#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { createInterface } from 'readline';

// ─── ANSI colours ────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  white:  '\x1b[97m',
  gray:   '\x1b[90m',
};

const bold   = (s) => `${c.bold}${s}${c.reset}`;
const cyan   = (s) => `${c.cyan}${s}${c.reset}`;
const green  = (s) => `${c.green}${s}${c.reset}`;
const yellow = (s) => `${c.yellow}${s}${c.reset}`;
const red    = (s) => `${c.red}${s}${c.reset}`;
const gray   = (s) => `${c.gray}${s}${c.reset}`;
const dim    = (s) => `${c.dim}${s}${c.reset}`;

// ─── CHAIN FILE PARSER ───────────────────────────────────────────────────────
function parseChainFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');

  const chain = {
    name: 'Unnamed Pipeline',
    model: 'claude-haiku-4-5-20251001',
    input: null,
    steps: [],
  };

  let currentStep = null;
  let currentLines = [];

  const flushStep = () => {
    if (!currentStep) return;
    // parse accumulated lines for the step
    const stepData = { name: currentStep, prompt: '', max_tokens: 1024 };
    let promptLines = [];
    let inPrompt = false;

    for (const line of currentLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('prompt:')) {
        inPrompt = true;
        const rest = trimmed.slice('prompt:'.length).trim();
        if (rest) promptLines.push(rest);
      } else if (trimmed.startsWith('max_tokens:')) {
        inPrompt = false;
        const val = parseInt(trimmed.slice('max_tokens:'.length).trim(), 10);
        if (!isNaN(val)) stepData.max_tokens = val;
      } else if (inPrompt && trimmed) {
        promptLines.push(trimmed);
      }
    }

    stepData.prompt = promptLines.join(' ');
    chain.steps.push(stepData);
    currentStep = null;
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Section header [step-name]
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      flushStep();
      currentStep = sectionMatch[1].trim();
      currentLines = [];
      continue;
    }

    // Top-level key: value (only outside a step)
    if (!currentStep) {
      const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1].toLowerCase();
        const val = kvMatch[2].trim();
        if (key === 'name')  chain.name = val;
        if (key === 'model') chain.model = val;
        if (key === 'input') chain.input = val;
      }
    } else {
      currentLines.push(line);
    }
  }

  flushStep();
  return chain;
}

// ─── SUBSTITUTION ────────────────────────────────────────────────────────────
function substitute(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, value || '');
  }
  return result;
}

// ─── PIPELINE VISUALISATION ──────────────────────────────────────────────────
function renderPipeline(chain, input) {
  console.log();
  console.log(`  ${bold('Pipeline:')} ${cyan(chain.name)}`);
  console.log(`  ${bold('Model:')}    ${gray(chain.model)}`);
  console.log(`  ${bold('Input:')}    ${yellow(`"${input}"`)}`);
  console.log();

  const names = chain.steps.map((s) => s.name);
  if (names.length === 0) {
    console.log(red('  No steps found in chain file.'));
    return;
  }

  // Build box row
  const boxes   = names.map((n) => `┌${'─'.repeat(n.length + 2)}┐`);
  const labels  = names.map((n) => `│ ${n} │`);
  const bottoms = names.map((n) => `└${'─'.repeat(n.length + 2)}┘`);

  const arrowWidth = 3; // ' → '
  const topRow    = boxes.join(' '.repeat(arrowWidth));
  const midRow    = labels.join(` ${c.cyan}→${c.reset} `);
  const botRow    = bottoms.join(' '.repeat(arrowWidth));

  console.log(`  ${topRow}`);
  console.log(`  ${midRow}`);
  console.log(`  ${botRow}`);
  console.log();
}

// ─── ANTHROPIC API CALL (native https, no deps) ──────────────────────────────
function callAnthropic(apiKey, model, prompt, maxTokens) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Anthropic API error: ${json.error.message}`));
          } else {
            const text = json.content?.[0]?.text ?? '';
            const usage = json.usage ?? {};
            resolve({ text, usage });
          }
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Request failed: ${e.message}`)));
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timed out after 60s'));
    });

    req.write(body);
    req.end();
  });
}

// ─── PROMPT USER FOR INPUT ───────────────────────────────────────────────────
function promptInput(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── SAVE OUTPUTS ────────────────────────────────────────────────────────────
function saveOutputs(chainName, results) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeName = chainName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const outDir = path.join(process.cwd(), 'chain-output', `${safeName}-${ts}`);

  fs.mkdirSync(outDir, { recursive: true });

  let combined = `# ${chainName}\nGenerated: ${new Date().toLocaleString()}\n\n`;

  for (const { step, output } of results) {
    const fileName = `${step}.txt`;
    fs.writeFileSync(path.join(outDir, fileName), output, 'utf8');
    combined += `## Step: ${step}\n\n${output}\n\n---\n\n`;
  }

  const combinedPath = path.join(outDir, '_combined.txt');
  fs.writeFileSync(combinedPath, combined, 'utf8');

  return outDir;
}

// ─── COST ESTIMATE ───────────────────────────────────────────────────────────
// Haiku pricing (approx, per 1M tokens): input $0.25, output $1.25
// Sonnet 3.5: input $3, output $15
// Opus: input $15, output $75
function estimateCost(model, inputTokens, outputTokens) {
  let inRate = 0.25, outRate = 1.25; // default haiku
  if (model.includes('sonnet')) { inRate = 3.00; outRate = 15.00; }
  if (model.includes('opus'))   { inRate = 15.00; outRate = 75.00; }
  const cost = (inputTokens / 1_000_000) * inRate + (outputTokens / 1_000_000) * outRate;
  return cost.toFixed(6);
}

// ─── COMMANDS ────────────────────────────────────────────────────────────────

// node index.js run --chain FILE [--input TEXT] [--dry-run]
async function cmdRun(args, forceDryRun = false) {
  const chainIdx = args.indexOf('--chain');
  if (chainIdx === -1 || !args[chainIdx + 1]) {
    console.error(red('Error: --chain <file> is required'));
    process.exit(1);
  }

  const chainFile = args[chainIdx + 1];
  if (!fs.existsSync(chainFile)) {
    console.error(red(`Error: chain file not found: ${chainFile}`));
    process.exit(1);
  }

  const chain = parseChainFile(chainFile);

  const inputIdx = args.indexOf('--input');
  let userInput = inputIdx !== -1 ? args.slice(inputIdx + 1).join(' ') : null;

  if (!userInput) {
    const placeholder = chain.input ?? '{{INPUT}}';
    userInput = await promptInput(`  ${bold('Input')} (${gray(placeholder)}): `);
    if (!userInput) {
      console.error(red('Error: input is required'));
      process.exit(1);
    }
  }

  renderPipeline(chain, userInput);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const isDryRun = forceDryRun || !apiKey;

  if (isDryRun) {
    console.log(yellow(`  ⚡ DRY RUN MODE${!apiKey ? ' (no ANTHROPIC_API_KEY found)' : ''}`));
    console.log(dim('  Set ANTHROPIC_API_KEY to execute the pipeline.\n'));
  } else {
    console.log(green(`  ✓ API key found — executing pipeline\n`));
  }

  const stepOutputs = {};
  const results = [];
  let totalInput = 0, totalOutput = 0;

  for (let i = 0; i < chain.steps.length; i++) {
    const step = chain.steps[i];
    const stepNum = `[${i + 1}/${chain.steps.length}]`;

    // Build substitution vars
    const vars = { INPUT: userInput };
    // named input placeholder from chain header
    if (chain.input) {
      const match = chain.input.match(/\{\{(\w+)\}\}/);
      if (match) vars[match[1]] = userInput;
    }
    // previous step output
    if (i > 0) vars['previous'] = stepOutputs[chain.steps[i - 1].name] ?? '';
    // all named step outputs
    for (const [k, v] of Object.entries(stepOutputs)) vars[k] = v;

    const resolvedPrompt = substitute(step.prompt, vars);

    console.log(`  ${cyan(bold(stepNum))} ${bold(step.name)}`);
    console.log(dim(`  ${'─'.repeat(50)}`));

    if (isDryRun) {
      console.log(`  ${gray('Prompt preview:')}`);
      // wrap at ~80 chars for readability
      const words = resolvedPrompt.split(' ');
      let line = '  ';
      for (const word of words) {
        if (line.length + word.length > 80) {
          console.log(dim(line));
          line = '  ' + word + ' ';
        } else {
          line += word + ' ';
        }
      }
      if (line.trim()) console.log(dim(line));
      console.log(dim(`  max_tokens: ${step.max_tokens}`));
      stepOutputs[step.name] = `[DRY RUN — step "${step.name}" output would appear here]`;
    } else {
      try {
        process.stdout.write(`  ${gray('Calling API')} `);
        const spinner = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
        let si = 0;
        const spin = setInterval(() => {
          process.stdout.write(`\r  ${gray('Calling API')} ${cyan(spinner[si++ % spinner.length])}`);
        }, 80);

        const { text, usage } = await callAnthropic(
          apiKey, chain.model, resolvedPrompt, step.max_tokens
        );

        clearInterval(spin);
        process.stdout.write('\r' + ' '.repeat(40) + '\r');

        console.log(green('  ✓ Response received'));
        console.log();
        // print the response with indent
        const responseLines = text.split('\n');
        for (const line of responseLines) {
          console.log(`  ${line}`);
        }

        stepOutputs[step.name] = text;
        results.push({ step: step.name, output: text });

        if (usage.input_tokens)  totalInput  += usage.input_tokens;
        if (usage.output_tokens) totalOutput += usage.output_tokens;

        console.log();
        console.log(dim(`  Tokens — input: ${usage.input_tokens ?? '?'}, output: ${usage.output_tokens ?? '?'}`));
      } catch (err) {
        console.error(red(`\n  Error in step "${step.name}": ${err.message}`));
        process.exit(1);
      }
    }

    console.log();
  }

  if (!isDryRun && results.length > 0) {
    const outDir = saveOutputs(chain.name, results);
    console.log(dim('─'.repeat(54)));
    console.log();
    console.log(`  ${bold('Pipeline complete!')} ${green('✓')}`);
    console.log(`  ${bold('Output saved:')} ${cyan(outDir)}`);
    console.log();
    console.log(`  ${bold('Token usage:')}`);
    console.log(`    Input tokens:  ${totalInput}`);
    console.log(`    Output tokens: ${totalOutput}`);
    const cost = estimateCost(chain.model, totalInput, totalOutput);
    console.log(`    Est. cost:     $${cost}`);
    console.log();
  } else if (isDryRun) {
    console.log(dim('─'.repeat(54)));
    console.log();
    console.log(`  ${yellow('Dry run complete.')} No API calls made.`);
    console.log(`  ${dim('Set ANTHROPIC_API_KEY=your_key and re-run to execute.')}`);
    console.log();
  }
}

// node index.js list
function cmdList() {
  const files = fs.readdirSync(process.cwd()).filter((f) => f.endsWith('.chain'));
  if (files.length === 0) {
    console.log(yellow('\n  No .chain files found in current directory.\n'));
    console.log(dim('  Run: agent-chain new <name> to create one.\n'));
    return;
  }
  console.log();
  console.log(bold('  Chain files in current directory:'));
  console.log();
  for (const f of files) {
    try {
      const chain = parseChainFile(f);
      const stepNames = chain.steps.map((s) => s.name).join(' → ');
      console.log(`  ${cyan(f)}`);
      console.log(`    ${dim(chain.name)}`);
      console.log(`    ${gray(stepNames || '(no steps)')}`);
      console.log();
    } catch {
      console.log(`  ${cyan(f)} ${red('(parse error)')}`);
    }
  }
}

// node index.js new NAME
function cmdNew(args) {
  const name = args[0];
  if (!name) {
    console.error(red('Error: provide a name — e.g.: agent-chain new my-pipeline'));
    process.exit(1);
  }
  const fileName = `${name}.chain`;
  if (fs.existsSync(fileName)) {
    console.error(red(`Error: ${fileName} already exists`));
    process.exit(1);
  }

  const template = `name: ${name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Pipeline
model: claude-haiku-4-5-20251001
input: {{INPUT}}

[step-one]
prompt: Process this input: {{INPUT}}. Provide a detailed analysis.
max_tokens: 500

[step-two]
prompt: Based on this analysis: {{previous}}. Expand and improve it.
max_tokens: 800

[step-three]
prompt: Take this content: {{previous}}. Polish it and make it publication-ready.
max_tokens: 600
`;

  fs.writeFileSync(fileName, template, 'utf8');
  console.log();
  console.log(green(`  ✓ Created ${cyan(fileName)}`));
  console.log(dim('  Edit the prompts, then run:'));
  console.log(dim(`  agent-chain run --chain ${fileName}`));
  console.log();
}

// node index.js dry-run --chain FILE [--input TEXT]
async function cmdDryRun(args) {
  return cmdRun(args, true);
}

// ─── HELP ────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
${bold(cyan('agent-chain'))} ${gray('— chain Claude AI prompts into pipelines')}

${bold('USAGE')}
  agent-chain ${cyan('run')}     --chain <file> [--input <text>]   Run a pipeline
  agent-chain ${cyan('dry-run')} --chain <file> [--input <text>]   Preview without API calls
  agent-chain ${cyan('list')}                                       List .chain files here
  agent-chain ${cyan('new')}     <name>                             Scaffold a new chain

${bold('EXAMPLES')}
  agent-chain run --chain blog.chain --input "AI in healthcare"
  agent-chain dry-run --chain examples/product-launch.chain --input "Notion for devs"
  agent-chain list
  agent-chain new my-pipeline

${bold('CHAIN FILE FORMAT')}
  ${dim('# Simple key:value header, then [step] sections')}

  ${cyan('name:')} My Pipeline
  ${cyan('model:')} claude-haiku-4-5-20251001
  ${cyan('input:')} {{TOPIC}}

  ${cyan('[step-one]')}
  ${cyan('prompt:')} Research {{TOPIC}} and summarise key facts.
  ${cyan('max_tokens:')} 500

  ${cyan('[step-two]')}
  prompt: Expand on this: {{previous}}
  max_tokens: 800

${bold('SUBSTITUTIONS')}
  {{previous}}   — output of the immediately preceding step
  {{STEP_NAME}}  — output of any named step (e.g. {{research}})
  {{INPUT}}      — the user's initial input
  {{TOPIC}}      — or any placeholder defined in the input: header

${bold('SETUP')}
  export ANTHROPIC_API_KEY=sk-ant-...
  ${gray('Without a key, dry-run mode activates automatically.')}

${bold('OUTPUT')}
  Results saved to ./chain-output/<name>-<timestamp>/
  Each step saved as a separate .txt file + _combined.txt
`);
}

// ─── MAIN ENTRYPOINT ─────────────────────────────────────────────────────────
async function main() {
  const [, , command, ...rest] = process.argv;

  switch (command) {
    case 'run':
      await cmdRun(rest);
      break;
    case 'dry-run':
      await cmdDryRun(rest);
      break;
    case 'list':
      cmdList();
      break;
    case 'new':
      cmdNew(rest);
      break;
    case '--help':
    case '-h':
    case 'help':
    case undefined:
      showHelp();
      break;
    default:
      console.error(red(`Unknown command: ${command}`));
      showHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(red(`\nFatal: ${err.message}`));
  process.exit(1);
});

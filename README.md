<div align="center">

# agent-chain

**Run multi-step Claude AI pipelines from a single command — research → write → edit → publish.**

[![License: MIT](https://img.shields.io/badge/license-MIT-0B0A09?labelColor=0B0A09&color=white)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-0B0A09?labelColor=0B0A09&color=white)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-0B0A09?labelColor=0B0A09&color=white)](package.json)

</div>

## Install

```bash
npx github:NickCirv/agent-chain --help
```

No global install required. Needs `ANTHROPIC_API_KEY` to execute; without it, dry-run mode activates automatically.

## Usage

```bash
# Preview prompts without making API calls
npx github:NickCirv/agent-chain dry-run --chain examples/blog.chain --input "AI in healthcare"

# Execute a full pipeline (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=sk-ant-...
npx github:NickCirv/agent-chain run --chain examples/blog.chain --input "AI in healthcare"
```

| Command | Description |
|---------|-------------|
| `run --chain FILE --input TEXT` | Execute a pipeline |
| `dry-run --chain FILE --input TEXT` | Preview prompts without API calls |
| `list` | List `.chain` files in current directory |
| `new NAME` | Scaffold a new chain file |

## What it does

`agent-chain` reads a `.chain` file — a lightweight plain-text format — and runs each named step sequentially through Claude, passing each step's output into the next via `{{previous}}` substitution. Results are saved per-step to `./chain-output/<name>-<timestamp>/` alongside a `_combined.txt`. After each run it prints token usage and an estimated cost.

### Chain file format

```
name: Blog Post Pipeline
model: claude-haiku-4-5-20251001
input: {{TOPIC}}

[research]
prompt: Research {{TOPIC}} and provide 5 key facts and unique angles.
max_tokens: 500

[write]
prompt: Write an 800-word blog post from this research: {{previous}}
max_tokens: 1200

[seo]
prompt: Improve this post for SEO. Add meta description and keyword suggestions: {{previous}}
max_tokens: 600
```

| Placeholder | Value |
|-------------|-------|
| `{{previous}}` | Output of the immediately preceding step |
| `{{STEP_NAME}}` | Output of any named step (e.g. `{{research}}`) |
| `{{INPUT}}` | The user's initial input |

Three example chains are included in `examples/`: `blog.chain`, `code-review.chain`, `product-launch.chain`.

---

<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>

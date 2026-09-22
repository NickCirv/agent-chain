# agent-chain — implementation reference

Source revision: `0dcc4336f0360414f19bc26e4043f0c560025d9a`. This reference records source declarations; it is not a transcript of a successful run.

## Entrypoint and runtime

[package.json](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/package.json) declares `index.js`. Node.js `>=18` and npm.

Executable mapping: `agent-chain` → `./index.js`.

## Supported workflow

Create and list chains; substitute step variables; dry-run prompt previews; save completed outputs under chain-output/.

Live execution sends prompts and step output to Anthropic using ANTHROPIC_API_KEY. The chain parser is a custom format, not a general YAML engine. Cost totals use embedded estimates.

## Command reference

The commands below use the installed executable name. From the pinned checkout, replace it with the `node` entrypoint shown above. Options and command branches were cross-checked against captured source; examples are not execution transcripts.

| Command | Description |
|---------|-------------|
| `run --chain FILE --input TEXT` | Execute a pipeline |
| `dry-run --chain FILE --input TEXT` | Preview prompts without API calls |
| `list` | List `.chain` files in current directory |
| `new NAME` | Scaffold a new chain file |

| Placeholder | Value |
|-------------|-------|
| `{{previous}}` | Output of the immediately preceding step |
| `{{STEP_NAME}}` | Output of any named step (e.g. `{{research}}`) |
| `{{INPUT}}` | The user's initial input |

## Package scripts

| Script | Exact command |
| --- | --- |
| `test` | `node --test` |

## Environment references

The implementation reads `ANTHROPIC_API_KEY`. Some are optional or mode-specific; inspect their call sites before configuring a service. Credentials and endpoint values are never supplied by this document.

## Implementation sources

[index.js](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/index.js).

## Verification boundary

No repository code, tests, network operation, hook installer or migration was executed for this review. Source inspection supports the documented interface; runtime correctness and external-service compatibility remain unverified.

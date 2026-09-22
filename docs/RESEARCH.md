# agent-chain — documentation research

Reviewed 21 September 2026. Public GitHub source only.

## Revision and scope

- Commit: [`0dcc4336f0360414f19bc26e4043f0c560025d9a`](https://github.com/NickCirv/agent-chain/commit/0dcc4336f0360414f19bc26e4043f0c560025d9a).
- Tree: `f5161e7c4a7a83d1cb7264d766c508846a7164b3`; truncated: `false`.
- Capture: 6 of 6 eligible text files; all eligible text files.
- Method: package and entrypoint inspection, implementation-interface review, targeted behavior/limitation inspection, and test-source review. This is not an exhaustive correctness or security audit.
- Commands run against repository code: **none**. External services, deployment and npm publication were not verified.

## Claim and evidence map

| Documentation claim | Pinned evidence | Assessment |
| --- | --- | --- |
| Runtime, executable and development commands | [package.json](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/package.json) | Source declaration inspected; runtime unverified |
| Runs a sequence of prompt steps from a .chain file, passing earlier results into later prompts. | [index.js](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/index.js) | Implementation interfaces inspected; behavior not executed |
| Create and list chains; substitute step variables; dry-run prompt previews; save completed outputs under chain-output/. | [index.js](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/index.js) | Source-backed scope, not a test result |
| Live execution sends prompts and step output to Anthropic using ANTHROPIC_API_KEY. The chain parser is a custom format, not a general YAML engine. Cost totals use embedded estimates. | [index.js](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/index.js) | Material limits documented; service compatibility remains open |
| Existing checks | [test/smoke.test.js](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/test/smoke.test.js) | Test source read; no passing-run claim |

## Documentation inventory and disposition

| Existing document | Decision |
| --- | --- |
| [README.md](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/README.md) | Rewritten with source-specific purpose, direct checkout setup, limitations and verification status. Old section fragments retained where practical. |

Added `docs/REFERENCE.md` for the observed implementation and command surface, and this research record. Protected license and attribution files remain in their original locations without edits. No source or product UI was changed.

## Quality dimensions

| Dimension | Status | Evidence / next step |
| --- | --- | --- |
| Pinned provenance | Verified | Captured commit, tree and per-file hashes recorded below |
| Interface documentation | Partially verified | Source inspection only; run clean-checkout quickstart |
| Runtime behavior | Unverified | No repository execution in this review |
| Test results | Unverified | Existing tests were not run |
| Deployment / package availability | Unverified | No remote publish or live-service check |
| Visual / link checks | Unverified | Portfolio renderer and independent QA are separate from this authoring step |

## Unresolved issues

Live execution sends prompts and step output to Anthropic using ANTHROPIC_API_KEY. The chain parser is a custom format, not a general YAML engine. Cost totals use embedded estimates.

## Captured source inventory

This lists captured provenance, not a claim that every line received a full audit. Binary/generated/excluded files are outside the eligible text capture.

| File | SHA-256 | Bytes |
| --- | --- | --- |
| [LICENSE](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/LICENSE) | `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d` | 1072 |
| [README.md](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/README.md) | `9ca081e08bb3f15994dd5a5adb9b92a6921a85bce1580fb98f52f96495354da8` | 2535 |
| [package.json](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/package.json) | `578c9cd44707c8e06b21a430d18d41698a352ca760870efb0fa5c687662b0b12` | 415 |
| [.github/workflows/ci.yml](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/.github/workflows/ci.yml) | `433fbf65635a767ef5cd787147104c248d0cea6bbd6523c6c862f915e0e3206a` | 384 |
| [index.js](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/index.js) | `53fb2e61d49faff1fec68fe610c27f82f2b3adb07b4c075e02be631c54f3c229` | 18319 |
| [test/smoke.test.js](https://github.com/NickCirv/agent-chain/blob/0dcc4336f0360414f19bc26e4043f0c560025d9a/test/smoke.test.js) | `d5426592565aa06e56313a7009490e5adbb1755a57e1b11075982b2ed5d228a0` | 451 |

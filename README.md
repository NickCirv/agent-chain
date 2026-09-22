![Nicholas Ashkar — agent-chain](assets/nicholas-ashkar/banner.png)

# agent-chain

Runs a sequence of prompt steps from a .chain file, passing earlier results into later prompts.





<a id="usage"></a>

<a id="preview-prompts-without-making-api-calls"></a>

<a id="execute-a-full-pipeline-requires-anthropic_api_key"></a>

<a id="chain-file-format"></a>

## What it does

- Create and list chains.
- Substitute step variables.
- Dry-run prompt previews.
- Save completed outputs under chain-output/.


<a id="install"></a>

## Quickstart

Prerequisites: Node.js `>=18` and npm. The checkout below pins the source used for this documentation.

```sh
git clone https://github.com/NickCirv/agent-chain.git
cd agent-chain
git checkout 0dcc4336f0360414f19bc26e4043f0c560025d9a
node index.js new editorial
```

**Expected behavior (illustrative, not captured):** Creates editorial.chain in the current directory; inspect it, then preview with dry-run --chain editorial.chain --input "A short launch note".

Preview the created chain before live execution:

```sh
node index.js dry-run --chain editorial.chain --input "A short launch note"
```

Examples are source-inspected, **not runtime-tested**. See the research record for verification gaps.

## Boundaries and data

Live execution sends prompts and step output to Anthropic using ANTHROPIC_API_KEY. The chain parser is a custom format, not a general YAML engine. Cost totals use embedded estimates.

## Development

The manifest defines `npm test` as:

```sh
node --test
```

The captured suite is a smoke check, not end-to-end behavior coverage. Examples include “entry is valid JavaScript”, “--help exits 0”. Tests were not run for this documentation revision.

See [implementation and command reference](docs/REFERENCE.md) for the package scripts and inspected interfaces, and [research record](docs/RESEARCH.md) for the pinned source, document decisions and unresolved checks.

## License and contact

See [LICENSE](LICENSE) for the original terms and attribution. Legal text is unchanged.

[Nicholas Ashkar](https://nicholashkar.com/) · [Discuss a project](https://nicholashkar.com/#oxblood-contact)

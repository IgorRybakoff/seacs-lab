# Reproducibility

## Scope

Public v0.1 guarantees functional replay of its committed reference matrix under the public reference policy. It makes no claim of equivalence to unpublished SEACS policies or production infrastructure.

## Environment

- Node.js 22 or newer
- Dependencies installed from `package-lock.json` with `npm ci`
- No API keys, network services, databases, or model endpoints required at runtime

## Commands

```bash
npm ci
npm test
npm run build
npm run replay
```

To regenerate evidence:

```bash
npm run artifacts
npm run replay
```

## Provenance rules

- Source configurations are committed in `configs/reference_matrix.json`.
- `scripts/generate-artifacts.ts` executes the real TypeScript controller.
- `artifacts/reference_v0.1/manifest.json` declares artifact origin and simulation status.
- `checksums.sha256` protects the frozen JSON evidence files.
- `scripts/replay-artifact.ts` recomputes records and requires exact equality.
- `llm_generated_metrics` is always `false`.
- `simulated_metrics` is explicitly `true` because this repository is intentionally a simulator.

## Determinism boundary

Determinism covers the committed code, configuration, Node-compatible numeric behavior, and JSON serialization used by public v0.1. It does not imply that a real distributed system would produce the same states or outcomes.

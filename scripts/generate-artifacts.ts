import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { run } from "../src/core/controller.ts";
import { PUBLIC_REFERENCE_POLICY } from "../src/core/referencePolicy.ts";
import type { Config } from "../src/core/types.ts";

const configPath = new URL("../configs/reference_matrix.json", import.meta.url);
const artifactDirectory = new URL("../artifacts/reference_v0.1/", import.meta.url);
const matrix = JSON.parse(await readFile(configPath, "utf8")) as { cases: Config[] };
const records = matrix.cases.map((config) => ({ config, result: run(config) }));
const gates = [...new Set(records.map(({ result }) => result.trustBefore.gate))].sort();
const gateCounts = Object.fromEntries(
  gates.map((gate) => [gate, records.filter(({ result }) => result.trustBefore.gate === gate).length]),
);
const summary = `${JSON.stringify({
  schema_version: "1.0",
  policy: PUBLIC_REFERENCE_POLICY.version,
  record_count: records.length,
  gate_counts: gateCounts,
  records,
}, null, 2)}\n`;
const summaryHash = createHash("sha256").update(summary).digest("hex");
const manifest = `${JSON.stringify({
  schema_version: "1.0",
  artifact_source: "REAL_TYPESCRIPT_EXECUTION",
  policy: PUBLIC_REFERENCE_POLICY.version,
  deterministic: true,
  simulated_metrics: true,
  llm_generated_metrics: false,
  external_actions: false,
  source_config: "configs/reference_matrix.json",
  generator: "scripts/generate-artifacts.ts",
  record_count: records.length,
  summary_sha256: summaryHash,
}, null, 2)}\n`;
const manifestHash = createHash("sha256").update(manifest).digest("hex");

await mkdir(artifactDirectory, { recursive: true });
await writeFile(new URL("experiment_summary.json", artifactDirectory), summary);
await writeFile(new URL("manifest.json", artifactDirectory), manifest);
await writeFile(
  new URL("checksums.sha256", artifactDirectory),
  `${summaryHash}  experiment_summary.json\n${manifestHash}  manifest.json\n`,
);
console.log(`Generated ${records.length} records with policy ${PUBLIC_REFERENCE_POLICY.version}.`);

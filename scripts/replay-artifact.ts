import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { run } from "../src/core/controller.ts";
import type { Config, Experiment } from "../src/core/types.ts";

const artifactDirectory = new URL("../artifacts/reference_v0.1/", import.meta.url);
const summaryText = await readFile(new URL("experiment_summary.json", artifactDirectory), "utf8");
const manifestText = await readFile(new URL("manifest.json", artifactDirectory), "utf8");
const checksumsText = await readFile(new URL("checksums.sha256", artifactDirectory), "utf8");
const manifest = JSON.parse(manifestText) as {
  summary_sha256: string;
  record_count: number;
  artifact_source: string;
  simulated_metrics: boolean;
  llm_generated_metrics: boolean;
};
const summary = JSON.parse(summaryText) as {
  record_count: number;
  records: { config: Config; result: Experiment }[];
};

assert.equal(manifest.artifact_source, "REAL_TYPESCRIPT_EXECUTION");
assert.equal(manifest.simulated_metrics, true);
assert.equal(manifest.llm_generated_metrics, false);
const summaryHash = createHash("sha256").update(summaryText).digest("hex");
const manifestHash = createHash("sha256").update(manifestText).digest("hex");
assert.equal(summaryHash, manifest.summary_sha256);
assert.ok(checksumsText.includes(`${summaryHash}  experiment_summary.json`));
assert.ok(checksumsText.includes(`${manifestHash}  manifest.json`));
assert.equal(summary.records.length, summary.record_count);
assert.equal(summary.record_count, manifest.record_count);
for (const record of summary.records) assert.deepEqual(run(record.config), record.result);

console.log(`Replay verified ${summary.record_count}/${summary.record_count} records exactly.`);

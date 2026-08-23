import assert from "node:assert/strict";
import test from "node:test";
import { run } from "../src/core/controller.ts";
import { PUBLIC_REFERENCE_POLICY } from "../src/core/referencePolicy.ts";
import { calculateTrust, gateFor } from "../src/core/trust.ts";
import type { EvidenceProfile, Mode, Scenario } from "../src/core/types.ts";

test("public policy is explicitly identified as a reference policy", () => {
  assert.equal(PUBLIC_REFERENCE_POLICY.version, "public-reference-v0.1");
});

test("critical non-primary evidence cannot remain overconfident", () => {
  const result = calculateTrust({
    health: 0.15,
    reliability: 0.9,
    confidence: 0.85,
    consensus: 0.35,
    stability: 0.2,
    efficiency: 0.35,
    entropy: 0.8,
    degradation: 0.8,
    mode: "HEURISTIC",
  }, 0.9);
  assert.ok(result.bounded <= PUBLIC_REFERENCE_POLICY.caps.criticalHealth);
  assert.ok(!["EXECUTE", "EXECUTE_WITH_LIMITS"].includes(result.gate));
});

test("same configuration gives byte-equivalent deterministic output", () => {
  const config = {
    scenario: "DB_LATENCY_SPIKE" as const,
    seed: 42,
    load: 0.72,
    mode: "PRIMARY" as const,
    evidenceProfile: "DEGRADED" as const,
    previousTrust: 0.75,
  };
  assert.deepEqual(run(config), run(config));
});

test("all scenarios return bounded states and respect the gate", () => {
  const scenarios: Scenario[] = [
    "STABLE_BASELINE",
    "DB_LATENCY_SPIKE",
    "AUTH_FAILURE",
    "GATEWAY_LOAD_SURGE",
    "CACHE_EVICTION_STORM",
  ];
  for (const scenario of scenarios) {
    const result = run({
      scenario,
      seed: 101,
      load: 0.8,
      mode: "PRIMARY",
      evidenceProfile: "DEGRADED",
      previousTrust: 0.75,
    });
    const bounded = [
      result.before.health,
      result.proposed.health,
      result.postGate.health,
      result.trustBefore.bounded,
      result.trustAfter.bounded,
    ];
    assert.ok(bounded.every((value) => value >= 0 && value <= 1));
    assert.ok(result.decision.actions.length >= 1);
    if (!result.applied.length) {
      assert.deepEqual(result.postGate, result.before);
      assert.equal(result.modelCheckPassed, false);
    }
  }
});

test("blocked execution keeps proposal separate from post-gate model state", () => {
  const result = run({
    scenario: "DB_LATENCY_SPIKE",
    seed: 101,
    load: 0.9,
    mode: "HEURISTIC",
    evidenceProfile: "LOST",
    previousTrust: 0.1,
  });
  assert.equal(result.trustBefore.gate, "BLOCK");
  assert.equal(result.applied.length, 0);
  assert.deepEqual(result.postGate, result.before);
  assert.notDeepEqual(result.proposed, result.before);
});

test("all five public reference gates are reachable", () => {
  assert.equal(gateFor(0.1), "BLOCK");
  assert.equal(gateFor(0.3), "REQUIRE_HUMAN_REVIEW");
  assert.equal(gateFor(0.5), "SIMULATE_ONLY");
  assert.equal(gateFor(0.7), "EXECUTE_WITH_LIMITS");
  assert.equal(gateFor(0.9), "EXECUTE");
});

test("small replay matrix has no nondeterminism or gate bypass", () => {
  const scenarios: Scenario[] = [
    "STABLE_BASELINE",
    "DB_LATENCY_SPIKE",
    "AUTH_FAILURE",
    "GATEWAY_LOAD_SURGE",
    "CACHE_EVICTION_STORM",
  ];
  const modes: Mode[] = ["PRIMARY", "FALLBACK", "HEURISTIC"];
  const profiles: EvidenceProfile[] = ["VERIFIED", "DEGRADED", "CONFLICTED", "LOST"];
  for (const seed of [1, 42, 101]) for (const scenario of scenarios) for (const mode of modes) for (const evidenceProfile of profiles) {
    const config = { scenario, seed, load: 0.72, mode, evidenceProfile, previousTrust: 0.75 };
    const first = run(config);
    const second = run(config);
    assert.deepEqual(first, second);
    const permitted = ["EXECUTE", "EXECUTE_WITH_LIMITS"].includes(first.trustBefore.gate);
    assert.equal(first.applied.length > 0, permitted);
  }
});

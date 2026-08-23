import { decide } from "./decision.ts";
import { experimentId } from "./random.ts";
import { simulate } from "./simulation.ts";
import { calculateTrust } from "./trust.ts";
import type { Config, EvidenceProfile, Experiment, Snapshot, TrustInput } from "./types.ts";

function trustInput(snapshot: Snapshot, confidence: number, mode: Config["mode"], profile: EvidenceProfile): TrustInput {
  const degraded = Object.values(snapshot.services).filter((service) => service.health < 0.7).length;
  const input: TrustInput = {
    health: snapshot.health,
    reliability: Math.max(0.4, 1 - snapshot.errors),
    confidence,
    consensus: Math.max(0.3, 0.9 - degraded * 0.15),
    stability: Math.max(0.2, 1 - snapshot.latency / 600),
    efficiency: Math.max(0.2, 1 - degraded * 0.15),
    entropy: Math.min(1, snapshot.errors + degraded * 0.1),
    degradation: Math.max(0, 1 - snapshot.health),
    mode,
  };
  if (profile === "VERIFIED") {
    input.reliability = Math.max(input.reliability, 0.95);
    input.consensus = Math.max(input.consensus, 0.95);
    input.stability = Math.max(input.stability, 0.9);
    input.entropy = Math.min(input.entropy, 0.05);
  } else if (profile === "DEGRADED") {
    input.reliability *= 0.75;
    input.consensus *= 0.75;
    input.stability *= 0.75;
    input.entropy = Math.min(1, input.entropy + 0.2);
  } else if (profile === "CONFLICTED") {
    input.reliability *= 0.5;
    input.consensus = 0.35;
    input.stability *= 0.5;
    input.entropy = Math.max(0.75, input.entropy);
    input.degradation = Math.max(0.6, input.degradation);
  } else if (profile === "LOST") {
    input.reliability = 0.1;
    input.consensus = 0.1;
    input.stability = 0.1;
    input.efficiency = 0.1;
    input.entropy = 1;
    input.degradation = 0.95;
    input.confidence = Math.min(input.confidence, 0.2);
  }
  return input;
}

export function run(config: Config): Experiment {
  const before = simulate(config.scenario, config.load, config.seed);
  const decision = decide(config.scenario, before);
  const trustBefore = calculateTrust(
    trustInput(before, decision.confidence, config.mode, config.evidenceProfile),
    config.previousTrust,
  );
  const permitted = trustBefore.gate === "EXECUTE" || trustBefore.gate === "EXECUTE_WITH_LIMITS";
  const applied = permitted
    ? (trustBefore.gate === "EXECUTE_WITH_LIMITS" ? decision.actions.slice(0, 1) : decision.actions)
    : [];
  const proposed = simulate(config.scenario, config.load, config.seed, decision.actions);
  const postGate = applied.length
    ? simulate(config.scenario, config.load, config.seed, applied)
    : before;
  if (applied.length && postGate.health > before.health && postGate.errors <= before.errors) {
    postGate.classification = "CONTAINMENT";
  }
  const trustAfter = calculateTrust(
    trustInput(postGate, decision.confidence, config.mode, config.evidenceProfile),
    trustBefore.bounded,
  );
  const modelCheckPassed = applied.length > 0
    && postGate.health >= before.health
    && postGate.errors <= before.errors
    && postGate.latency <= before.latency;
  return {
    id: experimentId(config.seed, config.scenario),
    config,
    before,
    proposed,
    postGate,
    decision,
    trustBefore,
    trustAfter,
    applied,
    modelCheckPassed,
    events: [
      { stage: "OBSERVE", level: "INFO", message: `Reference fault model produced ${before.classification}.` },
      { stage: "EVALUATE", level: "INFO", message: `${decision.primary} selected as the primary affected service.` },
      { stage: "SIMULATE", level: "INFO", message: `${decision.actions.join(" + ")} evaluated in the reference model.` },
      { stage: "GATE", level: permitted ? "PASS" : "BLOCK", message: `${trustBefore.gate} at ${(trustBefore.bounded * 100).toFixed(1)}% bounded trust.` },
      { stage: "CHECK", level: modelCheckPassed ? "PASS" : "WARN", message: applied.length ? "Post-gate state checked inside the same reference model." : "No model action applied; more evidence or human review is required." },
    ],
  };
}

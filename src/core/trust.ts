import { PUBLIC_REFERENCE_POLICY } from "./referencePolicy.ts";
import type { Gate, TrustInput, TrustResult } from "./types.ts";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function gateFor(trust: number): Gate {
  const { block, humanReview, simulateOnly, limitedExecution } = PUBLIC_REFERENCE_POLICY.gates;
  if (trust < block) return "BLOCK";
  if (trust < humanReview) return "REQUIRE_HUMAN_REVIEW";
  if (trust < simulateOnly) return "SIMULATE_ONLY";
  if (trust < limitedExecution) return "EXECUTE_WITH_LIMITS";
  return "EXECUTE";
}

export function calculateTrust(input: TrustInput, previous: number): TrustResult {
  const reliability = input.mode === "PRIMARY"
    ? input.reliability
    : Math.min(input.reliability, PUBLIC_REFERENCE_POLICY.caps.nonPrimaryReliability);
  const evidence = clamp((input.health + reliability + input.confidence) / 3);
  const consensus = clamp(input.consensus);
  const stability = clamp((input.stability + input.efficiency) / 2);
  const raw = clamp(
    evidence * 0.4 + consensus * 0.3 + stability * 0.3
      - input.degradation * 0.2 - input.entropy * 0.2,
  );

  let cap = 1;
  const reasons: string[] = [];
  if (input.health < 0.3) {
    cap = Math.min(cap, PUBLIC_REFERENCE_POLICY.caps.criticalHealth);
    reasons.push("CRITICAL_HEALTH_CAP");
  }
  if (input.mode !== "PRIMARY") {
    cap = Math.min(cap, PUBLIC_REFERENCE_POLICY.caps.nonPrimaryTrust);
    reasons.push("FALLBACK_RELIABILITY_CAP");
  }
  if (input.consensus < 0.4) {
    cap = Math.min(cap, PUBLIC_REFERENCE_POLICY.caps.lowConsensus);
    reasons.push("LOW_CONSENSUS_CAP");
  }
  if (input.entropy > 0.7) {
    cap = Math.min(cap, PUBLIC_REFERENCE_POLICY.caps.highEntropy);
    reasons.push("HIGH_ENTROPY_CAP");
  }

  // Public baseline uses symmetric smoothing. Private research policies are not included.
  const smoothed = previous * 0.5 + raw * 0.5;
  const bounded = clamp(Math.min(smoothed, cap));
  return {
    raw,
    bounded,
    previous,
    cap,
    delta: bounded - previous,
    gate: gateFor(bounded),
    reasons,
    components: { evidence, consensus, stability },
  };
}

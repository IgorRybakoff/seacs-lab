import { PUBLIC_REFERENCE_POLICY } from "./referencePolicy.ts";
import type { Action, Decision, Scenario, Snapshot } from "./types.ts";

const affected: Record<Scenario, { primary: Decision["primary"]; path: Decision["path"] }> = {
  STABLE_BASELINE: { primary: "gateway", path: ["gateway"] },
  DB_LATENCY_SPIKE: { primary: "database", path: ["database", "gateway"] },
  AUTH_FAILURE: { primary: "auth", path: ["auth", "gateway"] },
  GATEWAY_LOAD_SURGE: { primary: "gateway", path: ["gateway"] },
  CACHE_EVICTION_STORM: { primary: "cache", path: ["cache", "database", "gateway"] },
};

export function decide(scenario: Scenario, state: Snapshot): Decision {
  const candidates: Action[] = [...PUBLIC_REFERENCE_POLICY.candidates[scenario]];
  const severity = Math.min(1, (1 - state.health + state.errors + Math.min(state.latency / 400, 1)) / 3);
  const utility = Object.fromEntries(PUBLIC_REFERENCE_POLICY.actions.map((action) => {
    const candidateIndex = candidates.indexOf(action);
    if (candidateIndex < 0) return [action, 0];
    const fit = candidateIndex === 0 ? 1 : 0.7;
    const score = fit * (0.6 + severity * 0.4) - PUBLIC_REFERENCE_POLICY.actionCost[action];
    return [action, Number(Math.max(0, Math.min(1, score)).toFixed(3))];
  })) as Record<Action, number>;
  const sorted = [...candidates].sort((left, right) => utility[right] - utility[left]);
  return {
    state: state.classification,
    ...affected[scenario],
    actions: scenario === "STABLE_BASELINE"
      ? ["NO_ACTION"]
      : state.classification === "ACTIVE_CASCADE" ? sorted.slice(0, 2) : sorted.slice(0, 1),
    utility,
    confidence: Number(Math.max(0.5, 0.88 - severity * 0.25).toFixed(3)),
  };
}

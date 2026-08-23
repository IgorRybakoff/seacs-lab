import type { Action, Scenario } from "./types.ts";

/**
 * Transparent, illustrative coefficients for the public reference package.
 * They are intentionally simple and are not the private SEACS research policy,
 * production recommendations, or measured infrastructure parameters.
 */
export const PUBLIC_REFERENCE_POLICY = {
  version: "public-reference-v0.1",
  gates: {
    block: 0.2,
    humanReview: 0.4,
    simulateOnly: 0.6,
    limitedExecution: 0.8,
  },
  caps: {
    criticalHealth: 0.35,
    nonPrimaryReliability: 0.65,
    nonPrimaryTrust: 0.7,
    lowConsensus: 0.5,
    highEntropy: 0.4,
  },
  actions: ["NO_ACTION", "RATE_LIMIT", "SCALE_UP", "ISOLATE_SERVICE", "CIRCUIT_BREAKER"] as Action[],
  actionCost: {
    NO_ACTION: 0,
    RATE_LIMIT: 0.15,
    SCALE_UP: 0.25,
    ISOLATE_SERVICE: 0.3,
    CIRCUIT_BREAKER: 0.25,
  } satisfies Record<Action, number>,
  candidates: {
    STABLE_BASELINE: ["NO_ACTION"],
    DB_LATENCY_SPIKE: ["CIRCUIT_BREAKER", "SCALE_UP"],
    AUTH_FAILURE: ["ISOLATE_SERVICE", "CIRCUIT_BREAKER"],
    GATEWAY_LOAD_SURGE: ["RATE_LIMIT", "SCALE_UP"],
    CACHE_EVICTION_STORM: ["ISOLATE_SERVICE", "CIRCUIT_BREAKER"],
  } satisfies Record<Scenario, Action[]>,
} as const;

export type Scenario = "STABLE_BASELINE" | "DB_LATENCY_SPIKE" | "AUTH_FAILURE" | "GATEWAY_LOAD_SURGE" | "CACHE_EVICTION_STORM";
export type Mode = "PRIMARY" | "FALLBACK" | "HEURISTIC";
export type EvidenceProfile = "VERIFIED" | "DEGRADED" | "CONFLICTED" | "LOST";
export type Action = "NO_ACTION" | "RATE_LIMIT" | "SCALE_UP" | "ISOLATE_SERVICE" | "CIRCUIT_BREAKER";
export type Gate = "EXECUTE" | "EXECUTE_WITH_LIMITS" | "SIMULATE_ONLY" | "REQUIRE_HUMAN_REVIEW" | "BLOCK";
export type Classification = "NORMAL" | "LOCALIZED_DEGRADATION" | "CASCADE_RISK" | "ACTIVE_CASCADE" | "CONTAINMENT";
export type ServiceId = "gateway" | "auth" | "database" | "cache";

export interface Service {
  id: ServiceId; latency: number; errors: number; load: number;
  health: number; instances: number; criticality: number;
}
export interface Snapshot {
  services: Record<ServiceId, Service>; health: number; latency: number;
  errors: number; throughput: number; classification: Classification;
}
export interface TrustInput {
  health: number; reliability: number; confidence: number; consensus: number;
  stability: number; efficiency: number; entropy: number; degradation: number; mode: Mode;
}
export interface TrustResult {
  raw: number; bounded: number; previous: number; cap: number; delta: number;
  gate: Gate; reasons: string[];
  components: { evidence: number; consensus: number; stability: number };
}
export interface Decision {
  state: Classification; primary: ServiceId; path: ServiceId[];
  actions: Action[]; utility: Record<Action, number>; confidence: number;
}
export interface Config {
  scenario: Scenario; seed: number; load: number; mode: Mode;
  evidenceProfile: EvidenceProfile; previousTrust: number;
}
export interface Experiment {
  id: string; config: Config; before: Snapshot; proposed: Snapshot; postGate: Snapshot;
  decision: Decision; trustBefore: TrustResult; trustAfter: TrustResult;
  applied: Action[]; modelCheckPassed: boolean;
  events: { stage: string; level: "INFO" | "WARN" | "PASS" | "BLOCK"; message: string }[];
}

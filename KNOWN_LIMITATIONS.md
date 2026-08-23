# Known Limitations

SEACS Lab public v0.1 is a deterministic research simulator, not a production controller.

1. All service states, failures, actions, and metrics are synthetic.
2. `postGate` is computed by the same reference simulator as `before` and `proposed`; it is not an observation from external infrastructure.
3. `modelCheckPassed` is an internal invariant check, not independent production verification.
4. Dependency paths are fixed per scenario. There is no general service-graph discovery or traversal engine.
5. The public reference policy uses illustrative coefficients and is not an operational recommendation.
6. Results do not establish safety across arbitrary topologies, seeds, policies, workloads, or real failure distributions.
7. There are no Ray, Kubernetes, Redis, reinforcement-learning, distributed-consensus, or live-agent integrations.
8. The UI holds only the current run in memory. It has no persistent experiment history or external telemetry.
9. The current tests validate deterministic invariants and committed scenarios, not real-world availability or security.
10. No LLM creates or modifies metrics. An LLM may interpret evidence, but measured files must come from executable code.

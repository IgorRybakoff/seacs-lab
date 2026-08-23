# Publication Checklist — public v0.1

## Verified

- [x] Source package is separate from the private SEACS v3.2 checkpoint.
- [x] Public policy is explicitly marked as illustrative.
- [x] Private smoothing logic, fitted matrices, and original operational coefficients are absent.
- [x] No `.env`, credentials, tokens, customer data, or local absolute paths are included.
- [x] Seven deterministic tests pass.
- [x] TypeScript check and Vite production build pass.
- [x] Frozen evidence contains ten executable records and all five Safety Gate outcomes.
- [x] Replay recomputes 10/10 records exactly and validates SHA-256 checksums.
- [x] `simulated_metrics=true` and `llm_generated_metrics=false` are explicit.
- [x] CI performs install, tests, build, and artifact replay; it makes no production claim.

## Publication boundary

- [x] Repository is described as an experimental research simulator.
- [x] No Ray, Kubernetes, Redis, RL, live-agent, or production-integration claims.
- [x] Internal model checks are not described as independent external verification.
- [x] Fixed scenario paths are not described as a universal dependency-graph engine.
- [x] Apache-2.0 applies only to this public reference package.

## Before GitHub publication

- [ ] Confirm repository name and visibility.
- [ ] Review the rendered README and CI badge after first push.
- [ ] Run GitHub Actions and confirm the green workflow.
- [ ] Link the repository from the portfolio without removing the existing portfolio URL.

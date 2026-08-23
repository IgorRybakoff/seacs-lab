# Public / Private Boundary

This repository exposes a complete reference loop:

`synthetic state → reference decision → trust gate → model action → model check`

It intentionally excludes:

- unpublished trust policies and smoothing methods;
- operational thresholds, fitted coefficients, and production heuristics;
- private experiment graphs, optimization policies, or reward functions;
- infrastructure adapters and customer-specific configuration;
- confidential research notes and patent-sensitive implementations.

The public coefficients in `src/core/referencePolicy.ts` are transparent, illustrative, and specific to this educational reference package. Moving a private coefficient into a configuration file would still disclose it; therefore private values are not present anywhere in this repository.

The Apache-2.0 license covers only this public reference code.

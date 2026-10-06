The retained IsoMax candidate removes per-child inverse reconstruction using geometry-compiled transition slots and stability masks, and shares existing support/mover/TT preparation. Matching localhost trials average 53.828 s versus 56.239 s controls, with approximately 445 MiB additional geometry memory. The <=10 s target remains unmet.

Package the exact reviewed source as `isomax/` version 0.2.0-rc.2, with a standalone archive, launchers, configuration, dependencies, provenance and evidence. Default execution starts at empty 7x6 with four deep workers, 4 GiB shared TT and 256 MiB private TT per worker. No RLC, opening, persisted proof cache or solved knowledge is used. Board dimensions and fallback are chosen at initialization. Search/TT/ordering/gauge semantics and production CPC/BSFP are preserved.

Validation:

- 423 repository tests and 46 package tests pass; retained generators and535-unit NEES/source catalog pass.
- Exact source/closure reproduction, independent runtime lock and standalone extracted verification/smoke pass.
- Extracted archive solves empty7x6 EXACT WIN/c4 in55.326 s with recorded nightly runtime, verified0/2/4/6 affinity, four ready/exited workers and clean termination.
- Independent solver review and fresh packaging review completed; supplied-plan cold reuse/accounting defect corrected and rechecked.

Setup starts at `isomax/README.md`; transferable archive and SHA256 are under `isomax/dist/`. Historical archives remain available. This promotion does not publish to a registry.

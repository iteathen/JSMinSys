# C15b pre-performance qualification

Frozen warrant at ba04fee. Only helper packed publication changes; search producer/worker source unchanged. No performance conclusion yet.

29 focused tests pass on retained nightly/JIT flags. New test failed before implementation (sequence advanced4 instead of staying2), then passed: duplicate full key/value skips writes, every source key word mutation and changed value still publishes. Concurrent correlated-key/hybrid probes cover compact7x6 and generic7x5. Independent physical minimax oracle repeated24 cases with root/move/cleanup agreement; raw output in independent.json, algorithm and seed unchanged from c15-validation/c15-independent.mjs. Independent reviewer found no blocking delta issue; requested all-field mutation coverage is included.

Catalog226 units and generated center-worker source checks pass. Source identities in ledger refreshed only after helper cost decomposition includes short-circuit duplicate comparisons. No producer or helper reporting counters added.

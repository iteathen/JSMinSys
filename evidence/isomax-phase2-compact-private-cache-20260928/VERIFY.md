# Compact private cache verification

Date: 2026-09-28

Candidate solver revision:
`81c9475e94607cff9e777776157b82b3466c385b`

Draft PR:
#111 — compact private exact-bound cache 7x6

Verify:
`36446198090` — success.

Passed:
- schema;
- Node compatibility;
- full repository verification, including generated behavior/root-frontier freshness;
- runtime-geometry audit;
- add-on/NEES source-blob coverage;
- directed private compact collision, bound-coalescing, exact-precedence and nonstandard-fallback controls.

Standard 7x6 private key storage is 14 -> 8 uint32 words per row while the full
14-word q and full-q locator hash are retained. Shared exact-cache behavior stays
at the already-qualified compact baseline. No single-worker qualification was used.

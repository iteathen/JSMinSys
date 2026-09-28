# IsoMax Phase-2 row-carried shared publication

Date: 2026-09-28
Base solver: `81c9475e94607cff9e777776157b82b3466c385b`
Status: implementation candidate; no promotion yet.

The selected compact-private solver already materializes the exact private row
before every admitted shared exact store. This experiment publishes shared
identity from that private row instead of re-reading q and reconstructing the
same compact identity.

Invariant changes: none.

Preserved:
- full-q locator hash and direct-map slot;
- private/shared exact row identity;
- shared seqlock/CAS protocol;
- exact-only shared values;
- private LOWER0/UPPER0;
- same-q exact-draw coalescing;
- full sharing;
- arbitrary-geometry full-key fallback.

Preparation explicitly rejects mismatched private/shared stored row layouts.
Public q-based shared cache APIs remain available unchanged.

Qualification requires Verify and a fixed-source 4-worker 1-wide+3-deep A/B
against `81c9475e...`. Whole-process cycles remain authority. No single-worker
qualification. PR #84 receives no merge authorization.

# Compact shared exact cache verification

Date: 2026-09-28

Fixed candidate solver revision:
`9594b6b88420d60f113cb5af560de2f128aec0da`

Draft PR:
#110 — IsoMax Phase2: compact shared exact cache 7x6

Verify:
`36405205784` — success.

Passed:
- addon/NEES catalog verification;
- 159/159 decomposed cycle-ledger units;
- schema;
- Node compatibility;
- behavior/root-frontier generator checks;
- root-frontier audit;
- runtime geometry audit;
- full test suite;
- CPC/alpha-beta benchmark sanity;
- add-on benchmark sanity.

Production geometry policy:
- compact path is selected only by init-time geometry/layout guards;
- source contains no fixed proving-geometry carrier constants;
- unsupported geometries retain exact full-key shared-cache semantics.

Standard selected geometry:
- full q locator remains unchanged;
- shared stored exact identity: 14 -> 8 uint32 words;
- sequence-lock and exact-only value semantics unchanged.

No single-worker qualification.

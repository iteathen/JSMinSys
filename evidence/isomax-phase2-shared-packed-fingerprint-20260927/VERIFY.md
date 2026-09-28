# Packed shared-hash fingerprint verification

Date: 2026-09-27

Candidate solver revision:
`5ed5a7e3c1b53e9558e223efe881f4f554ed9b2f`

Draft PR:
#104 — IsoMax Phase2: packed shared hash fingerprint

Verify workflow:
`36391619969` — success.

Passed:
- add-on catalog / NEES ledger verification;
- schema;
- Node compatibility;
- behavior generator --check;
- root-frontier generator --check;
- root-frontier audit;
- runtime geometry audit;
- full test suite;
- CPC/alpha-beta benchmark sanity;
- add-on benchmark sanity.

Correctness boundary:
- packed low two bits carry only exact W/D/L codes 1..3;
- high bits reuse the existing q locator hash as a fingerprint;
- fingerprint mismatch fails closed as a cache miss;
- fingerprint match still requires full q-key equality;
- final shared sequence validation remains mandatory;
- shared cache remains exact-only;
- no additional table or per-slot allocation;
- no solved-game prior information;
- no single-worker qualification.

Ledger:
- 156/156 units decomposed;
- no missing units.

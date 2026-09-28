# Pure known-hash hot-helper verification

Date: 2026-09-27

Candidate solver revision:
`9da33eb5146ea94dd0928c4632a7f91f0cda4b29`

Draft PR:
#99 — IsoMax Phase2: specialize pure shared known-hash hot path

Verify workflow:
`36383046141` — success.

Passed:
- add-on catalog / NEES ledger verification;
- schema JSON parse;
- Node compatibility syntax check;
- behavior generator --check;
- root-frontier generator --check;
- root-frontier audit;
- runtime geometry audit;
- full test suite;
- CPC/alpha-beta benchmark sanity;
- add-on benchmark sanity.

Ledger summary:
- units: 158
- decomposed: 158
- missing: 0
- legacy symbolic visible: 0

Semantics retained:
- compatibility shared exact helpers remain available;
- hot callers use mandatory-known-hash shared exact probe/store helpers;
- full q-key equality and sequence validation remain;
- shared cache remains exact-only;
- local LOWER0/UPPER0 coalescing remains private;
- no selective all-noncutoff shared fallback is present;
- no single-worker qualification.

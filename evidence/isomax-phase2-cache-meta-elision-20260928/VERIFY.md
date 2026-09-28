# Meta-elided cache identity verification

Date: 2026-09-28

Candidate solver revision:
`03019e7fdde9270798ae5598656897293523b92e`

Draft PR:
#109 — IsoMax Phase2: meta-elided exact cache identity

Verify:
`36403670506` — success.

Passed:
- addon/NEES catalog verification;
- schema;
- Node compatibility;
- behavior generator --check;
- root-frontier generator --check;
- root-frontier audit;
- runtime geometry audit;
- 166/166 tests;
- CPC/alpha-beta benchmark sanity;
- add-on benchmark sanity.

Directed identity coverage includes 4x4, 7x6 and 10x10:
- full state keyWords = cacheKeyWords + 1;
- metaOffset = cacheKeyWords;
- nonterminal meta equals sum(support heights)<<2;
- exact cache intentionally ignores only trailing derived meta.

Standard widths:
- 7x6 full state: 14 words; cache identity: 13;
- 4x4 full state: 7 words; cache identity: 6.

Full sharing remains enabled. Shared cache remains exact-only. Private LOWER0/UPPER0
semantics are unchanged. No single-worker qualification.

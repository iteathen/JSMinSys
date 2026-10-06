# Memory profile package qualification

Runtime freeze:40b19431f00174c5d52c442677d67ec698e8c50a.
Owner policy:auto-select any fitting profile, including experimental16–128GiB.
1/2/4/8GiB labels retain the scoped localhost qualification; larger profiles
have metadata/addressing/small-bank checks without full-capacity performance claims.

Read-only independent review found a missing reserve for compiled planes on supplied
support plans with preparation budget0. The metadata-only regression failed before
the correction and passed after it. Effective-plan admission and compiled reuse now
match the support compiler. Fresh7x6/six-worker reserve remains2GiB.
No additional blocking finding remained at the runtime freeze.

Focused cache/memory suite:22/22. Packaged suite:81/81, no skips.
Catalog:298 sealed functions,563 add-on units,30/30 blocks, none deferred.
Package preparation/check and154-file closure verification pass.
Source changes since the measured89b1b14 freeze only affect cold memory reserve
estimation; the search workers/cache hot protocols are byte-identical.

The default runtime89b1b14 empty7x6 confirmation selected tested8GiB and six
verified P-core workers. EXACT/WIN, column4,39,662.3713ms solve; initialization
4919.246ms, cleanup36.8725ms, peak RSS11699208192bytes. Raw evidence:
https://github.com/iteathen/Connect4/tree/09c24fce/docs/qualification/20261006-memory-profiles
This single confirmation is not a repeated speed campaign or a universal optimum.
Native cross-OS startup CI results are recorded separately after final packaging.

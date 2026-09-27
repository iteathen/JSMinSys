# Final qualification checkpoint

Final performance sample source: 250ae50 (solver logic from 5b21782).
Afterward, one comment was narrowed to state the loss guard precisely; generated
behavior source and source-blob ledger guards were refreshed. No executable
solver change followed the final measurements.

159/159 repository tests passed. The separate scaling-harness test passed.
Catalog/cycle-ledger verification, generated-source --check, configured-geometry
audit, CPC/alpha-beta qualification benchmark and RBA-add-on benchmark succeeded.
The last two machine-readable outputs are retained beside the report.

360/360 campaign samples completed with expected WDL, joined workers and correct
all-worker node/cycle accounting. 35333571's separate diagnostic timeout remains
preserved as timeout. Three independent hard-case repetitions per worker count.

Production defaults: unchanged (existing library default sharing mask is 0).
Recommended next sustained baseline: four native workers, full sharing, 1M
shared entries and 1M private entries per worker; memory optimum remains open.
Current source and evidence are on the existing experiment branch, not merged
into protected main or repinned into Connect4 by this task.

Do not reuse old memory/strategist performance claims as measurements of these
new endpoint-producing workers. Requalify the relevant configured composition.

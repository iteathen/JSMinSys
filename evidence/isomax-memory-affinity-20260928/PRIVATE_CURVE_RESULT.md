# Candidate-only private-cache curve extension

Two new fresh-process samples; NO repeated baseline. Owner requested approximately15 and100MiB. Nearest native power-of-two capacities are18MiB(524288entries) and72MiB(2097152entries),36bytes/entry. Exact requested byte sizes would change the existing cache indexing contract.

Both returned EXACT,rootWdl=-1,move=4,all4workers active/exited,cleanup=true. Same clean solver6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e,Node27nightly20260928b59840b593,i5-12600K Windows host,4distinct pinned P-cores,1wide+3deep,shared10GiB,full sharing,35333571,300000ms. No runtime solver changes or memory growth. Full manifests/raw/sample outputs accompany this report.

| Private cache/worker | Process cycles | Wall seconds | Total nodes |
|---|---:|---:|---:|
|18MiB,one new sample|972150131798|66.546|196946287|
|36MiB,existing four-run pinned mean|822663778192.5|56.255|147229413.25|
|72MiB,one new sample|595178346882|40.683|87351245|

Comparisons are descriptive against the existing placement B mean,not contemporaneous paired qualification. No confidence interval for either new singleton. See analysis JSON for exact percentage deltas.72MiB is a promising better setting on this fixture;18MiB regresses. Neither result proves an empty-board optimum or that100MiB specifically was tested. No additional runs or global default changes were made. Earlier small-cache results remain in CONTINUATION_REPORT.md; mixed repetition counts and acquisition times must stay visible when drawing the curve.

## Larger point: owner requested256MiB

Nearest supported power-of-two size is288MiB/worker (8388608entries);256MiB itself was not tested. One candidate-only process, same fixed source/runtime/four-P-core placement/10GiB shared/35333571/300000ms. EXACT,-1,move4,all4workers active/exited,cleanup=true. No baseline rerun.

| Private MiB/worker | Wall seconds | Process cycles | Nodes |
|---|---:|---:|---:|
|18|66.546|972150131798|196946287|
|36 (existing four-run mean)|56.255|822663778192.5|147229413.25|
|72|40.683|595178346882|87351245|
|288|32.935|482075353928|60615217|

288MiB improves further on this hard fixture; reductions versus72MiB are descriptive single-run comparisons,not paired qualification. No confidence interval or universal saturation/empty-board conclusion. All new capacities remain curve experiments,not automatically promoted production defaults. See private-curve-288-analysis.json and raw/manifest/sample files for exact values and provenance.

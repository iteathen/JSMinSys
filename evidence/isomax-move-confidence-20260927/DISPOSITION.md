# Interrupted label pass

Source 03f1f26. Forty positions were labeled before p24-8 exposed a harness
assertion that distinguished +0 and -0. The root and every child had completed;
both root and all-action combination were draws. No solver defect was found.

The exact failed record remains in labels.jsonl. No performance tests ran.
A real-worker regression reproduces the error before the comparison repair.
The corrected fresh campaign is isomax-move-confidence-corrected-20260927;
do not pool this partial pass into its accuracy or timing statistics.

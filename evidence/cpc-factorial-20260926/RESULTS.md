# CPC predictive-family factorial screen

Removing both predictive families remains the strongest candidate against full
CPC on this pinned fixture: **3.744% fewer total process cycles**, with all eight
paired blocks favoring removal. Removing exhaustion alone did not help. The
individual-family results do not yet establish which mechanism explains the gain.
No production changes or promotion were made.

## Results

32 uninstrumented fresh-process solves: eight balanced blocks, one sample per
arm per block. Orders ABDC, BCAD, CDBA, DACB, repeated twice.

| Arm | Removed | Mean process cycles, billions | Paired change vs full | Descriptive 95% interval | Mean joined solve, ms |
|---|---|---:|---:|---|---:|
| A | Nothing | 17.802 | reference | — | 1059.65 |
| B | Residual exhaustion only | 17.843 | +0.232% | [-1.192%, +1.656%] | 1062.77 |
| C | Long-range response only | 17.502 | -1.665% | [-3.559%, +0.228%] | 1057.70 |
| D | Both | 17.135 | -3.744% | [-4.617%, -2.872%] | 1047.42 |

Changes are means of within-block ratios; they are not ratios of the displayed
arithmetic means. Intervals use Student-t with seven degrees of freedom. These
are exploratory, unadjusted multiple comparisons on one workload; no universal
ordering or NEES promotion follows.

D vs B: -3.935% [-5.858%, -2.013%]. D vs C: -2.059%
[-4.488%, +0.370%]. The multiplicative interaction D*A/(B*C) is -2.255%
[-5.205%, +0.695%]; interaction remains unresolved. Do not claim that removing
both has established superiority over response-only removal.

All 32 production and eight diagnostic samples returned exact rootWdl=1,
move=3, no errors, all four workers exited, cleanup=true. Every cycle partition
closed exactly. No timeout occurred; the 30-second solver ceiling was unchanged.

## Separate node diagnostics

Two instrumented fresh processes per arm, orders ABCD and DCBA. Existing numeric
node counters are redirected to padded shared slots by the pinned loader; these
runs are not used for production cycle rankings.

| Arm | Mean total worker visits | Mean diagnostic process cycles/visit |
|---|---:|---:|
| A | 2,828,242 | 6,189.37 |
| B | 2,842,443.5 | 6,219.43 |
| C | 2,850,015.5 | 6,008.37 |
| D | 2,866,003 | 5,995.08 |

D visited about 1.34% more nodes in this small diagnostic sample while its
uninstrumented whole-process cost fell. This supports evaluating net solve cost,
not treating node count as the objective. Two diagnostic samples cannot establish
a stable node-inflation estimate under Lazy SMP scheduling.

## Frozen scope and source review

- JSMinSys baseline A: 93aca1758718bcbf0635c11a957a67ca6387d50c.
- B: 8dfde9a87e0ea7f8da24b9e900457b3d43687924.
- C: 8d7095acf90b80ec3120136c1b4e538744d2cb5a.
- D: 25d4d24d51aa121fe675ade4f2de5af79941fcd0.
- Unmodified sample, counter, node instrumentation and validator from Connect4
  7a1a41665d3f5b1a679c16598d60ae3d1035706d, byte-compared before publication.
- Input 45461667; four workers; local/shared capacities 65536; sharing mask 7;
  pooled-frontier response and projected advisory disabled; no strategist.
- Windows, Intel i5-12600K, Node 26.7.0, V8 14.6.202.34-node.28.
- QueryProcessCycleTime measures user+kernel cycles across all process threads,
  from process creation through joined solve. It includes bootstrap, setup and
  shutdown; excludes subsequent report/Git output and the parent controller.
- Each candidate differs from A only in the CPC module and its symbolic cost
  ledger. Checked cofactor, immediate-win occurrence, move ordering, cache and
  worker code are identical. No per-node experiment switch was introduced.
- Source removals preserve terminal draw, tactical loss, immediate win, forced
  block and fork restrictions. The two removals commute as source edits; that
  does not imply additive runtime effects.

13 targeted existing tests per arm passed (52 total): independent small-board
and late-7x6 exact oracles, first-win/tactical behavior, serial/Lazy SMP agreement,
sharing density and shared exact publication. Treatment assertions passed for
all four arms. All four catalog/ledger verifications passed. Tests that require
the deliberately removed deduction were not asserted as unchanged contracts.
This is bounded candidate qualification, not the full test suite or NEES gate.

The ledger zeroes removed loop/call terms and retains a conservative fixed-cost
envelope. It is not an exact Intel instruction count; measured process cycles
remain the economic evidence.

## Setup interruption and evidence

Windows autocrlf initially made the catalog's byte hashes fail even on unchanged
A. Verified Git blobs matched the ledger. Converting only decomposed source files
to their committed LF bytes made all catalog checks pass; Git index refresh
confirmed no baseline source changes. An initial controller invocation then
stopped at its dirty-worktree gate, before launching any sample. Its manifest is
retained in `screen/`. `screen-verified/` contains the completed campaign; no
failed performance sample was retried or discarded.

Raw stdout/stderr, exact identities and source hashes: `screen-verified/manifest.json`,
`processes.jsonl`, `samples.jsonl`, `diagnostic.jsonl`, `summary.json`.
Treatment patches and `source-checks.json` preserve the candidate definitions.
Local candidate worktrees are retained for reproduction. The durable experimental
record belongs to JSMinSys PR #52; this adds no competing production execution model.

## Reproduction and disposition

Create four clean worktrees from A at the paths in the manifest. Apply the named
patches to B/C/D and commit; reconstructed commit IDs may differ, so the harness
captures fresh identities. Normalize decomposed sources to committed LF bytes,
verify catalogs, and refresh the index with `git add --renormalize addons`.
Confirm no unrelated changes. Run with the pinned Node runtime:

```text
node experiments/cpc-factorial/run.mjs NEW_OUTPUT_DIRECTORY
node experiments/cpc-factorial/analyze.mjs NEW_OUTPUT_DIRECTORY
```

Keep D as the leading candidate. The sensible next qualification broadens to
mirrors and additional solved positions, then composes the separately guarded
duplicate-win-check removal. Do not tune strategist or memory using these numbers
as though that combined configuration were already integrated or qualified.

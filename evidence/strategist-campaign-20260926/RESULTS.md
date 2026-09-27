# Initial asynchronous strategist campaign

Windows, Intel i5-12600K, Node 26.7.0 / V8 14.6.202.34-node.28.
Two evaluators, separate strategist where enabled. 4,096 private cache slots
per evaluator and 16,384 shared slots. No CPU affinity; short fresh-thread trials
with 20 untimed 4x4 warmup solves. Strategist does not mutate the TT.

## Revisions and outcomes

- Base optional controls: `424d5c230f92e3394dc874eec4caa09c685f0bfb`.
- Screen: `635ae8c`; second screen: `1613fa4`.
- Initial 64 comparisons: `a47d604`.
- 27 cadence comparisons: `3e079da`.
- 72 confirmation comparisons: `90f2ac7`.
- All 163 comparison solves completed, agreed on WDL, and joined all threads.
  4x4 empty is draw; selected 7x6 root and mirror are P0 loss. This is agreement
  with the baseline solver, not a newly independent proof of RBA correctness.
- Initial 14 screens: 12 exact, 2 clean timeouts at 500 ms. Trivial roots were
  rejected because the strategist had little/no opportunity to intervene.
- Full tests: 160/160 PASS. Existing catalog, runtime geometry, and exact source
  regeneration checks PASS. Ordinary addons/src unchanged.

The useful 7x6 fixture is 18 moves, zero-based columns:
`205363523335050016`; mirror `461303143331616650`.
These are targeted short tests, not Fhourstones or empty-7x6 solve results.

## Confirmation results

Median **sum of evaluator-thread cycles**, millions; 4 trials per cell.
Includes losing workers and retirement tail. Strategist cycles are separate.

| Policy | 4x4 empty | 7x6 root | 7x6 mirror |
| --- | ---: | ---: | ---: |
| No strategist (host-only) | 93.30 | 281.22 | 282.05 |
| Observer + original flag reader | 104.38 | 338.35 | 313.47 |
| Observer + inert experimental controls | 105.97 | 297.45 | 306.13 |
| Fixed extra tie shift | 93.57 | 302.38 | 308.27 |
| Sparse shared access (1/16) | 96.15 | 277.96 | 272.64 |
| Fixed shift + sparse access | 81.78 | 285.71 | 307.18 |

The static combination saved about 12.3% against the host-only control on 4x4,
but cost about 1.6% more on the 7x6 root and 8.9% more on its mirror. Do not
promote it as a general improvement. Fixed-shift median nodes were 19,996 versus
24,262 in the 4x4 host-only control, but 49,759 versus 47,731 on 7x6; lower node
counts do not alone establish lower cycle cost.

Sparse sharing is a follow-up candidate, not a selected default: median cycles
were about 1.2% lower on 7x6 and 3.3% lower on its mirror than host-only. Those
small deltas need longer, affinity-aware comparisons and more independent roots.
It is a static setting; this evidence does not establish a need for a strategist.

Observer controls show material variation even when game logic is unchanged.
Do not attribute their entire difference to the flag comparison: scheduling,
JIT/code layout, cache behavior and peer retirement timing remain confounded.
Host-only STOP is polled at roughly 1 ms; strategist STOP waits for its cadence.
That difference is deliberately charged as real retirement work, not hidden.

## Dynamic policies and cadence

Initial 7x6 medians, million evaluator cycles (4 repetitions, requested 5 ms):

| Candidate | Cycles | Median nodes |
| --- | ---: | ---: |
| Inert controls | 285.84 | 49,368 |
| Periodic rotation | 320.81 | 48,742 |
| Adaptive sharing | 294.14 | 49,368 |
| Rotation + adaptive sharing | 305.95 | 50,144 |

Periodic rotation reduced median nodes slightly while increasing cycles: it
fails the user's governing metric in this screen. Adaptive sharing uses the
contention/store ratio (>1/64 enables 1/16 sampling, with 20 ms hold); counters
and the short observation window do not reliably predict a useful intervention.
Some trials changed sampling and others never did. No dynamic policy earns
promotion from these results.

Requested cadence, 7x6 median million evaluator cycles (3 repetitions):

| Cadence | Inert | Rotation | Rotation + adaptive |
| --- | ---: | ---: | ---: |
| 1 ms | 298.65 | 299.88 | 303.50 |
| 5 ms | 290.82 | 324.86 | 318.95 |
| 25 ms | 288.13 | 309.57 | 309.56 |

This does not demonstrate a monotonic frequency curve or an optimal cadence.
Use trace timestamps, not requested intervals, for actual delivery opportunity.
Observed median intervals for requested 1/5/25 ms were 13.91/15.98/33.09 ms.
Policies are persistent preferences, so delayed delivery changes effectiveness
without invalidating WDL. State-scoped chronological instructions remain untested.

Owner correction: cadence is strategy-dependent, not an independent campaign
objective. The proposed atomic-wait follow-up was withdrawn before implementation
and its unimplemented test removed. Retain these timing observations as historical
evidence only. Future timing work requires an identified strategy whose benefit
depends on acting within a particular window; no universal cadence is sought.

## Measurement limits and interpretation

QueryThreadCycleTime brackets the whole solve call in each evaluator. This is
a hot-path-dominated operational measurement, not instruction-exact loop-only
cycles. Root frame setup and return overhead are included; warmup/ingress and
other V8 helper-thread costs are excluded. Short trials may include tier changes.
Warmup uses 4x4 zero-control solves; measurements include first policy activation
and 7x6 specialization costs, not just established steady-state execution.
No per-node clock, reporting store or acknowledgement is added. Control changes
increment one private counter; that incremental hot cost is included.

The strategist typically spent a few million cycles per short trial. This is
reported independently, not added to the primary metric. Cache/scheduling effects
and late STOP still appear in evaluator cycles and wall time. The trial host
remains responsive and enforces bounded deadlines with fail-closed cleanup.

Only two independent game positions were compared; the mirror is an orientation
check. Four/three repetitions are screening evidence, not statistical acceptance.
The untouched production path remains the default. No full NEES claim, solver
promotion, new pruning, TT bound change, PFIF frontier enumeration or restart
policy is hidden in this experiment.

Independent read-only review found no critical or important findings. It checked
active parent move-list safety, fresh-trial storage, cycle sums including losers,
bounded setup failure and delayed-strategist cleanup. Its cadence, warmup and
mirror-evidence limitations are recorded above.

## Next useful experiments

1. Confirm sparse sharing across more nontrivial roots, using paired runs and
   controlled placement; compare a cold static setting with strategist delivery.
2. Replace blind periodic rotation with a policy driven by evidence relevant to
   the current proof obligation. Current global cache counters are insufficient
   to infer which root alternative deserves attention.
3. Before context-dependent commands, define scope/expiry and rejection costs;
   no board reconstruction or per-node state publication should be assumed free.
4. Test combinations only after each component earns its cost. The 4x4 combination
   did not transfer, illustrating why improvements cannot simply be added.

Raw JSONL files retain every trial, node count, thread cycle interval, setting
change count, TT counters, strategist trace and cleanup result. Reproduction:
`experiments/strategist/README.md`; summaries: `summarize.mjs`.

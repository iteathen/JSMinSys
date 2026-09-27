# Worker actions and research-guided strategist campaign

Owner scope: experimental strategist and behavior flag handlers only. No solver,
TT, existing host/evaluator, memory, timeout or scheduling changes. Optimize total
evaluator solve-call cycles, including losing workers and action costs. A faster
wall clock or higher visit count alone is insufficient. No production promotion.

## Research consulted, 2026-09-26

Existing IsoMax Core-0.19 rendering/DP campaign at Connect4
`e19d70b5073f17dc07a2aa5e504c2c4ee0a72acc`:
`research/isograph/discovery/2026-09-26-isomax-core019/DP_REPORT.md` and review;
the preceding `2026-09-25-lazy-smp-all-leads-investigation/FINAL_REPORT.md` and
`2026-09-25-lazy-smp-dts-0.1/PROVENANCE_CENSUS_0_1.md`.

Load-bearing observations: sampled sharing benefits cannot be inferred from hit
counts; observed shared facts were predominantly CPC exact closures in that
frozen campaign; rank is not demonstrated reuse leverage; broader cyclic offsets
and root-order changes failed earlier acceptance. Exact root witness and value
are distinct obligations. Those historical measurements are not assumed current.

IsoGraph live main `e97cda505215f193e26eaadb8d7acf4c653540ae` now records direct
Core-0.19 integrated-stack qualification in Experiment 031, superseding the older
integration boundary. Qualified DP remains 0.1-0.7. The unqualified DP-0.8
sufficiency/valuation candidate at `03318348a4363019d37dd2aa0d80aba2b75c8958`
supplies a useful question: which alternative sufficient route preserves the
required answer AND witness at lowest whole-operation cost? It is guidance here,
not a claim that this campaign is a newly qualified native DP rendering.

Primary web sources consulted:

- [Stockfish search implementation](https://github.com/official-stockfish/Stockfish/blob/master/src/search.cpp):
  worker-dependent aspiration widths and separate worker search show deliberate
  policy diversity. This suggests testing heterogeneous worker effort; it does
  not justify importing chess selective pruning, optimism or changing this
  solver's alpha/beta protocol. No such implementation is added.
- [Pascal Pons Connect4 solver](https://github.com/PascalPons/connect4/blob/master/Solver.cpp):
  bound-valued TT entries and repeated null-window solves are materially different
  from our exact-only cache. Its reuse mechanism cannot be assumed equivalent.
  Stable action/witness correctness remains required; no bounds become exact facts.

## Actions

Opt-in `actions` handler uses the previously measured early integer equality.
The shared word is read at EVERY node completion. If changed, existing fields
are assigned; decoding is never deferred to initialization. Prepared data is
created before search. No allocation, string, clock, shared write or handshake
occurs in the handler. Extension and STOP semantics remain unchanged.

| Bit/field | Worker action | Sufficiency guard |
| --- | --- | --- |
| Existing rotation field | Select prepared cyclic tie precedence | Scores/root order/active lists unchanged |
| Existing sharing field | Select existing shared-access sample mask | Optional exact reuse only |
| 12 | Bypass shared cache by selecting null, restore saved reference when clear | Private cache remains; no TT clear/mutation |
| 13 | Enable existing CPC frontier-response proof option | Same RBA state; existing exact guards and preallocated scratch; no heuristic result |
| 14 | Select reversed prepared recursive tie precedence | Scores/root action order remain unchanged; qualify deterministic root witness |
| 0 | Existing cooperative STOP | Cancellation is never WDL; not issued by new policies |

The optional CPC proof path already exists and has independent-oracle tests in
`test/cpc-alphabeta.test.mjs`. This campaign adds live-toggle differential tests;
it does not redesign that proof algorithm. Live toggles only affect subsequent
evaluations. No parent frame is rewritten or reconstructed.

## Strategy hypotheses

- Private-only / private helpers: avoid atomics when reusable facts are too cheap
  or infrequent to justify traffic. These can lose useful reuse and need controls.
- Share-on-reuse: helpers begin private, join sharing after 64 observed shared
  hits. This is a coarse signal including self reuse, not measured helper leverage.
- Proof everywhere / helper proof specialist: pay stronger existing CPC closure
  cost to reduce search, either on all workers or only helpers. Count all cycles.
- Proof-on-reuse: sticky enable after the same reuse signal; test whether delayed
  proof effort helps. No claim that hits identify the worker's current position.
- Proof + private helper: factorial interaction control for proof cost and sharing.
- Reverse helper / reverse + proof: a different tie family from the previously
  rejected broader cyclic offsets. Root order is deliberately not modified.

## Execution and accounting

Run one/two original workers, early inert, actions inert, 1/8 sampling on one/two
workers, and the nine action policies. Two known nontrivial 7x6 roots, interleaved
rounds, 750 ms existing deadline, 20 existing warmups, fixed requested 5 ms timer.
Screen twice; confirm only candidates with promising complete-operation results.
Retain failed and timed-out outcomes. No cadence tuning or hidden retries.

QueryThreadCycleTime covers each complete solve call. Sum ALL evaluators and
report nodes, cycles/node and elapsed time. Strategist reads only existing cache
statistics; trace records published words and phase transitions outside search.
No additional per-node instrumentation. First specialization/JIT work remains
inside these short solves; finalists require matched confirmation and are not
automatically production improvements. The 1/8 control reflects the previously
qualified sampling policy, avoiding a full-sharing-only comparison.

Run `node --experimental-ffi experiments/strategist/action-campaign.mjs screen NEW.jsonl`.
Use `confirm NEW.jsonl action-POLICY ...` for selected follow-ups. Evidence records
exact source SHA and any dirty state. No static render occurrence count is used
as a cycle count or dynamic-frequency estimate.

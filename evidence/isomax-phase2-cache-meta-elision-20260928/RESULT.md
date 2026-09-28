# IsoMax Phase-2 result — exact cache meta elision

Date: 2026-09-28
Status: exact structural result retained; rejected from preferred whole-solve speed path.

## Fixed arms

A — preferred pure coalesced known-hash solver:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

B — verified meta-elided cache-identity candidate:
`03019e7fdde9270798ae5598656897293523b92e`

Candidate Verify:
`36403670506` — success.

The candidate keeps the full search state but moves support-derived nonterminal meta
behind the exact cache identity prefix. Standard 7x6 cache identity is 13 words
rather than 14. Private/local exact and weak-bound cache identity, locator hashing,
and shared exact cache identity all use that exact 13-word prefix.

Full sharing remains enabled. Shared cache remains exact-only. LOWER0/UPPER0 remain
private. No solved-position prior and no single-worker qualification are involved.

## Qualification artifacts

The PR benchmark workflow was retriggered by three branch updates before any
benchmark outcome was inspected. Every run used the same fixed source SHAs and
the same 4-worker topology, so all three pre-existing runs are retained rather
than selecting one by outcome.

Run 1:
- workflow `36403822254` — success
- artifact `10961627274`
- digest `sha256:77c86ac7e7850508b539bb4c749a0485daecdbe92eb4a87bb355aa3cec0ec38b`

Run 2:
- workflow `36403886144` — success
- artifact `10961378634`
- digest `sha256:1c12f6323229eff9a38542e1f392a96d52cb8102bf4185f2b9c46440cfdaf440`

Run 3:
- workflow `36403946612` — success
- artifact `10962020752`
- digest `sha256:336a504fcc0681ec1ea1d6409ef0ca1a67fac11dc2044dca186bf3439d6fc878`

Runner contract in every run:
- Windows latest / Node 26.7.0
- availableParallelism() = 4
- worker 0 wide/root-frontier
- workers 1..3 deep
- rootFrontier=true
- shared cache capacity 4,194,304
- local cache capacity 1,048,576 per worker
- full sharing / sharedSampleMask=0.

## Exact derived-long — 353335714

Each workflow ran eight balanced AB/BA blocks. Across the three independently
launched workflows this gives 24 paired blocks / 48 fresh exact processes.

All 48 processes completed exactly with:
- root WDL: -1
- root move: 4.

Per-run paired candidate-vs-baseline whole-process cycles:

| run | delta | 95% interval |
|---|---:|---:|
| 36403822254 | +0.185% | [-2.365%, +2.735%] |
| 36403886144 | -0.663% | [-1.150%, -0.177%] |
| 36403946612 | -0.541% | [-0.994%, -0.088%] |

Because all three workflows had already been launched before the first result was
inspected, the complete 24-block set is the relevant available evidence rather
than any favorable individual run.

Pooled paired 24-block result:
- whole-process cycles: **-0.340%**
- 95% interval: **[-1.092%, +0.412%]**
- CPU: -0.367%, interval [-1.197%, +0.464%]
- wall: +0.515%, interval [-1.340%, +2.371%]
- total nodes: -0.140%, interval [-0.418%, +0.138%]
- cycles/node: -0.197%, interval [-0.974%, +0.580%]
- shared hits: -0.631%, interval [-1.076%, -0.186%]
- shared stores: +0.130%, interval [-0.011%, +0.271%]
- RSS: **-4.626%**, interval **[-4.702%, -4.550%]**
- peak RSS: **-4.847%**, interval **[-4.904%, -4.790%]**

Pooled arm means:
- A cycles: 47.698 B
- B cycles: 47.520 B
- A nodes: 4.548 M
- B nodes: 4.541 M
- A RSS: 367.1 MB
- B RSS: 350.1 MB.

The memory reduction is real and stable. The whole-process-cycle interval crosses
zero, so the candidate does not establish a speed improvement under Phase-2
acceptance authority.

## Official hard fixed window — 35333571

All six hard samples timed out at the unchanged 120000 ms application ceiling.
No exact solve-speed ratio is admissible.

Across the three paired windows, descriptive candidate-vs-baseline means were:
- cycles: -1.757%, 95% interval [-5.845%, +2.331%]
- nodes: -1.875%, interval [-4.390%, +0.640%]
- cycles/node: +0.116%, interval [-1.571%, +1.803%]
- RSS: -4.794%, interval [-8.707%, -0.881%]
- peak RSS: -5.171%, interval [-6.445%, -3.897%].

These censored windows are consistent with the memory reduction but do not
qualify a solve-speed claim.

## Disposition

The semantic finding is retained:

> nonterminal meta is exactly derivable from support and is not an independent q
> identity component at the cache boundary.

The implementation is exact and verified, but it does **not** qualify as a
whole-solve speed improvement.

Therefore:
- retain `f549dcf...` as the preferred Phase-2 solver;
- do not promote `03019e...` into the preferred speed path;
- close PR #109 without merge;
- retain the candidate and measurements as evidence for memory-constrained
  profiles or later composition with a stronger exact representation change;
- do not infer a speed win from the memory result.

The next optimization must be a distinct measured hypothesis. PR #84 remains
draft/open and receives no merge authorization from this result.

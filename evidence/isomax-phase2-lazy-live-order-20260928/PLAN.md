# IsoMax Phase-2 exact lazy live-line ordering

Date: 2026-09-28
Base solver: `81c9475e94607cff9e777776157b82b3466c385b`
Status: planned implementation experiment.

The current eager stable live-line ordering scores every surviving sibling before
the first child is searched. The Phase-2 search-shape census measured 37.755% of
those scores as unconsumed on exact fixture `353335714`.

Candidate:
- precompute one exact static score upper bound per landing cell:
  `popcount(through[cell])`;
- collect legal actions without scoring;
- select each next child lazily in existing tie order;
- compute a dynamic live-line score only when its static upper bound can beat the
  best score already seen in that selection pass;
- cache computed scores per depth so recursion does not force rescoring;
- preserve the exact same descending-score / stable-actionOrder child sequence.

No child transition is constructed for ordering and no transition is recomputed.
The full q, compact private/shared caches, zero bounds, full sharing and full-q
locator hash remain unchanged.

All JSMinSys source changes must carry matching NEES/cycle-ledger updates and
source-blob seals in the same commit. Qualification remains 4 workers =
1 wide + 3 deep; single-worker runs are forbidden.

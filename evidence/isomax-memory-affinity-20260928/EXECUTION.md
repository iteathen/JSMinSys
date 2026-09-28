# Execution ledger
- [x] Canonical plan recovered; source/runtime and matrix fixed.
- [x] Capacity preflight exact (-1, move4), all4 workers active, clean.
- [ ] M16 empty-board 600000ms (in progress; no concurrent tests).
- [ ] Shared capacity ABBAABBA exact control.
- [ ] Optional affinity RED/GREEN and accounting.
- [ ] Default-off control, placement comparison, private-cache screens.
- [ ] Raw evidence + report + canonical research publication.

Implementation refinement: use Node's inherited optional --import worker startup
preload, with generic JSMinSys cold affinity API. No edits to search, worker loop,
canonical/generated solver, or TT. Preload binds before worker module evaluates;
record OS accepted group/mask per worker. Both placement arms use the same preload,
with off/no binding versus on. Compare default-off against unmodified launch first.
This minimizes source disturbance while satisfying initialization-only placement.

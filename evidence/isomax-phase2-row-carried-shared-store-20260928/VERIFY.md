# Row-carried shared publication verification

Date: 2026-09-28

Candidate source:
`34aa03a970ffedda619bd38e5163ec86bd55e18c`

Solver implementation:
`da3a78d304eebd312839de115bcc1ead8bcc5c97`

Draft PR:
#112 — row-carried shared exact publication

Verify:
`36448865089` — success.

The earlier Verify run `36448739074` failed only because two behavior-test fixtures
constructed a standard shared cache without the initialized geometry contract.
The solver guards, new directed tests, generator checks, runtime-geometry audit
and catalog verification had already passed. Commit `34aa03a...` corrected only
those fixtures by supplying geometry; the complete rerun is green.

Qualified behavior:
- public q-based shared APIs remain unchanged;
- internal admitted shared exact publication can reuse the already-materialized
  private exact-identity row;
- preparation rejects local/shared row-layout mismatch;
- standard compact and nonstandard full-key row publication are covered;
- opposite private zero-bound coalescing still publishes exact draw;
- 160/160 add-on cycle-ledger units are decomposed.

No single-worker qualification was used.

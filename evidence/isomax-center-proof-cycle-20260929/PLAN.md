# C1: consume CPC exact-kind contract once

Selected source A: 6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e.
Experiment ancestry: 68093ae185bb13e60976436a82235e457ae20df4 (same addons/tools).
Canonical research campaign: Connect4 research/semantic-quotient, commit
992babc4, research/isograph/discovery/2026-09-29-center-proof-cycle/.

The selected CPC evaluator returns CPC_EXACT iff its absolute interval has
equal endpoints. Source proof: its initial both-empty case returns exact;
immediate/fork/double-threat terminal closures return exact; after all remaining
endpoint tightening it checks equality before returning BOUND/RESTRICT/NONE.
The nonterminal consumer already exits on CPC_EXACT. Relative polarity
conversion is injective, so a later semanticLo===semanticHi branch is unreachable.

Remove only that redundant branch in searchCpcOnly and generated variants.
Keep the generic four-front search check: later front refinement can close its
interval. Do not alter CPC rules, producer stores, ordering, caches or topology.
This is independent of rejected CPC close-only fusion and proof-mask encoding.

Source-level saving per surviving non-exact CPC node:
one comparison plus its control branch; no new recurring operations. Use
(N-E) in the invocation ledger. Do not translate it into an invented Intel
cycle count; V8 may already fold it or code layout may regress.

Qualification: seeded legal 4x4/7x6/8x5 prefixes, both response policies,
projected advisory, first-win stopping; existing full tests; generated freshness,
runtime/root audits and ledger seals. Then fresh processes ABBA on maintained
353335714 with the locked localhost profile. If promising, expand to eight
paired exact blocks and hard-control validation before adoption. Failed screen
means retain evidence and restore the selected source, not optimize until it wins.

All resource/runtime options unchanged: selected i5-12600K profile, pinned
nightly, 4 workers (1 wide + 3 deep), 10 GiB shared / 576 MiB private each,
full sharing and existing cold affinity preload. Whole process cycles primary.
No single-worker performance run. No production promotion in this initial screen.

RED: kind invariant test passes; consumer occurrence test fails on the existing
redundant branch. This test describes the intended source reduction, not a new
gameplay behavior. Previous exact-result controls remain authoritative.

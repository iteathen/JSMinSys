# Fresh whole-remediation review

Read-only reviewer inspected6792395..1c7b64f, plan and NEES authority without
running tests or competing solvers. No Critical finding or demonstrated solver
result regression. Two Important integrity findings were verified and fixed:

1. validateCycleSymbols skipped activeCycleExpression and unboundedTerms.
The new regression failed before the fix and passed afterward. All three fields
now checked, plus operation counts. Existing PARK_DURATION is explicitly declared
as an unbounded scheduler duration rather than exempted or priced at zero.

2. Materialized result ledger missed affinity Array.from/callback/object/atomic
work. Actual source callback execution on Windows/Linux/macOS now independently
matches the explicit subledgers: five loads per Windows/Linux worker, four macOS.
The regression failed for missing bound callbacks then passed. State readiness
callbacks and native every(Boolean) also explicitly accounted and rooted.

Final fix pass:490tests passed,0failed,1GC-only skip; GC-specific release test
was separately executed and passed.651ledger units,573enforced graph units.
No runtime source change from1c7b64f in the review fix pass.

Reviewer found no separate minor issue. Declined performance causality, machine
boxing elimination, immediate RSS/compiled-plan GC, exhaustive game correctness
and complete NEES conformance. Ruling: preserve bounded claims and report these
limits; tests/code samples cannot establish those stronger properties. Cost if
wrong: users overestimating qualification; no global certificate is issued.

Production rc.4 is immutable and older. These are producer candidate fixes on
the work branch; package/main promotion is separate and not claimed.

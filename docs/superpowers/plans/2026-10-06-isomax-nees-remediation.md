# IsoMax NEES remediation

Direct execution authorization: owner requested fixes and a full empty7x6 solve
after each change. Execute inline on the existing isolated worktree/branch,
without another approval round. The audited source is `6792395`; runtime is
unchanged from measured `6bc1dd0`. Audit contract:
`evidence/isomax-nees-audit-20261006/REPORT.md` and NEES Draft0.5 at `7650bef`.

Hard constraints: exact variable-dimension solver through10x10; full solves only
empty7x6; no books/oracles/runtime expected answers; no BSFP/CPC proof changes;
keep discovered pinned multiworker topology and current memory/runtime flags.
Primary timing includes root construction after readiness, not initialization.
No automatic main promotion. Frozen old package remains immutable until a newly
bound package is deliberately prepared; current implementation fixes are owned
by producer support libraries, not copied into Connect4.

Review focus: module-local/import aliases and selected callbacks; nested conditional
publication; uint32 identity and negative-zero/cancellation transport; root/result
metadata after buffer release; malformed/oversized histories and timeout claims.

For every change: reproduce defect with a meaningful focused test, fix at owner,
run relevant checks/ledger, commit exact source, perform full solve using existing
Connect4 `run.ps1` with `partial24`, shared536870912, local8388608,
bank268435456, six verified P-core workers, Node27 frozen runtime,2400/9600.
Do not change source during a solve or accumulate another unmeasured fix.
Persist raw runs under `20261006-exact-tt-identity/nees-fix-*`. Repeat hot changes
when needed to resolve noise; rejected experiments restored and tested too.

## Change sequence

1. L3: shared cold cycle-parameter validator + regression tests; repair eight
   undeclared selectors in shared-layout ledger. Full solve.
2. L2: preserve callback-target expressions and admitted bindings in generators
   and existing partial-worker ledger. Regression for callee aggregation. Full solve.
3. L1: source-local/import-aware graph resolution; add actual prepared host and
   all admitted worker roots, fail closed on unresolved edges. Full solve.
4. L4: count conditional winner completion store and correct sentinel prose,
   with branch-specific regression. Full solve.
5. L5: scoped source-lock maintenance; reject unrelated drift rather than broadly
   resealing. Full solve.
6. M3: remove dead partial slot/tail ABI work coherently in worker generator and
   consumers. Full solve; inspect realization before assuming hash boxing remains.
7. M1: if still emitted, retain complete hash bits with proven internal numeric ABI
   that avoids boxing; exact collision controls and full solve.
8. M2: prove integer window/score/sentinel domain and eliminate negative-zero
   transport; independent bounded oracle and full solve.
9. C4: bound move-history ingress before allocation, including invalid DataView,
   first-terminal, full-column and variable geometry tests. Full solve.
10. C3: release closed-session buffer ownership while preserving result/state
    scalar metadata; lifecycle tests and full solve.
11. C1/C2/C5: accurately document persistent preparation, E3 root construction,
    checked readiness deadline and current profile; full solve.
12. Final ledger/package/NEES/independent review and resulting runtime evidence.
    M4 helper/Atomics costs and remaining broad optimization candidates get
    explicit dispositions; no unproved removal of required atomic/proof work.

## Progress and decisions

- Baseline `nees-fix-baseline-01`:39.8526872s primary,217.296875s whole-process
  CPU,EXACT/WIN/c4, six verified pins and six clean exits; producer6792395.
- No source fixes applied at plan checkpoint. Old audit is historical evidence,
  not a verifier that new corrected source must preserve old defects.

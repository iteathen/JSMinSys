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

Owner clarification during execution: full solves follow substantial coherent
changes, not individual lines/edits. The separate tooling repairs above are
already recorded; combine the remaining related COLD admission, resource-release,
deadline and documentation repairs into one prepared-application boundary change.
No implementation change may bypass the matched memory preflight.

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
- Change1 `b5aeba3`: symbols repaired; two regression tests pass; checker now
  catches missing IC before repair. Full `nees-fix-01-symbols`:37.7914212s,
  212.8125s CPU,EXACT/WIN/c4,six pins/exits. Runtime byte-identical to baseline;
  wall difference is run noise, not a tooling performance gain.
- Change2 `0084b24`: callback target expressions and concrete bindings retained;
  four focused tests and catalog pass. Full `nees-fix-02-callbacks`:38.3485895s,
  213.9375s CPU,EXACT/WIN/c4,six pins/exits. Solver unchanged.
- Change3 `1f95647`: actual source-local/import-aware closure now564 enforced
  units including32 workers and cold memory/discovery/startup roots; eight focused
  tests pass. Full `nees-fix-03-graph`:38.6730454s,213.8125s CPU,EXACT/WIN/c4,
  six pins/exits; solver unchanged.
- Change4 `bccd9ae`: actual completion source executed for96 winner/loser/cancelled
  paths across32 variants, now matches stores/RMW/notify accounting. Full
  `nees-fix-04-completion`:38.528148s,213.046875s CPU,EXACT/WIN/c4,six pins/exits.
- Change5 `30e670c`: three maintenance generators reject unrelated source drift;
  all rerun and11 tests/catalog pass. Full `nees-fix-05-scoped-guards`:39.4775608s,
  216.453125s CPU,EXACT/WIN/c4,six pins/exits. Solver remains baseline-identical.
- Change6 `87ed597`: removed dead partial slot/tail ABI from all8 candidate
  variants;10 focused/cache/dimension tests pass, including100 geometries and1551
  states. Full `nees-fix-06-partial-abi`:34.9560658s,214.421875s CPU,EXACT/WIN/c4,
  six pins/exits. One sample is not a claimed11% speedup. Current per-isolate
  diagnostic still emits unsigned hash boxing, so M1 was not superseded.
- Change7 `91677fd`: partial worker hash presentation signed32, all locator bits
  unchanged; byte-identical private/banked rows,12 focused tests and catalog pass.
  Full `nees-fix-07-signed-hash`:35.3293895s,210.890625s CPU,EXACT/WIN/c4,six
  pins/exits. No full-hash algorithm/public return contract change. Performance
  effect from one sample remains uncertain; final realization/repeats required.
- Change8 `86e7823`: all32 workers normalize recursive windows and returned
  scores without changing cancellation. Actual source-call regression and full
 482/482 suite pass; generator checks and564-unit graph pass. Full solve attempt
 `nees-fix-08-integer-windows` is RESOURCE_CENSORED before startup: physical
 free14.13GiB <preserved15.125GiB required. No performance conclusion or source
 change after this attempt. Matched solve is pending recovered memory.
- Grouped COLD regressions prepared while waiting, without modifying runtime:
 ingress allocates before rejecting oversize/uses external iteration; expired
 preparation launches4workers; pre-aborted partial throws; closed app retains a
 real TT backing handle after8major-GC turns. Tests expose existing failures.
- Change8 completed `nees-fix-08-integer-windows-02`:33.6200016s primary,
  209.984375s whole-process CPU, EXACT/WIN/c4, six verified pins/exits,
  peak RSS15,664,070,656bytes. Sourcef983426 is runtime-identical to86e7823.
  Owner authorized temporarily stopping OneDrive to recover required memory;
  this run differs in background activity from prior runs. Do not attribute
  its timing change solely to integer normalization. OneDrive must be restarted
  after qualification. Capacities/runtime/topology remained unchanged.
- Grouped COLD implementation: bounded indexed history before allocation,
  owned history replay, cooperative initialization checks before compilers,
  allocation and each launch, joined close clears large references after taking
  scalar resource snapshot. Seven targeted regressions pass including actual
  WeakRef/major-GC release and100 geometry shapes. Broad scan caught and corrected
  a new split-layout12byte double-count before timing. The proper top-level test
  set is being rerun; automatic discovery wrongly executes worker fixtures.

- Grouped COLD fullsolve `nees-fix-09-cold-boundary`, source1c7b64f:
 33.8710484s primary,207.046875sCPU,15,665,020,928bytes peakRSS,
 EXACT/WIN/c4,six pins/exits. Runtime hot bodies unchanged from change8.
- Fresh whole-branch reviewer found two Important tooling gaps; both reproduced
 RED then GREEN: active/unbounded expression symbols and affinity callback
 accounting. One fix pass completed490pass/0fail/1GC-onlyskip and catalog
 651units/573reachable. No solver runtime edit. Reviewed source and limits in
 evidence/isomax-nees-remediation-20261006/REVIEW.md. Final review: no minors.
- Ruling: current work repairs producer candidate; historical frozenrc.4 remains
 immutable, no main promotion. Cost if wrong: older distribution retains audit
 issues; explicitly distinguish candidate fixes from a released package.
- Matched controls: OneDrive remains stopped for both immutable6792395 and
 candidate. First control34.1060957s primary/209.6875sCPU. Initial -01 launcher
 attempt failed before process due PSObject property creation; fixed and -02
 passed. No performance evidence from that non-started attempt.

- Owner steering: Do not restore OneDrive. Earlier restoration requirement is
 superseded; leave it stopped and preserve the environment-change record.

- Matched alternating series A1/B1/A2/B2 finished: controls34.1060957,
 34.1992052s; candidates33.3282517,33.1626396s. Means34.15265045 ->
 33.24544565s; observed2.656% reduction. CPU209.7890625 ->205.75s.
 All EXACT/WIN/c4,six verified pins/exits; no observed regression.
 Composite retained; per-fix and portable performance gains unqualified.
- Independent physical-minimax validation26positions per native32,
 partial24banked andpartialMixed route: all78root/optimal-witness checks match,
 all four-worker cleanup succeeds. Same26positions, not78independentfixtures.
 No full10x10solve or sealed-holdout outcomes. Machine observation and limits
 preserved in Connect4 nees-final-numeric-code and current REPORT.md.

## Completion boundary

Scoped implementation steps1..11 are complete, with9..11 grouped under the
owner clarification. Final whole-branch review and its single fix pass are
complete. Correctness, generated code, matched full solves, source identity,
remote durability and no remaining benchmark process were verified.

Ruling: retain the existing work branch; no automatic main or frozen-package
promotion, as specified at plan start. An immutable6792395 control checkout is
retained at C:/r/jsminsys-nees-control-20261006 for identical reruns. Production
rc.4 remains its separate historical freeze and is not advertised as remediated.
The original audit packet stays historical; current REPORT/correctness/timing/
debt dispositions own these results. OneDrive stays stopped per latest owner
instruction. No deferred review minors. Whole-runtime native cycle qualification
and remaining optimization debt are not declared solved.

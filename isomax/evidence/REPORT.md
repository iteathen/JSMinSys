# IsoMax NEES remediation — selected producer candidate

Confirmed accounting, numeric ABI and application boundary issues are addressed
on `work/isomax-auto-workers-20261006`. The runtime freeze is
`1c7b64f352c2e44b4853f9faaf916b48d7837bce`; later commits change accounting,
verification and evidence. This is not a whole-runtime NEES certificate, a global
optimum, a ≤10-second result, or a production-package promotion.

| Finding | Current disposition |
|---|---|
| L1 cost graph | All 32 worker roots plus prepared/discovery/memory/state roots. Source-local/import resolution fails closed on ambiguity. 651 units, 573 enforced. The declared-call resolver is not an AST completeness proof. |
| L2 callbacks | Target-bound expressions survive maintenance generation; partial-cache and completion/affinity/state callback bodies are enforced. |
| L3 selectors | Operation counts and expression/active/unbounded fields are checked. Selectors and the unbounded wait label are explicitly declared. |
| L4 publication | 96 winner/loser/cancelled paths across 32 variants match conditional stores, RMWs and notifications. |
| L5 source locks | Three maintenance generators reject unreviewed source drift. Only reviewed inventories may refresh guards. |
| L6 frozen ledger | Historical rc.4 remains bound to its own `40b1943` ledger. Its 154 locked files verify; the current checker does not certify its costs. |
| M1 hash boxing | Signed internal ABI preserves all 32 locator bits in eight partial variants. Exact-row tests and representative machine code confirm the repaired call sites. |
| M2 windows | All 32 minimal variants normalize recursive windows and returned scores, with cancellation checked before score negation. Representative window arguments no longer box negative zero. |
| M3 dead arguments | Unused partial slot/tail work removed from the generator and eight workers. Keys are not truncated. |
| M4 helper/builtin costs | Whole JavaScript Atomics/call ABI costs remain explicit and symbolic. No unsafe removal of required atomics or proof guards; no allocation-free claim. |
| C1 READY boundary | Persistent arenas, TTs and plans precede READY. Actual one-shot root ingress follows READY and is included in primary time. |
| C2 initialization | Cooperative checks before compilers, admission, large allocation and each launch. Pre-aborted partial preparation cancels without a missing-plan exception. Synchronous stages cannot be preempted; public discovery precedes this clock. |
| C3 ownership | Close joins workers, snapshots scalar resource sizes and drops large owned references. A real shared-TT WeakRef becomes collectable. Immediate RSS or caller-owned-plan release is not promised. |
| C4 ingress | Bounded indexed arrays/typed arrays admitted before arenas. DataView/arbitrary iterables rejected. Original history read once and owned snapshot replayed. |
| C5 documentation | Historical rc.2/four-worker headings distinguished from current automatic profiles and the unpromoted partial24 candidate. |

The final suite passed 490 tests, with zero failures and one GC-only skip. Eight
targeted GC/layout tests passed separately. Boundary checks cover all 100 geometry
shapes through 10×10 without full 10×10 solving. Independent physical minimax
matches root outcomes and optimal witnesses on 26 positions for each native32,
banked partial24 and partialMixed route: 78 checks on the same 26 positions.
All bounded solver checks use four workers and verify cleanup. Oracle validation
occurs after solving and supplies no runtime premise. No CPC proof or BSFP source
was changed; no book, persisted solved input or sealed formula holdout was read.

The full-solve configuration remains the recovered localhost configuration:

- Windows x64 / Intel i5-12600K.
- Node `v27.0.0-nightly20260928b59840b593`; V8 `14.6.202.34-node.36`.
- Six discovered physical P-core workers, verified on CPUs 0/2/4/6/8/10.
- All deep, alternating center/live; root frontier disabled; sample mask 0;
  proof bounds and compiled support plans enabled.
- Shared: 536,870,912 rows × 24 bytes, two banks of 268,435,456 rows: 12 GiB.
- Private: 8,388,608 rows × 24 bytes per worker: 192 MiB.
- V8 inlining flags 2400/9600 and the recorded FFI/startup preload.

Primary timing runs from all workers READY and pages warmed through actual
empty-root construction to the observed exact result. Initialization and cleanup
are separate; process CPU includes them. Cycles and native node metrics are
unavailable. No hot statistics or clocks were added.

Every substantial runtime change has a full empty 7×6 result in
`timing-summary.json`. The grouped boundary result was 33.871 seconds. The final
alternating series used OneDrive stopped for both immutable control and candidate:

| Version | Primary seconds | Mean primary | Mean process CPU |
|---|---|---:|---:|
| Control `6792395` | 34.106, 34.199 | 34.153 s | 209.789 s |
| Candidate, runtime `1c7b64f` | 33.328, 33.163 | 33.245 s | 205.750 s |

All four returned EXACT/WIN/c4 with six verified pins and clean exits. The observed
mean reduction is 2.656%; two samples per source support no observed regression,
not a portable speedup or attribution to one edit. Candidate peak RSS was
15,663,845,376 bytes (~14.59 GiB), including the whole process. Earlier timings
with OneDrive active are not part of this comparison. The owner instructed
leaving OneDrive stopped; see `environment-change.json`.

The fresh review's two Important accounting findings were reproduced and fixed;
see `REVIEW.md`. Machine observations and raw hashes are in Connect4
`docs/qualification/20261006-nees-audit/nees-final-numeric-code/`. Other allocation
paths and builtin/helper work remain; full machine cost conformance is unqualified.
Further recurring-cost candidates retain explicit dispositions in
`debt-dispositions.json`. No speculative control-equivalence theorem became pruning.

Production rc.4 and main remain unchanged. The corrected producer candidate and
raw measurements are pushed on the work branch. A newly bound distribution is
required before these fixes can be advertised as part of the frozen package.

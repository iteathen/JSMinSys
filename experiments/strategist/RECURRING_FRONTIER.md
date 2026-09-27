# Recurring branch-local PFIF experiment

Owner-approved question: after a narrow continuation expands again, can renewed
bounded exploration reduce total evaluator cycles? This is a bounded experiment
in worker actions, not a new shared scheduler or TT representation.

## Prepared worker action

Bit 29 enables recurrence. Bits 16..21 retain the probe stride, independently
of the one-way root stride that becomes zero on root narrowing. Bits 24..28
select the narrowing target. Explicit full-release disables recurrence; STOP
keeps its existing per-node behavior. The strategist publishes the policy before
the measured run and otherwise changes only shared behavior words.

The recurring specialization is generated from the existing frontier worker.
When advancing without a bounded horizon, an already-generated genuine branch
can start a local region. That region probes to current depth + stride, then
retains its native parent frame, move order, alpha, best, and completed child
queries while advancing subsequent passes locally. Once sufficiently few
queries remain, it follows them without a horizon. A deeper genuine branch
can start a new local region. Forced chains keep using the existing native loop.
A bounded probe never recursively starts another probe region.

One byte per prepared depth/action slot records a completed **query**, not a
global exact value. With beta fixed and alpha monotonically increasing, a prior
fail-low result remains dominated; a fail-high ends the query immediately.
These markers never enter the shared exact TT. Unknown horizon results do not
complete a child. The existing exact-cache publication conditions are preserved.

No allocation, strings, reporting messages, timers, ingress replay, or frame
copying are added to recursion. The 7x6 prepared marker array is 301 bytes per
worker. Per-region counters distinguish entries, local passes, releases, reuse,
and entries below a prior local release. Two scalar recursion arguments carry
the scoped horizon and release ancestry; their cost is included in measurement.
Cutoffs occur before retention bookkeeping because a closed query has no frame
continuation to retain.

Root behavior remains the existing deterministic action contract. At internal
nodes, 'remaining' means unresolved obligations for the current alpha/beta
query, not all legal moves or a count of global frontier leaves. Native frames
are retained at the current branch; unresolved paths inside a probe can still
be revisited on the next local pass. This is not full frontier materialization
or multiworker partitioning. Disable/release takes effect at local pass
boundaries for already-active probes; STOP remains observed at node completion.

## Qualification and fair controls

- Actual re-expansion after local release must be observed, not inferred from
  more than one root pass or a faster timing.
- WDL and deterministic root witnesses must agree with the reference; seeded
  4x4 physical minimax, reflections, tiny caches, live disable and STOP check
  query-result retention and cleanup independently of timing.
- Compare baseline, one-way 2-ply narrowing, the recurring specialization with
  recurrence disabled, and active strides 2/4. Disabled recurrence must produce
  exactly the same node count as the one-way worker.
- Three rotated repetitions, one evaluator, unchanged 750 ms limit and cache
  sizes. Two established independent 7x6 positions plus B's adjacent winning-
  mover predecessor. The third root is not another independent game family.
- Measure complete evaluator solve-call cycles, nodes, cycles/node and wall
  time. All probes and revisits count. Record strategist cycles separately.

No production defaults or NEES claims are promoted by this screen. The outcome
may reject this implementation even if the recurrence idea remains useful.

# Worker / cache / profile / admission interaction campaign

Objective: minimum time to correct solution at declared hardware/memory resources.
Cycles and nodes explain cost; they do not veto faster valid results. Experimental
only, full CPC retained, no production or hot execution changes.

Bounded staged plan (at most 258 trials, 750 ms search each):

1. Resource interaction screen: one-worker base control, plus 2/4/8 workers at
   base (4096 private, 16384 shared), private 2x, shared 2x, both 2x. Two rotated
   repeats on A/B/B15: 78 trials. Per-worker capacity fixed within each memory
   profile; total private memory therefore grows with workers.
2. Pairing screen: at 4 and 8 workers, select the lowest geometric-mean fully
   solved memory setting from stage 1 (base on no fully solved setting). Compare
   all-deep, only worker 1 wide, only worker 0 wide, odd-index workers wide, and
   even-index workers wide. Two repeats on three roots: 60 trials. All use the
   unchanged mode-capable engine and common ready barrier.
3. Dynamic admission: same selected memory, 4/8 prepared workers, compare fixed
   one active, fixed all active, width-grow from one, width-grow from two. Two
   repeats on three roots: 48 trials. This stratum uses the existing observed
   engine in ALL arms. Two fresh comparable positive width deltas admit one
   standby at a time. Admission order is existing ascending worker ID; starting
   from one vs two changes the initial composition and subsequent activation
   sequence. No timed trigger, migration, pause/resume or role-transfer machinery.
4. Conditional holdout: at most one candidate per family (memory, pairing,
   dynamic) on mirrored A/B/B15, four alternating paired repetitions: at most
   72 trials. Each candidate must solve all training trials, improve geometric
   mean paired latency by at least 1%, and have no root median regression >5%.
   Memory compares to same-count base, pairing to same-count all-deep, dynamic
   compares to same-prepared-pool fixed-one. Selection is a screen, not promotion.

A/B/B15 are previously qualified roots (zero-based columns):
2053635233350500, 1320461024522311, 132046102452231.
Mirrors preserve exact value but are correlated games, not independent positions.

Each trial is a fresh process with 20 worker-private warmups, fresh caches,
5 ms requested strategist cadence, original 1500 ms cleanup grace. No simultaneous
benchmarks. Primary timing is common ready barrier to first exact completion,
conditional on final validation and cleanup. Joined and cold end-to-end timing,
all evaluator/strategist thread cycles, whole-process cycles, nodes, TT traffic,
activation traces and actual cache payload sizes remain evidence. Timeouts are
censored, never substituted into solved-time rankings. Failures stop the campaign
without retries; completed phases are checkpointed before the next begins.

Do not compare observed-engine dynamic timings to plain-mode timings as if only
policy changed. No provenance per cache row is added; aggregate hits do not prove
cross-worker benefit. Eight worker indices use seven column offsets, so index 7
repeats index 0's nominal offset. No change to that existing behavior is included.

This batch explores interactions among existing mechanisms. It does not exhaust
the space, establish optimum memory, qualify adaptive wide/deep reassignment, or
prove that a shallow worker should be permanently provisioned. Follow-up selection
must respect whole-solve latency, guard correctness, and preserve negative evidence.

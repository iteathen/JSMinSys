# Solve-time objective follow-up

Owner instruction: parallel objective is time to solve; single-evaluator cycles
to solve may be the efficiency objective. Aggregate parallel cycles are diagnostic,
not a veto on a faster correct answer. Preserve exact result and witness semantics.

Reuse the four frozen CPC factorial arms. No library changes. First analyze the
existing 32 production samples by joined wall time. Then obtain an independent
32-sample parallel confirmation and 32-sample serial cycle screen, eight balanced
four-arm blocks each. Run one process at a time, alternating serial/parallel blocks.
Same input 45461667; same private capacity 65536; parallel four workers, shared
capacity 65536, sample mask 7. No strategist or duplicate-win-check changes.

Parallel primary endpoint is accepted API return (joined cleanup): current host
error state is checked after close, so early DONE is provisional. Use unchanged
factorial production sampler. Measure host observation and close separately in
eight diagnostic runs by cold lifecycle wrappers; exclude those from acceptance.

Serial calls the existing public serial solver, no shared cache, orderOffset=0,
CPC-only. Measure solve-call process cycle delta including runtime helper threads;
also report process-total cycles, setup time, solve time and existing node count.
An external 30-second process deadline bounds synchronous serial calls without a
new hot-path timeout check. Parallel retains its 30-second solver deadline.

Store every subprocess output, source identity and failure before validation.
No retries on failure. Descriptive block-paired intervals, not full NEES promotion.
Keep old evidence immutable. Commit and publish reproducible findings on the
existing experimental branch, leaving production untouched.

# Observation-cost separation and harder-position retest

Approved objective: distinguish measurement/worker cost from strategy value;
retain required operating cost in whole-solve comparisons. No production solver,
generated recursion, TT, move ordering or timeout-policy edits.

84 sequential fresh-process trials, committed before execution:

- 48 short trials: 4 rotated repetitions on A/B, one evaluator, 750 ms cap,
  private4096/shared16384. Bare native; native+STOP polling (host only);
  native+STOP polling with inert strategist; mode-capable DEEP; observed DEEP
  with no requests; observed DEEP with asynchronous requests.
- 36 harder trials: 3 rotated repetitions on Fhourstones 45461667 and empty,
  5-second cap already supported by the harness, four prepared workers,
  private4096/shared32768. All DEEP; worker0 WIDE/three DEEP; minimal fixed1;
  minimal fixed4; observed fixed1; observed grow1. Admission uses existing
  positive-width-delta policy. No short-result eligibility gate.

All arms retain their existing accounting counters. Timers and Windows cycle
reads bracket solve calls, never nodes. 20 warmups and a common ready barrier;
requested strategist cadence 5 ms, actual delivery retained in traces. Existing
1500 ms cleanup grace. Bare native is restricted to one worker, short solved
fixtures only; inability to finish/clean up fails the campaign, not a timing win.

Adjacent short contrasts isolate polling, strategist presence, and observation
where traversal matches. STOP-to-mode also changes root query windows and
control flow; its difference is total implementation cost, not just decoding.
Report node agreement before interpreting cycle differences as overhead.

Minimal fixed pool cold-selects the ordinary mode worker and sends activation/
STOP only. It neither creates observation storage nor requests snapshots. Grow
retains observed execution and snapshots because the policy needs them. The
observed fixed1 control separates this cost from activation effects; minimal
fixed1 measures the net cost/benefit of the complete growth implementation.

Primary: time to a correct completed solution. Single-worker solve cycles and
nodes provide overhead diagnostics; all-worker and strategist cycles remain
separate. Timeouts are censored and cannot be ranked by nodes as solve progress.
Record actual activations, snapshot publications, copied words and horizon work.
This is a bounded diagnostic, not a full Fhourstones score or NEES qualification.
Preserve previous evidence and do not promote from these small samples alone.

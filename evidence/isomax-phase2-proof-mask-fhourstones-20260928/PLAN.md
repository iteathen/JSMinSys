# Standard Fhourstones input comparison

Requested follow-up after PR118 rejection. Test the four official inputs, not
353335714. One fresh A/B pair per input, official input order, serial processes.
A=be7c2887defcefb37080fa61de7ce1dc38dc2990; B=7f74e324457c4237590bc6b0f924852f6d728e4c.
Use the existing proof-mask source AB runner unchanged with blocks=1 and
application timeout=120000ms. Four workers: one wide and three deep; shared
4194304, private1048576 each, full sharing. Node26.7.0, Windows
QueryProcessCycleTime. No algorithm or instrumentation changes.

Expected absolute WDL: 45461667=1,35333571=-1,13333111=0,empty=1.
Source: https://tromp.github.io/c4/fhour.html (checked 2026-09-28).
Timeouts are censored. Single pairs are descriptive, not statistical promotion
qualification. IsoMax visits are not reference Fhourstones nodes; no official
Fhourstones score can be claimed from an incomplete suite.

Reproduce: node evidence/isomax-phase2-proof-mask-fhourstones-20260928/run.mjs
The driver refuses to overwrite existing case results. It calls the existing
cold harness and adds no search instrumentation. Cold orchestration costs:
four sequential child-process launches (OS/blocking work, unbounded); bounded
JSON/file reads/writes and result checks, outside each measured solve bracket.
Process launch and file work are not zero-cost solver operations.

Harness correction after first hard sample: baseline returned TIMEOUT with
HOST_DEADLINE=102, cleanup=true and four workers joined. The old exact-comparison
controller incorrectly rejected any nonzero errorCode. Original raw output and
controller error are retained. The standard-suite driver now calls the SAME
unchanged source sample runner, accepts only TIMEOUT/102 or EXACT/0, validates
all other lifecycle/configuration gates and resumes from raw process records.
No completed sample is rerun. Inline controls reject wrong status/code pairs.
All process outputs are persisted before classification. This changes cold
orchestration only; timing bracket and both solver revisions are unchanged.
Cold accounting: at most eight launches and git checks, O(raw bytes) parsing,
fixed four-case/two-arm checks, filesystem/blocking costs outside measured solve.

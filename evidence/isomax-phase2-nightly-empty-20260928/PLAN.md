# Node nightly and empty-board follow-up

Owner requested Node nightly AFTER the pinned26.7.0 long comparison, then a full
empty-board attempt with ten minutes per run. Both fixed sources remain unchanged:
A=be7c2887defcefb37080fa61de7ce1dc38dc2990;
B=7f74e324457c4237590bc6b0f924852f6d728e4c.
Nightly=27.0.0-nightly20260928b59840b593, official Windows x64 zip checked against
published SHA256. See runtime.json for exact URL,hash,index record and local path.
Installed alongside26.7.0; no global PATH change and no production runtime promotion.
Nightly full correctness suites: A174/174,B180/180. QueryProcessCycleTime FFI
availability checked successfully. No source compatibility changes needed.

First, isolate runtime effect: fixed source A,fixture353335714,ABBAABBA order,
A-runtime=26.7.0,B-runtime=nightly,eight fresh serial processes,90000ms each.
Expected WDL=-1,move4. This is a small local runtime screen,not a broad Node claim.
Then run empty board once on each solver A/B, both using nightly,600000ms each.
Expected completed absolute WDL=1; exact move must agree if both finish. Timeouts
are censored, no solve-speed ratios. No cap extension or automatic retry.

All samples:4workers,one wide+three deep,shared4194304,private1048576 each,
sharedSampleMask0,rootFrontier=true. Reuse existing source-sample measurement.
No ply instrumentation or hot loop changes. Raw output persisted before checks.
Cold orchestration: at most10process launches with nonzero OS/blocking costs,
Git checks, JSON/I/O O(raw bytes), fixed numeric validation. Outside solve bracket.

Execution disposition: runtime screen completed8/8. Empty-board baseline reached
600-second timeout; owner explicitly cancelled candidate during execution.
Preserve cancellation.json and raw nonzero exit. Do not resume the old run.mjs
empty command: this series is retired at owner direction,not awaiting retry.
See REPORT.md and the canonical shared-TT/L2 experimental plan for next work.

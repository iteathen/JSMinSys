# One-shot intermediate Player One win:151231

Owner required one position/test only,harder than35333571,easier than empty,first-player win rather than draw. No trial solves or baseline reruns.13333111 was rejected before execution.

Selected151231 from existing Pascal Pons Begin-Hard Test_L1_R3 reference row151231 1,six moves,first player to move. Dataset retained in Connect4 docs/research/evidence/2026-09-12-pons-protocol/data/Test_L1_R3;SHA25674dd53517f4e180c08ce9d59beccbcd9af3a9f7b233115440e8bbb2db19045c3. Reference WDL checked only after result;no solved data supplied to search. Expected best move was not assumed.

Single fresh process completed EXACT with rootWdl=1,move=2 (zero-based,column3). Matches reference first-player win. Wall42740.8729ms,CPU168485ms,process cycles624327517535,total nodes83075039,7515.2239cycles/node,1943690.743nodes/s. Worker counts14262879/23056873/22986931/22768356. Shared hits10159435,stores25209365. PeakRSS12851482624bytes. All4workers active/exited,cleanup=true,errors=[]. No remaining benchmark process.

Locked hardware profile:10GiB shared TT,576MiB private/worker,4distinct pinned i5-12600K P-cores(1wide+3deep),full sharing,Windows11,Node27.0.0-nightly20260928b59840b593. Fixed clean solver6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e.600000ms ceiling unchanged. Complete raw/manifest/affinity/sample records in begin-hard-win-151231-*.

Historical same-profile35333571 took32.4070529s/474132402721cycles/59427894nodes. New root took42.7408729s,about32%longer,comfortably below600s. It meets the requested intermediate fixture empirically in this one-shot screen; these distinct workloads are not an optimization A/B pair or statistically qualified speed ratio. Empty board remained unsolved after600s on this profile. No additional tests were run and no production solver changes made.

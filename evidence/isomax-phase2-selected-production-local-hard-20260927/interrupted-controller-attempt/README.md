# Preserved interrupted controller attempt

The first solver process exited normally with TIMEOUT / HOST_DEADLINE=102,
cleanup=true, workersExited=7. Its output is valid censored data, not a solver
failure. The cold controller incorrectly asserted errorCode=0 for TIMEOUT and
stopped before the first B. The host implementation explicitly uses 102 for
TIMEOUT (addons/rba-connect4-lazy-smp-host.mjs). Corrected only controller
validation to accept that exact documented code; unchanged solver and limits.

This incomplete block is excluded from paired analysis and preserved here. The
whole ABBA block is restarted, not resumed or selectively substituted. Eight
fresh processes remain required after this interruption (nine total including
this retained attempt). No favorable-result stopping or censor deletion.

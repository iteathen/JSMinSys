# Stress-loader setup failure

72 production solve-time samples completed with expected WDL and clean lifecycle
at 04cc9be. The first stress subprocess exited before the solver/module ran:

`ERR_UNSUPPORTED_ESM_URL_SCHEME: On Windows, absolute paths must be valid file:// URLs. Received protocol 'c:'`

The controller supplied a Windows absolute path to `--import`. Repair only that
cold argument using pathToFileURL, and add `--stress-only` to resume the 14
unstarted diagnostic samples into a separate directory/manifest. Do not rerun
the completed 72 samples or overwrite the failed subprocess record. The native
solver, sample body, memory configuration, node loader and all limits remain
unchanged. This is a harness setup failure, not a solver or memory-capacity result.

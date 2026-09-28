# IsoMax Phase-2 live recovery checkpoint — 2026-09-27

Status: execution continuation recovered from live GitHub after UI desynchronization.

## Production PR boundary

PR #84 remains draft/open and MUST NOT be merged from this checkpoint.

Recovered PR head before this note:
`0b4c05702ca886e029b81931769b85c61ff4c4e4`.

Production base remains:
`a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`.

## Split-bound experiment — already complete

Verified branch heads:
- LOWER0-only: `789d5f8024357b98e2dfb8cf1d78083a0cad310f`
- UPPER0-only: `38ef5684180e129a805d42a6383377d17b0289a2`

Run `36374092717` succeeded; artifact `10950602126`,
digest `sha256:38d3bb9413f9571dbd6119f808d0f42c391e286cfae81fc4a92c1dccbfb6468b`.

Result: both bound directions are useful on the completed derived-long tree.
The combined bound implementation remains strongest there; the hard fixed-window
screen instead exposed excess store/interference cost when both directions are
used without same-q coalescing.

## Retained exact-control winner

Same-q weak-bound coalescing + publication of newly exact draws to the existing
shared exact cache:

`e449df20dc59cc6c1e5b2da78134751a2376f355`

Run `36375481507` succeeded; artifact `10950119722`,
digest `sha256:80f2fa22c719b2159bda62018841b6ef25a54257a396a7cdccac4a49091457a2`.

On `353335714`, this arm improved process cycles by about 2.99% versus the
uncoalesced two-bound realization, with all samples exact.

## Selective shared fallback

All-noncutoff shared-exact fallback head:
`4161b37e949adf05d3e10978547a40adf15a2743`.

Run `36377402344` showed no exact derived-long process-cycle win, so this is
not the retained exact-control winner. It remains an important hard-workload
lead: under the fixed 120-second hard window it reduced cycles/nodes by about
15% and materially reduced shared store contention.

## Current hash-reuse experiment

The structural target is duplicate locator hashing. The current q already owns
`cacheHash`; shared exact probes/stores were hashing the same q again.

Verified green candidates:
- fallback-probe known-hash reuse:
  `2cf45625023877072a9a4e6f4e2667a7aee7b4c2`
- all-hot shared probe/store known-hash reuse:
  `48c514e747cb2656666b951f97e0928dda501cf7`

Both retain full shared q-key/sequence validation. Hash reuse changes locator
recomputation only. NEES ledgers explicitly charge the known-hash selection
test/branch and remove `CALL(mixSpan32Locator32)` only for KH=1.

Live benchmark state at checkpoint:
- four-arm retained-winner comparison run `36379171950`: derived-long exact
  step complete; hard fixed-window step running.
- three-arm hash-reuse run `36379272022`: derived-long exact step complete;
  hard fixed-window step running.

Required topology remains 4 search workers = worker 0 wide/root-frontier +
workers 1..3 deep. Single-worker qualification remains forbidden.

## Next decision

Use the four-arm run as selection authority:
A = retained coalesced+shared-draw winner,
B = all-noncutoff fallback,
C = fallback known-hash reuse,
D = all-hot known-hash reuse.

Primary authority is whole-process cycles on completed exact controls. A hard
timeout remains censored evidence only.

Do not add another cache/table before these measurements are read.

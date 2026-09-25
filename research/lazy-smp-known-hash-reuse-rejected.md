# Rejected Lazy-SMP known-hash reuse

**Date:** 2026-09-24 America/Los_Angeles  
**Baseline:** `6a861d661c6a2bf04005fa20da54e5e588b51ad3`  
**Candidate:** `aa8f55641be60363ae332772f7f35adfbcf8a28b`  
**Workers:** exactly 4  
**Shared sampling:** mask 7 / one-eighth on both baseline and candidate  
**Control:** official Fhourstones `45461667`

## Experiment

The candidate forwarded the private exact-cache hash into sampled shared-cache
probe/store operations so the shared cache did not call
`mixSpan32Locator32()` a second time.

This deliberately excluded the previously rejected hash-tag/direct-map
machinery. No tag array, metadata, synchronization, or additional shared state
was added. Existing public shared-cache wrappers remained available for callers
without a known hash.

## Qualification

The first attempted A/B at Connect4 `588310242435e48d39562c9cb24b5666b7559a15`
was invalid for isolation because the baseline accidentally ran mask 0 while the
candidate ran mask 7. It is not used below.

Corrected same-runner B/C/C/B at Connect4
`d0e4b308f761fe2f44de2148957a18237b52635a`, Actions run
`36103885058`, held mask 7 constant for both sides and was run twice.

### Attempt 1

Baseline:
- wall: 3.147450 s / 2.869282 s
- CPU: 10.671 s / 10.876 s
- cycles: 26.567334006B / 26.471816212B

Candidate:
- wall: 3.192955 s / 3.649578 s
- CPU: 10.828 s / 10.969 s
- cycles: 26.393740571B / 26.765969317B

### Attempt 2

Baseline:
- wall: 3.031933 s / 3.420168 s
- CPU: 11.672 s / 11.766 s
- cycles: 32.262165015B / 32.944057005B

Candidate:
- wall: 3.135283 s / 3.224017 s
- CPU: 11.953 s / 11.562 s
- cycles: 33.267914274B / 31.996018364B

All eight samples remained:
- EXACT +1
- move 3
- oracle matched
- cleanup true
- 4 workers

Across the four corrected samples per side:
- baseline average wall: ~3.1172 s
- candidate average wall: ~3.3005 s
- baseline average CPU: ~11.2463 s
- candidate average CPU: ~11.3280 s
- baseline average cycles: ~29.5613B
- candidate average cycles: ~29.6059B

## Disposition

**Rejected.**

Despite mechanically removing one duplicate wide-key hash from sampled shared
cache operations, the candidate did not reduce measured process CPU or cycles
and wall time was unstable. Do not resurrect known-hash forwarding as a
standalone Lazy-SMP optimization without new structural evidence.

This does not invalidate the already accepted high-hash density sampling itself.

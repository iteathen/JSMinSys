# IsoMax Phase-2 compact private cache experiment

Date: 2026-09-28
Base: `9594b6b88420d60f113cb5af560de2f128aec0da`
Status: implementation candidate; no promotion yet.

The already-qualified 8-word standard-7x6 exact identity is extended only to the
private exact/LOWER0/UPPER0 cache. The full 14-word q remains the search state
and the full-q locator hash remains the direct-map address.

Selected 7x6 private rows:
- stored identity: 14 -> 8 uint32 words;
- first two support heights remain raw discriminators;
- support/tail packing is evaluated only on an occupied compact comparison path;
- local exact values and private zero-bound codes are unchanged;
- shared exact cache remains the qualified compact baseline.

Non-7x6 initialized geometry and compatibility constructors retain full-key
private storage.

Qualification requires Verify plus matched 4-worker 1-wide+3-deep exact A/B
against fixed baseline `9594b6b...`. Whole-process cycles remain authority.
Single-worker qualification remains forbidden. PR #84 receives no merge
authorization from this experiment.

# IsoMax Phase-2 packed private cache tag experiment

Date: 2026-09-28
Base solver: `81c9475e94607cff9e777776157b82b3466c385b`
Status: planned implementation experiment.

Pack private cache epoch + value into one uint32 tag:

```
tag = (epoch << 3) | value
```

Low 3 bits retain exact / LOWER0 / UPPER0 codes 0..5.
High 29 bits retain the per-solve epoch.

Unchanged:
- private compact/full key identity;
- full-q locator hash;
- local capacity;
- shared compact exact cache;
- full sharing;
- private LOWER0/UPPER0 semantics;
- same-q opposite-bound exact draw;
- search/order/CPC/cofactor behavior;
- arbitrary geometry fallback.

Epoch range becomes 1..2^29-1. Wrap clears the tag array and restarts at 1.

Required gates:
- exact values and private bound codes round-trip;
- public exact probe still hides 4/5;
- exact rows still outrank weak bounds;
- same-q opposite bounds still coalesce to draw;
- reset invalidates stale rows;
- forced epoch wrap clears stale tags;
- generated behavior/root-frontier mirrors remain authoritative;
- cycle ledgers/source seals update with source;
- 4-worker qualification only: 1 wide + 3 deep.

Primary A/B:
A = `81c9475e...`
B = packed-tag candidate.

Authority: completed exact whole-process cycles on `353335714`.
PR #84 remains draft/open and receives no merge authorization.

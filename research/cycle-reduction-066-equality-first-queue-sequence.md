# Cycle reduction round-066 — equality-first queue sequence checks

The nonblocking queue paths need signed sequence differences only to classify a slot that is **not** exactly ready.

The previous generic path always computed:

```text
difference = (observed - expected) | 0
difference === 0
```

before the success path.

Reorder to:

```text
if observed === expected:
  success
difference = (observed - expected) | 0
classify full/empty/retry
```

This removes SUB + int32 coercion from successful generic attempts while leaving non-equal wrap-aware classification unchanged.

Owned-position profiles are stronger: because that side owns the reservation position, any non-equal slot is simply unavailable. They now use direct equality only and never construct a signed difference.

Ledger reductions:

- generic try-enqueue success local term: +6 -> +4;
- generic try-dequeue success local term: +8 -> +6;
- owned boolean enqueue: +5 -> +3;
- owned boolean dequeue: +6 -> +4;
- owned-next enqueue: +6 -> +4;
- owned-next dequeue: +7 -> +5.

Existing wrap tests continue to protect sequence-number rollover semantics.

# Cycle reduction round-053 — remove caller-known rehash capacity return

## Observation

`rehashOverwrite32` receives `newMask` from its caller.

The previous return:

```text
newMask + 1
```

reconstructed the new capacity solely to return information the caller already possesses.

The value is not required for migration correctness.

## Change

`rehashOverwrite32` is now migration-only and returns no computed capacity.

Ledger:

```text
before: 3 + N*(L+5) + K*(L+1+2*S)
after:  2 + N*(L+5) + K*(L+1+2*S)
```

The deleted cycle is the final capacity reconstruction add.

## Governing-unit note

This is not a moved cost. A caller that needs capacity already has either `newMask` or the capacity value used to derive it.

## Qualification

Tests validate migrated hashes/values rather than asserting a redundant return value.

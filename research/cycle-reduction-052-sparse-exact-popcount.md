# Cycle reduction round-052 — sparse exact popcount profiles

## Requirement

Some consumers genuinely need exact cardinality, so zero/one/multiple classification cannot replace popcount universally.

But exact count does not require fixed work when the set itself is sparse.

## One-lane sparse loop

```text
while word != 0:
  word = word & (word - 1)
  count += 1
```

Each iteration removes exactly one set bit.

Conservative predicted-loop ledger:

```text
1 + 5*K + BM
```

where `K` is exact cardinality and `BM` is explicit branch-misprediction penalty.

With `BM=0`:

- K=0: 1
- K=1: 6
- K=2: 11
- K=3: 16

The fixed SWAR path is 14, so sparse wins through K=2 under the predicted scenario.

## Two lanes

Two independent loops give:

```text
2 + 5*K + BM
```

for total set bits across both lanes.

Against fixed 25-cycle two-lane SWAR, the predicted-loop profile wins through K=4.

## Selection rule

This is a distribution-specific alternative, not a replacement for SWAR.

If cardinality is not known/sufficiently sparse, or branch behavior is unfavorable, choose the fixed-cost profile.

## Qualification

Tests compare sparse and SWAR results across zero, bit-31, mixed-lane, and small-cardinality vectors.

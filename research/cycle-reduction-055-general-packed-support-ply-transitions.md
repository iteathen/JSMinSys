# Cycle reduction round-055 — general packed support+ply transitions

## Gap after round 054

Round 054 qualified packed support+ply state only for callers that already held the landing cell.

The representation benefit does not depend on that ownership.

Ordinary transition callers can still load the maintained landing cell themselves while storing support+ply in one physical word.

## One lane

Separate state-owned transition:

```text
4*LOAD + 4*STORE + 7..9 ALU/control
25-27 L1
```

Packed support+ply:

```text
3*LOAD + 3*STORE + 6..8 ALU/control
19.5-21.5 L1
```

The caller need not own ply or landing cell.

## Two lanes

Separate state-owned:

```text
27-35.5 L1
```

Packed state:

```text
21.5-30 L1
```

The packed profile therefore reaches the same transition ledger as the caller-owned-ply representation while keeping rank physically owned by state.

## Representation boundary

All round-054 configuration requirements remain:

- 3-bit support fields;
- rows <= 7;
- support bits + rank bits fit one uint32;
- one combined support/rank delta prepared per transition index.

Reflection remains support-only. A packed word is masked with `supportMask` before any reflection call.

## Qualification

Differential tests compare ordinary separate-state and packed-state apply/undo on runtime-configured 4x4 and a two-lane 7x6 boundary-crossing test vector.

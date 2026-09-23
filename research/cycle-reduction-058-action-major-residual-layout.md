# Cycle reduction round-058 — action-major residual transition layout

## Workload mismatch

The existing residual layout is class-major:

```text
table[classIndex * actionCount + actionIndex]
```

That is ideal when one class is reused across several actions.

The pinned IsoMax residual inner loop fixes the action/cell while active term/class IDs vary, so direct class-major addressing repeats one multiply per active term.

## Dual layout

Action-major storage is:

```text
table[actionIndex * classCount + classIndex]
```

For a fixed action:

```text
actionBase = actionIndex * classCount
table[actionBase + classIndex]
```

hoists the multiply once.

## Governing ledger

For T active classes at one fixed action:

```text
class-major direct L1 = 8*T
action-major L1      = 3 + 5*T
```

T=1 is equal; every additional active class saves one IMUL, or 3 static-serial cycles.

The same structure gives 16*T vs 3+13*T at L2 and 51*T vs 3+48*T at L3.

## Initialization

`fillResidualActionMajor32` explicitly transposes an existing class-major table.

If the producer emits action-major storage directly, no transpose is required. The catalog therefore keeps both layouts rather than treating either as universally superior.

## Qualification

A 2-class by 3-action table is transposed and both prepared-base addressing modes are checked for identical transition values.

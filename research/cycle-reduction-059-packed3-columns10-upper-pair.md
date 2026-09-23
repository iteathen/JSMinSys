# Cycle reduction round-059 — direct upper-pair extraction for 10-column reflection

The 10-column packed-3 reflector previously extracted the upper six-bit lane and then reversed its two three-bit fields:

```text
high = code >>> 24
high = ((high << 3) | (high >>> 3)) & 0x3f
```

The desired result is simply field 9 in bits 0..2 and field 8 in bits 3..5, so it can be read directly:

```text
(code >>> 27) | ((code >>> 21) & 0x38)
```

This removes one serial shift/transform operation.

Static ledger:

- before: 21 cycles;
- after: 20 cycles.

The low-eight-field network and representation contract are unchanged. Existing configured-reflection tests compare the result against the direct reference implementation.

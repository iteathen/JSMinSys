# Deferred functions requiring primitive review

The deferred queue is currently **empty**.

## Resolved items

### allocateTypedCapacity

**Disposition:** admitted and implemented.

JSMinSys now admits the specific operation `Uint32Array.construct`, realized as `new Uint32Array(length)`.

Its cost is not represented as a cheap constant. NEES operation `memory.allocate.typed.u32` accounts for it as:

```text
TYPED_ARRAY_ALLOC_U32(length, typedArrayAllocationPath, pageState, gcState)
```

The application author remains responsible for deciding whether that cost is worth paying.

### Number.isInteger

**Disposition:** not required.

Checked integrality remains an external-boundary concern; JMS-SEALED internal indices enter with an established integer-domain invariant.

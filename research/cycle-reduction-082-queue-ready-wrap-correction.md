# Cycle reduction round-082 — preserve equality-first queue optimization across int32 rollover

Round 066 moved signed sequence-difference construction behind an exact equality miss. That optimization exposed a domain mismatch on dequeue:

position is Int32, but position + 1 is a Number until stored through Atomics.

At position 0x7fffffff:

- Atomics sequence value becomes -2147483648;
- unnormalized position + 1 is +2147483648;
- direct equality therefore fails even though the slot is ready.

The fix is ready = (position + 1) | 0 before every dequeue-side sequence equality.

This adds one accounted ALU to affected dequeue paths. Equality-first remains beneficial because successful generic try-dequeue still avoids constructing a signed difference after the comparison.

Regression tests cover blocking dequeue, generic try-dequeue, and owned-position try-dequeue across the signed rollover boundary.

# Cycle reduction round-088 — direct power-of-two triple index

The joint triple locator ends with multiplication by the odd constant 0x7feb352d, then a power-of-two table consumes only hash & (capacity-1).

For capacity = 2^k, multiplication by any odd constant is a bijection modulo 2^k. Therefore:

x1 mod 2^k = x2 mod 2^k
iff
(C*x1) mod 2^k = (C*x2) mod 2^k

for odd C. The final multiplier cannot split or merge primary collision classes; it only permutes bucket labels.

The direct profile computes the three coordinate products, XOR fold, and capacity mask and returns the start index immediately.

Ledger:
- mix3x32Locator + powerOfTwoIndex32: 16 + 1 = 17 cycles
- mix3x32PowerOfTwoIndex: 14 cycles

Caveat: a permutation of bucket labels need not preserve adjacency, so linear-probe cluster lengths may change even though primary collisions do not. Integration must measure probe lengths/locality before replacing an established locator.

Correctness remains independent of the locator because exact tuple equality authorizes hits.

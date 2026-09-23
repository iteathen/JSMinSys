# Cycle reduction round-085 — load-first atomic claim rejection

atomicTryClaim32 always executes a locked compareExchange, including calls where the shared word is already visibly not equal to expected.

The load-first profile performs one sequentially-consistent Atomics.load first:

- observed != expected: return false without a locked RMW;
- observed == expected: execute compareExchange, which remains the only claim authority.

A stale matching load cannot create a false claim because CAS revalidates atomically. A stale mismatch can conservatively return false, which is valid for a try-claim contract.

NEES leaves Atomics.load cache/contention cost symbolic, so the profile deliberately has no invented scalar break-even.

Expected cost:

ATOMIC_LOAD + CMP_EQ + Q*(ATOMIC_RMW + CMP_EQ)

Select only when this is below the direct baseline ATOMIC_RMW + CMP_EQ.

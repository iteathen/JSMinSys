# Cycle reduction round-090 — direct two-word power-of-two index

The pinned IsoMax residual chunk interner hashes an exact two-word key before linear probing a power-of-two table.

The existing workload shape independently avalanches word 0, independently avalanches word 1, combines each through another multiply stage, avalanches the combined hash again, and finally masks it to the table capacity. Exact two-word equality still authorizes every hit.

Using the current JSMinSys strong-mix ledger as the comparable composition, that addressing path costs about 46 ALU-ledger cycles through the final capacity mask, excluding the two unavoidable key loads.

The selected profile jointly mixes the tuple:

```text
x = imul(a, C1) xor imul(b, C2)
x = x xor (x >>> 16)
index = x & capacityMask
```

Static serial ledger:

- 2 × IMUL = 6
- 2 × XOR = 2
- 1 × shift = 1
- 1 × AND = 1

Total: 10 cycles.

No identity work is removed: the probe must still compare both exact words. The reduction is purely addressing work that exact equality does not need.

A structured 4096-key smoke distribution over 256 buckets occupied all 256 buckets and stayed below a 40-entry maximum bucket. That is only a falsification check, not governing-unit proof.

Important tradeoff: unlike round 088, this rewrite is not merely deleting a final odd permutation. It changes the primary collision partition. Linear-probe locality and chain length therefore remain part of qualification. Integrations should retain a stronger mixer if actual probe behavior loses more than the 36-cycle local addressing reduction.

Falsifiers:

- exact equality is not available and the hash must act as identity;
- capacity is not a power of two;
- the actual residual-key distribution develops materially worse probe chains or cache locality;
- generated-code evidence invalidates the assumed two-IMUL/xorshift lowering.

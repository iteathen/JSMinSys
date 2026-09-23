# Cycle reduction round-099 — guarded fixed-prefix metadata projection

A recurring failure mode in packed systems is to encode semantic identity structurally and then rediscover it by scanning the representation.

The pinned IsoMax residual vocabulary supplied a concrete case. Singleton terms are generated so term IDs 0..41 equal physical cell IDs. Initialization can prove:

- every singleton term is in that exact prefix;
- every prefix ID maps to the corresponding cell bit;
- no later term is a singleton.

The older metadata builder nevertheless scanned all 20 residual words, masked candidate singleton terms, iterated every set bit, recovered each term ID, loaded its low/high masks, and OR-accumulated the result.

Once the encoding invariant is checked at initialization, the final normalized residual already contains the answer:

- output low mask = word 0;
- output high mask = word 1 & configured singleton-prefix mask.

Later words are irrelevant by proof, not by assumption.

## JSMinSys profile

`projectMaskedPrefix2x32Into` performs:

- 2 source loads;
- 1 AND;
- 2 destination stores.

Ledger:

`2*LOAD + AND + 2*STORE_COST`

Reference minimum:

- L1: 10 cycles;
- L2: 26 cycles.

The setup proof is not hidden. The representation owner must validate the prefix correspondence before hot execution. If the mapping drifts, configuration must fail rather than silently projecting incorrect metadata.

## Pinned governing evidence

The accepted issue-81 implementation replaced the 20-word scan/set-bit loop with direct final-word projection and added exhaustive vocabulary controls.

Paired measurements preserved exact work:

- serial median: 1798.82 -> 1749.07 ms (~2.8% lower);
- one worker: 2176.16 -> 2153.42 ms (~1.0% lower).

The qualification tested all 625 isolated vocabulary terms, mixed word-1 bits, physical reconstruction, reflection, and arbitrary valid interning. The method depends on final normalized representation, not parent provenance.

## Structural lesson

Prepared representation position can itself be semantic metadata. When initialization can prove a complete correspondence, do not scan a larger state to re-derive what bit position already says.

## Falsifiers

- target members are not exactly confined to the proved prefix;
- later words can contain target semantics;
- the selected input is not the final normalized representation;
- initialization cannot validate the identity mapping completely;
- another representation makes the prefix projection more expensive than its alternative.

# IsoMax cofactor dynamic-work census — 2026-09-27

Status: diagnostic result; instrumentation-only; no timing claim.

Workflow run: `36344109473` — success  
Artifact: `10939639198`  
Digest:
`sha256:65b1b7ac71a0813e7fb48cb1cbe68cdede00ac9018d84752665fcbedbf178b33`

The hook only counts existing cofactor operations. Instrumented elapsed time is
not performance evidence.

## Long control — 353335714

Normal solver metrics remain:
- 11,755,731 nodes;
- 11,813,310 cofactors;
- exact result unchanged.

Dynamic cofactor census:

- known-height calls: **11,813,319**
- deep nonterminal calls: **11,755,740**
- parent-basis entries scanned: **210,780,024**
- child-basis entries emitted: **183,170,360**
- mean parent basis size: **17.93**
- mean child basis size: **15.58**
- candidate images reaching C1 guard: **114,248,370**
- images absorbed by already-completed principal upset: **55,902,588**
- C1 absorbed fraction: **48.93%**
- images still expanded: **58,345,782**
- mean expanded images/deep cofactor: **4.96**
- dense subset candidate tests after C1: **448,668,285**
- mean subset tests/deep cofactor: **38.17**
- mean subset tests/expanded image: **7.69**
- hypothetical three-word closure ORs for all surviving player/image expansions:
  **184,848,270**

Thus C1 is doing substantial useful work—it suppresses nearly half of image
expansions—but the surviving geometry work is still enormous.

## Short control — 45461667

- deep calls: 62,039
- mean parent basis: 32.65
- mean child basis: 30.08
- C1 absorbed fraction: 47.09%
- mean expanded images/deep cofactor: 11.54
- subset candidate tests: 8,253,358
- mean subset tests/deep cofactor: 133.03

The smaller solve has larger bases but far fewer calls.

## Combined interpretation with support-plan census

The support-plan census independently found that **98.83%** of deep long-control
cofactor calls repeat a previously seen exact `(support,column)` plan key.

Therefore a support-derived plan can potentially amortize:

1. repeated parent-basis removal/image construction;
2. repeated child-basis set emission;
3. repeated child-index discovery;
4. the **448.7M** post-C1 subset tests used to complete principal upsets.

The runtime work that must remain is q-specific coordinate membership,
mover/opponent survival, C1 absorption checks, and publication of the resulting
coordinate words.

This establishes the Stage-2 target; it does not prove a cache will be faster.

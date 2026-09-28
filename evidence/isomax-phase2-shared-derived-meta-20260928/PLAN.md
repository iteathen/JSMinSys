# IsoMax Phase-2 derived-meta shared identity experiment

Date: 2026-09-28
Base solver: `f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`
Status: implementation experiment; not selected production.

## Hypothesis

The solver-owned shared exact cache currently stores the full q word span.

For configured geometry:

```
metaOffset = columns
keyWords = columns + 1 + 2*coordWords
```

For every cacheable nonterminal q, the meta word is exactly derivable:

```
rank = sum(support heights)
meta = rank << 2
```

because terminal bits are zero at shared cache probe/publication points.

Thus omitting `metaOffset` from stored shared identity preserves exact q equality on the admitted cache domain. The already-computed full-q hash remains a valid locator because projected-equal q states derive equal meta and therefore have equal full q words.

## Candidate

- private exact cache unchanged;
- full-q locator hash unchanged;
- shared exact value semantics unchanged;
- sharedSampleMask remains 0;
- shared cache stores/validates all q words except the configured derived meta word;
- stored shared key stride becomes `keyWords - 1`;
- no probabilistic fingerprint;
- no weak-bound sharing.

Standard 7x6: 14 -> 13 stored key words. At capacity 4,194,304 this saves 16 MiB in the shared key array.

## Required gates

- configured 4x4, 7x6 and 10x10 projected/full equality controls;
- known-hash collision rejection;
- normal Verify;
- source-blob seals and cycle ledger updated with source changes;
- 4-worker benchmark topology only: 1 wide + 3 deep;
- exact fixture `353335714`, whole-process cycles authoritative;
- hard fixture `35333571` at 120000 ms is descriptive if censored.

Reject if exact correctness fails or completed whole-process cycles do not establish improvement.

PR #84 remains draft/open and is not authorized for merge by this work.

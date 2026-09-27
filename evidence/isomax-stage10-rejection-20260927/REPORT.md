# IsoMax Stage-10 final microstructure — 2026-09-27

Status: rejected after confirmation; no production promotion.

## Screening

Control: Stage-9 exact 7x6 plan-key winner
`10380f79af68dc1f57455d535814ac0a7eacea33`.

B — inline standard plan key
`6a9b404fa62e519a97756056b64817cd05d129f8`.

C — hoisted one-word closure fast path
`7312547d3374637537f74136cdd14cf64b450327`.

D — combined B+C
`aaeeb87b4c0acbe72f2eb2f7fd2a5c84f6e12014`.

All arms passed Verify and preserved identical search/result metrics.

Stage-10 factorial run `36354260155`, artifact `10943526352`,
digest `sha256:ab3f29f74d800d135418846aecab83d72d375613363691735bd36ce85f256a6f`.

Eight-block screen long-control paired cycles:
- B: -0.738%, interval crossing zero;
- C: -1.175%, interval crossing zero;
- D: -1.604%, interval [-3.271%, +0.062%].

D's point estimate would have crossed the 50% campaign target, but the cycle
interval did not establish the gain.

## Higher-repetition confirmation

### D combined candidate

16-block ABBA, 64 fresh long solves.
Run `36354742051`, artifact `10943309300`,
digest `sha256:31075f8152ff251998a61b8110c14784fb964431cc2567e7c1f3c45c34889b5e`.

Paired solve cycles: **+0.069%**,
95% interval **[-1.173%, +1.311%]**.

The screening gain does not reproduce. Reject D.

### B inline-key candidate

16-block long confirmation plus 8-block short confirmation.
Run `36354742084`, artifact `10943522507`,
digest `sha256:486279805ee3f7f1dc25d1ede3247b2eeefa85f61da69522aec61877653f4755`.

Long paired solve cycles: **-0.455%**,
interval **[-2.068%, +1.157%]**.

Short paired solve cycles: **+1.651%**,
interval crossing zero.

The earlier screen does not establish a reproducible gain. Reject B.

## Disposition

Reject all Stage-10 successors for performance qualification. Preserve their
verified semantics and negative measurements as research evidence.

The campaign authority remains Stage-9 C:
`10380f79af68dc1f57455d535814ac0a7eacea33`.

Compounded qualified/screened campaign factor remains approximately **0.50339**
of original C1 worker cost, or **49.66% reduction**. Approximately **0.67% of the
current Stage-9 kernel** remains to reach the owner <=0.50 target.

Next experiment should change a materially different cost mechanism rather than
retrying target-word guard or helper-inlining variants.

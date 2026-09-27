# IsoMax Phase-1 closeout / Phase-2 denominator

Date: 2026-09-27

## Final retained Phase-1 line

Phase-1 Stage-10 confirmation did not reproduce a cycle improvement strongly
enough to retain either Stage-10 arm.

Retained Phase-1 experimental winner:

- Stage-9 exact 7-column/radix-7 plan-key specialization
- SHA: `10380f79af68dc1f57455d535814ac0a7eacea33`
- Stage-9 factorial run: `36353413496`
- artifact: `10942324449`
- artifact digest:
  `sha256:d9de78407b6720e7cdc711f03688e87fad637fecc02c6fae5aa58893e1b3776a`

Stage-9 paired long-control result versus Stage 7:
- cycles: **-1.690%**
- 95% descriptive interval: **[-2.755%, -0.626%]**
- identical WDL, root move, nodes, cofactors, CPC/cache metrics.

The cumulative retained Phase-1 chain is approximately **0.50339** of the
original C1 worker cost, or about **49.66% reduction**.

## Stage-10 falsification / closeout

Stage-10 final screen had promising point estimates, but higher-power
confirmation did not retain them.

### Combined inline-key + one-word closure

Confirmation workflow:
- run `36354742051`
- artifact `10943309300`
- digest:
  `sha256:31075f8152ff251998a61b8110c14784fb964431cc2567e7c1f3c45c34889b5e`

Long 16-block ABBA:
- cycle delta: **+0.069%**
- interval: **[-1.173%, +1.311%]**

No retained gain.

### Inline-key-only

Confirmation workflow:
- run `36354742084`
- artifact `10943522507`
- digest:
  `sha256:486279805ee3f7f1dc25d1ede3247b2eeefa85f61da69522aec61877653f4755`

Long 16-block ABBA:
- cycle delta: **-0.455%**
- interval: **[-2.068%, +1.157%]**

Short 8-block control:
- cycle delta: **+1.651%**
- interval: **[-0.860%, +4.163%]**

No retained gain.

Therefore Stage 10 is not part of the Phase-2 denominator.

## Phase-2 denominator

Per owner directive, begin the new **additional cumulative 50% campaign** from
the best retained/current experimental line even though the prior campaign
finished just short of its nominal 50% threshold.

Phase-2 denominator:

`10380f79af68dc1f57455d535814ac0a7eacea33`

Phase-2 target:

    total exact whole-solve cost <= 0.50 * Stage-9 denominator

The target is mechanism-neutral. Reduced nodes, faster nodes, better search,
structural simplification, primitive optimization, representation redesign and
algorithm redesign all count if exact whole-solve effectiveness improves.

This denominator is experimental/research authority, not a production-promotion
claim. Multiworker/production qualification remains a separate gate.

## Durability

Future Phase-2 progress must be committed frequently. Record every material
plan, census, accepted/rejected experiment, source SHA, workflow run, artifact
and disposition so UI desynchronization cannot erase campaign state.

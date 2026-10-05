# Retained optimization absorption audit

Owner asks to identify older optimizations superseded by accumulated work.
Current retained parent: 22eda47, C52+C53/J05. C51 is unqualified.

| Surface | Evidence / disposition |
| --- | --- |
| C01 forced singleton scan + C05 binary searches | C53 replaces both in minimal workers with one current-rank scan. Public library functions remain independently useful; no duplicate hot calls remain. |
| C52 pair hub versus C53 header | Matched header-only ablation 78.815/78.841s vs complete 71.740/72.207s. Pair proof is not absorbed; keep both. |
| C39 six output accumulators | Earlier matched J04 ablation established redundancy; removed from active source. |
| C48 resource-empty companions | Valid bounded theorem, but J05 interaction ablation did not distinguish speed benefit; runtime/helpers/options removed. |
| C28 forced-node CPC bypass | Re-tested after structural changes; neutral and removed. |
| Generic basis/reflection builders | C21/C23/C26 cold-select complete plan paths. Fallback functions remain required for actual dimensions/budgets without complete plans; deleting them would break universality. |
| Live-line state in center workers | Generated center bodies contain no live state/order/advance path; not merely an unused runtime flag. Live workers still use it. |
| C52 failed-trigger sentinel255 | C53 now already knows exact forbidden columns. Sentinel/late hazard check may be replaceable by an earlier shared-profile guard; freeze and test as a separate candidate. More per-spoke mask reads could lose. |
| Whole CPC WIN + a new separate NONLOSS scan | Avoid that duplication. C51 companion uses one common policy/denial pass and optional own guarantee. Public WIN-only authority unchanged. Not yet retained. |
| Basis copy + inverse fill | C24 already fused the traversals; complete immutable basis view (C44) could remove copies, but inverse/cofactor mapping remains needed. No deletion without measured replacement. |

No aggregate cleanup patch is applied from this table. Each causal experiment
must preserve NEES/source identities, pass physical/gauge/window gates and be
measured against its immediately retained parent. Public APIs and generic
fallbacks are not obsolete merely because the standard-board launch selects a
specialized path. Initialization savings are secondary; prepared-empty solve
time remains primary. Avoid double-counting isolated percentage gains.

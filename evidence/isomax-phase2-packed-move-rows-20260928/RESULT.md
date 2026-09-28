# IsoMax Phase-2 result — packed recursive move-order rows (PR #115 realization)

Date: 2026-09-28
Status: qualified whole-solve improvement for this exact realization.

## Fixed source arms

A — selected packed-private-tag baseline:

`f2d56c2788ef3a4c49fc4bef9d447c5be3184059`

B — PR #115 packed recursive move-row runtime source:

`7b1cbf0ddb77173cf614bde32b6bd2cdb459820e`

Benchmark-only branch head:

`cd3909d8de71fe6ba72d873e631dd0b0aed8eda3`

Candidate Verify:

`36458922654` — success.

Post-harness Verify:

`36459095263` — success.

Qualification workflow:

`36459095332` — success.

Artifact:

`10987375059`

Digest:

`sha256:4ede6ad995b75629425b695f82b8c38391ebbe60ce8d801ca2e00890cdb9bf62`

## Realization boundary

This result applies to PR #115 source `7b1cbf0d...`.

A concurrent local realization of the same structural hypothesis used source
`c496f57f3d1463805528cf1d904a3ee52a44e57f` and did **not** qualify
(+0.302% cycles, 95% [-0.660%, +1.264%]).

Do not combine the two point estimates or treat one as testing the other's exact
source. The mechanism is realization-sensitive.

## Candidate structure

Recursive live-line ordering remains the retained one-pass stable insertion
algorithm.

For qualified geometry the recursive row stores one uint32:

```
entry = (score << b) | column
```

with a cold exact width/score guard and a full two-field fallback.

Preserved:
- exact live-line score;
- worker-specific prepared action order as equal-score tie order;
- CPC restrictions;
- cofactor/canonicalization;
- root ordering;
- compact private/shared cache identity;
- packed private epoch/value tag;
- full-q locator hash;
- private LOWER0/UPPER0 and same-q draw coalescing;
- full sharing;
- 4-worker topology = 1 wide + 3 deep.

No child transition is created or recomputed for ordering.

## Primary exact control — 353335714

Eight balanced AB/BA blocks, 16 fresh processes.

All samples completed exactly:
- root WDL: -1;
- root move: 4;
- all samples used four workers.

Means:

| metric | A baseline | B packed rows |
|---|---:|---:|
| process cycles | 52.749 B | 52.421 B |
| wall ms | 5,646.2 | 5,758.6 |
| CPU ms | 21,552.8 | 21,464.9 |
| total nodes | 4.483 M | 4.460 M |
| winner nodes | 1.258 M | 1.263 M |
| cycles/node | 11,767.0 | 11,755.0 |
| shared hits | 517.9 K | 517.2 K |
| shared stores | 1.5965 M | 1.5963 M |
| contention | 39.5 K | 37.0 K |
| RSS | 267.1 MB | 266.5 MB |
| peak RSS | 434.0 MB | 433.8 MB |

Paired B versus A:
- whole-process cycles: **-0.621%**, 95% **[-1.101%, -0.141%]**;
- CPU: **-0.407%**, 95% **[-0.754%, -0.061%]**;
- wall: +1.888%, 95% [-3.094%, +6.871%];
- total nodes: -0.518%, 95% [-1.113%, +0.077%];
- winner nodes: +0.435%, 95% [-0.109%, +0.979%];
- cycles/node: -0.101%, 95% [-0.624%, +0.423%];
- shared hits: -0.144%, interval crosses zero;
- shared stores: -0.016%, interval crosses zero;
- shared contention: -6.098%, interval crosses zero;
- shared bytes: unchanged;
- RSS: **-0.226%**, 95% **[-0.397%, -0.054%]**;
- peak RSS: -0.035%, interval crosses zero.

The campaign authority is completed exact whole-process cycles. The complete
95% interval is below zero, therefore this exact source qualifies.

Because node count and cycles/node intervals cross zero, do not attribute the
qualified effect solely to fewer nodes or solely to cheaper nodes. The result is
a whole-process property of this realization.

## Secondary hard fixed window — 35333571

One paired block at the unchanged 120000 ms ceiling.

Both arms timed out. No exact solve-speed ratio is admissible.

Descriptive B versus A:
- cycles +0.006%;
- wall -0.004%;
- CPU -0.064%;
- nodes -0.363%;
- shared hits +0.018%;
- shared stores -1.414%;
- contention +0.641%;
- cycles/node +0.370%;
- RSS +0.167%;
- peak RSS -0.103%.

This censored pair does not override the completed exact qualification.

## Accounting repair

Independent review of the concurrent local experiment found an inherited
generated-ledger symbol collision: `K` described both insertion shifts and
cancellation checks.

That source-neutral repair is PR #116 and was merged into the packed-tag
experimental base as squash commit:

`2bbaebf3a1bd799d4b58a8a19bd8afe5c99f9af5`

Runtime source/seals were unchanged by that repair.

Before using packed rows as the parent of another runtime experiment, produce or
use an accounting-corrected baseline that combines the qualified PR #115 runtime
source with this ledger repair. Do not discard the repair and do not reinterpret
it as performance evidence.

## Disposition

Qualified runtime realization:

`7b1cbf0ddb77173cf614bde32b6bd2cdb459820e`

It supersedes `f2d56c27...` for Phase-2 runtime experiments **after** the
source-neutral generated-ledger repair is carried forward.

PR #115 remains experimental/draft; qualification alone is not production
merge authorization.

PR #84 remains draft/open because its separate official-hard production
promotion gate remains unresolved.

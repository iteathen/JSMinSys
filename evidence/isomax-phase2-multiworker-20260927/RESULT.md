# IsoMax Phase-2 selected seven-worker qualification — 2026-09-27

Status: selected six-deep/one-wide multiworker economics qualified; official hard-control follow-up pending.

## Fixed verified arms

Control:
`fb81d1502f3921894ae70916f31f93956555bfe9`

- Stage-9 Phase-2 denominator;
- private 262,144-entry support-plan arena wired into every selected worker;
- Verify/schema/node compatibility green.

Candidate:
`ad871518f320d9fdb6c0da8352a9704614bdf261`

- direct search-derived LOWER0/UPPER0 implementation;
- behavior/root-frontier mirrors synchronized;
- identical support-plan worker wiring;
- Verify/schema/node compatibility green.

Selected profile:
7 workers, six deep + one iterative root-frontier, 4,194,304 shared exact
entries, 1,048,576 private exact entries per worker, full sharing.

No single-worker qualification was used.

## Workflow

`IsoMax Phase2 selected seven-worker qualification`

Run: `36359137924` — success.

Artifact: `10944872966`

Digest:
`sha256:fca442cdc8c38856a35b529e9d44eb6714fddffedab009435a6b20e85c82eed4`.

Windows GitHub-hosted runner, Node 26.7.0, QueryProcessCycleTime.

## Long selected-profile control — 353335714

Eight A/B/B/A blocks / 32 fresh seven-worker processes.

Exact result in every sample:
- root WDL: -1;
- root move: 4.

### Means

| metric | Stage-9 + plans | zero bounds + plans |
|---|---:|---:|
| solve cycles | 133.850 B | **54.475 B** |
| wall | 14,420.97 ms | **5,839.50 ms** |
| CPU | 54,809.75 ms | **22,311.56 ms** |
| all-worker nodes | 30,173,420 | **6,322,047** |
| winner nodes | 4,288,643 | **848,204** |
| winner cofactors | 4,367,912 | **848,255** |
| shared exact hits | 5,019,578 | 802,909 |
| shared exact stores | 2,076,181 | 1,997,033 |
| shared contention | 5,238 | 9,097 |
| peak RSS | 1.665 GB | 1.634 GB |

### Paired deltas

- **solve cycles: -59.2932%**
- 95% interval: **[-59.9218%, -58.6645%]**
- **wall: -59.4883%**
- interval: **[-60.1276%, -58.8490%]**
- CPU: **-59.2846%**
- **all-worker nodes: -79.0417%**
- interval: **[-79.4128%, -78.6706%]**

The selected seven-worker result therefore retains and strengthens the local
Phase-2 win.

## Shared-exact interaction

Shared exact hits:
- 5.020M -> 0.803M;
- **-84.0%**.

Shared stores:
- 2.076M -> 1.997M;
- **-3.8%**.

This confirms that private zero-bound rows and the much smaller local trees
substantially reduce optional shared-exact consumption.

The effect is not economically adverse: despite losing most shared hits, total
process cycles fall ~59.3% and all-worker nodes fall ~79.0%.

Do **not** add a shared-exact-precedence lookup solely to recover the missing
hit count. The current whole-solve evidence says the local bound is already the
cheaper information source. Such an arm would need a separate positive
hypothesis before adding hot shared traffic.

## Worker distribution

Control winner:
- worker 2 in all 16 A samples.

Candidate winner:
- worker 2 in 14/16;
- worker 1 once;
- worker 3 once.

Mean candidate worker nodes:
- worker0 root-frontier: 1.363M;
- worker1: 0.845M;
- worker2: 0.852M;
- worker3: 0.812M;
- worker4: 0.808M;
- worker5: 0.842M;
- worker6: 0.800M.

The second-worker-idle regression is not present; every selected worker performs
substantial search work.

## Memory

Seven private fixed plan arenas did not cause a hosted-runner memory failure.

Measured process peak RSS is slightly lower on the candidate:
- control 1.665 GB;
- candidate 1.634 GB;
- paired delta -1.87%.

The fixed typed-array virtual payload is larger than touched resident memory;
report measured RSS rather than assuming every reserved plan byte becomes
resident.

## Short selected-profile control — 45461667

Four blocks / 16 fresh processes.

Exact root WDL +1 and move 3 preserved.

Candidate paired deltas:
- cycles: +1.10%, interval **[-3.15%, +5.35%]**;
- wall: +0.62%, interval **[-4.18%, +5.41%]**;
- all-worker nodes: -1.97%, interval crossing zero.

No short-control performance regression or improvement is established.

## Disposition

The search-derived local zero-bound mechanism passes the selected seven-worker
economic gate with large margin.

The Phase-2 additional-50% target is therefore crossed both:
1. on the direct local exact lane; and
2. on the selected six-deep/one-wide Lazy-SMP lane.

Next:
- run the official hard Fhourstones `35333571` control under the unchanged
  120-second application ceiling;
- then decide integration/promotion of the plan wiring and zero-bound candidate.

No single-worker test is authorized.

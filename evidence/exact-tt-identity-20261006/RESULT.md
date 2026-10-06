# Exact TT identity investigation result

Durable measurement entry point:
[Connect4 qualification packet](https://github.com/iteathen/Connect4/tree/work/isomax-auto-workers-20261006/docs/qualification/20261006-exact-tt-identity).
Full-coverage run sources are recorded individually: the first full24 run uses
b8d0b8336f8f8cd2326bf510b1db652184aadd5e; subsequent full24, mixed and native
repeats use4ddd04c7232ba1af34f8607c984d8789aa0e104c. The first native control
uses frozen40b1943 with identical native worker bodies. The generated full24
workers and their hot helpers are unchanged between b8d0b83 and4ddd04c; additions
to that library are cold factory/attachment support and separate16/mixed helpers.

Full24 is an exact index-plus-partial-key representation of the entire
nonterminal7x6 canonical RBA cache domain. It saves25% TT payload at unchanged
entry counts. No probabilistic fingerprint, runtime inverse/decoder, new hot
statistics, allocation or tactical/search change. Other geometries retain their
existing exact initialization-selected wider layout.

Three fresh six-worker empty7x6 solves per complete-coverage configuration:

| Configuration | TT payload total | Mean solve | Range |
| --- | ---: | ---: | ---: |
| native32 control | 5.5 GiB | 42.128 s | 40.977–43.246 s |
| full24 same entries | 4.125 GiB | 39.607 s | 38.060–40.557 s |
| full24 double shared | 7.125 GiB | 38.889 s | 36.716–40.179 s |
| full24 double private | 5.25 GiB | 39.682 s | 38.713–40.334 s |
| mixed16/24 | 4.8125 GiB | 39.337 s | 37.732–40.522 s |

These15 runs all returned EXACT/WIN/c4, six verified pins and six clean worker
exits. Node27nightly/V8, startup preload,2400/9600flags and search topology are
unchanged. Primary solve excludes only initialization/cleanup. Process CPU and
RSS include the entire process; process cycles are unavailable. Raw data,
invocations/hashes, comparison script and descriptive statistics are in Connect4.
Do not promote a significance claim from three samples.

Full24 is RETAINED as a bounded research candidate for its exact25% footprint
benefit and lower measured mean. Extra shared memory lowered its mean a further
1.81%, unresolved against variation. Extra private entries did not improve the
mean. Mixed correctness is qualified, but its incremental speed premium over
full24 is UNQUALIFIED; no production default changed.

The16-byte-only admission policy is REJECTED. Even at double capacities and the
original byte budget it timed out at120.013s. Its n<=32 gate loses early/midgame
sharing; the support-only audit has no admitted supports at ply20. This is not
a claim about measured runtime frequency. The host flag and four generated
workers/ledger units have been removed. Narrow16 identity primitives and tests
remain for the complete-coverage mixed experiment. Historical reproduction uses
6014152f0a64c448923ab97b5efb8320516bd6cc and its corresponding frozen harness.
This rejects the admission policy, not the possibility of another complete16-byte
encoding. The current proof only establishes16 bytes in the stated narrow domain.

Doubling both24-byte capacities was RESOURCE_CENSORED before solve:8.25GiB TT
payload plus2GiB preflight reserve exceeded available commit headroom. The reserve
was not weakened and the OS memory settings were not altered.

Final verification after policy removal:465/465 root tests,9/9 targeted exact-key
tests,298 sealed functions +638 add-on units,30/30 blocks and0 deferred. The
generator validates all retained variants; full24/mixed timed workers remain
byte-identical. Review found and verified fixes to emitted-operation accounting
and a nonexistent mixed packing subledger callee. The updater now checks
candidate callee resolution. Stale root contracts were independently requalified
to the existing production package, without changing it.

Bounded physical/key coverage:100 geometries1..10,1551 states, no solved outcomes
queried. Three26-case independent physical-minimax comparisons passed; oracle
answers were never worker inputs. Concurrent colliding writers, busy/wrap/clone,
all five proof tags, disjoint offsets and10000 independent modular inversions
passed. **No full10x10 solve was attempted.** Sealed formula holdouts stayed sealed.

That initial batch admitted compact7x6, compiled support plans, native caches
and one optimized shared bank. The subsequent extension is recorded in
[TWELVE-GIB-RESULT.md](TWELVE-GIB-RESULT.md), including fresh banked controls.
Larger production profiles are not qualified by those bounded tests. Production
isomax package/defaults/main are unchanged.

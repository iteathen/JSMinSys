// Offline evidence synthesis; never imported by the runtime.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dir='evidence/isomax-boolean-confirm-20261002';
const summary=JSON.parse(readFileSync(dir+'/SUMMARY.json'));
const blocks=JSON.parse(readFileSync(dir+'/BLOCK_ANALYSIS.json'));
const rows=readFileSync(dir+'/samples.jsonl','utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,8);assert.equal(summary.order,'ABBABAAB');
const a=summary.comparison.find(r=>r.arm==='A'),b=summary.comparison.find(r=>r.arm==='B');
assert.equal(b.sourceSha,'98b51d3c118bf34878af0430b82174578f5a7011');
const selected=rows.filter(r=>r.arm==='B'),peak=Math.max(...selected.map(r=>r.peakRssBytes));
for(const r of rows){assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,1);assert.equal(r.move,3);assert.equal(r.searchCalls,1);assert.equal(r.cleanup,true);}
const s=ms=>(ms/1000).toFixed(3),pct=x=>x.toFixed(2),paired=blocks.comparisons[0];
const report=`# Qualified prepared-closure candidate

The selected candidate averages **${s(b.meanWallMs)} seconds**, versus
**${s(a.meanWallMs)} seconds** for the qualified baseline: **${pct(b.percentLowerWall)}%
less wall time** and **${pct(b.percentLowerCycles)}% fewer process cycles**.
This is local evidence for the existing empty-board structural prefix plus ONE
exact root search, including preparation and cleanup. It is not full self-play.

Eight frozen matched trials, order ABBABAAB, all completed EXACT with WDL+1 and
column4. All seven controls passed, five opening moves were computed without
search, and the one search began at ply6 from44444. All runs finished below60s.
No runtime oracle, opening book or hard-coded opening was introduced.

| Arm | Exact revision | Mean seconds | Mean process cycles |
|---|---|---:|---:|
| Baseline | ${a.sourceSha} | ${s(a.meanWallMs)} | ${Math.round(a.meanCycles)} |
| Candidate | ${b.sourceSha} | ${s(b.meanWallMs)} | ${Math.round(b.meanCycles)} |

Candidate range: ${s(Math.min(...selected.map(r=>r.wallMs)))}–${s(Math.max(...selected.map(r=>r.wallMs)))}s.
Maximum candidate peak RSS: ${peak} bytes (${(peak/2**30).toFixed(3)}GiB).
Four-pair descriptive wall reduction interval:
${paired.wallMs.descriptive95PercentInterval.map(pct).join(' to ')}%; cycle interval:
${paired.solveCycles.descriptive95PercentInterval.map(pct).join(' to ')}%.
These t intervals assume normal/independent pair log ratios; four pairs on one
host are not a universal guarantee or robust population inference.

## Exact environment and boundaries

i5-12600K, Windows10.0.26200, Node27.0.0-nightly20260928b59840b593,
V8 14.6.202.34-node.36. Four deep workers, no wide worker, actual affinity0/2/4/6
verified per run. Shared134217728 entries x32bytes =4GiB; private16777216 entries
x36bytes =576MiB/worker. Sample mask0; safety ceiling300s. Same runtime, capacities,
worker topology and timing interval for both arms. No reported environment deviation.
No counters were restored: node counts and TT hits remain unavailable.

The candidate compiles strict superset word masks during initialization, intersects
them with the already-built child-basis set, and uses exact local inverse indices.
Tables/scratch are allocated before search. Constants, table references, dense
removal and Boolean publication flags are specialized; sparse initialization and
general dimensions retain valid separate paths. No new coordinate codec is used.
Search ordering, TT identity/replacement/synchronization, CPC and STOP remain intact.
Production addons/src (including CPC) and BSFP were not changed; holdouts stay sealed.

## Investigation and selection

The initial CSR list was correct but screened1.79% slower. Scalar constants alone
screened neutral (+0.25% wall, effectively unchanged cycles). Those observations
do not falsify compiled transitions or specialization as parent approaches.
Grouped masks screened about12% faster. Prepared tables, cold dense dispatch and
hoisting reduced that realization's time by another5.19% in its own screen.
An eight-run pre-Boolean confirmation measured16.82% paired wall reduction.
Compiler review then found removable mixed zero/Boolean guards; normalizing them
removed four HeapNumber-map checks and reduced cofactor machine-code size8–9%.
The final eight runs above qualify the resulting composite. Differences across
campaign stages do not isolate a constituent's independent performance effect.

All ten original claims have explicit dispositions in CLAIM_AUDIT.md; deferred
parents remain unverified debt, not rejected theories. The prepared subset compiler
is a bounded implementation of part of the transition idea, not a claim that all
support transitions, make/unmake or canonical-key-only reflection are finished.
No50% improvement or global optimality is claimed.

## Qualification and durable evidence

Node26 and the benchmark Node27 each pass236 source tests. Directed cofactor
comparisons cover dense/sparse geometry, legal children, reflection, both players,
stale inverse/tail memory, first wins and full-board terminal precedence. Deterministic
search comparisons preserve full private and logical shared TT contents and ties.
Independent reviews found no correctness blocker. General-dimension kernels are
unchanged. Packaging adds standalone worker and selected-cofactor tests.

SUMMARY.json, samples.jsonl, raw.jsonl, manifest.json, BLOCK_ANALYSIS.json and every
affinity report are retained beside this report. Campaign profile/qualification
and all four preliminary screens are retained separately. Profiling/compiler runs
are excluded from scored timing. CPU samples are attribution estimates, not PMU
memory stalls; small-cache codegen evidence is not full-worker stability proof.
NEES_REVIEW.md records the changed cost scope and remaining debt.
`;
writeFileSync(dir+'/REPORT.md',report);
console.log(JSON.stringify({meanBaselineMs:a.meanWallMs,meanCandidateMs:b.meanWallMs,wallPercentLower:b.percentLowerWall,cyclesPercentLower:b.percentLowerCycles,peakRssBytes:peak}));

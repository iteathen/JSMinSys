// Audit artifacts only. No solver imports, source rewriting, or timing promotion.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,relative} from 'node:path';
const out='evidence/isomax-nees-audit-20261006',
 consumer=resolve(process.argv[2]??'C:/r/c4-external-20261004'),
 norms=resolve(process.argv[3]??'C:/r/NEES-isomax-rebuild-ref'),
 candidate='6bc1dd047209664f9924c4cb49597a2154555107',
 production='40b19431f00174c5d52c442677d67ec698e8c50a',
 normative='7650bef0aecc0d2b226ecf253a1f8937ccf89d69',
 nodeHash='2f2843c1802f6a17ba7fabe5550c90bb055c9bef8738a08338d94f71dbe91f29',
 read=p=>readFileSync(p,'utf8'),json=p=>JSON.parse(read(p)),
 hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),
 normalizedHash=p=>createHash('sha256').update(read(p).replaceAll('\r\n','\n')).digest('hex'),
 git=(args,cwd=process.cwd())=>execFileSync('git',args,{cwd,encoding:'utf8',maxBuffer:16*1024*1024}).trim(),
 write=(p,v)=>writeFileSync(out+'/'+p,JSON.stringify(v,null,2)+'\n');
assert.equal(git(['rev-parse','HEAD'],norms),normative);
assert.equal(git(['diff',candidate,'--','addons','src']),'','Audit must not mutate the measured runtime.');
const rep=json(out+'/reproduction.json'),lock=json('isomax/provenance.json');
assert.equal(lock.sourceCommit,production);
assert.equal(rep.current.reachableUnits,168);
assert.equal(rep.current.unboundCounts.length,8);
assert.equal(rep.packageResult.frozenWorkerRootsReachable,0);
assert.equal(rep.publicationCheck.sourceAtomicStoresInCompletionBranch,5);
assert.equal(rep.publicationCheck.ledgerAtomicStores[0].count,4);
assert.equal(rep.badRegexMatchesOrdinaryTerms,false);

// Rule dispositions are scoped review judgments; passing structure is not a whole-runtime certificate.
const judgments={
 'EVID-001':['CONFORMS','Exact localhost runtime/CPU/flags and distinct production/candidate identities recorded. This does not transplant Node26 reference costs to Node27.'],
 'EVID-002':['CONFORMS','Actual emitted Smi32 checks replace a rejected folklore assumption; no historical advice used as native-cost proof.'],
 'EVID-003':['CONFORMS','Debt entries state causal mechanism, governing unit, regression surface and falsifier.'],
 'EVID-004':['CONFORMS','Inherited correctness/performance reused for unchanged runtime; bounded diagnostics address a coherent audit uncertainty.'],
 'EVID-005':['CONFORMS','No hot mutation made merely because a detector or static review found work.'],
 'EVID-006':['CONFORMS','Full empty7x6 multiworker solve is the hot performance authority; local/code observations cannot promote candidates.'],
 'EVID-007':['CONFORMS','Assembly/site/GC counts are not elapsed-time or saving claims. Diagnostic TIMEOUT is not a performance rejection.'],
 'COST-001':['UNVERIFIED','Reference ledger/profile binding exists; complete active Node27/i5 closure and realization-sensitive cost binding remain incomplete (L1/L6/M4).'],
 'COST-002':['UNVERIFIED','Symbolic runtime/native costs remain named, but missing closure/callback aggregation prevents complete nonzero-cost assurance (L1/L2).'],
 'COST-003':['UNVERIFIED','Confirmed failed accounting checks: actual roots, callee identities, callbacks, selectors and completion store (L1–L5). No owner-approved deviation invented.'],
 'COST-004':['UNVERIFIED','Native-width/bank accesses are explicitly modeled, but completion-store count is wrong and actual builtin lowering exceeds bare-load accounting (L4/M4).'],
 'COST-005':['UNVERIFIED','New candidate assembly supports M1–M4; ledger does not completely represent its boxing/calls. Production and other OS machine mappings unqualified.'],
 'COST-006':['CONFORMS','No additive cycle sum reported as wall time; external whole-process CPU/cycles distinguished from primary solve.'],
 'COST-007':['UNVERIFIED','Regex and callback/root gaps prevent preservation of all unresolved cost through aggregation (L1–L3).'],
 'CORE-001':['UNVERIFIED','Complete source review exposes unresolved recurring cost; admissible lower-cost replacements not yet qualified.'],
 'CORE-002':['CONFORMS','No semantic change. Inherited independent oracle, transition and full-suite checks retained; not universal proof.'],
 'CORE-003':['CONFORMS','TT address plus stored exact identity retained; full hash alone is not equality. Qualified collision/alias controls inherited.'],
 'CORE-004':['CONFORMS','Representation/calls/boxing and recurring structural work prioritized while small ABI costs remain visible.'],
 'CORE-005':['CONFORMS','C34+C63 and other retained fusions protected; fallback work not deleted because compiled route supersedes only admitted cases.'],
 'XTRM-001':['UNVERIFIED','Cost search completed for this audit; whole-runtime minimal-cost/maximal-optimization certification is not established.'],
 'XTRM-002':['CONFORMS','Every candidate is causal-classified; emitted work not called known avoidable absent full-solve qualification.'],
 'XTRM-003':['CONFORMS','Dead slot/tail and small repeated checks stay in debt, regardless of isolated magnitude.'],
 'XTRM-004':['CONFORMS','Instruction/site counts are explanatory; elapsed/cycles at enclosing solve decide promotion.'],
 'XTRM-005':['UNVERIFIED','Optimization campaign remains open with durable debt. Audit completion is not a fast-enough optimization stopping claim or owner deferral.'],
 'XTRM-006':['CONFORMS','No global-optimality claim; current uncertainty and requalification triggers visible.'],
 'XTRM-007':['CONFORMS','Investigation/disposition performed without blindly intervening in superior composites.'],
 'BOUND-001':['UNVERIFIED','Cold geometry/cache dispatch exists; caller-proved fact retests and unbounded history admission remain candidates (D7/C4).'],
 'BOUND-002':['UNVERIFIED','CPC/mover/full-column rechecks identified; removing them requires caller/fallback ownership proof.'],
 'BOUND-003':['CONFORMS','Formatting/discovery/errors external or cold; no hot reporting counters introduced.'],
 'BOUND-004':['CONFORMS','No builtin replaced by folklore; actual Atomics calls and popcount helper retained as measured candidates.'],
 'REP-001':['CONFORMS','Initialization-selected basis/index/cache widths and bank limits explicit; general exact fallback preserved through10x10. Large profiles not fully allocation-qualified.'],
 'REP-002':['UNVERIFIED','Stable arenas exist, but uint32 boxing and negative-zero transport are emitted conversion debt (M1/M2).'],
 'REP-003':['CONFORMS','Hot structured state consumed directly; no string/JSON reparsing in recurrence.'],
 'REP-004':['UNVERIFIED','Compiled plans/fused identity reused; remaining extraction/repacking/reflection work requires shared-overhead investigation.'],
 'ALLOC-001':['CONFORMS','Source-scope successful recurrence has no dynamic aggregate construction. Numeric HeapNumber paths are separately unresolved under XTRM/JIT; no machine-allocation-free claim.'],
 'ALLOC-002':['UNVERIFIED','Closed-app retention is source-established; lifecycle/retention cost and release qualification unresolved (C3). No pooling assumption.'],
 'ALLOC-003':['CONFORMS','TT, frames, scratch and support plans sealed before E0; no hot storage growth detected. E3 root allocation included in primary.'],
 'ALLOC-004':['CONFORMS','Rank-owned recursive arenas and stable scalars protect borrowed scratch; no escaping recursive scratch found. Closed-app ownership documented in audit.'],
 'COMP-001':['CONFORMS','No rewrite/asymptotic regression in audit; fallback complexity and support-plan budgets explicit.'],
 'COMP-002':['UNVERIFIED','Basis/reflection/pair-prefix scans and residual extraction remain candidate repeated work, not proven removable.'],
 'COMP-003':['UNVERIFIED','Eager child/frontier/live products may be bypassed by certificates; guard/ownership economics unresolved.'],
 'COMP-004':['CONFORMS','Prepared buffers sized from geometry/profile; no E0 allocate-copy-shrink. One-shot root slices are E3.'],
 'FINITE-001':['CONFORMS','Immutable support, closure, reflection and transition plans prepared within declared budgets; exact fallback retained.'],
 'FINITE-002':['CONFORMS','C66 compilation amortization/bytes/full-solve evidence inherited; budget fallback and code-size risks recorded.'],
 'CF-001':['UNVERIFIED','Terminal/cache/forced gates exist; eager live/frontier work can precede child simplification (D5).'],
 'CF-002':['UNVERIFIED','Cold worker/layout selection exists; some fallback fixed-layout tests remain realization-sensitive debt.'],
 'JIT-001':['UNVERIFIED','Target traces inspected; complete production/fallback feedback behavior not established. Large recurrence retains helper calls.'],
 'JIT-002':['UNVERIFIED','Stable typed storage/source shapes evident; emitted guards/boxing and all-tier behavior not completely qualified.'],
 'JIT-003':['CONFORMS','Per-isolate machine evidence collected; static DCE/inlining/allocation assumptions explicitly limited.'],
 'CONC-001':['CONFORMS','Workers progress independently; cancellation/cache Atomics not reporting coordination. No pernode host rendezvous found.'],
 'CONC-002':['CONFORMS','Bounded cold-created workers and start gate; no task visibility creates new search workers.'],
 'CONC-003':['UNVERIFIED','No hot global diagnostic counters; cache publication/contention remains semantic/coupled cost with no current PMU frequency attribution.'],
 'CONC-004':['CONFORMS','Cache sequence/atomic payload protocol preserved and inherited busy/wrap/clone/collision tests pass. Not a new formal concurrency proof.'],
 'NATIVE-001':['CONFORMS','FFI affinity is a cold boundary with ABI/OS constraints; no solver escape or native-is-faster assumption.'],
 'DIAG-001':['CONFORMS','No source hot counters. Diagnostic runtime flags intentionally distort performance and are excluded from promotion.'],
};
const spec=read(resolve(norms,'SPEC.md')),rules=[...spec.matchAll(/^### (NEES-([A-Z]+-\d+)) — (.*)$/gm)].map(m=>({id:m[1],key:m[2],title:m[3]}));
assert.equal(rules.length,Object.keys(judgments).length,'Every pinned rule needs one explicit disposition.');
write('rule-dispositions.json',{authority:{repository:'iteathen/NEES',commit:normative,draft:'0.5',level:'NEES-EXTREME'},
 scope:'Production/candidate source and accounting review; machine evidence limited to candidate Windows/Node27. CONFORMS is explicitly scoped, not global certification.',
 overall:'INCOMPLETE_COST_CONFORMANCE',approvedDeviations:[],
 rules:rules.map(({id,key,title})=>{assert.ok(judgments[key],id);return {id,title,status:judgments[key][0],evidence:judgments[key][1]};})});

const methodNotes={
 M01:['UNVERIFIED','BOUND-001','Cold layout/geometry dispatch exists; caller facts and history admission debt remain.'],
 M02:['UNVERIFIED','JIT-001','Candidate bodies observed; complete feedback/tier coverage not proved.'],
 M03:['UNVERIFIED','JIT-002','Stable retained objects; no repeated reshaping found, all-tier realization incomplete.'],
 M04:['CONFORMS','ALLOC-004','Rank frames/scalars preserve values needed after descendant scratch reuse.'],
 M05:['CONFORMS','REP-001','Fixed indexed TT records and typed state arenas; packing qualified at enclosing solve.'],
 M06:['CONFORMS','CORE-003','Addresses narrow lookup; exact encoded coordinates still determine equality.'],
 M07:['CONFORMS','FINITE-001','Support/closure/reflection/cell-incidence tables cold, bounded and reused.'],
 M08:['CONFORMS','CORE-003','Exact partial-key reconstruction and collision/alias controls; no hash-only equality.'],
 M09:['UNVERIFIED','REP-002','M1/M2 emitted numeric boxing; any signed/window trick needs ABI proof and full-solve evidence.'],
 M10:['CONFORMS','REP-001','Fixed-width/shared representation is load-bearing, not typed-array folklore.'],
 M11:['CONFORMS','ALLOC-001','No source temporary aggregates in recurrence; numeric engine allocation separately recorded.'],
 M12:['UNVERIFIED','ALLOC-002','Prepared one-shot resource ownership; no arbitrary pooling, closed-app retention unresolved.'],
 M13:['CONFORMS','ALLOC-003','Capacities sealed before recursive execution, budget fallback explicit.'],
 M14:['NOT-APPLICABLE','CONC-004','No queued generation-bearing arena references; TT replacement uses exact-key/sequence protocol instead.'],
 M15:['UNVERIFIED','REP-004','Prepared plans and C34 reuse retained; extraction/repacking debt remains.'],
 M16:['CONFORMS','REP-003','No hot serialization/reparsing to rediscover structured state.'],
 M17:['UNVERIFIED','CF-001','Terminal and tactical gates exist; eager child preparation still bypassable in principle.'],
 M18:['UNVERIFIED','CF-001','D5 eager products can precede exact child/cache simplification.'],
 M19:['CONFORMS','COMP-001','Hot indexed loops and bit scans; cold iterators not rewritten from syntax folklore.'],
 M20:['UNVERIFIED','JIT-003','Dead slot/tail ABI emitted; large bodies still retain costly calls.'],
 M21:['CONFORMS','ALLOC-001','Worker helpers prepared at module/setup boundary; no closure per node found.'],
 M22:['UNVERIFIED','BOUND-002','Do not globally remove proof guards; admitted specialized preconditions need caller provenance.'],
 M23:['UNVERIFIED','COMP-002','Preallocated rank frames avoid deep clones; incremental make/unmake remains unqualified alternative.'],
 M24:['CONFORMS','CONC-002','Forced moves directly recurse without central scheduling; further transition fusion remains D10.'],
 M25:['NOT-APPLICABLE','CONC-002','No interworker priority heap/queue in selected independent deep-worker runtime.'],
 M26:['CONFORMS','CONC-004','Explicit numeric ready/stop/done/winner state, no object claim transport.'],
 M27:['CONFORMS','CONC-004','Atomic sequence/payload protocol retained before any attempt to remove synchronization.'],
 M28:['UNVERIFIED','CONC-003','Interleaved layout/compact rows qualified, current coherence traffic and contention frequency unmeasured.'],
 M29:['CONFORMS','CONC-002','Workers instantiated once before search; no child-created workers. One-shot session contract explicit.'],
 M30:['CONFORMS','ALLOC-004','Shared geometry/root/cache ownership and rank-local private scratch explicit; no escaping borrowed Buffer.'],
 M31:['CONFORMS','NATIVE-001','FFI only cold OS affinity/discovery; no hot native solver substitution.'],
 M32:['NOT-APPLICABLE','NATIVE-001','No compiled Node-API addon in solver; OS FFI is a separately constrained cold mechanism.'],
 M33:['NOT-APPLICABLE','NATIVE-001','No custom V8 Fast API solver callback; generic experimental FFI only.'],
 M34:['UNVERIFIED','NATIVE-001','Exact OS calls and cold lifetime inspected; complete ABI/permission/failure profile across all deployment platforms not recertified here.'],
 M35:['CONFORMS','DIAG-001','No hot reporting counters; bounded external runtime tracing labels its perturbation.'],
 M36:['CONFORMS','DIAG-001','RSS external; main heap snapshots explicitly exclude workers, collected only for diagnostic ownership question.'],
 M37:['CONFORMS','CORE-005','Compact flat/interleaved exact TT layout is measured, not bytes-only promotion.'],
 M38:['UNVERIFIED','BOUND-002','Admitted geometry specializations retained; repeated CPC/caller facts still need shared ownership proof.'],
 M39:['CONFORMS','CORE-005','C24/C44/C66 supersession and current load-bearing full hash preserved; obsolete passes not restored.'],
 M40:['CONFORMS','BOUND-004','No folklore replacement of builtin primitives.'],
 M41:['CONFORMS','COMP-004','Geometry-derived fixed arrays allocated once; no hot dry-run encoding/grow-copy.'],
 M42:['CONFORMS','FINITE-002','C66 bounded table compilation and fallback; no runtime eval/code injection for search specialization.'],
 M43:['CONFORMS','CORE-004','Tiny result materialization E3 does not justify moving fine-grained arithmetic across native boundary.'],
 M44:['UNVERIFIED','COST-005','Candidate Node27 machine record exists; whole production/fallback/profile ledger evidence incomplete.'],
 M45:['CONFORMS','XTRM-002','Complete selected source/support scope reviewed; debt durable, machine coverage limits explicit.'],
 M46:['CONFORMS','XTRM-004','Static proxies subordinate to full-solve cost; unavailable cycles/PMU not zero.'],
 M47:['CONFORMS','EVID-006','Governing exact multiworker empty7x6 unit and secondary initialization named for each debt.'],
 M48:['CONFORMS','EVID-005','Detected code and bookkeeping defects not turned into untested solver rewrites.'],
 M49:['CONFORMS','CORE-005','Composite overhead sharing and existing absorbed gates reviewed.'],
 M50:['CONFORMS','EVID-003','Board widths, worker counts, lifetime, JIT/spills and memory surfaces mapped in debt; no new promotion.'],
 M51:['CONFORMS','EVID-007','GC/sites/code size diagnostic only.'],
 M52:['UNVERIFIED','COST-003','Concrete incomplete transitive cycle accounting/enforcement L1–L5 prevents complete qualification.'],
};
const methods=[...read(resolve(norms,'NODE_V8_METHODS.md')).matchAll(/^## (M\d+) — (.*)$/gm)];
assert.equal(methods.length,Object.keys(methodNotes).length);
write('method-dispositions.json',{authority:{repository:'iteathen/NEES',commit:normative,document:'NODE_V8_METHODS.md'},
 methods:methods.map(m=>{const [status,rule,reason]=methodNotes[m[1]];return {id:m[1],title:m[2],status,relatedRule:'NEES-'+rule,reason};})});

const entries=[
 ['D1','Unsigned hash boxing at exact publication','E0/E2','REPRESENTATION / JIT-ENGINE','COUPLED','Center partial24:175; live partial24:190; M1 assembly','Internal signed-bit ABI or publication inlining; preserve all32 hash bits and every consumer.','Removing boxing may change spills/inlining; never truncate exact identity.'],
 ['D2','Recursive negative-zero window boxing','E0','REPRESENTATION / JIT-ENGINE','COUPLED','Center partial24:210; live partial24:227; M2 assembly','Prove int32 window/score/sentinel transport; test coherent integer normalization.','Preserve negamax bounds, cancellation sentinel and external score semantics.'],
 ['D3','Dead slot and constant tail arguments','E0/E2','DERIVATION / JIT-ENGINE','COUPLED','Center partial24:136/:106/:175; emitted AND/spill/tag/push; M3','Remove unused ABI fields jointly with publication qualification.','Code size, register pressure and inline decisions can change.'],
 ['D4','coord.seen unused cofactor argument','E1','DERIVATION','UNKNOWN','Source residue; representative inlining appears to eliminate load','Simplify ABI if it benefits maintenance or composite lowering.','No emitted cost established; do not count a nonexistent load as saving.'],
 ['D5','Eager frontier/live child state before cache/tactical return','E1','DERIVATION / DATA-MOVEMENT','COUPLED','Live partial24:221–223; proofs:225–227; frontier setup:20–22; live update:106–114','Consume cheap child certificates before preparing optional state, or share one lazy preparation.','Additional guards/spills, recursive scratch ownership and pruning effectiveness.'],
 ['D6','Reflection scans inactive basis entries','E1','DERIVATION','COUPLED','rba-connect4-coordinate-support-reflection-view.mjs:13–31','Share an active-coordinate union already computed by transition.','Canonical exact identity and fallback domains; avoiding scan may cost another union.'],
 ['D7','CPC/caller repeated terminal, controller, mover and capacity facts','E0/E1','SEMANTIC / DERIVATION','COUPLED','connect4-cpc-matching-response.mjs:40–41; connect4-cpc-target-win.mjs:28–29; ordinary proof carry sites','Carry proven preconditions into guarded narrow helpers; combine consumers of common extraction.','CPC true intent, proof guard ancestry, wide-board fallback and first-win precedence.'],
 ['D8','Transition image reads for parent bits absorbed for both owners','E1','DERIVATION / LOCALITY','COUPLED','rba-connect4-coordinate-compiled-transition.mjs:201–215','Construct/share eligible surviving union before image access.','Both owner closures, absorption, image-index exactness and branch economics.'],
 ['D9','Full-column checks repeated after live ordering','E0/E1','DERIVATION','UNKNOWN','Live-order legal filtering followed by worker loop check','Carry legal-mask ownership through forced/fallback branches.','Proof that all callers supply the same filtered domain; no out-of-bounds moves.'],
 ['D10','Pair-hub singleton-prefix scan and ordinary forced recursion','E0/E1','SEMANTIC / DERIVATION','COUPLED','connect4-cpcx-pair-hub.mjs:1–62; forced recursion sites','Share certified prefix/forced transition work with existing fused gate.','Do not restore earlier separate C01/C05 passes; forced-move semantics and work distribution.'],
 ['D11','Fallback mover/support/tail repacking and fixed-layout dispatch','E0','DERIVATION / JIT-ENGINE','COUPLED','Ordinary proof workers and local32/cache helpers; generic fallback review','Extend prepared identity/carry to fallback only if domain and whole-solve economics justify.','C34+C63 composite, unsupported geometry/profile fallback and V8 folding.'],
 ['D12','Basis/inverse rebuilding on noncompiled fallback','E1','DERIVATION','ENABLING','C24/C44 ancestry; generic cofactor/closure prepared/dense functions','Consider shared prepared support handle where budget admits; preserve exact generic path.','C66 supersedes only admitted complete plans; wider boards cannot assume7x6 memory budget.'],
 ['D13','Large uninlined helper calls and builtin numeric handling','E0/E2','JIT-ENGINE / CONCURRENCY','COUPLED','M4 latest TurboFan bodies, frontier comparisons/popcount/publication/AtomicsLoad','Qualify fusion or stable integer ABI at the enclosing recurrence.','Instruction footprint, tiering, contention and required atomic visibility.'],
 ['D14','Closed application retains solver storage','E3/COLD','ALLOCATION-LIFETIME','COUPLED','Prepared host close retains root/shared/workerGeometry/geometry; C3','Document natural lifetime; optionally preserve scalar result metadata then release captured buffers.','State/result availability and reusable ownership contract; not a proven leak.'],
 ['D15','Root ingress/history admission/setup deadline documentation','E3/COLD','SECURITY-INTEGRITY / ALLOCATION-LIFETIME','STANDALONE','Ingress69–70; prepared synchronous setup and deadline; C1/C2/C4/C5','Bound history length before allocation; state readiness deadline and root-allocation boundary accurately.','Do not count cold setup or E3 ingress as E0; do not mutate frozen package without new provenance.'],
];
write('debt.json',{governingHotUnit:'Complete exact empty7x6 multiworker solve, all-ready/root construction through exact result; init/cleanup secondary.',
 authorization:'Audit/disposition only; no automatic solver changes or approved performance deferrals.',
 entries:entries.map(([id,site,executionClass,mechanism,causalRole,evidence,question,regressionSurface])=>({id,site,executionClass,mechanism,causalRole,
 disposition:'UNVERIFIED-DEBT',knownAvoidable:false,evidence,candidateQuestion:question,regressionSurface,
 whyUnresolved:'No admissible replacement with complete governing-unit qualification in this audit.',
 owner:'JSMinSys support/worker library; direct owner request; NEES-EVID-005/XTRM-002',
 revisitTrigger:'Next coherent optimization touching this ABI/data/guard, a new shared-overhead consumer, or runtime/profile change.',
 profile:executionClass.includes('COLD')?'Source-established cold lifecycle; target profile as manifest.':'Node27/V8 14.6.202.34-node.36 Windows x64 i5-12600K; production lowering separately unqualified.'}))});

const run=resolve(consumer,'docs/qualification/20261006-nees-audit/partial24-banked-code-gc-02'),
 invocation=json(resolve(run,'invocation.json')),summary=json(resolve(run,'summary.json'));
assert.equal(invocation.executable_hash,nodeHash);
assert.equal(summary.performanceConclusionAllowed,false);
assert.equal(summary.result.readyWorkers,6);assert.equal(summary.result.workersExited,6);
assert.equal(summary.result.cleanup,true);assert.equal(summary.result.status,'TIMEOUT');
assert.equal(summary.result.sharedTtPayloadBytes,12*2**30);
const asm=readdirSync(run).filter(p=>/^code-.*-[1-6]\.asm$/.test(p)).sort().map(p=>{
 const text=read(resolve(run,p)),matches=[...text.matchAll(/--- Optimized code ---/g)],start=matches.at(-1)?.index;
 assert.notEqual(start,undefined,p);const body=text.slice(start),line=text.slice(0,start).split('\n').length;
 assert.match(body,/name = negamax/);assert.match(body,/kind = TURBOFAN_JS/);
 return {file:p,latestHeaderLine:line,instructionBytes:Number(body.match(/Instructions \(size = (\d+)\)/)[1]),
 allocatorSlowCallSites:[...body.matchAll(/\bcall[^\n]*\(AllocateInYoungGeneration\)/g)].length,
 inlinedFunctions:Number(body.match(/Inlined functions \(count = (\d+)\)/)[1]),sha256:hash(resolve(run,p))};
});
assert.equal(asm.length,6);
assert.deepEqual(asm.map(x=>x.instructionBytes),[42192,45276,40100,48112,47300,48564]);
assert.deepEqual(asm.map(x=>x.allocatorSlowCallSites),[20,20,17,21,30,23]);
const lockedRuntime=Object.entries(lock.files).filter(([p])=>p.startsWith('runtime/')).map(([p,v])=>({path:p,source:v.source,
 sha256:normalizedHash('isomax/'+p),lockedSha256:v.sha256,sourceBlob:git(['rev-parse',production+':'+v.source]),
 sourceLineCount:read('isomax/'+p).split('\n').length-1}));
for(const item of lockedRuntime){
 assert.equal(item.sha256,item.lockedSha256,item.path);
 const frozenText=execFileSync('git',['show',production+':'+item.source],{encoding:'utf8',maxBuffer:16*1024*1024}).replaceAll('\r\n','\n');
 item.frozenSourceSha256=createHash('sha256').update(frozenText).digest('hex');
 assert.equal(item.sha256,item.frozenSourceSha256,item.path+' must match the frozen source, not just a mutable package lock.');
}
const workerSources=readdirSync('addons').filter(p=>/^rba-connect4-lazy-smp-worker-minimal.*\.mjs$/.test(p)).sort().map(p=>({path:'addons/'+p,
 sourceBlob:git(['rev-parse',candidate+':addons/'+p]),sha256:normalizedHash('addons/'+p),lines:read('addons/'+p).split('\n').length-1,
 review:'Full source review of hot recurrence, caches/publication, terminal/forced gates, support/reflection/live ownership; fallback variants included.',
 machineCoverage:/center-proofs-local32-partial24/.test(p)?'isolate1/3/5':/compiled-proofs-local32-partial24/.test(p)?'isolate2/4/6':'No fresh machine capture for this exact variant.'}));
assert.equal(workerSources.length,32);
const evidenceCommit=git(['rev-parse','HEAD'],consumer),
 evidenceFiles=readdirSync(run).filter(p=>!asm.some(a=>a.file===p)).map(p=>({path:relative(consumer,resolve(run,p)).replaceAll('\\','/'),sha256:hash(resolve(run,p))}));
for(const e of [...evidenceFiles,...asm.map(a=>({path:relative(consumer,resolve(run,a.file)).replaceAll('\\','/'),sha256:a.sha256}))]){
 const committed=execFileSync('git',['show',evidenceCommit+':'+e.path],{cwd:consumer,maxBuffer:16*1024*1024});
 assert.equal(createHash('sha256').update(committed).digest('hex'),e.sha256,'Committed raw bytes must match capture: '+e.path);
}
write('manifest.json',{kind:'Thorough NEES source/accounting/realization audit',overall:'INCOMPLETE_COST_CONFORMANCE',
 normative:{repository:'iteathen/NEES',commit:normative,documents:['SPEC.md','CONFORMANCE.md','COST_ACCOUNTING.md','NODE_V8_METHODS.md','RUNTIME_PROFILE_NODE26.md','STALE_ADVICE.md'].map(p=>({path:p,sha256:normalizedHash(resolve(norms,p))}))},
 producer:{repository:'iteathen/JSMinSys',branch:git(['branch','--show-current']),auditObservationHead:rep.auditHead,manifestPreparedAt:git(['rev-parse','HEAD']),candidateRuntime:candidate,runtimeDiffFromCandidate:'EMPTY'},
 consumer:{repository:'iteathen/Connect4',branch:git(['branch','--show-current'],consumer),diagnosticHarnessHead:invocation.repositoryCommit,evidenceCommit,manifestObservedHead:evidenceCommit},
 package:{version:lock.version,sourceCommit:production,lockSha256:normalizedHash('isomax/provenance.json'),frozenLedgerBlob:git(['rev-parse',production+':catalog/addon-cycle-ledger-v0.json']),lockedRuntime},
 currentLedger:{sha256:normalizedHash('catalog/addon-cycle-ledger-v0.json'),units:642,reachableDeclaredUnits:168,activeCompiledRootsReachable:0},
 coverage:{workerSources,method:'Independent read-only hot/cold/ledger domains, primary reproductions and representative current machine-code validation. Hash inventory is not itself line-by-line or machine proof.',
 supportReview:['Compiled cofactor/child loader/closure','Prepared and dense cofactor/closure/support','Basis/support-handle/view/profile plans','Reflection/canonicalization and inverse construction','CPC win/response/matching/target/dense/pair-hub proof guards','Live-line evaluator/ordering and residual proof-frontier','Exact/index-partial/banked TT identity and atomic protocol','Ingress, managed lifecycle, discovery, affinity, memory profiles and package closure'],
 limitations:['Source review does not prove all-tier/all-OS allocation freedom.','Fresh assembly captures only two selected candidate policies.','Runtime-wide transitive cost enforcement remains defective.','No full10x10 solve or experimental16–128GiB allocation qualification.']},
 runtime:{node:summary.runtime.node,v8:summary.runtime.v8,cpu:'Intel Core i5-12600K',platform:'win32/x64',executable:invocation.executable,sha256:nodeHash,flags:invocation.arguments,
 workers:6,affinity:summary.result.workerAffinity,sharedBytes:summary.result.sharedTtPayloadBytes,privateBytesPerWorker:192*2**20,sharedBanks:2,
 rootFrontier:false,sharedSampleMask:0,sharedProofBounds:true,compiledTransitions:true,sourceHotCountersAdded:false,processCycles:null},
 diagnostic:{directory:relative(consumer,run).replaceAll('\\','/'),performanceConclusionAllowed:false,result:'TIMEOUT after declared10s observation; six clean exits',
 gcAttribution:'Runtime GC observed; no causal per-site or steady-search allocation frequency established.',asm,evidenceFiles},
 inheritedValidation:'467/467 tests;26 independent oracle cases/1340 memo nodes;7 fresh complete exact empty7x6 multiworker solves at measured candidate; no new runtime diff.',
 auditArtifacts:['REPORT.md','SCOPE.md','REVIEW.md','verification.json','reproduce.mjs','reproduction.json','reproduction.txt','finalize.mjs','rule-dispositions.json','method-dispositions.json','debt.json'].map(p=>({path:p,sha256:normalizedHash(out+'/'+p)})),
 mutation:{solver:false,cpc:false,bsfp:false,package:false,defaults:false,main:false}});
console.log('Audit artifacts verified: '+rules.length+' NEES rules, '+methods.length+' methods, '+entries.length+' durable debt items, '+workerSources.length+' worker source variants, '+asm.length+' machine-code isolates.');

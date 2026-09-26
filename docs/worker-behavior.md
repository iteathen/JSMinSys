# Optional shared worker behavior

`Worker` remains unchanged. Applications can explicitly select `BehaviorWorker`
when preparing a worker implementation, or call `readWorkerBehavior32` directly
at a chosen safe checkpoint. There is no per-node "enabled?" branch in existing
workers. The ordinary Lazy SMP worker remains flag-free. Passing prepared
`behaviorMemory` to `runLazySmpConnect4Rba32` selects the optional worker, which
reads its primary word at every completed-node boundary during search. This is
not a PFIF strategist; no scheduling/ordering policy is inferred from TT data.

```js
const behaviorMemory = createWorkerBehaviorMemory32(workerCount);
const words = new Uint32Array(behaviorMemory.buffer);
const solve = runLazySmpConnect4Rba32(moves, {geometry, workers:workerCount, behaviorMemory});
// Strategist may publish while solve is running. Bit 0 means cooperative STOP.
publishWorkerBehavior32(words, workerIndex, WORKER_BEHAVIOR_STOP);
const result = await solve;
```

STOP retires that worker at its next completed-node/forced-transit boundary.
Other workers continue. If all retire, the host returns INTERRUPTED with null
rootWdl. A cancelled search never publishes an unfinished parent as exact.
Previously completed exact rows remain valid. Clearing STOP permits a new solve;
it does not resurrect a retired worker. Other payload bits are reserved for
future explicit behaviors. Unknown bits alone do not change search semantics.

Completion means a searched q return (cache/CPC/cutoff/ordinary), a terminal
cofactor child, the root, or a completed forced-transit evaluation before
continuing to its child. It is not each internal algebra operation. Front
construction/action-front evidence is not interrupted internally. Lazy SMP
uses CPC-only. For completed CPC solves, checkpoint count equals cofactors+1,
including terminal children that the historical `nodes` counter excludes.

```js
// Initialization/controller side:
const words = createWorkerBehavior32(workerCount);
// Send the shared view with worker setup, not on each behavior update.
publishWorkerBehavior32(words, workerIndex, primaryFlags, extension1, extension2, extension3);

// Optional concrete worker; run() and behavior meanings remain consumer-owned.
class ControlledWorker extends BehaviorWorker {
  run() {
    // At the consumer's prepared checkpoint:
    const flags = this.readBehavior32();
    // -1: publication overlapped; defer until a later checkpoint.
    // Otherwise process primary payload (flags & 0x7fffffff).
    // Only inspect behaviorExtensions if flags & 0x80000000 is nonzero.
  }
}
```

## Layout and ownership

Each worker has four 32-bit words, each containing 31 payload bits. Bit 31 of
words 0–2 means another word is present. Bit 31 of word 3 is reserved and always
zero. This fixed profile offers 124 behavior flags, including sparse extension
sets. The publisher derives extension markers; supplied payloads must fit
0..0x7fffffff. Omitted extension arguments are zero. Unknown flag meanings are
not interpreted by the library.

A fifth word is an extension-publication version. The 20 active bytes use a
128-byte stride: distinct worker payloads cannot share a 64-byte cache line
even without assuming SAB base-address alignment. Other hardware line sizes
require separate locality qualification. Memory cost is 128 bytes per worker
plus 12 bytes of private extension scratch for a BehaviorWorker instance.

Exactly one strategist owns publication to a given worker region. It updates
shared storage directly through `publishWorkerBehavior32`; no worker message,
clear, acknowledgment, shared write, or wake is involved. Readers only load
shared words. They may write their own prepared extension scratch.

Flags describe persistent desired behavior. Updates may coalesce; this is not
a delivery-guaranteed command/event queue. The consumer owns bit meanings,
assignment/session validity, checkpoint placement and safe behavior changes.
Flags cannot manufacture exact results or authorize dropping proof obligations.

## Publication contract

Single-word observation: one atomic load and one extension-bit test; return
the primary word. No version or extension load, and no output write.

Extended observation: read an even version, re-read the primary inside the
version bracket, follow only present extension words, then confirm the version
is unchanged. Only then write the three private output lanes and return the
unsigned primary. Unused extension lanes are zero. Return -1 on an odd/changed
version, leaving prior private output untouched. There is no spin/retry/wait.
If an accepted primary is single-word, old private extension values are not
part of that result and must not be interpreted.

The writer validates inputs before mutation, marks the version odd, writes
active extension words, publishes the primary, then marks the version even.
All shared accesses use the atomic protocol. Raw strategic stores that bypass
the protocol, multiple concurrent writers, or version reset while readers are
live violate the contract. An interrupted writer can leave an odd version;
readers remain nonblocking and defer that extended update. This channel is not
an emergency-stop mechanism with guaranteed delivery or response latency.

Version wrap is rejected before mutation at 0xfffffffe. A session supports
2,147,483,647 publications per worker before quiescent replacement is required;
no ABA-producing silent wrap is permitted. There is no dynamic extension or
automatic storage recycling in the execution path.

## Cost accounting and qualification

`catalog/functions-v0.json` contains the numeric reader's executed-path ledger.
With n active extension words, a successful extension read uses 4+n atomic
loads (5–7 normally), plus explicit address operations, bit tests, version
comparison and three private stores. The common primary-only path uses one
atomic load. The writer performs one version load and 3+n atomic stores after
cold validation. The `BehaviorWorker` method adds receiver/field access and
call costs unless V8 inlines them; these costs remain accounted, never assumed
zero. Allocation, publisher validation and class setup are in the add-on ledger.

Atomic/coherence/cache/call costs remain symbolic until measured on the target
CPU/V8 profile. Static ledger verification is not complete NEES conformance.
`tools/bench-worker-behavior.mjs` measures Windows whole-process CPU cycles for
the checkpoint loop, including background runtime work, with a no-control loop
comparison. It separately records startup/setup/warmup and total harness cycles.
This is a component probe, not a prediction of added cycles per IsoMax node.
Concurrent-reader correctness is tested; write-frequency-dependent coherence
performance and integration checkpoint cadence still need consumer qualification.

Tests cover all 124 payload bits, extension truncation, inactive slots, input
validation, version exhaustion, overlapping updates, cross-thread consistency,
one-load fast path, and the unchanged base Worker. Integration tests cover
live post-start publication, every CPC completion, explicit cancellation,
exact-cache reuse after cancellation, one-worker retirement and host cleanup.
Ordinary search, TT, move ordering and solver defaults are unchanged.

## Prepared per-node reader: scoped JSMinSys deviation

The optional search uses `createWorkerBehaviorMemory32` and a prepared
`BehaviorWorker(owner, words, index, memory)`. Memory allocation, view binding,
module compilation, instance creation and a 100,000-load warmup happen before
search. The hot search calls the prepared Wasm export directly; it does not
dispatch through the generic Worker method or test whether controls are enabled.

Scope: `worker-behavior.mjs#prepareWorkerBehaviorLoad32` and
`worker-behavior-search.mjs#completeBehaviorNode32`. The sole admitted Wasm
operation for this opt-in profile is `i32.atomic.load`, using a byte offset
encoded as `i32.const` during initialization and returning i32. The exported
reader takes no arguments: no worker-address lookup or conversion at each node.
It is a sequentially consistent atomic read; JS converts
to uint32 before applying the existing extension protocol. No game evaluation,
TT operation, memory copying, or foreign general-purpose code is moved to Wasm.

This explicitly recorded deviation under SPEC section 17 does not globally
expand the sealed primitive catalog. A standard-library JS Atomics load remains
the portable reader and owns the rare consistent-extension path. Ordinary
unordered loads, initialization-only sampling, and less-than-per-node polling
do not implement the owner's semantics. Equivalent signed/unsigned/cached JS
Atomics call shapes did not remove the generic V8 builtin overhead in probes.

Storage: fixed shared WebAssembly memory, 64 KiB page granularity, 128 bytes per
worker region. Total reservation is ceil(workerCount*128/65536)*65536 bytes.
All extension access uses views of the same memory. The byte offset includes
the typed view's own byteOffset. No memory growth during a session.

Cost: JS-to-Wasm guards/call/return, bounds/alignment checks, the actual atomic
load, uint32 interpretation, extension test, STOP decision, recursive sentinel
propagation and cold retirement must all be included. The isolated ~6-cycle
loop result does not equal whole-search overhead. One reader is prepared per
worker; swapping export identities inside an evaluator changes JIT feedback
and requires its own qualification. Compilation/warmup cost and the extra
64 KiB minimum are explicit, not free. Coherence under a changing strategist
and other Node/CPU versions require requalification. No full NEES claim is made.

The opt-in solver/worker files are generated at build time by
`tools/build-behavior-search.mjs` from the ordinary solver/worker. CI checks exact
regeneration. There is no runtime source rewriting or second manually maintained
search algorithm. Falsifiers include any missed completed-node read, missed live
update, altered zero-flag value/node count/move, invalid cache publication, or
unaccounted whole-operation cycle regression.

# Worker cleanup audit after the interaction campaign

Audited checkpoint: `794e05bddbb3cdc9572c453fa354ecb352d46e96`.
Live main comparison: `93aca1758718bcbf0635c11a957a67ca6387d50c`.

## Findings and repair

The ordinary Lazy SMP worker and alpha-beta implementation match main. The
optional behavior worker, generated search, and completion reader have no
functional changes since `095d66d`; its preparation module has only a subsequent
comment correction about V8 tier scheduling. The strategist experiments are
cold-selected in `evaluator.mjs`, not branches through all candidates per node.

The active mode generator nevertheless inherited dead four-front scaffolding
from its general-purpose ancestor. It rejects four-front execution but retained:

- two unused coordinate imports;
- an unavailable four-front mode export and redundant validation;
- three unused boundary configuration arguments;
- unused state mode, null front and three null action-array fields;
- five always-zero front counters, their root resets and output fields.

Removed that scaffolding in the generator and regenerated modes, observed-modes
and one-band. Unsupported mode values still fail closed. General-purpose
production four-front support remains intact. Existing experimental historical
controls are retained for reproduction; they are not loaded by the mode worker.
Historical benchmark files remain unchanged, including their old zero fields.

## Real costs retained deliberately

- Every completed node/forced transit reads the prepared behavior word. Mode
  decoding on changes, STOP and bounded extension-consistency checks are live.
- The mode worker carries horizons, incomplete-result propagation and retained
  child markers. DEEP pays mode-capable control flow; it is not bare native AB.
- The observed variant clears a frame count per visited node, initializes branch
  markers even in DEEP, records completed children and tests snapshot requests.
  Accepted requests copy raw live-frame data to shared observation storage.
  The strategist computes width/delta. This is additional search-path work,
  not a free consequence of putting reporting on another thread.
- Shared-cache hits/stores/contention use atomic counters. These predate this
  campaign and support observations; this audit did not change TT machinery.
- Node/cofactor/CPC/mode counters supply current accounting and policy inputs.
  They are not unused merely because they have measurement purposes.
- A terminal child's checkpoint and its parent completion are distinct under
  the existing completion contract; their nearby calls are not safely deduplicated.

No new allocation, string processing, environment lookup, timer or message was
added inside recursive search by this cleanup. Root ingress/warmup, module
selection, prepared activation gating, and final result packaging remain outside
recursion. Per-request snapshot copying is explicitly present, not concealed.

## Verification

- Added a generator regression against dead four-front baggage in all three
  mode profiles. It failed before repair, then passed.
- 20 targeted mode/mixed-role/observation/one-band/pool tests passed, including
  reference values, witnesses, restoration, unchanged traversal on read-only
  observations, live flag updates and STOP/cleanup.
- 24 library worker/behavior tests passed, including standard 7x6 baseline
  metrics and completed-node checkpoint counts.
- Seven generator `--check` commands passed: behavior search, experimental
  search, frontier, recurring, modes, observed modes and one-band.
- Recursive `searchCpcOnlyBehavior` bodies are byte-identical before/after
  (normalized LF), with SHA-256:
  - modes: `14056231c03fa07ef5eadf1394ff3dfeb661aeba5edc57563ca80b16ad5c7664`
  - observed: `91ef8a6fc287504e0443e63eab67d4e969bf3ebc6f479c044f94b96296caf1a7`
  - one-band: `5616a89722f33b5807ec81681b65bc34edc6fbecba0477db51f374c556be30c8`

This is verified dead-code/setup cleanup, not a measured speedup or full NEES
qualification. State-shape changes can affect JIT behavior despite identical
recursive source, so previous timing evidence remains pinned to its old SHA.
Any attempt to reduce the retained observation cost needs a separate matched
experiment; do not silently remove strategist inputs or completion guarantees.

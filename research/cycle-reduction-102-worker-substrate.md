# Round 102 — worker execution substrate

Status: implemented on `research/isomax-rba-primitives-v1`; whole-application qualification remains required.

## Boundary

JSMinSys does not own an application worker. The application retains:

- the outer loop;
- its domain evaluator;
- domain result codes;
- domain-specific dependency semantics; and
- policy choices such as which dependencies are worth publishing.

JSMinSys now owns enough recurring mechanics that the application loop can be
mostly orchestration.

## Added blocks

- `takeOwnedStampedWork32`: serialized intrusive take, generation/currentness
  validation, lazy retirement/resolved skipping, and execution ownership claim.
- `validateOwnedWork32` / `releaseOwnedWork32`: retained-work validation and
  ownership release.
- `publishResolvedValue32`: value-before-marker publication under caller-owned
  serialization.
- `publishDependencies7x32`: fixed-degree dependency id/generation plus three
  opaque scalar payload words.
- `retainFirstRunnableDependency7x32`: direct child/dependency handoff without
  mandatory queue round-trip.
- `observeWake32`, `signalWake32`, `parkOnWake32`, and
  `workerStopOrDone32`: explicit wake, park, and stop/completion mechanics.

Amortized telemetry does not need another block: round 101's `publishSpan32`
already covers caller-owned scalar counter publication.

## Cost discipline

No additional source primitive was admitted. Atomic load/add/notify/wait use the
existing NEES synchronization authority. `parkOnWake32` is explicitly modeled
as unbounded elapsed blocking rather than assigned a fabricated finite cycle
count. Active CPU work, blocked time, and governing-unit elapsed time remain
separate measurements.

## Non-goals

This round does not add a scheduler framework, callback-based worker abstraction,
domain result enum, Connect4/RBA behavior, hidden queue, background task system,
or automatic retry/fallback mechanism. The functions remain fixed-storage numeric
building blocks.

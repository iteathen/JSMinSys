# Strategist owns shallow/deep decisions

Owner direction replaces worker-local PFIF policy for the next campaign.
The strategist chooses **SHALLOW** or **DEEP**. The worker executes that choice.
Previous recurring candidates remain reproducible experimental controls only.
The ordinary solver and shared TT are unchanged.

## Execution contract

- SHALLOW: explore bounded bands across unresolved alternatives, retaining the
  native parent frame, query bounds, order and completed-query markers. Move
  through successive bands as work completes. This is bounded traversal, not
  a heuristic value at the horizon and not a separately materialized frontier.
- DEEP: ignore probing horizons and continue the native exact traversal.
- Only strategist publication changes the mode. The worker does not test
  expansion usefulness, select a narrowing target, score yield, re-arm itself,
  or decide to abandon probing. A mode does not change WDL/proof obligations.
- The worker observes the existing shared word at every completed-node/forced-
  transit boundary. A changed mode affects subsequent execution. No root replay,
  cache clearing, stack restart, permission wait or synchronous message occurs.
  Existing query frames and their scope survive; delayed/coalesced publications
  are safe, although they may spend extra cycles.
- At the physical end of the game a horizon cannot restrict anything further.
  That fact does not change the commanded mode.

The cold-selected mode payload uses bit 0 STOP, bit 1 SHALLOW, bits 2..7 band
stride. DEEP is zero. The standard extension protocol remains available.
This payload is separate from the older experiment's action encoding; the
evaluator selects the corresponding decoder once before execution.

## Authority and observation gap

`mode-policy.mjs` is imported by the strategist only. Its current fixed modes
and timed SHALLOW/DEEP/SHALLOW/DEEP sequence are **diagnostic policies**, not an
expansion detector or a cadence recommendation. The latter sequence tests live
control; missed intermediate settings may coalesce under the flag contract.

Existing strategist observations are committed exact TT entries and aggregate
cache counters. They do not expose current unresolved width. Claiming that
they identify the worker's current expansion would be unsupported. A useful
expansion trigger still needs an independently qualified observation/policy.
This change adds no per-node telemetry or TT mutation to manufacture that signal.

## Execution cost ledger

Preparation binds the existing atomic reader, numeric settings and a
depth/action marker arena (301 bytes for 7x6). No hot allocation is added.

Unchanged primary word: one prepared shared load, uint32 interpretation,
extension-bit test, equality test, return. Changed primary: STOP test, two
numeric setting assignments, last-word store and a private change counter.
Extensions use the existing bounded consistency reader; no retry/spin.

Native recursion adds one scalar horizon argument; commanded-mode/horizon
checks; unfinished-sentinel handling. SHALLOW region setup initializes marker
lanes, saves a horizon and increments counters. Repeated bands skip completed
query children and advance the horizon. DEEP still pays the mode-capable
control flow. There is no policy/lineage argument or worker narrowing/re-arm
logic. No claim of zero execution overhead or fixed cycle cost is made.

Whole evaluator solve-call cycles include all of the above. Strategist cycles
are separate. Report measurements as bounded evidence, not NEES certification.

## Qualification

The generator derives execution from the existing native RBA worker and checks
every rewrite seam. Tests verify absence of local policy fields, one load on
unchanged control, live switches during recursion, WDL/witness agreement,
native-root restoration, STOP, and real asynchronous two-evaluator cleanup.
The ordinary solver and prior experimental controls remain comparison oracles.

```sh
node experiments/strategist/build-modes.mjs --check
node --test experiments/strategist/modes.test.mjs
node --experimental-ffi experiments/strategist/modes-campaign.mjs <new-output.jsonl>
```

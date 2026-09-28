# IsoMax Phase-2 selected packed-move continuation baseline

Date: 2026-09-28

## Selected continuation commit

`19b80c7877305a6de8ec5c29e4b8d6c61a335381`

Branch:

`experiment/isomax-phase2-packed-move-selected-20260928`

Draft PR:

#117 — accounting-corrected packed-move baseline.

Verify:

`36460304917` — success.

## Performance-qualified runtime identity

The packed-move runtime realization was qualified at:

`7b1cbf0ddb77173cf614bde32b6bd2cdb459820e`

using workflow `36459095332`, artifact `10987375059`,
digest
`sha256:4ede6ad995b75629425b695f82b8c38391ebbe60ce8d801ca2e00890cdb9bf62`.

Exact control `353335714`, eight balanced pairs:

- whole-process cycles: -0.621%, 95% [-1.101%, -0.141%];
- CPU: -0.407%, 95% [-0.754%, -0.061%];
- root WDL -1, root move 4 in all 16 processes.

## Runtime byte identity

The following runtime blobs are identical between qualified source
`7b1cbf0d...` and selected continuation `19b80c78...`:

- `addons/rba-connect4-alphabeta.mjs`
- `addons/rba-connect4-alphabeta-behavior.mjs`
- `addons/rba-connect4-frontier.mjs`
- `addons/rba-connect4-lazy-smp-worker.mjs`
- `addons/rba-connect4-lazy-smp-worker-behavior.mjs`
- `addons/rba-connect4-lazy-smp-worker-frontier.mjs`
- `addons/rba-connect4-lazy-smp-host.mjs`
- `addons/rba-connect4-shared-exact-cache.mjs`

Thus no runtime performance inference is transferred across changed runtime
bytes: there are none.

## Accounting difference

The continuation baseline additionally contains the source-neutral PR #116
cycle-ledger repair:

- insertion shifts retain symbolic parameter `K`;
- cancellation checks use distinct `STOP_TEST`;
- regression test protects the separation.

PR #116 squash commit on the packed-tag base:

`2bbaebf3a1bd799d4b58a8a19bd8afe5c99f9af5`.

This repair changes no runtime source or source seals.

## Authority

Use `19b80c78...` as the parent for subsequent Phase-2 experiments.

When citing the performance qualification itself, cite fixed runtime source
`7b1cbf0d...` and its artifact.

The concurrent local packed-row source `c496f57...` remains separately
rejected. Do not merge their evidence.

PR #84 remains draft/open because its production official-hard promotion gate
is unresolved.

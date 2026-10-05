# C15 qualification before performance

Candidate parent a566296; exact candidate source is the commit containing this packet. No performance claim yet.

- 28 focused tests pass on the retained Node nightly and inline600/cumulative2400 flags. Covers batch visibility, queue full/drop/reuse, cursor rollover, compact/general identity, same-slot replacement, four concurrent producers, active/idle helper readiness, timeout cleanup, host/search regressions and affinity validation.
- Strengthened concurrent stress varies all key fields, including compact support/tail, with producer-dependent values; probes impossible hybrid identities during publication. Four producers, one publisher, concurrent reader, compact 7x6 and generic 7x5.
- `c15-independent.json`: 24 bounded physical-board minimax cases, all pass. Expected root WDL/optimal moves computed after four-worker async solver returns; five clean exits required. 4x4 plus compact7x6/general7x5. Test assertions are not runtime solving inputs.
- `c15-affinity-smoke/`: actual obtained CPUs 0/2/4/6 for four search workers and CPU12 efficiency-class0 helper; process mask4181. All ready before empty root construction; exact4x3 result and five clean exits.
- Separate read-only reviewer found no concrete protocol defect. Its two validation requests are addressed by the independent oracle packet and strengthened correlated-key stress. Dedicated helper-startup-failure injection remains outside this bounded packet; managed worker error handling is unchanged.
- Catalog verifies 298 sealed functions and 226 decomposed add-on units. Queue producer costs, helper publication costs, cold allocation and lifecycle are explicit. Existing cycle-model vocabulary is not a numerical i5 cycle prediction.

Primary experiment remains A no helper/mask85; B idle helper/mask4181; C active helper/mask4181. B and C allocate identical queues. Search policies,5GiB shared/1056MiB private per worker, runtime flags and sampling stay fixed. No hot statistics added. Delayed/dropped shared exact publications only lose reuse; local proof handling remains synchronous.

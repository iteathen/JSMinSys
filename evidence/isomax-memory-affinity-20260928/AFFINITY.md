# Optional worker placement experiment

This is cold initialization in JSMinSys, not a solver change. Node's optional
--import tools/worker-affinity-preload.mjs is inherited by existing file workers.
With JMS_WORKER_AFFINITY_FILE unset it performs only the cold gate. With it set,
it reads a prepared JSON target array, validates current core/efficiency/L2
relationships, calls SetThreadGroupAffinity once and checks GetThreadGroupAffinity
before the worker module/private-state initialization. JMS_WORKER_AFFINITY_REPORT
is a unique path prefix; four exclusive-create JSON reports preserve acceptance.
Main thread and reporting scheduling are unchanged. No per-node work is added.

Generic API: addons/worker-affinity.mjs. Windows x64 only; unsupported requests,
unknown topology, duplicate physical cores, E-class targets, unavailable APIs,
failed native binding or mismatched accepted mask fail closed. This experiment
requires heterogeneous efficiency classes; homogeneous machines need a separately
specified placement profile. No guarantee of L2 residency/exclusivity is made.

Owning contracts:
- Microsoft GetLogicalProcessorInformationEx / PROCESSOR_RELATIONSHIP /
  CACHE_RELATIONSHIP: variable record Size, x64 GROUP_AFFINITY, core EfficiencyClass.
- Microsoft SetThreadGroupAffinity / GetThreadGroupAffinity: thread mask semantics.
- Node --import worker inheritance, existing JSMinSys ManagedThreadSession execArgv.
- JSMinSys SPEC Draft0.2 and NEES COST_ACCOUNTING Draft0.5 at7650bef0.

Measured composition is fixed selected solver be7c2887 plus this optional cold
preload at its separately recorded commit. No generated search/worker changes.
Both placement arms share the same preload; a prior no-preload/default-off ABBA
control exposes initialization effects. Physical cycles bracket worker startup,
search and cleanup. Unresolved FFI/OS/IO/allocation costs remain symbolic, not0.

RED/GREEN controls cover numeric target domain, high-bit/group mapping, SMT
collisions, heterogeneous classes, insufficient cores and malformed records.
Actual native preflight on this host recorded masks1,4,16,64 for workers0..3,
matching four distinct P-cores, and exact WDL-1/move4 with32768private entries.
No OS permission-denial fault was artificially injected; native failures throw.

Source-neutral CPC accounting repair accompanies this infrastructure:11+3P+F
scratch arrays,20fields,executed terminal/delegation stores,nonterminal interval
reads/writes. Historical be7 sources/results are not rewritten. This corrects
specific inherited counts; no claim of exact Intel instruction totals is made.

# Initialization memory profiles

Owner-approved profiles:1/2/4/8GiB tested;16/32/64/128GiB experimental. Auto selects any fitting profile, including experimental, explicitly authorized. Status is scoped to the recorded evidence, not universal performance assurance. Private budget256MiB/worker, exact allocation derives from geometry, with2GiB minimum support/runtime reserve. Core count/pinning remains automatic; memory admission does not silently reduce workers.

Cold discovery uses os.freemem and process.availableMemory; Windows also queries available commit via GlobalMemoryStatusEx. Select against their minimum before TT allocation. The snapshot is not an OS reservation, and allocation failure remains an error with cleanup. No hot memory scanning or resizes.

Profile labels are shared-TT budgets. Standard7x6 native32 uses exact listed GiB. Other geometries select native widths and power-of-two capacities, reporting actual bytes (which may be below budget). Native banks limit each leaf's largest view index to2^31-1;32-byte128GiB uses32 banks of4GiB and all2^32 unsigned hash slots. Generic layouts choose smaller banks as necessary. Full-capacity16..128 allocation/performance remains experimental, while metadata plans and small bank tests cover addressing and supported dimensions.1..10x1..10 plans tested without giant allocation.

The promoted8GiB profile uses the already measured banked hot functions unchanged. Only cold generic sizing/attachment/selection was broadened; recursive workers, CPC/NDC, move ordering, private TT/proof protocol and original unbanked hot functions are unchanged. Catalog562units check passed. Source and scientific provenance remain separate from package distribution identities.

Discovery sources: https://nodejs.org/api/process.html#processavailablememory and https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex . Windows structure64 bytes and available-commit offset32 follow MEMORYSTATUSEX: https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/ns-sysinfoapi-memorystatusex .

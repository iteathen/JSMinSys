# Banked TT measurement disposition

Experimental source cbb039926cab14420df284facd3130b331d89074. The producer's packaged rc.3 runtime remains frozen at e6580e9; defaults, archive and package provenance were not changed.

Six pinned i5 P-core workers,256MiB private/worker, retained nightly/JIT profile. Native32 all tests. Packaged4GiB controls42.791/41.345s(mean42.068); unbanked candidate4GiB41.157s; banked4GiB43.386/42.627(mean43.007); banked8GiB42.151/39.822/41.398(mean41.124). EightGiB net mean improvement2.24% is smaller than sample variability; roughly4.07GiB additional peakRSS. Capacity improvement repays some addressing work, but repeatable performance promotion is unqualified. Candidate kept for experiments; no default/promotion change.

SixteenGiB admission refused before allocation/search: requires19.5GiB free physical and commit headroom, observed14.0GiB physical/11.5GiB commit. No negative performance conclusion. Its full-capacity correctness and ROI remain unqualified until resources permit.

Independent review caught malformed stats-plane aliasing (including clonedSAB handles); both failing regressions were repaired cold. Stats must use offset0 and a12-byte backing, preventing entry aliases. Bank topology itself is trusted factory topology/whole-object clone; JS object identity is not native backing authentication. No per-node reporting or allocation. All recursive worker bodies/original unbanked protocol functions unchanged. NEES554units check passed; source costs symbolic and bank indexing/call overhead openly charged.

Durable raw measurements, source identities, invocations, external memory snapshot, resource-censored attempts and summaries: https://github.com/iteathen/Connect4/tree/work/isomax-auto-workers-20261006/docs/qualification/20261006-large-shared-tt

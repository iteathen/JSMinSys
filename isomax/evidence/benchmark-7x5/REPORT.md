# 7x5 canonical-library qualification

Measured runtime: `8713baa11148a7723043d8c434ffb77343a96253`. Baseline: `98b51d3c118bf34878af0430b82174578f5a7011`.

Matched ABBA: previous 6.954s, corrected 6.167s; wall change -11.31%, process-cycle change -11.03% (positive means slower). Candidate range 6.094–6.240s. Peak RSS 7.348GiB.

Each run computed 4 local moves from empty, then one exact search at ply5; root WDL0, chosen column4. All controls, exact-result agreement, actual affinity0/2/4/6 and four-worker cleanup passed. No full self-play claim.

Four deep workers on the recorded i5-12600K/Node27 nightly; shared4GiB (67108864 entries ×64bytes), private832MiB per worker. Capacities match within both arms. Two samples per arm, descriptive ABBA screen on one host. No universal speed or minimum-cycle claim; compare within geometry only. Cold geometry preparation outside historical primary timer; solver initialization, structural phase, search and cleanup inside. No node counts.

Raw results, process cycles, per-worker timing and affinity reports are beside this file. Source and machine qualification is in ../isomax-library-geometry-20261002; typed-width storage retains exact keys and no per-node diagnostic counters.

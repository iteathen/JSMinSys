# C64P constant-time sorted rank, frozen before replay

Parent is B2 at b5ada10/443d88b. C64 binary was rejected after a fully optimized73.409s solve. This alternative removes its variable-length lookup without adding per-node construction. Old support compiler and old APIs stay unchanged.

A new geometry-owned cold compiler consumes only the complete immutable sorted support rows and sizes, recreates a membership bitmap and native per-word prefix count. For a surviving image id in a known child support row:

slot = prefix[rowWord] + popcount(membership[rowWord] & ~(0xffffffff << (id &31))).

The mask excludes the image bit; bit0 produces0 and bit31 produces0x7fffffff without a floating subtraction overflow. ID order equals basis slot order. The exact cofactor proves image membership; no heuristic membership/licensing replaces that invariant. RowWord=knownHandle*shapeWordCount+(id>>>5). All preparations use rules/support only, no owners, values, move labels or oracle.

Native prefix width selected once from maxBasis: <=255Uint8, <=65535Uint16, otherwiseUint32; bitmapUint32. All allocations before ready. Cold budget requires plan.workingBytes + extra retained arrays <= existing declared budget; infeasible plans keep the exact B2 view worker. A separate rank worker family is selected once at host initialization only when these arrays exist. No hot selector. Old generic/native/view workers remain unchanged. New geometry metadata shares all prior arrays; no second basis or closure allocation.

For actual7x6:823543profiles,20shape words,65883440membership bytes +16470860prefix bytes =82354300additional retained bytes. Retained plans rise856484748->938839048; conservative peak working922368188->1004722488, below existing1073741824budget. Entry counts and TT bytes unchanged. Report actual rank preparation/bytes/budget/worker selection in raw result, and preserve ABI source identity. This is an explicitly controlled rank-metadata memory experiment, not a replacement baseline memory setting. Primary still includes all position-specific root work, initialization excluded and separately recorded.

Generated rank cofactor family changes only inverse loader/slot lookup; no order/closure/terminal/gauge/cache/search/tactical change. Map+mirror scratch omits inverse. The popcount and selected rank lookup must inline in the actual4worker kernel with unchanged2400/9600 flags; source operation savings alone do not qualify. Fast physical100dimension and nested7x5/7x6 dense/prepared/span3 transitions, poisoned tails, reflection/lifetime/proxies, all bounded rows/IDwidths, bit31, exact budget and infeasible fallback tests before scalar replay. Preserve sealed formula holdouts. Fullsuite+independent4worker oracle+NEES/source gates precede full timing. If competitive repeat/match B2; otherwise restore all host/worker/ledger source changes to B2 and document this child rejection. No branch promotion or package modification.

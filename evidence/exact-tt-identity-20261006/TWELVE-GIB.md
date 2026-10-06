# Twelve GiB shared TT extension

Owner request: take the shared TT from6GiB to12GiB. Keep full24 identity,
private2^23entries/192MiB per worker, six discovered pinned P-cores, frozen
Node/V8/flags, tactics/windows/order and primary empty7x6 timing boundary.
Producer starting512e7a5; consumer startinge6099117, preflight39f1054a.

Memory preflight rejected before solver allocation:12GiB shared +1.125GiB
private +2GiB existing reserve =15.125GiB. The current commit headroom is
approximately10.6GiB. Do not change paging, kill unrelated apps, lower reserve
or force the solve to obtain a timing.

Prepare the existing bank-routing design for the exact partial key. Shared
capacity2^29 uses two banks of2^28entries, each6GiB. Within-bank native indices
remain below2^31. Bank selection uses existing high hash bits; each unchanged
24-byte row still stores hash>>>bankShift (including the redundant bank bit),
so low slot bits plus stored bits reconstruct the full32bit locator exactly.
Do not shorten the partial key again or change proof/sequence publication.

Bind banked/unbanked shared accessors once during worker initialization. Keep
private accessors unchanged. Preserve the single-bank and mixed hot paths.
Both bank buffers are allocated and page-warmed before READY. No counters,
resizing, allocator, timing or layout test enters recursion. Banked access pays
one bank-array lookup, unsigned shift and mask, explicitly charged in NEES.

Qualification: test first with tiny two/four-bank caches, same local slots in
different banks, all five proof tags, full32bit busy/wrap, clone/alias validation,
and host READY/cleanup. Run bounded independent physical oracle comparisons
with banked caches, keeping other geometries on the old exact fallback. Check
generators, all root tests, source identities and ledger; get read-only review.
No10x10 full solve. Then retry12GiB preflight. If still insufficient, record
RESOURCE_CENSORED with exact source/runtime/memory configuration, never a solve
time or performance conclusion. The requested performance test remains pending.

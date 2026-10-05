# Controlled missing-layout retest

The cold fixes returned EXACT +1/c4 in 161,315.7666 ms, versus 161,348.4393 ms before edits; whole-operation cycles fell from 2,260,128,649,492 to 2,254,317,855,979. This pair provides no measurable adverse performance signal, not a statistical speed claim.

The separate native-layout trial uses source `81ced48` and its unchanged-source descendants. A bound old-layout control is necessary because binding accessors once at initialization can change V8's generated call sites. That first control completed in 160,644.3627 ms and 2,247,547,872,942 cycles, with four clean exits. The 32-byte candidate has not yet returned its first full solve when this selection rule is recorded.

Trial order: bound40 control, native32, bound40 control, native32. Each is a fresh cold process, exact empty root without RLC, original Node/V8/hash/inline flags, shared 134,217,728 entries, private 33,554,432 entries each, four center/live/center/live deep workers, P-cores0/2/4/6, rootFrontier false and sharedSampleMask0. Only the shared layout changes. Native halves retain exact field values; no new packing/decoding, reporting, or layout dispatch is introduced inside recursion.

Retention rule: no correctness/lifecycle/collision regression; both native repeats improve wall and cycles against their immediately preceding controls; mean wall and whole-operation cycles each improve by at least1%. Otherwise retain old layout or mark the native layout unqualified. Two pairs remain bounded internal evidence, not statistical or universal assurance. Repeat or extend only if a new uncertainty requires it. The <=10s objective is separately judged and is not implied by layout retention.

If retained, automatic selection is restricted to qualified standard7×6 compact geometry. Other geometries keep the previous split layout by default. The explicit native generic implementation remains dimension-adaptive, but7×5 padded records grow56→64bytes; correctness checks do not qualify their performance. No general-board memory or speed claim.

Cold checks: selected-largest-view capacity rejects before any allocation; structured-cloned alias views rebuilt without copying; physical memory accounting counts backing once. Four-worker compact/direct, gray state, reflected canonical frames, exact semantic lanes, collision/concurrency/rollover, idle/active cancellation and one-shot controls pass. Resource/page initialization is outside primary solve time and remains included in whole-operation cycles. Shared/node reporting remains null.

Local full tests258/258; package source/extracted tests42/42 each; catalog298 sealed+244 add-on units. Historic Verify CI already failed at the stale legacy behavior-generator check on `5954a8c`, and still does on `fcfbd61`; unchanged unrelated legacy search/generator was not regenerated as a performance shortcut. Relevant center/uncounted generation checks pass. CI does not authorize performance retention.

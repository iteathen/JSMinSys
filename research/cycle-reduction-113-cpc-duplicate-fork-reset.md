# Cycle reduction 113 — duplicate fork-output reset removal

**Candidate:** `d5715f46060ef9d9e809ad2b1d9c011d144d9b94`
**Baseline:** `937ac408d0fb334ad015f01b7932ddc5626dc79b`
**Disposition:** rejected.

`evaluateConnect4CpcNonterminal32` already zeros precursor/preemption outputs before its private fork helper, so the candidate removed the helper's repeated three u32 stores.

Verify run `36080498720` passed. Search A/B run `36080495441` preserved identical production nodes/cofactors and CPC forced counts, but CPC-only aggregate warm median regressed 12.57% and elapsed regressed 15.01%. The second paired comparison was strongly adverse. The source/ledger/workflow are restored.

Do not assume fewer source-level stores improve V8 emitted code without measured evidence.
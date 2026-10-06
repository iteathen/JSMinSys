# Exact current-rank partial identity

Domain: actual nonterminal7x6 canonical RBA worker frames. Seven heights are
0..6. Rank equals their sum and metadata isrank<<2. Each owner's third word
contains at most five bits. All retained full coordinate words are exact.
This is not a generic arbitrary fourteen-word key API: inconsistent metadata or
poisoned high tails do not satisfy the candidate's explicit fast-input contract.
The retained worker ingress/cofactor/reflection paths preserve this contract.

For every mixer stepM(x)=imul(x xor(x>>>16),0x7feb352d) mod2^32,
the XOR-shift is self-inverse and the multiplier is odd, hence invertible modulo
2^32. Holding all input lanes except12 fixed makes the final locator a bijection
of lane12. Retained heights reconstruct rank/metadata; retained two five-bit
tails reconstruct lanes10/13. Thus retained fields plus full locator determine
the complete original frame. Same-slot low locator bits plus stored high bits
give that full locator exactly. No probabilistic fingerprint or lookup decoder.

partial24: seq32, partial locator plus proof3, packed heights21 plus tails10,
then original lanes8/9/11. Six native32bit words=24bytes. Original lane12 is
omitted. Proof occupies upper3bits of the partial-locator word: capacity>=8
ensures those bits are free. Full32bit sequence, busy ownership, CAS failure,
double-read coherence and zero-on-wrap miss remain unchanged. Private cache
uses the first word as its existing native proof tag instead of a sequence.

Testing: independent modular inverse reconstructs omitted lane on10000 valid
metadata/tail frames; exact forced same-index collision and concurrent two-key
writers; all five proof tags; disjoint offsets; sequence busy/wrap/clone; canonical
physical identities/reflection across100 dimensions with existing wider fallback.
Tests never derive or supply a solved outcome to a runtime worker.

16bytes cannot hold this full retained-coordinate scheme without another
compression fact. A separately frozen narrow domain can admit frames with only
one active word per owner (n<=32): omit lane11, retain lane8, while lanes9/10/12/13
are known zero. Heights, partial/proof, seq and lane8 then need four words.
Outside that domain16-byte-only tables must miss/skip publication, or use a
separate wider table. The whole-board49-bit encoding does not prove a cheap
canonical representative of the existing residual/gray-token quotient.

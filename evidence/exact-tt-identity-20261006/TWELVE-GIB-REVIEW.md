# Twelve GiB review

Read-only reviewer: review_exact_partial_tt. Runtime source6bc1dd0.
No edits, heavy tests or solver runs by the reviewer during measurements.

Runtime review found no correctness blocker: bank selection retains the entire
locator, including redundant bank bits; each row stays inside native signed
index bounds; proof tags and full32bit publication are unchanged. Attachment
and shared-accessor selection occur cold. Factory/whole-object-clone scope is
explicit and matches the existing bank contract.

One P2 accounting issue was fixed and independently confirmed at6bc1dd0:
charge the bank lookup as three field loads plus one array-reference load with
guards, one shift and one mask, then call the unchanged row accessor. The prior
four-field-read entry was not an accurate operation class.

Final evidence review found no material issue. It checked36.856563s versus
38.367944s means (3.9392% lower primary time),0.7366% lower whole-process CPU,
exact memory budgets/peak RSS, source attribution, expected-answer separation,
cleanup and qualification bounds. The single fresh one-bank reference and the
incomplete JIT diagnostic are separate from the repeated matched comparison.
External means are43.301s versus43.303s, both about43.3s; docs use that rounding.
It inspected recorded467/467 tests and26-case oracle output without rerunning.
No outstanding finding. Larger capacities/platforms and production promotion
remain unqualified by this bounded localhost packet.

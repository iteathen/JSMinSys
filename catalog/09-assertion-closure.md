# JSMinSys Assertion Closure Audit

Status: active experimental optimization campaign.

## Principle

At every execution point, treat every proposition already established by configuration,
authoritative evolving state, the current transition, or the execution path as an
available assertion.

Before computing or storing a value, ask:

1. Is the required fact already asserted?
2. Is it implied by existing assertions more cheaply than the current derivation?
3. Can the transition update it more cheaply than recomputing it from the new state?
4. Is it already encoded by representation position, range, ordering, identity, or lifetime?
5. If retained physically, does its saved derivation cost exceed its load/store/cache cost?

Derived facts are not automatically stored. The target is the smallest physical assertion
basis that cheaply implies the assertions demanded by the workload.

## Assertion sources

- Configuration: columns, rows, win length, cells, winning lines, incidence, reflection,
  action order, word widths, capacity/range bounds.
- Evolving authoritative state: support, residual coordinates, exact position identity,
  TT topology/evidence.
- Transition: selected action/cell, old/new support, changed incidence neighborhood,
  mover/rank change, retained child.
- Execution path: validated legal action, known nonterminal state, recursion-frame parent
  values, already-compared equality/range facts, manager/worker ownership.

## Active findings

| Assertion | Previous work | Assertion-qualified realization | Status |
| --- | --- | --- | --- |
| Winning geometry exists => singleton residual id equals physical cell id | allocate/load singletonByCell[] | use cell directly | implemented / qualification |
| Hot cofactor callers have valid column + nonterminal parent + legal move | cofactor repeats validity/full-column tests and callers handle impossible -1 | checked public ingress + known-legal hot kernel | implemented / qualification |
| Recursive CPC callers have nonterminal q | CPC reloads/tests terminal on every call | checked public ingress + nonterminal hot kernel | implemented / qualification |

## High-value investigation queue

- Basis payload versus support: basis is a deterministic projection of support and static
  winning geometry; determine whether storing the full basis per TT row is cheaper than
  reconstruction, compression, or a different carrier.
- Residual implication: shape ids are cardinality ordered and the complete subset relation
  is configuration-known; compare dense matrix and basis scans against sparse prepared
  supersets / transition-local propagation.
- Cell transition consequences: played cell fixes playable-mask changes, support delta,
  affected winning-line incidence, and reflection contribution; compare prepared/fused
  deltas against recurring lane/boundary derivation.
- Runtime type/range assertions: choose the narrowest safe stored representation from
  configured maxima (basis ids, indices, labels, counts) without adding recurring dispatch.
- CPC specialization assertions: frontier-response/projected-advisory modes are fixed at
  initialization; test whether selected evaluator variants delete recurring mode branches.
- TT/manager assertions: distinguish facts already encoded by row state, queue membership,
  ownership, generation and bucket position from separately maintained metadata.

## Admission rule

An assertion-derived optimization is retained only when correctness gates pass and the
governing workload shows lower total cost or a justified memory/cache reduction. A
derived fact may remain explicitly stored when recomputation is more expensive than
maintaining it.

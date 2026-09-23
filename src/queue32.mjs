export function queueEnqueue32(
  enqueue,
  sequence,
  values,
  mask,
  capacity,
  value,
) {
  const position = Atomics.add(enqueue, 0, 1);
  const slot = position & mask;
  let observed = Atomics.load(sequence, slot);
  while (observed !== position) {
    Atomics.wait(sequence, slot, observed);
    observed = Atomics.load(sequence, slot);
  }
  Atomics.store(values, slot, value);
  Atomics.store(sequence, slot, position + 1);
  Atomics.notify(sequence, slot, 1);
  return position;
}

export function queueDequeue32(
  dequeue,
  sequence,
  values,
  mask,
  capacity,
) {
  const position = Atomics.add(dequeue, 0, 1);
  const slot = position & mask;
  const ready = position + 1;
  let observed = Atomics.load(sequence, slot);
  while (observed !== ready) {
    Atomics.wait(sequence, slot, observed);
    observed = Atomics.load(sequence, slot);
  }
  const value = Atomics.load(values, slot);
  Atomics.store(sequence, slot, position + capacity);
  Atomics.notify(sequence, slot, 1);
  return value;
}

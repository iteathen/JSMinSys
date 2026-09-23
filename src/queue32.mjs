export function queueEnqueue32(
  enqueue,
  sequence,
  values,
  mask,
  value,
) {
  const position = Atomics.add(enqueue, 0, 1);
  const slot = position & mask;
  let observed = Atomics.load(sequence, slot);
  while (observed !== position) {
    Atomics.wait(sequence, slot, observed);
    observed = Atomics.load(sequence, slot);
  }
  values[slot] = value;
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
  const value = values[slot];
  Atomics.store(sequence, slot, position + capacity);
  Atomics.notify(sequence, slot, 1);
  return value;
}

export function queueTryEnqueue32(
  enqueue,
  sequence,
  values,
  mask,
  value,
) {
  while (true) {
    const position = Atomics.load(enqueue, 0);
    const slot = position & mask;
    const observed = Atomics.load(sequence, slot);
    const difference = (observed - position) | 0;
    if (difference === 0) {
      if (Atomics.compareExchange(enqueue, 0, position, position + 1) !== position) continue;
      values[slot] = value;
      Atomics.store(sequence, slot, position + 1);
      return true;
    }
    if (difference < 0) return false;
  }
}

export function queueTryDequeue32(
  dequeue,
  sequence,
  values,
  mask,
  capacity,
  out,
  outIndex,
) {
  while (true) {
    const position = Atomics.load(dequeue, 0);
    const slot = position & mask;
    const observed = Atomics.load(sequence, slot);
    const ready = position + 1;
    const difference = (observed - ready) | 0;
    if (difference === 0) {
      if (Atomics.compareExchange(dequeue, 0, position, ready) !== position) continue;
      out[outIndex] = values[slot];
      Atomics.store(sequence, slot, position + capacity);
      return true;
    }
    if (difference < 0) return false;
  }
}

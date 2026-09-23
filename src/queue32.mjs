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
    if (observed === position) {
      const ready = position + 1;
      if (Atomics.compareExchange(enqueue, 0, position, ready) !== position) continue;
      values[slot] = value;
      Atomics.store(sequence, slot, ready);
      return true;
    }
    const difference = (observed - position) | 0;
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
    if (observed === ready) {
      if (Atomics.compareExchange(dequeue, 0, position, ready) !== position) continue;
      out[outIndex] = values[slot];
      Atomics.store(sequence, slot, position + capacity);
      return true;
    }
    const difference = (observed - ready) | 0;
    if (difference < 0) return false;
  }
}

export function queueTryEnqueueOwnedPosition32(
  sequence,
  values,
  mask,
  position,
  value,
) {
  const slot = position & mask;
  const observed = Atomics.load(sequence, slot);
  if (observed !== position) return false;

  values[slot] = value;
  Atomics.store(sequence, slot, position + 1);
  return true;
}

export function queueTryDequeueOwnedPosition32(
  sequence,
  values,
  mask,
  capacity,
  position,
  out,
  outIndex,
) {
  const slot = position & mask;
  const ready = position + 1;
  const observed = Atomics.load(sequence, slot);
  if (observed !== ready) return false;

  out[outIndex] = values[slot];
  Atomics.store(sequence, slot, position + capacity);
  return true;
}

export function queueTryEnqueueOwnedNext32(
  sequence,
  values,
  mask,
  position,
  value,
) {
  const slot = position & mask;
  const observed = Atomics.load(sequence, slot);
  if (observed !== position) return position;

  const nextPosition = (position + 1) | 0;
  values[slot] = value;
  Atomics.store(sequence, slot, nextPosition);
  return nextPosition;
}

export function queueTryDequeueOwnedNext32(
  sequence,
  values,
  mask,
  capacity,
  position,
  out,
  outIndex,
) {
  const slot = position & mask;
  const nextPosition = (position + 1) | 0;
  const observed = Atomics.load(sequence, slot);
  if (observed !== nextPosition) return position;

  out[outIndex] = values[slot];
  Atomics.store(sequence, slot, position + capacity);
  return nextPosition;
}

export function queueEnqueueOwnedNext32(
  sequence,
  values,
  mask,
  position,
  value,
) {
  const slot = position & mask;
  let observed = Atomics.load(sequence, slot);
  while (observed !== position) {
    Atomics.wait(sequence, slot, observed);
    observed = Atomics.load(sequence, slot);
  }

  const nextPosition = (position + 1) | 0;
  values[slot] = value;
  Atomics.store(sequence, slot, nextPosition);
  Atomics.notify(sequence, slot, 1);
  return nextPosition;
}

export function queueDequeueOwnedNext32(
  sequence,
  values,
  mask,
  capacity,
  position,
  out,
  outIndex,
) {
  const slot = position & mask;
  const nextPosition = (position + 1) | 0;
  let observed = Atomics.load(sequence, slot);
  while (observed !== nextPosition) {
    Atomics.wait(sequence, slot, observed);
    observed = Atomics.load(sequence, slot);
  }

  out[outIndex] = values[slot];
  Atomics.store(sequence, slot, position + capacity);
  Atomics.notify(sequence, slot, 1);
  return nextPosition;
}


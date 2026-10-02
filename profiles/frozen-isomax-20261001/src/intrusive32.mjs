// Intrusive list operations are non-atomic. Caller must own/serialize the list.
// control stores head/tail/count at caller-selected indices. Membership and
// generation stamps are caller-owned fixed arrays.
export function intrusiveEnqueueTailStamped32(
  control,
  headIndex,
  tailIndex,
  countIndex,
  next,
  prev,
  member,
  ticketGeneration,
  generation,
  item,
) {
  const tail = control[tailIndex];
  prev[item] = tail;
  next[item] = -1;
  ticketGeneration[item] = generation[item];
  member[item] = 1;
  if (tail === -1) control[headIndex] = item;
  else next[tail] = item;
  control[tailIndex] = item;
  control[countIndex] += 1;
  return item;
}

export function intrusiveEnqueueOnceTailStamped32(
  control,
  headIndex,
  tailIndex,
  countIndex,
  next,
  prev,
  member,
  ticketGeneration,
  generation,
  item,
) {
  if (member[item]) return 0;
  const tail = control[tailIndex];
  prev[item] = tail;
  next[item] = -1;
  ticketGeneration[item] = generation[item];
  member[item] = 1;
  if (tail === -1) control[headIndex] = item;
  else next[tail] = item;
  control[tailIndex] = item;
  control[countIndex] += 1;
  return 1;
}

export function intrusiveRemove32(control, headIndex, tailIndex, countIndex, next, prev, member, item) {
  if (!member[item]) return 0;
  const before = prev[item];
  const after = next[item];
  if (before === -1) control[headIndex] = after;
  else next[before] = after;
  if (after === -1) control[tailIndex] = before;
  else prev[after] = before;
  next[item] = -1;
  prev[item] = -1;
  member[item] = 0;
  control[countIndex] -= 1;
  return 1;
}

export function intrusivePopHeadStamped32(control, headIndex, tailIndex, countIndex, next, prev, member) {
  const item = control[headIndex];
  if (item === -1) return -1;
  const after = next[item];
  control[headIndex] = after;
  if (after === -1) control[tailIndex] = -1;
  else prev[after] = -1;
  next[item] = -1;
  prev[item] = -1;
  member[item] = 0;
  control[countIndex] -= 1;
  return item;
}

export function intrusiveTicketValid32(ticketGeneration, generation, item) {
  return ticketGeneration[item] === generation[item];
}

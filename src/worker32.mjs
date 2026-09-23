// Generic worker-execution substrate. Domain policy and the outer loop remain
// application-owned. All list/topology mutation is externally serialized unless
// an individual function explicitly uses Atomics.

export function takeOwnedStampedWork32(
  control,
  headIndex,
  tailIndex,
  countIndex,
  next,
  prev,
  member,
  ticketGeneration,
  generation,
  refs,
  resolved,
  execution,
  queuedValue,
  freeValue,
  owner,
) {
  for (;;) {
    const item = control[headIndex];
    if (item === -1) return -1;
    if (ticketGeneration[item] !== generation[item] || execution[item] !== queuedValue) return -2;

    const after = next[item];
    control[headIndex] = after;
    if (after === -1) control[tailIndex] = -1;
    else prev[after] = -1;
    next[item] = -1;
    prev[item] = -1;
    member[item] = 0;
    control[countIndex] -= 1;

    if (refs[item] && !resolved[item]) {
      execution[item] = owner;
      return item;
    }
    execution[item] = freeValue;
  }
}

// Return -1 on ownership violation, 0 on retired/resolved work, 1 when usable.
export function validateOwnedWork32(refs, resolved, execution, item, owner) {
  if (execution[item] !== owner) return -1;
  return refs[item] && !resolved[item] ? 1 : 0;
}

export function releaseOwnedWork32(execution, item, owner, freeValue) {
  if (execution[item] !== owner) return 0;
  execution[item] = freeValue;
  return 1;
}

// Publish value before the resolved marker. External serialization/visibility
// owns any stronger synchronization requirement.
export function publishResolvedValue32(values, resolved, item, value) {
  values[item] = value;
  resolved[item] = 1;
  return item;
}

// Publish fixed-degree dependency rows from prepared caller-owned scratch.
// Each dependency carries id, generation, and three opaque scalar payload words.
export function publishDependencies7x32(
  childOut,
  generationOut,
  payload0Out,
  payload1Out,
  payload2Out,
  outOffset,
  childIn,
  generationIn,
  payload0In,
  payload1In,
  payload2In,
  inOffset,
  count,
) {
  for (let index = 0; index < count; index += 1) {
    const source = inOffset + index;
    const target = outOffset + index;
    childOut[target] = childIn[source];
    generationOut[target] = generationIn[source];
    payload0Out[target] = payload0In[source];
    payload1Out[target] = payload1In[source];
    payload2Out[target] = payload2In[source];
  }
  return count;
}

// Retain the first runnable dependency directly under caller serialization.
// Negative dependency ids are absent scalar-only edges.
export function retainFirstRunnableDependency7x32(
  execution,
  resolved,
  state,
  children,
  offset,
  count,
  owner,
  freeValue,
) {
  for (let index = 0; index < count; index += 1) {
    const child = children[offset + index];
    if (child >= 0 && execution[child] === freeValue && !resolved[child] && !state[child]) {
      execution[child] = owner;
      return child;
    }
  }
  return -1;
}

export function observeWake32(control, wakeIndex) {
  return Atomics.load(control, wakeIndex);
}

// Returns the prior wake counter. Notify count is caller-selected.
export function signalWake32(control, wakeIndex, notifyCount) {
  const previous = Atomics.add(control, wakeIndex, 1);
  Atomics.notify(control, wakeIndex, notifyCount);
  return previous;
}

// Caller must only park after establishing that no useful work is available.
// Timeout may be Infinity; blocking elapsed time is unbounded in that profile.
export function parkOnWake32(control, wakeIndex, observed, timeout) {
  Atomics.wait(control, wakeIndex, observed, timeout);
  return 0;
}

export function workerStopOrDone32(control, stopIndex, doneIndex) {
  return Atomics.load(control, stopIndex) || Atomics.load(control, doneIndex) ? 1 : 0;
}

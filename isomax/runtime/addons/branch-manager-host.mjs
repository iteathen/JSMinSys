import { Worker } from 'node:worker_threads';

// COLD HOST ADD-ON ONLY.
// This module is intentionally outside the JMS-RESTRICTED hot catalog. It owns
// Node worker lifecycle, timers, promises, rich host errors, and cleanup. Domain
// state initialization and result interpretation remain application-owned.

export function filterFileWorkerExecArgv32(execArgv) {
  let filtered;
  for (let i = 0; i < execArgv.length; i += 1) {
    const arg = execArgv[i];
    if (arg === '--input-type') {
      if (filtered === undefined) filtered = execArgv.slice(0, i);
      i += 1;
      continue;
    }
    if (arg.startsWith('--input-type=')) {
      if (filtered === undefined) filtered = execArgv.slice(0, i);
      continue;
    }
    if (filtered !== undefined) filtered.push(arg);
  }
  return filtered;
}

export function createMetricViews32(workerCount, metricWidth) {
  if (!Number.isInteger(workerCount) || workerCount < 0
      || !Number.isInteger(metricWidth) || metricWidth < 0) {
    throw new RangeError('invalid metric view dimensions');
  }
  const views=new Array(workerCount),bytes=metricWidth*8;
  for(let worker=0;worker<workerCount;worker+=1)
    views[worker]=new Float64Array(new SharedArrayBuffer(bytes));
  return views;
}

// Canonical managed worker-thread lifecycle role.
//
// Construction is cold/control-plane work. Instantiate before entering hot
// worker/manager loops, preferably during application initialization. Lifecycle
// method dispatch therefore stays outside the numeric hot execution paths.
export class ManagedThreadSession {
  constructor({
    control,
    stopIndex,
    doneIndex,
    errorIndex,
    wakeIndex,
    workerDiedCode,
    deadlineCode,
    cancelledCode,
    execArgv = process.execArgv,
  } = {}) {
    if (!(control instanceof Int32Array)
        || !Number.isInteger(stopIndex) || !Number.isInteger(doneIndex)
        || !Number.isInteger(errorIndex) || !Number.isInteger(wakeIndex)
        || !Number.isInteger(workerDiedCode) || !Number.isInteger(deadlineCode)
        || !Number.isInteger(cancelledCode)) {
      throw new TypeError('invalid managed thread session');
    }
    this.control=control;
    this.stopIndex=stopIndex;
    this.doneIndex=doneIndex;
    this.errorIndex=errorIndex;
    this.wakeIndex=wakeIndex;
    this.workerDiedCode=workerDiedCode;
    this.deadlineCode=deadlineCode;
    this.cancelledCode=cancelledCode;
    this.execArgv=filterFileWorkerExecArgv32(execArgv);
    this.threads=[];
    this.exits=[];
    this.errors=[];
    this.exited=0;
    this.finished=false;
    this.timer=null;
    this.poll=null;
    this.abortSignal=null;
    this.abortHandler=null;
  }

  fail(code){
    return failManagedThreadSession32(this,code);
  }

  spawn(fileURL,workerData){
    return spawnManagedFileWorker32(this,fileURL,workerData);
  }

  wait(options={}){
    return waitManagedThreadSession32(this,options);
  }

  close(){
    return closeManagedThreadSession32(this);
  }

  state(){
    return managedThreadSessionState32(this);
  }
}

export function createManagedThreadSession32(options={}) {
  return new ManagedThreadSession(options);
}

export function failManagedThreadSession32(session, code) {
  Atomics.compareExchange(session.control, session.errorIndex, 0, code);
  Atomics.store(session.control, session.stopIndex, 1);
  Atomics.add(session.control, session.wakeIndex, 1);
  Atomics.notify(session.control, session.wakeIndex);
  return 0;
}

export function spawnManagedFileWorker32(session, fileURL, workerData) {
  const options = { workerData };
  if (session.execArgv !== undefined) options.execArgv = session.execArgv;
  const worker = new Worker(fileURL, options);
  session.threads.push(worker);
  session.exits.push(new Promise((resolve) => {
    worker.once('error', (error) => {
      session.errors.push(error.stack ?? String(error));
      failManagedThreadSession32(session, session.workerDiedCode);
    });
    worker.once('exit', (code) => {
      session.exited += 1;
      if (!session.finished
          && !Atomics.load(session.control, session.stopIndex)
          && !Atomics.load(session.control, session.doneIndex)) {
        session.errors.push(`Unexpected worker exit ${code}`);
        failManagedThreadSession32(session, session.workerDiedCode);
      }
      resolve(code);
    });
  }));
  return worker;
}

export async function waitManagedThreadSession32(
  session,
  { timeoutMs, signal, pollMs = 2 } = {},
) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0
      || !Number.isFinite(pollMs) || pollMs <= 0) {
    throw new RangeError('invalid managed session wait');
  }

  const abort = () => failManagedThreadSession32(session, session.cancelledCode);
  session.abortSignal = signal ?? null;
  session.abortHandler = abort;

  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });

  try {
    await new Promise((resolve) => {
      session.timer = setTimeout(() => {
        failManagedThreadSession32(session, session.deadlineCode);
        resolve();
      }, timeoutMs);
      session.poll = setInterval(() => {
        if (Atomics.load(session.control, session.stopIndex)
            || Atomics.load(session.control, session.doneIndex)) resolve();
      }, pollMs);
    });
  } finally {
    clearTimeout(session.timer);
    clearInterval(session.poll);
    session.timer = null;
    session.poll = null;
    signal?.removeEventListener('abort', abort);
    session.abortSignal = null;
    session.abortHandler = null;
  }

  return Atomics.load(session.control, session.errorIndex);
}

export async function closeManagedThreadSession32(session) {
  session.finished = true;
  if (session.timer !== null) clearTimeout(session.timer);
  if (session.poll !== null) clearInterval(session.poll);
  session.abortSignal?.removeEventListener('abort', session.abortHandler);

  Atomics.store(session.control, session.stopIndex, 1);
  Atomics.add(session.control, session.wakeIndex, 1);
  Atomics.notify(session.control, session.wakeIndex);

  await Promise.allSettled(session.threads.map((worker) => worker.terminate()));
  await Promise.all(session.exits);
  return session.exited;
}

export function managedThreadSessionState32(session) {
  return {
    errorCode: Atomics.load(session.control, session.errorIndex),
    stopped: Atomics.load(session.control, session.stopIndex) !== 0,
    done: Atomics.load(session.control, session.doneIndex) !== 0,
    workerCount: session.threads.length,
    workersExited: session.exited,
    cleanup: session.exited === session.threads.length,
    errors: session.errors.slice(),
  };
}

export function sumMetricViews32(metricViews, metricWidth, out) {
  for (let index = 0; index < metricWidth; index += 1) out[index] = 0;
  for (let worker = 0; worker < metricViews.length; worker += 1) {
    const view = metricViews[worker];
    for (let index = 0; index < metricWidth; index += 1) out[index] += view[index];
  }
  return out;
}

export function sharedViewBytes32(record) {
  let bytes=0;
  for(const key in record){
    const value=record[key];
    if(ArrayBuffer.isView(value))bytes+=value.byteLength;
  }
  return bytes;
}

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ManagedThreadSession,
  createManagedThreadSession32,
} from '../addons/index.mjs';

function createSession(){
  const control=new Int32Array(new SharedArrayBuffer(8*4));
  return createManagedThreadSession32({
    control,
    stopIndex:0,
    doneIndex:1,
    errorIndex:2,
    wakeIndex:3,
    workerDiedCode:5,
    deadlineCode:6,
    cancelledCode:7,
    execArgv:['--trace-warnings'],
  });
}

test('ManagedThreadSession is the canonical managed host lifecycle object', async () => {
  const session=createSession();

  assert.equal(session instanceof ManagedThreadSession,true);
  assert.equal(typeof session.fail,'function');
  assert.equal(typeof session.spawn,'function');
  assert.equal(typeof session.wait,'function');
  assert.equal(typeof session.close,'function');
  assert.equal(typeof session.state,'function');

  assert.deepEqual(session.state(),{
    errorCode:0,
    stopped:false,
    done:false,
    workerCount:0,
    workersExited:0,
    cleanup:true,
    errors:[],
  });

  assert.equal(session.fail(7),0);
  assert.equal(Atomics.load(session.control,0),1);
  assert.equal(Atomics.load(session.control,2),7);
  assert.equal(await session.close(),0);
});

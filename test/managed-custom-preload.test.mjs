import test from 'node:test';
import assert from 'node:assert/strict';
import {createManagedThreadSession32} from '../addons/branch-manager-host.mjs';
test('managed session retains explicit worker preload arguments',()=>{
 const execArgv=['--import','node:fs'],session=createManagedThreadSession32({control:new Int32Array(new SharedArrayBuffer(16)),stopIndex:0,doneIndex:1,errorIndex:2,wakeIndex:3,workerDiedCode:101,deadlineCode:102,cancelledCode:103,execArgv});
 assert.deepEqual(session.execArgv,execArgv);
});

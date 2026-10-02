import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {evaluateConnect4RankLocalLanding32} from '../addons/connect4-rank-local-presearch.mjs';

const root=new URL('../',import.meta.url);
const archive=new URL('profiles/frozen-isomax-20261001/',root);
const lock=JSON.parse(readFileSync(new URL('profiles/isomax-current.json',root)));

test('historical IsoMax archive, configuration, and measured artifacts remain frozen',()=>{
  assert.deepEqual(lock.options,{
    workers:4,rootFrontier:true,sharedSampleMask:0,
    sharedCacheCapacity:134217728,localCacheCapacity:16777216,timeoutMs:600000,
  });
  for(const [path,expected] of Object.entries(lock.files)){
    const source=readFileSync(new URL(path,archive),'utf8').replace(/\r\n/g,'\n');
    const actual=createHash('sha256').update(source).digest('hex');
    assert.equal(actual,expected,`${path}: historical archive changed; preserve the frozen measured version`);
  }
  const record=JSON.parse(readFileSync(new URL(lock.evidenceDirectory+'/empty-structural-once-5g-576-20261001-samples.jsonl',root)));
  assert.deepEqual(record.config,lock.options);
  assert.equal(record.sourceSha,lock.solverSourceSha);
  assert.equal(record.structuralSourceSha,lock.structuralSourceSha);
  assert.equal(record.wallMs,lock.measured.wallMs);
  assert.equal(record.searchCalls,1);
});

test('frozen calculator computes its prefix and stops before the sixth move',()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
  const moves=[];
  let result;
  for(let rank=0;rank<=geometry.cellCount;rank++){
    result=evaluateConnect4RankLocalLanding32(moves,{geometry});
    if(result.status!=='CERTIFIED')break;
    moves.push(result.move);
  }
  assert.equal(moves.map(c=>c+1).join(''),'44444');
  assert.equal(result.status,'UNRESOLVED');
  assert.equal(result.reason,'UNIQUE_MAX_EXHAUSTS_COLUMN');
  const maximum=result.candidates.find(c=>c.column===result.uniqueParetoColumn);
  assert.deepEqual([maximum.moverLiveLines,maximum.opponentDeniedLines,maximum.headroom],[6,6,0]);
  assert.equal(evaluateConnect4RankLocalLanding32([3,0],{geometry}).move,3);
});

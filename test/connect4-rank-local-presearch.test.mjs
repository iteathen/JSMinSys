import test from 'node:test';
import assert from 'node:assert/strict';

import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {
  evaluateConnect4RankLocalLanding32,
  RANK_LOCAL_CERTIFIED,
  RANK_LOCAL_UNRESOLVED,
} from '../addons/connect4-rank-local-presearch.mjs';
import {runIsoMaxConnect4Move32} from '../addons/rba-connect4-move-selector.mjs';

const g=prepareConnect4RbaGeometry({columns:7,rows:6});

function cols(sequence){
  return Array.from(sequence,ch=>Number(ch)-1);
}

test('rank-local pre-search derives the first five center moves without an opening table',()=>{
  const prefixes=['','4','44','444','4444'];
  const expected=[
    {A:7,B:7,headroom:5},
    {A:9,B:10,headroom:4},
    {A:11,B:12,headroom:3},
    {A:10,B:11,headroom:2},
    {A:8,B:8,headroom:1},
  ];
  for(let i=0;i<prefixes.length;i+=1){
    const result=evaluateConnect4RankLocalLanding32(cols(prefixes[i]),{geometry:g});
    assert.equal(result.status,RANK_LOCAL_CERTIFIED,JSON.stringify(result));
    assert.equal(result.move,3,JSON.stringify(result));
    assert.equal(result.uniqueParetoColumn,3);
    const row=result.candidates.find(candidate=>candidate.column===3);
    assert.deepEqual(
      {A:row.moverLiveLines,B:row.opponentDeniedLines,headroom:row.headroom},
      expected[i],
    );
    assert.equal(row.dominatedBy.length,0);
  }
});

test('same rule explicitly refuses move six when the incidence maximum exhausts its column',()=>{
  const result=evaluateConnect4RankLocalLanding32(cols('44444'),{geometry:g});
  assert.equal(result.status,RANK_LOCAL_UNRESOLVED,JSON.stringify(result));
  assert.equal(result.move,-1);
  assert.equal(result.reason,'UNIQUE_MAX_EXHAUSTS_COLUMN');
  assert.equal(result.uniqueParetoColumn,3);
  const center=result.candidates.find(candidate=>candidate.column===3);
  assert.deepEqual(
    {A:center.moverLiveLines,B:center.opponentDeniedLines,headroom:center.headroom},
    {A:6,B:6,headroom:0},
  );
});

test('bad opponent move is recomputed from the actual 41 position',()=>{
  const result=evaluateConnect4RankLocalLanding32(cols('41'),{geometry:g});
  assert.equal(result.status,RANK_LOCAL_CERTIFIED,JSON.stringify(result));
  assert.equal(result.move,3);
  const center=result.candidates.find(candidate=>candidate.column===3);
  assert.deepEqual(
    {A:center.moverLiveLines,B:center.opponentDeniedLines,headroom:center.headroom},
    {A:10,B:9,headroom:4},
  );
  assert.equal(center.dominatedBy.length,0);
});

test('certificate is descriptive enough to reproduce every elimination',()=>{
  const result=evaluateConnect4RankLocalLanding32([],{geometry:g});
  assert.equal(result.status,RANK_LOCAL_CERTIFIED);
  assert.equal(result.candidates.length,7);
  for(const candidate of result.candidates){
    assert.equal(Number.isInteger(candidate.column),true);
    assert.equal(Number.isInteger(candidate.landingCell),true);
    assert.equal(Number.isInteger(candidate.landingRow),true);
    assert.equal(Number.isInteger(candidate.moverLiveLines),true);
    assert.equal(Number.isInteger(candidate.opponentDeniedLines),true);
    assert.equal(Number.isInteger(candidate.headroom),true);
    assert.ok(Array.isArray(candidate.moverLiveLineIds));
    assert.ok(Array.isArray(candidate.opponentLiveLineIds));
    assert.ok(Array.isArray(candidate.dominatedBy));
  }
  assert.deepEqual(result.premises,{
    descendantEnumeration:false,
    recursiveSearch:false,
    oracle:false,
    solvedValues:false,
    projection:false,
  });
});


test('IsoMax selector returns a certified local move before Lazy SMP starts',async()=>{
  const result=await runIsoMaxConnect4Move32(cols('41'),{geometry:g,workers:1});
  assert.equal(result.status,'RANK_LOCAL_MOVE',JSON.stringify(result));
  assert.equal(result.source,'RANK_LOCAL');
  assert.equal(result.searchStarted,false);
  assert.equal(result.move,3);
  assert.equal(result.workersUsed,0);
  // workers:1 would be rejected by Lazy SMP. Reaching this assertion therefore
  // also proves the wrapper returned before entering the search host.
  assert.equal(result.requestedWorkers,1);
});

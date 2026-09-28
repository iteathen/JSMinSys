import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';

const addons=await import('../addons/index.mjs');

test('live-line evaluator keeps only winning lines not blocked by the opponent',()=>{
  assert.equal(typeof addons.prepareConnect4LiveLineEvaluator32,'function');
  assert.equal(typeof addons.resetConnect4LiveLineState32,'function');
  assert.equal(typeof addons.advanceConnect4LiveLineState32,'function');
  assert.equal(typeof addons.evaluateConnect4LiveLineCell32,'function');
  assert.equal(typeof addons.evaluateConnect4LiveLine3x32,'function');

  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    profile=addons.prepareConnect4LiveLineEvaluator32(g);

  assert.equal(profile.lineCount,69);
  assert.equal(profile.wordCount,3);
  assert.equal(profile.stateWords,6);
  assert.ok(profile.maxScore instanceof Uint8Array);
  assert.equal(profile.maxScore.length,42);

  const stack=new Uint32Array(profile.stateWords*3);
  addons.resetConnect4LiveLineState32(profile,stack,0);

  const rootExpected=[3,4,5,7,5,4,3];
  for(let column=0;column<7;column+=1){
    const cell=column;
    const generic=addons.evaluateConnect4LiveLineCell32(profile,stack,0,0,cell);
    const specialized=addons.evaluateConnect4LiveLine3x32(
      profile.through,
      cell*3,
      stack,
      0,
    );
    assert.equal(generic,rootExpected[column],`root score column ${column}`);
    assert.equal(specialized,generic,`3-word score column ${column}`);
    assert.equal(profile.maxScore[cell],generic,`root max score column ${column}`);
  }

  // P0 occupies bottom-center cell 3. Every P1 line through cell 3 dies.
  addons.advanceConnect4LiveLineState32(profile,stack,0,0,3,stack,profile.stateWords);

  // The fused transition is also the root-replay path: same-frame in-place
  // mutation must produce exactly the same live-line state as a disjoint frame.
  const inPlace=new Uint32Array(profile.stateWords);
  addons.resetConnect4LiveLineState32(profile,inPlace,0);
  addons.advanceConnect4LiveLineState32(profile,inPlace,0,0,3,inPlace,0);
  assert.deepEqual(
    Array.from(inPlace),
    Array.from(stack.slice(profile.stateWords,profile.stateWords*2)),
  );
  const p1Expected=[2,2,2,0,2,2,2];
  for(let column=0;column<7;column+=1)
    assert.equal(
      addons.evaluateConnect4LiveLineCell32(profile,stack,profile.stateWords,1,column),
      p1Expected[column],
      `P1 score after P0 center, column ${column}`,
    );

  // P1 then occupies bottom cell 2. P0's line field loses exactly P1-blocked lines.
  addons.advanceConnect4LiveLineState32(
    profile,
    stack,
    profile.stateWords,
    1,
    2,
    stack,
    profile.stateWords*2,
  );
  assert.equal(
    addons.evaluateConnect4LiveLineCell32(profile,stack,profile.stateWords*2,0,4),
    3,
  );
});


test('static live-line incidence is an exact upper bound and lazy selection preserves stable eager order',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    profile=addons.prepareConnect4LiveLineEvaluator32(g),
    state=new Uint32Array(profile.stateWords);
  addons.resetConnect4LiveLineState32(profile,state,0);
  for(const [mover,cell] of [[0,3],[1,2],[0,10],[1,11]]){
    addons.advanceConnect4LiveLineState32(profile,state,0,mover,cell,state,0);
    for(let x=0;x<g.cellCount;x++){
      const score=addons.evaluateConnect4LiveLine3x32(profile.through,x*3,state,(mover^1)*3);
      assert.ok(score<=profile.maxScore[x],`upper bound cell ${x}`);
    }
  }
  const lazyOrder=(scores,bounds)=>{
    const actual=Array(scores.length).fill(null),used=Array(scores.length).fill(false),out=[];
    for(let selected=0;selected<scores.length;selected++){
      let best=-1,bestScore=-2147483648;
      for(let i=0;i<scores.length;i++){
        if(used[i])continue;
        let score=actual[i];
        if(score===null){
          if(bounds[i]<=bestScore)continue;
          score=scores[i];actual[i]=score;
        }
        if(score>bestScore){bestScore=score;best=i;}
      }
      used[best]=true;out.push(best);
    }
    return out;
  };
  const eagerOrder=scores=>scores.map((score,i)=>({score,i}))
    .sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.i);
  const cases=[
    [[7,5,4,3,2,1,0],[7,7,7,7,7,7,7]],
    [[3,3,2,3,1],[7,5,5,4,3]],
    [[0,2,1,2,2,0],[3,4,4,4,3,3]],
    [[5,1,4,0,3,2],[5,7,6,4,5,4]],
  ];
  for(const [scores,bounds] of cases){
    for(let i=0;i<scores.length;i++)assert.ok(scores[i]<=bounds[i]);
    assert.deepEqual(lazyOrder(scores,bounds),eagerOrder(scores));
  }
});

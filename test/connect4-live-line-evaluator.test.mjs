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
  }

  // P0 occupies bottom-center cell 3. Every P1 line through cell 3 dies.
  addons.advanceConnect4LiveLineState32(profile,stack,0,0,3,stack,profile.stateWords);
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

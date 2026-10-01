import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {
  prepareConnect4GuardSurvival32,
  loadConnect4GuardSurvivalRoot32,
  proveConnect4GuardSurvival32,
  diagnoseConnect4GuardSurvivalTrigger32,
} from '../addons/cpc-connect4-guard-survival.mjs';

const candidate6Moves=[3,3,3,3,3,0,4,5,5,5];
const candidate6OddDefenderMask=98305;

test('NEES guard survival kernel reproduces established candidate6 D15 certificate',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const root=connect4RbaFromMoves(candidate6Moves,{geometry:g,canonical:false});
  const ctx=prepareConnect4GuardSurvival32({geometry:g,memoCapacity:1<<20});
  loadConnect4GuardSurvivalRoot32(ctx,root.words,0,root.basis,0,root.basis.length);
  assert.equal(proveConnect4GuardSurvival32(ctx,15,candidate6OddDefenderMask),1);
});

test('guard survival kernel rejects non-standard geometry specialization',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  assert.throws(()=>prepareConnect4GuardSurvival32({geometry:g,memoCapacity:16}),/standard 7x6/);
});


test('D15 trigger diagnostic agrees that every legal root trigger has a closing response',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const root=connect4RbaFromMoves(candidate6Moves,{geometry:g,canonical:false});
  const ctx=prepareConnect4GuardSurvival32({geometry:g,memoCapacity:1<<20});
  loadConnect4GuardSurvivalRoot32(ctx,root.words,0,root.basis,0,root.basis.length);
  const out=new Uint32Array(18);
  for(let c=0;c<7;c++){
    if(root.words[c]>=6)continue;
    diagnoseConnect4GuardSurvivalTrigger32(ctx,15,candidate6OddDefenderMask,c,out,0);
    const triggerTerminal=out[2];
    if(triggerTerminal)continue;
    const mask=out[0];
    assert.notEqual(mask,0,'expected at least one licensed response for trigger '+(c+1));
    let closed=false;
    for(let r=0;r<7;r++)if((mask&(1<<r))&&out[4+r]===1){closed=true;break;}
    assert.equal(closed,true,'expected diagnostic closure for trigger '+(c+1));
  }
});

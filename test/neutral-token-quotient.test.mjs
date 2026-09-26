import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';

function boardKey(board,heights,ply){
  let s=String(ply)+':';
  for(let c=0;c<heights.length;c++)s+=heights[c]+',';
  s+=':';
  for(let i=0;i<board.length;i++)s+=board[i]<0?'_':String(board[i]);
  return s;
}

function neutralKey(g,board,heights){
  const relevant=new Uint8Array(g.cellCount);
  for(let line=0;line<g.lineCount;line++){
    let p0=1,p1=1;
    const base=line*4;
    for(let i=0;i<4;i++){
      const cell=g.lineRow[base+i]*g.columns+g.lineColumn[base+i];
      const owner=board[cell];
      if(owner===1)p0=0;
      else if(owner===0)p1=0;
    }
    if(p0||p1)for(let i=0;i<4;i++){
      const cell=g.lineRow[base+i]*g.columns+g.lineColumn[base+i];
      relevant[cell]=1;
    }
  }
  let s='';
  for(let c=0;c<g.columns;c++)s+=heights[c]+',';
  s+=':';
  for(let cell=0;cell<g.cellCount;cell++){
    const owner=board[cell];
    if(owner<0)continue;
    if(relevant[cell])s+=cell+':'+owner+';';
  }
  return s;
}

function qKey(root){
  return Array.from(root.words).join(',');
}

function terminalAfterMove(g,board,cell,player){
  for(let line=0;line<g.lineCount;line++){
    const base=line*4;
    let contains=0,all=1;
    for(let i=0;i<4;i++){
      const candidate=g.lineRow[base+i]*g.columns+g.lineColumn[base+i];
      if(candidate===cell)contains=1;
      if(board[candidate]!==player)all=0;
    }
    if(contains&&all)return 1;
  }
  return 0;
}

test('audit neutral-token quotient against current RBA q on exhaustive 4x4 legal states',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const board=new Int8Array(g.cellCount);board.fill(-1);
  const heights=new Uint8Array(g.columns);
  const moves=[];
  const visited=new Set();
  const neutralToQ=new Map(),qToNeutral=new Map(),qToPhysical=new Map();
  let states=0,neutralMultiQ=0,qMultiNeutral=0,physicalCollapsedByQ=0,nonterminalCollapsedByQ=0,witness=null,nonterminalWitness=null;

  function add(map,key,value){
    let set=map.get(key);
    if(!set){set=new Set();map.set(key,set);}
    set.add(value);
    return set;
  }

  function visit(ply,isTerminal=0){
    const physical=boardKey(board,heights,ply);
    if(visited.has(physical))return;
    visited.add(physical);states+=1;

    const neutral=neutralKey(g,board,heights);
    const root=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
    const q=qKey(root),terminal=root.words[g.metaOffset]&3;
    const nq=add(neutralToQ,neutral,q);
    const qn=add(qToNeutral,q,neutral);
    const qp=add(qToPhysical,q,physical);
    if(nq.size===2)neutralMultiQ+=1;
    if(qn.size===2)qMultiNeutral+=1;
    if(qp.size===2){
      physicalCollapsedByQ+=1;
      if(!witness)witness={q,neutral,physical:[...qp]};
      if(!terminal){
        nonterminalCollapsedByQ+=1;
        if(!nonterminalWitness)nonterminalWitness={q,neutral,physical:[...qp]};
      }
    }

    if(isTerminal)return;
    const player=ply&1;
    for(let column=0;column<g.columns;column++){
      const row=heights[column];
      if(row>=g.rows)continue;
      const cell=row*g.columns+column;
      board[cell]=player;heights[column]=row+1;moves.push(column);
      const terminal=terminalAfterMove(g,board,cell,player);
      visit(ply+1,terminal);
      moves.pop();heights[column]=row;board[cell]=-1;
    }
  }

  visit(0);

  let maxQPerNeutral=0,maxNeutralPerQ=0,maxPhysicalPerQ=0;
  for(const set of neutralToQ.values())if(set.size>maxQPerNeutral)maxQPerNeutral=set.size;
  for(const set of qToNeutral.values())if(set.size>maxNeutralPerQ)maxNeutralPerQ=set.size;
  for(const set of qToPhysical.values())if(set.size>maxPhysicalPerQ)maxPhysicalPerQ=set.size;

  const result={
    states,
    neutralClasses:neutralToQ.size,
    rbaQClasses:qToNeutral.size,
    neutralMultiQ,
    qMultiNeutral,
    physicalCollapsedByQ,
    nonterminalCollapsedByQ,
    maxQPerNeutral,
    maxNeutralPerQ,
    maxPhysicalPerQ,
    witness,
    nonterminalWitness,
  };
  console.log('NEUTRAL_QUOTIENT_AUDIT '+JSON.stringify(result));

  assert.ok(states>1000);
  assert.equal(neutralMultiQ,0,'neutral-token equivalent boards split across RBA q');
  assert.equal(maxQPerNeutral,1,'neutral-token equivalent boards failed to collapse');
  assert.ok(qToNeutral.size<neutralToQ.size,'RBA q did not improve on neutral-token quotient');
  assert.ok(qMultiNeutral>0,'RBA q did not collapse beyond neutral-token board identity');
  assert.ok(nonterminalCollapsedByQ>0,'RBA q collapse occurred only after terminal play');
});

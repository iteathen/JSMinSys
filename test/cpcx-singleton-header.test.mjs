import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4CpcxPairHub32} from '../addons/connect4-cpcx-pair-hub.mjs';
import {connect4RbaForcedResponseColumn,connect4RbaExposesOpponentWin} from '../addons/rba-connect4-coordinate.mjs';

test('singleton tactical header has distinct native mask words and frame lifetimes',()=>{
  const columns=33,rows=3,g={columns,rows,cellCount:99,coordWords:1,p0Offset:34,p1Offset:35,
    pairShapeStart:99,tripleShapeStart:99,shapeCells:new Uint32Array(396),
    cellColumn:Uint32Array.from({length:99},(_,i)=>i%columns),cellRow:Uint32Array.from({length:99},(_,i)=>Math.floor(i/columns))},
    p=prepareConnect4CpcxPairHub32(g),words=new Uint32Array(36),basis=Uint32Array.of(32,33,65);
  assert.equal(typeof p.collect,'function');assert.equal(p.forbiddenWords,2);words[35]=0xffffffff;
  assert.equal(p.collect(words,0,basis,0,3,0,0),32);
  assert.deepEqual(Array.from(p.forbidden.subarray(0,2)),[1,1],'columns0 and32 must not alias');
  assert.equal(p.collect(words,0,basis,0,0,0,2),-1);
  assert.deepEqual(Array.from(p.forbidden.subarray(0,4)),[1,1,0,0],'child frame reset leaves parent intact');
  words[35]=0;
  assert.equal(p.collect(words,0,basis,0,3,0,0),-1);
  assert.deepEqual(Array.from(p.forbidden.subarray(0,2)),[0,0],'same frame clears previous hazards');
  words[35]=3;basis.set([0,32,65]);
  assert.equal(p.collect(words,0,basis,0,3,0,0),-2,'two exact frontier demands retain dual-threat loss');
});

test('singleton tactical header equals current exact C01 C05 predicates on admitted dimensions',()=>{
  let seed=533271,checked=0,flags=0,forced=0;
  const random=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
  // No tactical outcome replay on3x6 or5x3 formula holdouts.
  for(let W=1;W<=10;W++)for(let H=1;H<=10;H++){
    if(W===3&&H===6||W===5&&H===3)continue;
    const g=prepareConnect4RbaGeometry({columns:W,rows:H}),p=prepareConnect4CpcxPairHub32(g);
    assert.equal(typeof p.collect,'function');
    for(let trial=0;trial<6;trial++){
      const moves=[],heights=new Uint32Array(W);
      for(let rank=0;rank<W*H;rank++){
        const q=connect4RbaFromMoves(moves,{geometry:g}),mover=rank&1;
        if(q.words[g.metaOffset]&3)break;
        const words=new Uint32Array(g.keyWords+3),basis=new Uint32Array(q.basis.length+2).fill(0xffffffff);
        words.set(q.words,1);basis.set(q.basis,1);
        const row=p.forbiddenWords*2,n=q.basis.length,aw=(n+31)>>>5,opp=1+(mover?g.p0Offset:g.p1Offset);
        if(aw&&(n&31))words[opp+aw-1]|=0xffffffff<<(n&31);
        const actual=p.collect(words,1,basis,1,n,mover,row),expected=connect4RbaForcedResponseColumn(g,words,1,basis,1,n,mover);
        assert.equal(actual,expected);if(actual>=0)forced++;
        // Dual-threat caller returns immediately; its partial mask is unused.
        if(actual!==-2)for(let c=0;c<W;c++)if(words[1+c]<H){
          const flag=Boolean(p.forbidden[row+(c>>>5)]&(1<<(c&31))),
            old=Boolean(connect4RbaExposesOpponentWin(g,words,1,basis,1,n,mover,c,words[1+c]));
          assert.equal(flag,old);if(flag)flags++;
        }
        checked++;
        const legal=[];for(let c=0;c<W;c++)if(heights[c]<H)legal.push(c);
        const c=legal[random(legal.length)];heights[c]++;moves.push(c);
      }
    }
  }
  assert.ok(checked>1000);assert.ok(flags>0);assert.ok(forced>0);
  console.log(JSON.stringify({kind:'cpcx-singleton-header-predicate-agreement',checked,flags,forced,seed}));
});

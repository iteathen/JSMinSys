import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {connect4RbaImmediateWinningColumn,connect4RbaForcedResponseColumn} from '../addons/rba-connect4-coordinate.mjs';

test('RBA immediate winning column matches physical rules across dimensions and frames',()=>{
  let seed=74219,checked=0,winning=0;
  const random=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
  for(const [columns,rows] of [[7,6],[7,5],[4,4],[3,3]]){
    const geometry=prepareConnect4RbaGeometry({columns,rows});
    for(let game=0;game<40;game++){
      const cells=new Int8Array(columns*rows).fill(-1),heights=new Uint32Array(columns),moves=[];
      function wins(c,r,p){
        for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
          let count=1;
          for(const sign of [-1,1])for(let k=1;k<4;k++){
            const x=c+sign*k*dx,y=r+sign*k*dy;
            if(x<0||x>=columns||y<0||y>=rows||cells[y*columns+x]!==p)break;
            count++;
          }
          if(count>=4)return true;
        }
        return false;
      }
      while(moves.length<cells.length){
        const mover=moves.length&1,legal=[],expected=[],opponentThreats=[];
        for(let c=0;c<columns;c++)if(heights[c]<rows){
          legal.push(c);const r=heights[c];cells[r*columns+c]=mover;
          if(wins(c,r,mover))expected.push(c);
          cells[r*columns+c]=mover^1;
          if(wins(c,r,mover^1))opponentThreats.push(c);
          cells[r*columns+c]=-1;
        }
        const q=connect4RbaFromMoves(moves,{geometry,positionCode:false}),offset=5,bi=3;
        const words=new Uint32Array(offset+geometry.keyWords),basis=new Uint32Array(bi+q.basis.length);
        words.set(q.words,offset);basis.set(q.basis,bi);
        const column=connect4RbaImmediateWinningColumn(geometry,words,offset,basis,bi,q.basis.length,mover);
        if(expected.length){
          assert.ok(column>=0);winning++;
          const physical=q.reflected?columns-1-column:column;
          assert.ok(expected.includes(physical),JSON.stringify({columns,rows,moves,expected,physical}));
        }else assert.equal(column,-1);
        assert.deepEqual(words.subarray(offset),q.words);
        assert.deepEqual(basis.subarray(bi),q.basis);
        if(!expected.length){
          const forced=connect4RbaForcedResponseColumn(geometry,words,offset,basis,bi,q.basis.length,mover);
          if(opponentThreats.length>1)assert.equal(forced,-2);
          else if(opponentThreats.length===1)assert.equal(q.reflected?columns-1-forced:forced,opponentThreats[0]);
          else assert.equal(forced,-1);
        }
        checked++;
        const c=legal[random(legal.length)],r=heights[c]++;
        cells[r*columns+c]=mover;moves.push(c);
        if(wins(c,r,mover))break;
      }
    }
  }
  assert.ok(checked>1000);
  assert.ok(winning>0);
});

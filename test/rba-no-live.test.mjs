import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import * as coordinate from '../addons/rba-connect4-coordinate.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('empty residual channels match independent physical live-line existence',()=>{
  assert.equal(typeof coordinate.connect4RbaNoLiveResiduals,'function');
  let seed=184129,checked=0,dead=0;
  const random=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
  for(const [W,H] of [[7,6],[7,5],[4,4],[3,3],[1,4]]){
    const geometry=prepareConnect4RbaGeometry({columns:W,rows:H});
    for(let game=0;game<60;game++){
      const cells=new Int8Array(W*H).fill(-1),heights=new Uint32Array(W),moves=[];
      while(moves.length<W*H){
        let alive=false,terminal=false;
        for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
          const ex=x+3*dx,ey=y+3*dy;if(ex<0||ex>=W||ey<0||ey>=H)continue;
          let zero=0,one=0;
          for(let k=0;k<4;k++){const p=cells[(y+k*dy)*W+x+k*dx];if(p===0)zero++;if(p===1)one++;}
          if(zero===4||one===4)terminal=true;
          if(!zero||!one)alive=true;
        }
        if(terminal)break;
        const q=connect4RbaFromMoves(moves,{geometry,positionCode:false}),offset=5;
        const words=new Uint32Array(offset+geometry.keyWords+2).fill(0xdeadbeef);words.set(q.words,offset);
        const before=words.slice();
        assert.equal(coordinate.connect4RbaNoLiveResiduals(geometry,words,offset),alive?0:1);
        assert.deepEqual(words,before);checked++;if(!alive)dead++;
        const legal=[];for(let c=0;c<W;c++)if(heights[c]<H)legal.push(c);
        const c=legal[random(legal.length)];cells[heights[c]++*W+c]=moves.length&1;moves.push(c);
      }
    }
  }
  assert.ok(checked>2000);assert.ok(dead>0);
});

test('no-line geometry returns exact draw and a legal root witness with four workers',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:3,rows:3});
  const result=await runLazySmpConnect4Rba32([],{geometry,workers:4,workerMode:'minimal',sharedCacheCapacity:1024,localCacheCapacity:1024,timeoutMs:3000});
  assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);
  assert.ok(result.move>=0&&result.move<3);assert.equal(result.cleanup,true);assert.equal(result.workersExited,4);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import * as tt from '../experiments/isomax-lean/shared-cache.mjs';
import * as reference from '../addons/rba-connect4-shared-exact-cache.mjs';

test('standard shared TT occupies exactly 32 bytes per slot without shortening sequence counter',()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
  const cache=tt.createConnect4RbaSharedExactCache32({capacity:16,keyWords:geometry.keyWords,geometry});
  assert.equal(cache.entries.buffer.byteLength,16*32);
  const root=connect4RbaFromMoves([3,3,3],{geometry});
  Atomics.store(cache.entries,0,0xfffffffe);
  tt.storeConnect4RbaSharedExactCache32(cache,root.words,0,3,0);
  assert.equal(Atomics.load(cache.entries,0),0); // unchanged full-width rollover
  assert.equal(tt.probeConnect4RbaSharedExactCache32(cache,root.words,0,0),0);
  tt.storeConnect4RbaSharedExactCache32(cache,root.words,0,3,0);
  assert.equal(tt.probeConnect4RbaSharedExactCache32(cache,root.words,0,0),3);
});

test('initialization chooses exact accessors for multiple widths and heights',()=>{
  assert.equal(typeof tt.prepareSharedCacheAccess,'function');
  for(const [columns,rows] of [[7,6],[4,4],[8,6],[4,8],[1,256]]){
    const geometry=prepareConnect4RbaGeometry({columns,rows});
    const cache=tt.createConnect4RbaSharedExactCache32({capacity:2,keyWords:geometry.keyWords,geometry});
    const old=reference.createConnect4RbaSharedExactCache32({capacity:2,keyWords:geometry.keyWords,geometry});
    const {probe,store}=tt.prepareSharedCacheAccess(cache);
    const words=new Uint32Array(geometry.keyWords+6),offset=3;
    // Field-domain differential: includes maximum heights, all coordinate bits,
    // nonzero source offsets, collisions, and each exact value.
    let seed=16379;
    for(let sample=0;sample<300;sample++){
      for(let c=0;c<columns;c++)words[offset+c]=sample===0?rows:(sample+c)%(rows+1);
      words[offset+geometry.metaOffset]=(words.slice(offset,offset+columns).reduce((a,b)=>a+b,0)<<2)|(sample&3);
      for(let w=geometry.p0Offset;w<geometry.keyWords;w++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;words[offset+w]=seed;
      }
      if(columns===7&&rows===6){words[offset+10]&=31;words[offset+13]&=31;}
      const hash=sample&3,value=sample%3+1;
      assert.equal(probe(cache,words,offset,hash),reference.probeConnect4RbaSharedExactCache32(old,words,offset,hash));
      store(cache,words,offset,value,hash);reference.storeConnect4RbaSharedExactCache32(old,words,offset,value,hash);
      assert.equal(probe(cache,words,offset,hash),value);
      // Low/high used bits of each coordinate word reject a colliding key.
      for(let w=geometry.p0Offset;w<geometry.keyWords;w++){
        const high=columns===7&&rows===6&&(w===10||w===13)?4:31;
        for(const bit of [0,high]){
          const mask=1<<bit;words[offset+w]^=mask;
          assert.equal(probe(cache,words,offset,hash),0);words[offset+w]^=mask;
        }
      }
      for(let c=0;c<columns;c++){
        const prior=words[offset+c];words[offset+c]=(prior+1)%(rows+1);
        assert.equal(probe(cache,words,offset,hash),0);words[offset+c]=prior;
      }
    }
  }
});

test('native height width transitions preserve maximum height and last coordinate',()=>{
  for(const [rows,bytes] of [[255,1],[256,2],[65535,2],[65536,4]]){
    // Exact one-column k4 geometry layout facts. No enormous shape tables are
    // needed to exercise the TT boundary; this is not a large-board solve test.
    const coordWords=Math.ceil((rows-3)/32),geometry={columns:1,rows,
      lineCount:rows-3,coordWords,metaOffset:1,p0Offset:2,p1Offset:2+coordWords,keyWords:2+2*coordWords};
    const cache=tt.createConnect4RbaSharedExactCache32({capacity:2,keyWords:geometry.keyWords,geometry});
    const {probe,store}=tt.prepareSharedCacheAccess(cache),words=new Uint32Array(geometry.keyWords);
    assert.equal(cache.heights.BYTES_PER_ELEMENT,bytes);
    words[0]=rows;words[1]=(rows<<2)|2;words[words.length-1]=0xffffffff;
    store(cache,words,0,2,1);assert.equal(probe(cache,words,0,1),2);
    words[0]=0;assert.equal(probe(cache,words,0,1),0);
    words[0]=rows;words[words.length-1]=0x7fffffff;assert.equal(probe(cache,words,0,1),0);
  }
});

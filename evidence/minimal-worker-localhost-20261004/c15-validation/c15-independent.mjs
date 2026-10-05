// Correctness-only physical-board minimax. Expected W/D/L is computed AFTER
// the cold four-worker solver returns; no expected answer enters worker input.
import {writeFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-lazy-smp-host.mjs';
let seed=197279;function rand(n){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;}
function board(W,H){
  const cells=Array(W*H).fill(-1),heights=Array(W).fill(0);let rank=0;
  return {cells,heights,get rank(){return rank;},push(c){cells[heights[c]++*W+c]=(rank++)&1;},pop(c){cells[--heights[c]*W+c]=-1;rank--;},scan(){
    let live=0,winner=-1;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
      const ex=x+3*dx,ey=y+3*dy;if(ex<0||ex>=W||ey<0||ey>=H)continue;
      let a=0,b=0;for(let k=0;k<4;k++){const p=cells[(y+k*dy)*W+x+k*dx];if(p===0)a++;if(p===1)b++;}
      if(!b)live|=1;if(!a)live|=2;if(a===4)winner=0;if(b===4)winner=1;
    }
    return {live,winner,terminal:winner>=0||rank===W*H};
  }};
}
const records=[];
for(const [W,H,trials] of [[4,4,16],[7,5,4],[7,6,4]]){
  const geometry=prepareConnect4RbaGeometry({columns:W,rows:H});
  for(let trial=0;trial<trials;trial++){
    const target=W===4?4+(trial%7):W*H-10;let b,moves;
    for(let attempt=0;attempt<1000;attempt++){
      b=board(W,H);moves=[];
      while(moves.length<target){
        const legal=[];for(let c=0;c<W;c++)if(b.heights[c]<H){b.push(c);const t=b.scan().terminal;b.pop(c);if(!t)legal.push(c);}
        if(!legal.length)break;const c=legal[rand(legal.length)];b.push(c);moves.push(c);
      }
      if(moves.length===target)break;
    }
    if(moves.length!==target)throw Error('fixture generation failed');
    const liveOwners=b.scan().live;
    const actual=await runLazySmpConnect4Rba32(moves,{geometry,workers:4,workerMode:'minimal',publicationMode:'async',publicationCapacity:64,publicationBatch:2,sharedCacheCapacity:65536,localCacheCapacity:65536,timeoutMs:10000});
    const memo=new Map();let visits=0;
    function exact(){
      visits++;const t=b.scan();if(t.terminal)return t.winner<0?0:t.winner===(b.rank&1)?1:-1;
      const key=b.cells.join(',');if(memo.has(key))return memo.get(key);
      let best=-2;for(let c=0;c<W;c++)if(b.heights[c]<H){b.push(c);const v=-exact();b.pop(c);if(v>best)best=v;if(best===1)break;}
      memo.set(key,best);return best;
    }
    const expected=exact(),bestMoves=[];
    for(let c=0;c<W;c++)if(b.heights[c]<H){b.push(c);const v=-exact();b.pop(c);if(v===expected)bestMoves.push(c);}
    const expectedAbsolute=expected*((b.rank&1)?-1:1),pass=actual.status==='EXACT'&&actual.rootWdl===expectedAbsolute&&bestMoves.includes(actual.move)&&actual.cleanup&&actual.workersExited===5;
    const row={geometry:[W,H],sequence:moves.map(c=>c+1).join(''),liveOwners,expectedAbsolute,bestMoves,oracleVisits:visits,actual,pass};records.push(row);console.log(JSON.stringify({case:records.length,geometry:[W,H],liveOwners,visits,pass}));
    if(!pass)throw Error(JSON.stringify(row));
  }
}
writeFileSync(new URL('./c15-independent.json',import.meta.url),JSON.stringify({kind:'correctness-only-post-return-physical-minimax',seed:197279,records},null,2));


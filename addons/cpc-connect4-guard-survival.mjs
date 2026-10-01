import {connect4RbaCofactorKnownHeight} from './rba-connect4-coordinate.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {isCompactProfile8} from './rba-connect4-shared-exact-cache.mjs';
import {
  prepareConnect4RbaProofMemo32,
  mixConnect4RbaProofMemoKey32,
  probeConnect4RbaProofMemo32,
  storeConnect4RbaProofMemo32,
} from './rba-connect4-proof-memo.mjs';

const COLUMNS=7,ROWS=6,CELLS=42,FRAMES=43,NONE=7;

// COLD standard-7x6 specialization. Generic RBA remains available separately.
export function prepareConnect4GuardSurvival32({geometry,memoCapacity=4194304}={}){
  if(!geometry||!isCompactProfile8(geometry,geometry.keyWords))
    throw new RangeError('guard survival requires standard 7x6 compact RBA profile');
  const g=geometry,frameWords=FRAMES*g.keyWords,frameBasis=FRAMES*g.maxBasis,
    profile=prepareConnect4RbaExecutionProfile(g),
    subsetPrepared=new Uint32Array(g.shapeCount);
  if(profile.subsetMode!==1)throw new RangeError('guard survival requires dense prepared subset profile');
  for(let id=0;id<g.shapeCount;id+=1)subsetPrepared[id]=profile.prepareSubset(g,id);
  return {
    g,
    profile,
    subsetPrepared,
    memo:prepareConnect4RbaProofMemo32({capacity:memoCapacity,keyWords:g.keyWords,geometry:g}),
    words:new Uint32Array(frameWords),
    basis:new Uint32Array(frameBasis),
    basisSize:new Uint32Array(FRAMES),
    seen:new Uint32Array(g.shapeWordCount),
    minimal:new Uint32Array(FRAMES*g.maxBasis),
    minimalCount:new Uint32Array(FRAMES),
    critical:new Uint32Array(g.maxBasis),
    needs:new Uint32Array(4),
    partner:new Uint32Array(COLUMNS),
    pairLength:new Uint32Array(COLUMNS),
  };
}

// COLD root import. No board reconstruction exists below this boundary.
export function loadConnect4GuardSurvivalRoot32(ctx,words,offset,basis,basisOffset,basisSize){
  const g=ctx.g,dst=ctx.words,outBasis=ctx.basis;
  for(let i=0;i<g.keyWords;i+=1)dst[i]=words[offset+i];
  for(let i=0;i<basisSize;i+=1)outBasis[i]=basis[basisOffset+i];
  ctx.basisSize[0]=basisSize;
  return basisSize;
}

function cofactorFrame32(ctx,sourceFrame,targetFrame,column){
  const g=ctx.g,
    src=sourceFrame*g.keyWords,dst=targetFrame*g.keyWords,
    bi=sourceFrame*g.maxBasis,ci=targetFrame*g.maxBasis,
    n=ctx.basisSize[sourceFrame],
    height=ctx.words[src+column];
  return connect4RbaCofactorKnownHeight(
    g,ctx.profile,ctx.words,src,ctx.basis,bi,n,column,height,
    ctx.words,dst,ctx.basis,ci,ctx.seen,ctx.basisSize,targetFrame
  );
}

function fillMinimal32(ctx,frame,player){
  const g=ctx.g,words=ctx.words,basis=ctx.basis,
    off=frame*g.keyWords,bi=frame*g.maxBasis,n=ctx.basisSize[frame],
    coord=off+(player?g.p1Offset:g.p0Offset),
    outBase=frame*g.maxBasis;
  let count=0;
  for(let i=0;i<n;i+=1){
    if(!(words[coord+(i>>>5)]&(1<<(i&31))))continue;
    const id=basis[bi+i],size=g.shapeSize[id];
    let minimal=1;
    for(let j=0;j<n;j+=1){
      const other=basis[bi+j],otherSize=g.shapeSize[other];
      if(otherSize>=size)break;
      if((words[coord+(j>>>5)]&(1<<(j&31)))&&
         g.subsetTable[ctx.subsetPrepared[other]+id]){
        minimal=0;break;
      }
    }
    if(minimal)ctx.minimal[outBase+count++]=id;
  }
  ctx.minimalCount[frame]=count;
  return count;
}

function shapeHasCell32(g,id,cell){
  const n=g.shapeSize[id],base=id*4;
  for(let i=0;i<n;i+=1)if(g.shapeCells[base+i]===cell)return 1;
  return 0;
}

function earliestAttacker32(ctx,frame,id){
  const g=ctx.g,words=ctx.words,off=frame*g.keyWords,
    size=g.shapeSize[id],base=id*4,needs=ctx.needs,
    rank=words[off+g.metaOffset]>>>2,remaining=CELLS-rank;
  for(let i=0;i<size;i+=1){
    const cell=g.shapeCells[base+i],c=g.cellColumn[cell],r=g.cellRow[cell],
      need=r-words[off+c]+1;
    if(need<=0)return 0;
    let j=i;
    while(j>0&&needs[j-1]>need){needs[j]=needs[j-1];j-=1;}
    needs[j]=need;
  }
  let slot=1;
  for(let i=0;i<size;i+=1){
    const need=needs[i];
    while(slot<need)slot+=2;
    if(slot>remaining)return 0;
    slot+=2;
  }
  return slot-2;
}

function pooledNoWin32(ctx,frame,minimalCount){
  const g=ctx.g,words=ctx.words,off=frame*g.keyWords,minBase=frame*g.maxBasis;
  let poolCount=0;
  for(let c=0;c<COLUMNS;c+=1){
    const rem=ROWS-words[off+c];
    if(rem&&(rem&1))poolCount+=1;
  }
  if(poolCount&1)return 0;
  for(let i=0;i<minimalCount;i+=1){
    const id=ctx.minimal[minBase+i],size=g.shapeSize[id],base=id*4;
    let covered=0;
    for(let j=0;j<size;j+=1){
      const cell=g.shapeCells[base+j],c=g.cellColumn[cell],r=g.cellRow[cell],
        h=words[off+c],rem=ROWS-h,start=h+(rem&1),firstResponse=start+1;
      if(r>=firstResponse&&((r-firstResponse)&1)===0){covered=1;break;}
    }
    if(!covered)return 0;
  }
  return 1;
}

function shapeCoveredByTemplate32(ctx,frame,id){
  const g=ctx.g,words=ctx.words,off=frame*g.keyWords,
    size=g.shapeSize[id],base=id*4,partner=ctx.partner,length=ctx.pairLength;
  for(let i=0;i<size;i+=1){
    const cell=g.shapeCells[base+i],c=g.cellColumn[cell],r=g.cellRow[cell],
      h=words[off+c],p=partner[c],L=p<NONE?length[c]:0,
      firstVertical=h+L+1;
    if(r>=firstVertical&&((r-firstVertical)&1)===0)return 1;
    if(p<NONE){
      const j=r-h;
      if(j>=0&&j<L){
        const mate=(words[off+p]+j)*COLUMNS+p;
        for(let k=0;k<size;k+=1)if(g.shapeCells[base+k]===mate)return 1;
      }
    }
  }
  return 0;
}

function templateCoversCritical32(ctx,frame,criticalCount){
  for(let i=0;i<criticalCount;i+=1)
    if(!shapeCoveredByTemplate32(ctx,frame,ctx.critical[i]))return 0;
  return 1;
}

function firstColumnBit32(mask){
  for(let c=0;c<COLUMNS;c+=1)if(mask&(1<<c))return c;
  return NONE;
}

function templateCoverSearch32(ctx,frame,oddMask,evenMask,criticalCount){
  const words=ctx.words,off=frame*ctx.g.keyWords,partner=ctx.partner,length=ctx.pairLength;
  if(oddMask){
    const a=firstColumnBit32(oddMask),rest=oddMask&~(1<<a),remA=ROWS-words[off+a];
    for(let b=a+1;b<COLUMNS;b+=1)if(rest&(1<<b)){
      const next=rest&~(1<<b),remB=ROWS-words[off+b],max=remA<remB?remA:remB;
      partner[a]=b;partner[b]=a;
      for(let L=1;L<=max;L+=2){
        length[a]=L;length[b]=L;
        if(templateCoverSearch32(ctx,frame,next,evenMask,criticalCount))return 1;
      }
    }
    return 0;
  }
  if(evenMask){
    const a=firstColumnBit32(evenMask),rest=evenMask&~(1<<a),remA=ROWS-words[off+a];
    partner[a]=NONE;length[a]=0;
    if(templateCoverSearch32(ctx,frame,0,rest,criticalCount))return 1;
    for(let b=a+1;b<COLUMNS;b+=1)if(rest&(1<<b)){
      const next=rest&~(1<<b),remB=ROWS-words[off+b],max=remA<remB?remA:remB;
      partner[a]=b;partner[b]=a;
      for(let L=2;L<=max;L+=2){
        length[a]=L;length[b]=L;
        if(templateCoverSearch32(ctx,frame,0,next,criticalCount))return 1;
      }
    }
    return 0;
  }
  return templateCoversCritical32(ctx,frame,criticalCount);
}

function baseSafe32(ctx,frame,D,minimalCount){
  const minBase=frame*ctx.g.maxBasis;
  let criticalCount=0,oddMask=0,evenMask=0,oddCount=0;
  for(let i=0;i<minimalCount;i+=1){
    const id=ctx.minimal[minBase+i],deadline=earliestAttacker32(ctx,frame,id);
    if(deadline&&deadline<=D)ctx.critical[criticalCount++]=id;
  }
  if(!criticalCount)return 1;
  const off=frame*ctx.g.keyWords;
  for(let c=0;c<COLUMNS;c+=1){
    const rem=ROWS-ctx.words[off+c];
    if(!rem)continue;
    if(rem&1){oddMask|=1<<c;oddCount+=1;}
    else evenMask|=1<<c;
  }
  if(oddCount&1)return 0;
  return templateCoverSearch32(ctx,frame,oddMask,evenMask,criticalCount);
}

function synchronizedResponseMask32(ctx,frame,column){
  const off=frame*ctx.g.keyWords,words=ctx.words;
  let oddMask=0,evenMask=0,oddCount=0;
  for(let c=0;c<COLUMNS;c+=1){
    const rem=ROWS-words[off+c];
    if(!rem)continue;
    if(rem&1){oddMask|=1<<c;oddCount+=1;}
    else evenMask|=1<<c;
  }
  if(oddCount&1)return 0;
  return ((ROWS-words[off+column])&1)
    ?oddMask&~(1<<column)
    :evenMask;
}

function adaptiveResponseMask32(ctx,frame,column){
  const g=ctx.g,words=ctx.words,off=frame*g.keyWords,
    frontier=words[off+column]*COLUMNS+column,
    minBase=frame*g.maxBasis,minCount=ctx.minimalCount[frame];
  let mask=synchronizedResponseMask32(ctx,frame,column);
  for(let i=0;i<minCount;i+=1){
    const id=ctx.minimal[minBase+i],size=g.shapeSize[id],base=id*4;
    if(!shapeHasCell32(g,id,frontier))continue;
    for(let j=0;j<size;j+=1){
      const mate=g.shapeCells[base+j];
      if(mate===frontier)continue;
      const rc=g.cellColumn[mate],rr=g.cellRow[mate];
      if(rc!==column&&words[off+rc]===rr)mask|=1<<rc;
    }
  }
  for(let i=0;i<minCount;i+=1){
    const midId=ctx.minimal[minBase+i];
    if(g.shapeSize[midId]!==3||!shapeHasCell32(g,midId,frontier))continue;
    const mb=midId*4;
    let up0=0xffffffff,up1=0xffffffff;
    for(let j=0;j<3;j+=1){
      const cell=g.shapeCells[mb+j];
      if(cell===frontier)continue;
      if(up0===0xffffffff)up0=cell;else up1=cell;
    }
    const c0=g.cellColumn[up0],c1=g.cellColumn[up1];
    if(c0===c1||c0===column||c1===column)continue;
    const r0=g.cellRow[up0],r1=g.cellRow[up1];
    if(r0<2||r1<2)continue;
    const want0=(r0-2)*COLUMNS+c0,want1=(r1-2)*COLUMNS+c1;
    if(words[off+c0]!==r0-2||words[off+c1]!==r1-2)continue;
    for(let j=0;j<minCount;j+=1){
      const lowId=ctx.minimal[minBase+j];
      if(g.shapeSize[lowId]!==2)continue;
      if(shapeHasCell32(g,lowId,want0)&&shapeHasCell32(g,lowId,want1)){
        mask|=(1<<c0)|(1<<c1);break;
      }
    }
  }
  return mask>>>0;
}

function minimalContainsCell32(ctx,frame,cell){
  const g=ctx.g,base=frame*g.maxBasis,count=ctx.minimalCount[frame];
  for(let i=0;i<count;i+=1)if(shapeHasCell32(g,ctx.minimal[base+i],cell))return 1;
  return 0;
}

function guardColumnMask32(ctx,frame,oddMask){
  const off=frame*ctx.g.keyWords,words=ctx.words;
  let guards=0;
  for(let c=0;c<COLUMNS;c+=1){
    const h=words[off+c];
    if(h<1||h>5||!(h&1))continue;
    const count=(h+1)>>>1,required=((1<<count)-1)<<(c*3);
    if((oddMask&required)===required)guards|=1<<c;
  }
  return guards>>>0;
}

function maskMove32(mask,column,row,defenderMove){
  if(row&1)return mask>>>0;
  const bit=1<<(column*3+(row>>>1));
  return defenderMove?((mask|bit)>>>0):((mask&~bit)>>>0);
}

function maskAfterPair32(ctx,frame,mask,attackerColumn,responseColumn){
  const off=frame*ctx.g.keyWords,words=ctx.words,attackerRow=words[off+attackerColumn];
  let next=maskMove32(mask,attackerColumn,attackerRow,0);
  const responseRow=responseColumn===attackerColumn
    ?attackerRow+1
    :words[off+responseColumn];
  next=maskMove32(next,responseColumn,responseRow,1);
  return next>>>0;
}

function noImmediateAttackerWin32(ctx,frame,attacker){
  const g=ctx.g,off=frame*g.keyWords,attackerTerminal=attacker?1:3;
  for(let c=0;c<COLUMNS;c+=1){
    if(ctx.words[off+c]>=ROWS)continue;
    const term=cofactorFrame32(ctx,frame,frame+1,c);
    if(term===attackerTerminal)return 0;
  }
  return 1;
}

function searchGuardSurvival32(ctx,frame,attacker,D,oddMask){
  if(D<=0)return 1;
  if(D===1)return noImmediateAttackerWin32(ctx,frame,attacker)?1:2;

  const g=ctx.g,words=ctx.words,off=frame*g.keyWords,
    hash=mixConnect4RbaProofMemoKey32(words,off,g.keyWords,oddMask,D),
    memoCode=probeConnect4RbaProofMemo32(ctx.memo,words,off,oddMask,D,hash);
  if(memoCode)return memoCode;

  const minCount=fillMinimal32(ctx,frame,attacker);
  if(pooledNoWin32(ctx,frame,minCount)){
    storeConnect4RbaProofMemo32(ctx.memo,words,off,oddMask,D,hash,1);return 1;
  }
  if(baseSafe32(ctx,frame,D,minCount)){
    storeConnect4RbaProofMemo32(ctx.memo,words,off,oddMask,D,hash,1);return 1;
  }

  const guardColumns=guardColumnMask32(ctx,frame,oddMask),
    attackerTerminal=attacker?1:3;
  for(let c=0;c<COLUMNS;c+=1){
    if(words[off+c]>=ROWS)continue;
    const term=cofactorFrame32(ctx,frame,frame+1,c);
    if(term===attackerTerminal){
      const code=c+2;
      storeConnect4RbaProofMemo32(ctx.memo,words,off,oddMask,D,hash,code);return code;
    }
    if(term)continue;

    let candidates=adaptiveResponseMask32(ctx,frame,c);
    if((guardColumns&(1<<c))&&words[off+c]<5)candidates|=1<<c;

    const childOff=(frame+1)*g.keyWords;
    fillMinimal32(ctx,frame+1,attacker);
    if(words[childOff+c]<ROWS){
      const released=words[childOff+c]*COLUMNS+c;
      if(minimalContainsCell32(ctx,frame+1,released))candidates|=1<<c;
    }else{
      for(let rcol=0;rcol<COLUMNS;rcol+=1){
        if(rcol===c||words[childOff+rcol]>=ROWS)continue;
        if(!(guardColumns&~(1<<c)&~(1<<rcol)))continue;
        const responseCell=words[childOff+rcol]*COLUMNS+rcol;
        if(minimalContainsCell32(ctx,frame+1,responseCell))candidates|=1<<rcol;
      }
    }

    let found=0;
    for(let rcol=0;rcol<COLUMNS;rcol+=1)if(candidates&(1<<rcol)){
      const responseTerm=cofactorFrame32(ctx,frame+1,frame+2,rcol);
      if(responseTerm){found=1;break;}
      const nextMask=maskAfterPair32(ctx,frame,oddMask,c,rcol),
        child=searchGuardSurvival32(ctx,frame+2,attacker,D-2,nextMask);
      if(child===1){found=1;break;}
    }
    if(!found){
      const code=c+2;
      storeConnect4RbaProofMemo32(ctx.memo,words,off,oddMask,D,hash,code);return code;
    }
  }

  storeConnect4RbaProofMemo32(ctx.memo,words,off,oddMask,D,hash,1);
  return 1;
}

// E3 entry over an already-ingressed exact RBA root. Return 1=survival proved;
// 2..8 encode first unclosed attacker trigger column 1..7.
export function proveConnect4GuardSurvival32(ctx,horizon,oddDefenderMask){
  const g=ctx.g,meta=ctx.words[g.metaOffset],terminal=meta&3;
  if(terminal)return terminal===2?1:2;
  const attacker=(meta>>>2)&1;
  return searchGuardSurvival32(ctx,0,attacker,horizon,oddDefenderMask>>>0);
}

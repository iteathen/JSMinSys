import {prepareConnect4RbaCoordinateScratch} from './rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {connect4RbaBasisFromSupport,connect4RbaCofactorKnownHeight,connect4RbaCanonicalize,connect4RbaTerminal,connect4RbaRank} from './rba-connect4-coordinate.mjs';

// COLD INGRESS ONLY: encode the external root once; workers never import this module.

function positionCodeEmpty64(g,outLo,outHi,index){
  if(!g.positionMode){outLo[index]=0;outHi[index]=0;return 0;}
  outLo[index]=g.positionEmptyLo;outHi[index]=g.positionEmptyHi;return 1;
}

function advancePositionCode64(g,lo,hi,column,height,player,outLo,outHi,index){
  const bit=g.positionBitBase[column]+height+player;
  if(bit<32){
    const delta=(1<<bit)>>>0,next=(lo+delta)>>>0;
    outLo[index]=next;outHi[index]=(hi+(next<lo?1:0))>>>0;
  }else{
    outLo[index]=lo>>>0;outHi[index]=(hi+((1<<(bit-32))>>>0))>>>0;
  }
}

function extractLane64(lo,hi,bit,width,mask){
  if(bit>=32)return (hi>>>(bit-32))&mask;
  if(bit+width<=32)return (lo>>>bit)&mask;
  return ((lo>>>bit)|(hi<<(32-bit)))&mask;
}

function reflectPositionCode64(g,lo,hi,outLo,outHi,index){
  if(!g.positionMode){outLo[index]=0;outHi[index]=0;return 0;}
  if(g.positionMode===49){
    const l0=lo&127,l1=(lo>>>7)&127,l2=(lo>>>14)&127,l3=(lo>>>21)&127,
      l4=((lo>>>28)|(hi<<4))&127,l5=(hi>>>3)&127,l6=(hi>>>10)&127;
    outLo[index]=(l6|(l5<<7)|(l4<<14)|(l3<<21)|(l2<<28))>>>0;
    outHi[index]=((l2>>>4)|(l1<<3)|(l0<<10))>>>0;
    return 1;
  }
  const stride=g.positionStride,mask=(1<<stride)-1;
  let reflectedLo=0,reflectedHi=0;
  for(let c=0;c<g.columns;c+=1){
    const source=g.mirrorColumn[c],lane=extractLane64(lo,hi,g.positionBitBase[source],stride,mask),
      bit=g.positionBitBase[c];
    if(bit>=32)reflectedHi|=(lane<<(bit-32))>>>0;
    else{
      reflectedLo|=(lane<<bit)>>>0;
      if(bit+stride>32)reflectedHi|=lane>>>(32-bit);
    }
  }
  outLo[index]=reflectedLo>>>0;outHi[index]=reflectedHi>>>0;return 1;
}

export function connect4PositionCode64FromMoves(moves,{geometry,reflected=0}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  const g=geometry,heights=new Uint32Array(g.columns),
    loOut=new Uint32Array(1),hiOut=new Uint32Array(1);
  if(!positionCodeEmpty64(g,loOut,hiOut,0))return {lo:0,hi:0};
  let lo=loOut[0],hi=hiOut[0],rank=0;
  for(const column of moves){
    if(!Number.isInteger(column)||column<0||column>=g.columns||heights[column]>=g.rows)
      throw new RangeError('invalid position-code move');
    advancePositionCode64(g,lo,hi,column,heights[column],rank&1,loOut,hiOut,0);
    lo=loOut[0];hi=hiOut[0];heights[column]+=1;rank+=1;
  }
  if(reflected){reflectPositionCode64(g,lo,hi,loOut,hiOut,0);lo=loOut[0];hi=hiOut[0];}
  return {lo,hi};
}

export function connect4RbaFromMoves(moves,{geometry,canonical=true,positionCode=true}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  const g=geometry,profile=prepareConnect4RbaExecutionProfile(g),words=new Uint32Array(g.keyWords*2),basis=new Uint32Array(g.maxBasis*2),scratch=prepareConnect4RbaCoordinateScratch(g),
    moveHistory=new Uint32Array(moves.length);
  let src=0,dst=g.keyWords,bi=0,ci=g.maxBasis,moveIndex=0;
  let n=connect4RbaBasisFromSupport(g,words,src,basis,bi,scratch.seen);
  for(let p=0;p<2;p+=1){const off=src+(p?g.p1Offset:g.p0Offset);for(let i=0;i<n;i+=1)words[off+(i>>>5)]|=1<<(i&31);}
  for(const column of moves){
    if(!Number.isInteger(column)||column<0||column>=g.columns)throw new RangeError('invalid column');
    moveHistory[moveIndex++]=column;
    if(connect4RbaTerminal(g,words,src))throw new RangeError('move after terminal');
    const height=words[src+column];if(height>=g.rows)throw new RangeError('column full');
    connect4RbaCofactorKnownHeight(g,profile,words,src,basis,bi,n,column,height,words,dst,basis,ci,scratch.seen,scratch.size,0,scratch.map,scratch.inverse);
    const oldSrc=src;src=dst;dst=oldSrc;const oldBi=bi;bi=ci;ci=oldBi;n=scratch.size[0];
  }
  const result=words.slice(src,src+g.keyWords),rootBasis=basis.slice(bi,bi+n);
  const reflected=canonical?connect4RbaCanonicalize(g,profile,result,0,rootBasis,0,n,scratch):0;
  let positionLo=0,positionHi=0;
  if(positionCode){
    const position=connect4PositionCode64FromMoves(moves,{geometry:g,reflected});
    positionLo=position.lo;positionHi=position.hi;
  }
  return {words:result,basis:rootBasis,reflected,positionLo,positionHi,moveHistory};
}

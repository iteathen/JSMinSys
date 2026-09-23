import {permuteBits3x32Into,permuteBitsSpan32Into} from '../src/basis32.mjs';
import {insertMinimal6x32InPlace,productJoinMinimal6x32Into,insertMinimalSpan32InPlace,productJoinMinimalSpan32Into} from '../src/relational32.mjs';
import {connect4RbaRemoveCell,connect4RbaShapeSubset} from './rba-connect4-geometry.mjs';

function removeDense(g,id,cell){return g.removeByCell[cell*g.shapeCount+id];}
function removeSparse(g,id,cell){return connect4RbaRemoveCell(g,id,cell);}
function subsetDense(g,a,b){return g.subsetTable[a*g.shapeCount+b];}
function subsetSparse(g,a,b){return connect4RbaShapeSubset(g,a,b);}
function prepareSubsetDense(g,a){return a*g.shapeCount;}
function prepareSubsetSparse(g,a){return a;}
function subsetDensePrepared(g,row,b){return g.subsetTable[row+b];}
function subsetSparsePrepared(g,a,b){return connect4RbaShapeSubset(g,a,b);}

function permute3(out,outOffset,outWordCount,source,sourceOffset,map,mapOffset,count){
  return permuteBits3x32Into(out,outOffset,source,sourceOffset,map,mapOffset,count);
}
function permuteSpan(out,outOffset,outWordCount,source,sourceOffset,map,mapOffset,count){
  return permuteBitsSpan32Into(out,outOffset,outWordCount,source,sourceOffset,map,mapOffset,count);
}
function permutePair3(out,p0Out,p1Out,outWordCount,source,p0Source,p1Source,map,mapOffset,count){
  out[p0Out]=0;out[p0Out+1]=0;out[p0Out+2]=0;
  out[p1Out]=0;out[p1Out+1]=0;out[p1Out+2]=0;
  for(let index=0;index<count;index+=1){
    const sourceWord=index>>>5,sourceMask=1<<(index&31),target=map[mapOffset+index],
      targetWord=target>>>5,targetMask=1<<(target&31);
    if(source[p0Source+sourceWord]&sourceMask)out[p0Out+targetWord]|=targetMask;
    if(source[p1Source+sourceWord]&sourceMask)out[p1Out+targetWord]|=targetMask;
  }
  return p0Out;
}
function permutePairSpan(out,p0Out,p1Out,outWordCount,source,p0Source,p1Source,map,mapOffset,count){
  for(let word=0;word<outWordCount;word+=1){out[p0Out+word]=0;out[p1Out+word]=0;}
  for(let index=0;index<count;index+=1){
    const sourceWord=index>>>5,sourceMask=1<<(index&31),target=map[mapOffset+index],
      targetWord=target>>>5,targetMask=1<<(target&31);
    if(source[p0Source+sourceWord]&sourceMask)out[p0Out+targetWord]|=targetMask;
    if(source[p1Source+sourceWord]&sourceMask)out[p1Out+targetWord]|=targetMask;
  }
  return p0Out;
}
function insert6(words,base,length,capacity,recordWords,candidate,candidateOffset){
  return insertMinimal6x32InPlace(words,base,length,capacity,candidate,candidateOffset);
}
function insertSpan(words,base,length,capacity,recordWords,candidate,candidateOffset){
  return insertMinimalSpan32InPlace(words,base,length,capacity,recordWords,candidate,candidateOffset);
}
function product6(out,outBase,outLength,capacity,left,leftBase,leftLength,right,rightBase,rightLength,recordWords,scratch,scratchOffset){
  return productJoinMinimal6x32Into(out,outBase,outLength,capacity,left,leftBase,leftLength,right,rightBase,rightLength,scratch,scratchOffset);
}
function productSpan(out,outBase,outLength,capacity,left,leftBase,leftLength,right,rightBase,rightLength,recordWords,scratch,scratchOffset){
  return productJoinMinimalSpan32Into(out,outBase,outLength,capacity,left,leftBase,leftLength,right,rightBase,rightLength,recordWords,scratch,scratchOffset);
}

// COLD selection only. Hot functions receive these selected implementations and
// do not test board width/height to decide which path to execute.
export function prepareConnect4RbaExecutionProfile(g){
  const denseRemove=g.removeByCell!==null,denseSubset=g.subsetTable!==null;
  const coordinate3=g.coordWords===3,front6=g.generatorWords===6;
  return {
    removeCell:denseRemove?removeDense:removeSparse,
    shapeSubset:denseSubset?subsetDense:subsetSparse,
    prepareSubset:denseSubset?prepareSubsetDense:prepareSubsetSparse,
    shapeSubsetPrepared:denseSubset?subsetDensePrepared:subsetSparsePrepared,
    permuteBits:coordinate3?permute3:permuteSpan,
    permuteCoordinates:coordinate3?permutePair3:permutePairSpan,
    insertFront:front6?insert6:insertSpan,
    productJoin:front6?product6:productSpan,
    removeMode:denseRemove?1:0,
    subsetMode:denseSubset?1:0,
    coordinateMode:coordinate3?3:0,
    frontMode:front6?6:0,
  };
}

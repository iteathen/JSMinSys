import {popcount32} from '../src/word32.mjs';
import {popcount3x32} from '../src/word64x32.mjs';

// Exact advisory evaluator for potential winning-line contribution.
//
// A line is live for player p exactly while no opponent token occupies any
// cell in that line. Geometry/incidence is prepared once. Recursive callers
// should keep live state in preallocated per-depth numeric storage.
//
// Hot functions below intentionally trust their prepared numeric inputs.

export function prepareConnect4LiveLineEvaluator32(g){
  if(!g||
     !Number.isSafeInteger(g.columns)||g.columns<1||
     !Number.isSafeInteger(g.rows)||g.rows<1||
     !Number.isSafeInteger(g.cellCount)||g.cellCount<1||
     !Number.isSafeInteger(g.lineCount)||g.lineCount<0||
     !(g.lineColumn instanceof Uint32Array)||
     !(g.lineRow instanceof Uint32Array))
    throw new TypeError('prepared Connect4 geometry required');

  const columns=g.columns,cellCount=g.cellCount,lineCount=g.lineCount,
    lineColumn=g.lineColumn,lineRow=g.lineRow,
    wordCount=(lineCount+31)>>>5,stateWords=wordCount<<1,
    through=new Uint32Array(cellCount*wordCount),
    all=new Uint32Array(wordCount);

  for(let line=0;line<lineCount;line+=1){
    const word=line>>>5,bit=1<<(line&31),base=line*4;
    all[word]|=bit;
    for(let i=0;i<4;i+=1){
      const cell=lineRow[base+i]*columns+lineColumn[base+i],
        at=cell*wordCount+word;
      through[at]|=bit;
    }
  }

  return {columns:g.columns,rows:g.rows,cellCount,lineCount,wordCount,stateWords,through,all};
}

export function resetConnect4LiveLineState32(profile,state,stateOffset=0){
  const words=profile.wordCount,all=profile.all,p1=stateOffset+words;
  for(let word=0;word<words;word+=1){
    const value=all[word];
    state[stateOffset+word]=value;
    state[p1+word]=value;
  }
  return state;
}

export function advanceConnect4LiveLineState32(
  profile,
  source,
  sourceOffset,
  mover,
  cell,
  target,
  targetOffset,
){
  const words=profile.wordCount,through=profile.through,
    throughBase=cell*words,ownBase=mover*words,blockedBase=(1-mover)*words;

  // Same-frame in-place and disjoint depth frames are both safe in one fused
  // pass because player slices never overlap each other. Partially overlapping
  // unequal ranges remain outside this hot contract.
  for(let word=0;word<words;word+=1){
    target[targetOffset+ownBase+word]=source[sourceOffset+ownBase+word];
    target[targetOffset+blockedBase+word]=source[sourceOffset+blockedBase+word]&~through[throughBase+word];
  }

  return target;
}

export function evaluateConnect4LiveLineCell32(
  profile,
  state,
  stateOffset,
  player,
  cell,
){
  const words=profile.wordCount,through=profile.through,
    throughBase=cell*words,playerBase=stateOffset+player*words;
  let score=0;
  for(let word=0;word<words;word+=1)
    score+=popcount32(state[playerBase+word]&through[throughBase+word]);
  return score;
}

// Three-word specialization for geometries whose prepared line field spans
// exactly three u32 words. Callers that already own the two prepared offsets
// avoid loop, player-offset multiplication, and cell-offset multiplication.
export function evaluateConnect4LiveLine3x32(
  through,
  throughOffset,
  state,
  playerOffset,
){
  return popcount3x32(
    state[playerOffset]&through[throughOffset],
    state[playerOffset+1]&through[throughOffset+1],
    state[playerOffset+2]&through[throughOffset+2],
  );
}

// Prepared three-word specialization; select once at initialization.
export function advanceConnect4LiveLineState3x32(profile,source,sourceOffset,mover,cell,target,targetOffset){
  const through=profile.through,throughBase=cell*3,ownBase=mover*3,blockedBase=(1-mover)*3;
  target[targetOffset+ownBase+0]=source[sourceOffset+ownBase+0];
  target[targetOffset+blockedBase+0]=source[sourceOffset+blockedBase+0]&~through[throughBase+0];
  target[targetOffset+ownBase+1]=source[sourceOffset+ownBase+1];
  target[targetOffset+blockedBase+1]=source[sourceOffset+blockedBase+1]&~through[throughBase+1];
  target[targetOffset+ownBase+2]=source[sourceOffset+ownBase+2];
  target[targetOffset+blockedBase+2]=source[sourceOffset+blockedBase+2]&~through[throughBase+2];
  return target;
}

// General counterpart to the prepared-offset three-word scoring interface.
export function evaluateConnect4LiveLineSpan32(through,throughOffset,state,playerOffset,wordCount){
  let score=0;
  for(let w=0;w<wordCount;w+=1)score+=popcount32(state[playerOffset+w]&through[throughOffset+w]);
  return score;
}

import {popcount32} from '../src/word32.mjs';

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
     !Number.isSafeInteger(g.lineCount)||g.lineCount<1||
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
  const words=profile.wordCount,stateWords=profile.stateWords,through=profile.through,
    throughBase=cell*words,blockedBase=targetOffset+(1-mover)*words;

  // Intended search use is same-frame in-place or disjoint preallocated depth
  // frames. Partially overlapping unequal ranges are outside this hot contract.
  for(let index=0;index<stateWords;index+=1)
    target[targetOffset+index]=source[sourceOffset+index];

  for(let word=0;word<words;word+=1)
    target[blockedBase+word]=target[blockedBase+word]&~through[throughBase+word];

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
  return popcount32(state[playerOffset]&through[throughOffset])+
    popcount32(state[playerOffset+1]&through[throughOffset+1])+
    popcount32(state[playerOffset+2]&through[throughOffset+2]);
}

import {prepareConnect4LiveLineEvaluator32,resetConnect4LiveLineState32,advanceConnect4LiveLineState32,advanceConnect4LiveLineState3x32,evaluateConnect4LiveLine3x32,evaluateConnect4LiveLineSpan32} from './connect4-live-line-evaluator.mjs';

export function prepareConnect4MoveOrderPacking32(columns,lineCount){
  let shift=0,stride=1;
  while(stride<columns&&shift<31){stride*=2;shift+=1;}
  return shift<31&&lineCount<=(0xffffffff>>>shift)
    ?{shift,mask:stride-1}
    :{shift:-1,mask:0xffffffff};
}

// COLD: geometry, kernels, root replay and all per-depth storage prepared once.
export function prepareConnect4LiveLineOrder32(g,centerOrder,moves){
  const profile=prepareConnect4LiveLineEvaluator32(g),levels=g.cellCount+1,
    packing=prepareConnect4MoveOrderPacking32(g.columns,g.lineCount),
    state=new Uint32Array(levels*profile.stateWords),heights=new Uint32Array(g.columns),
    advance=profile.wordCount===3?advanceConnect4LiveLineState3x32:advanceConnect4LiveLineState32,
    score=profile.wordCount===3?evaluateConnect4LiveLine3x32:evaluateConnect4LiveLineSpan32;
  resetConnect4LiveLineState32(profile,state,0);
  for(let i=0;i<moves.length;i+=1){
    const c=moves[i],cell=heights[c]*g.columns+c;
    advance(profile,state,0,i&1,cell,state,0);heights[c]+=1;
  }
  return {g,profile,state,advance,score,centerOrder,
    ordered:new Uint32Array(levels*g.columns),
    scores:packing.shift<0?new Uint32Array(levels*g.columns):null,
    shift:packing.shift,mask:packing.mask,
    order:packing.shift<0?orderConnect4LiveLineGeneral32:orderConnect4LiveLinePacked32};
}

// Advisory only. All legal landings retained; stable ties follow worker order.
export function orderConnect4LiveLinePacked32(o,words,src,mover,orientation,liveOffset,row){
  const g=o.g,p=o.profile,ordered=o.ordered,shift=o.shift,
    playerOffset=liveOffset+mover*p.wordCount,
    columns=g.columns,rows=g.rows,wordCount=p.wordCount,
    mirrorColumn=g.mirrorColumn,centerOrder=o.centerOrder,
    through=p.through,state=o.state,scoreCell=o.score;
  let count=0;
  for(let i=0;i<columns;i+=1){
    const c=centerOrder[i],h=words[src+c];if(h>=rows)continue;
    const physical=orientation?mirrorColumn[c]:c,cell=h*columns+physical,
      score=scoreCell(through,cell*wordCount,state,playerOffset,wordCount),
      threshold=(score<<shift)>>>0,entry=(threshold|c)>>>0;
    let at=count;
    while(at>0){const prior=ordered[row+at-1];if(prior>=threshold)break;ordered[row+at]=prior;at-=1;}
    ordered[row+at]=entry;count+=1;
  }
  return count;
}

// Initialization fallback when score+column cannot be losslessly packed in u32.
export function orderConnect4LiveLineGeneral32(o,words,src,mover,orientation,liveOffset,row){
  const g=o.g,p=o.profile,ordered=o.ordered,scores=o.scores,
    playerOffset=liveOffset+mover*p.wordCount,
    columns=g.columns,rows=g.rows,wordCount=p.wordCount,
    mirrorColumn=g.mirrorColumn,centerOrder=o.centerOrder,
    through=p.through,state=o.state,scoreCell=o.score;
  let count=0;
  for(let i=0;i<columns;i+=1){
    const c=centerOrder[i],h=words[src+c];if(h>=rows)continue;
    const physical=orientation?mirrorColumn[c]:c,cell=h*columns+physical,
      score=scoreCell(through,cell*wordCount,state,playerOffset,wordCount);
    let at=count;
    while(at>0&&scores[row+at-1]<score){scores[row+at]=scores[row+at-1];ordered[row+at]=ordered[row+at-1];at-=1;}
    scores[row+at]=score;ordered[row+at]=c;count+=1;
  }
  return count;
}

export const RANK_LOCAL_CERTIFIED='CERTIFIED';
export const RANK_LOCAL_UNRESOLVED='UNRESOLVED';

// Cold pre-search only. This module reconstructs the current physical ownership
// from the supplied move history, measures only current legal landing cells, and
// never enumerates descendants or calls search/CPC/oracle machinery.
export function evaluateConnect4RankLocalLanding32(moves,{geometry}={}){
  if(!geometry||!Number.isSafeInteger(geometry.columns)||!Number.isSafeInteger(geometry.rows)||
     !Number.isSafeInteger(geometry.lineCount)||!geometry.lineColumn||!geometry.lineRow)
    throw new TypeError('prepared Connect4 RBA geometry required');
  if(!Array.isArray(moves)&&!ArrayBuffer.isView(moves))
    throw new TypeError('move history must be an array or typed array');

  const g=geometry,columns=g.columns,rows=g.rows,
    heights=new Uint32Array(columns),
    owner=new Int8Array(g.cellCount);
  owner.fill(-1);

  for(let i=0;i<moves.length;i+=1){
    const column=moves[i];
    if(!Number.isSafeInteger(column)||column<0||column>=columns||heights[column]>=rows)
      throw new RangeError('invalid rank-local move history');
    const row=heights[column],cell=row*columns+column;
    owner[cell]=i&1;
    heights[column]=row+1;
  }

  let terminal=false;
  for(let line=0;line<g.lineCount&&!terminal;line+=1){
    const base=line*4,c0=g.lineRow[base]*columns+g.lineColumn[base],p=owner[c0];
    if(p<0)continue;
    terminal=
      owner[g.lineRow[base+1]*columns+g.lineColumn[base+1]]===p&&
      owner[g.lineRow[base+2]*columns+g.lineColumn[base+2]]===p&&
      owner[g.lineRow[base+3]*columns+g.lineColumn[base+3]]===p;
  }

  const premises={
    descendantEnumeration:false,
    recursiveSearch:false,
    oracle:false,
    solvedValues:false,
    projection:false,
  };
  if(terminal)return {
    status:RANK_LOCAL_UNRESOLVED,
    reason:'TERMINAL_POSITION',
    move:-1,
    rank:moves.length,
    mover:moves.length&1,
    uniqueParetoColumn:-1,
    heights:Array.from(heights),
    candidates:[],
    premises,
  };

  const mover=moves.length&1,opponent=1-mover,candidates=[];
  for(let column=0;column<columns;column+=1){
    const landingRow=heights[column];
    if(landingRow>=rows)continue;
    const landingCell=landingRow*columns+column,
      moverLiveLineIds=[],opponentLiveLineIds=[];
    let moverLiveLines=0,opponentDeniedLines=0;

    for(let line=0;line<g.lineCount;line+=1){
      const base=line*4;
      let containsLanding=false,moverBlocked=false,opponentBlocked=false;
      for(let i=0;i<4;i+=1){
        const lineColumn=g.lineColumn[base+i],lineRow=g.lineRow[base+i];
        if(lineColumn===column&&lineRow===landingRow)containsLanding=true;
        const p=owner[lineRow*columns+lineColumn];
        if(p===opponent)moverBlocked=true;
        else if(p===mover)opponentBlocked=true;
      }
      if(!containsLanding)continue;
      if(!moverBlocked){moverLiveLines+=1;moverLiveLineIds.push(line);}
      if(!opponentBlocked){opponentDeniedLines+=1;opponentLiveLineIds.push(line);}
    }

    candidates.push({
      column,
      landingCell,
      landingRow,
      moverLiveLines,
      opponentDeniedLines,
      headroom:rows-landingRow-1,
      moverLiveLineIds,
      opponentLiveLineIds,
      dominatedBy:[],
    });
  }

  for(let i=0;i<candidates.length;i+=1){
    const a=candidates[i];
    for(let j=0;j<candidates.length;j+=1){
      if(i===j)continue;
      const b=candidates[j];
      if(b.moverLiveLines>=a.moverLiveLines&&
         b.opponentDeniedLines>=a.opponentDeniedLines&&
         (b.moverLiveLines>a.moverLiveLines||b.opponentDeniedLines>a.opponentDeniedLines))
        a.dominatedBy.push(b.column);
    }
  }

  const maxima=candidates.filter(candidate=>candidate.dominatedBy.length===0),
    unique=maxima.length===1?maxima[0]:null,
    base={
      rank:moves.length,
      mover,
      heights:Array.from(heights),
      candidates,
      paretoColumns:maxima.map(candidate=>candidate.column),
      uniqueParetoColumn:unique?unique.column:-1,
      formula:{
        moverLiveLines:'live mover winning lines containing current legal landing',
        opponentDeniedLines:'live opponent winning lines containing current legal landing',
        dominance:'A>= and B>= with at least one strict component',
        headroom:'empty cells above the candidate landing after that landing',
      },
      premises,
    };

  if(!candidates.length)return {
    ...base,
    status:RANK_LOCAL_UNRESOLVED,
    reason:'BOARD_FULL',
    move:-1,
  };
  if(!unique)return {
    ...base,
    status:RANK_LOCAL_UNRESOLVED,
    reason:'NON_UNIQUE_PARETO_MAX',
    move:-1,
  };
  if(unique.headroom===0)return {
    ...base,
    status:RANK_LOCAL_UNRESOLVED,
    reason:'UNIQUE_MAX_EXHAUSTS_COLUMN',
    move:-1,
  };
  return {
    ...base,
    status:RANK_LOCAL_CERTIFIED,
    reason:'UNIQUE_PARETO_MAX_WITH_COLUMN_HEADROOM',
    move:unique.column,
  };
}

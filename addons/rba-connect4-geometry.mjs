// COLD Connect4 RBA geometry. Board dimensions are selected at application
// initialization and remain invariant for the prepared execution instance.
// Hot state stores one uint32 height per column; no packed-height width limit.
export function prepareConnect4RbaGeometry({columns,rows,actionOrder,specializationBudgetBytes=2097152}={}) {
  if(!Number.isSafeInteger(columns)||columns<1||!Number.isSafeInteger(rows)||rows<1||
     !Number.isSafeInteger(specializationBudgetBytes)||specializationBudgetBytes<0)
    throw new RangeError('invalid Connect4 dimensions/profile budget');
  const cellCount=columns*rows;
  if(!Number.isSafeInteger(cellCount)||cellCount>=0x40000000)
    throw new RangeError('Connect4 dimensions exceed uint32 RBA profile');

  const lines=[];
  for(let row=0;row<rows;row+=1)for(let column=0;column<columns;column+=1){
    for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]]){
      if(column+3*dc<columns&&row+3*dr>=0&&row+3*dr<rows){
        lines.push([
          row*columns+column,
          (row+dr)*columns+column+dc,
          (row+2*dr)*columns+column+2*dc,
          (row+3*dr)*columns+column+3*dc,
        ]);
      }
    }
  }

  const shapeMap=new Map(),shapeList=[];
  const keyOf=cells=>cells.join(',');
  for(const line of lines)for(let bits=1;bits<16;bits+=1){
    const cells=[];
    for(let i=0;i<4;i+=1)if(bits&(1<<i))cells.push(line[i]);
    cells.sort((a,b)=>a-b);
    const key=keyOf(cells);
    if(!shapeMap.has(key)){shapeMap.set(key,0);shapeList.push(cells);}
  }
  shapeList.sort((a,b)=>a.length-b.length||(()=>{
    const n=Math.min(a.length,b.length);
    for(let i=0;i<n;i+=1)if(a[i]!==b[i])return a[i]-b[i];
    return a.length-b.length;
  })());
  shapeMap.clear();
  for(let id=0;id<shapeList.length;id+=1)shapeMap.set(keyOf(shapeList[id]),id);

  const lineCount=lines.length,shapeCount=shapeList.length;
  const maxBasis=lineCount,coordWords=Math.ceil(maxBasis/32),shapeWordCount=Math.ceil(shapeCount/32);
  const metaOffset=columns,p0Offset=metaOffset+1,p1Offset=p0Offset+coordWords,keyWords=p1Offset+coordWords;
  const lineColumn=new Uint32Array(lineCount*4),lineRow=new Uint32Array(lineCount*4),lineShape=new Uint32Array(lineCount*16);
  const shapeSize=new Uint32Array(shapeCount),shapeCells=new Uint32Array(shapeCount*4),reflect=new Uint32Array(shapeCount);
  const removeAt=new Int32Array(shapeCount*4),singletonByCell=new Int32Array(cellCount);
  shapeCells.fill(0xffffffff);removeAt.fill(-1);singletonByCell.fill(-1);

  for(let l=0;l<lineCount;l+=1){
    const line=lines[l];
    for(let i=0;i<4;i+=1){lineColumn[l*4+i]=line[i]%columns;lineRow[l*4+i]=(line[i]/columns)|0;}
    for(let bits=1;bits<16;bits+=1){
      const cells=[];for(let i=0;i<4;i+=1)if(bits&(1<<i))cells.push(line[i]);cells.sort((a,b)=>a-b);
      lineShape[l*16+bits]=shapeMap.get(keyOf(cells));
    }
  }
  for(let id=0;id<shapeCount;id+=1){
    const cells=shapeList[id],size=cells.length;shapeSize[id]=size;
    for(let i=0;i<size;i+=1)shapeCells[id*4+i]=cells[i];
    if(size===1)singletonByCell[cells[0]]=id;
    const reflected=cells.map(cell=>((cell/columns)|0)*columns+(columns-1-(cell%columns))).sort((a,b)=>a-b);
    reflect[id]=shapeMap.get(keyOf(reflected));
    for(let pos=0;pos<size;pos+=1){
      if(size===1){removeAt[id*4+pos]=-1;continue;}
      const image=[];for(let i=0;i<size;i+=1)if(i!==pos)image.push(cells[i]);
      removeAt[id*4+pos]=shapeMap.get(keyOf(image));
    }
  }


  let removeByCell=null,subsetTable=null,specializationBytes=0;
  const removeBytes=cellCount*shapeCount*4;
  if(removeBytes<=specializationBudgetBytes){
    removeByCell=new Int32Array(cellCount*shapeCount);
    for(let cell=0;cell<cellCount;cell+=1)for(let id=0;id<shapeCount;id+=1){
      const size=shapeSize[id],base=id*4;let pos=-1;
      for(let i=0;i<size;i+=1)if(shapeCells[base+i]===cell){pos=i;break;}
      removeByCell[cell*shapeCount+id]=pos<0?id:removeAt[id*4+pos];
    }
    specializationBytes+=removeBytes;
  }
  const subsetBytes=shapeCount*shapeCount*4;
  if(specializationBytes+subsetBytes<=specializationBudgetBytes){
    subsetTable=new Uint32Array(shapeCount*shapeCount);
    for(let a=0;a<shapeCount;a+=1)for(let b=0;b<shapeCount;b+=1){
      if(shapeSize[a]>shapeSize[b])continue;
      const ab=a*4,bb=b*4;let ok=1;
      for(let i=0;i<shapeSize[a];i+=1){const cell=shapeCells[ab+i];let found=0;
        for(let j=0;j<shapeSize[b];j+=1)if(shapeCells[bb+j]===cell){found=1;break;}
        if(!found){ok=0;break;}
      }
      subsetTable[a*shapeCount+b]=ok;
    }
    specializationBytes+=subsetBytes;
  }

  let order;
  if(actionOrder!==undefined){
    if(!(actionOrder instanceof Uint32Array)&&!Array.isArray(actionOrder))throw new TypeError('actionOrder must be numeric');
    if(actionOrder.length!==columns)throw new RangeError('actionOrder width mismatch');
    const seen=new Uint8Array(columns);order=new Uint32Array(columns);
    for(let i=0;i<columns;i+=1){const c=actionOrder[i];if(!Number.isSafeInteger(c)||c<0||c>=columns||seen[c])throw new RangeError('invalid actionOrder');seen[c]=1;order[i]=c;}
  }else{
    const temp=Array.from({length:columns},(_,c)=>c);
    const center=(columns-1)/2;temp.sort((a,b)=>Math.abs(a-center)-Math.abs(b-center)||a-b);
    order=Uint32Array.from(temp);
  }
  const priorityByColumn=new Uint32Array(columns),mirrorColumn=new Uint32Array(columns);
  for(let i=0;i<columns;i+=1){priorityByColumn[order[i]]=i;mirrorColumn[i]=columns-1-i;}

  return {columns,rows,cellCount,lineCount,shapeCount,maxBasis,coordWords,shapeWordCount,
    metaOffset,p0Offset,p1Offset,keyWords,edgeCapacity:columns,generatorWords:coordWords*2,
    lineColumn,lineRow,lineShape,shapeSize,shapeCells,reflect,removeAt,removeByCell,subsetTable,singletonByCell,
    specializationBudgetBytes,specializationBytes,actionOrder:order,priorityByColumn,mirrorColumn};
}

export function prepareConnect4RbaCoordinateScratch(g){
  return {seen:new Uint32Array(g.shapeWordCount),mirrorBasis:new Uint32Array(g.maxBasis),
    inverse:new Uint32Array(g.shapeCount),map:new Uint32Array(g.maxBasis),
    mirror:new Uint32Array(g.keyWords),size:new Uint32Array(1)};
}

export function connect4RbaShapeContains(g,id,cell){
  const size=g.shapeSize[id],base=id*4;
  for(let i=0;i<size;i+=1)if(g.shapeCells[base+i]===cell)return i;
  return -1;
}
export function connect4RbaRemoveCell(g,id,cell){
  const pos=connect4RbaShapeContains(g,id,cell);
  return pos<0?id:g.removeAt[id*4+pos];
}
export function connect4RbaShapeSubset(g,subsetId,supersetId){
  if(subsetId<0)return 1;
  const aSize=g.shapeSize[subsetId],bSize=g.shapeSize[supersetId];
  if(aSize>bSize)return 0;
  const aBase=subsetId*4,bBase=supersetId*4;
  for(let i=0;i<aSize;i+=1){
    const cell=g.shapeCells[aBase+i];let found=0;
    for(let j=0;j<bSize;j+=1)if(g.shapeCells[bBase+j]===cell){found=1;break;}
    if(!found)return 0;
  }
  return 1;
}

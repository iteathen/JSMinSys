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
    const cell=row*columns+column;
    if(column+3<columns)lines.push([cell,cell+1,cell+2,cell+3]);
    if(row+3<rows)lines.push([cell,cell+columns,cell+2*columns,cell+3*columns]);
    if(column+3<columns&&row+3<rows)
      lines.push([cell,cell+columns+1,cell+2*columns+2,cell+3*columns+3]);
    if(column+3<columns&&row>=3)
      lines.push([cell,cell-columns+1,cell-2*columns+2,cell-3*columns+3]);
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
  shapeList.sort((a,b)=>{
    const lengthDelta=a.length-b.length;if(lengthDelta)return lengthDelta;
    for(let i=0;i<a.length;i+=1)if(a[i]!==b[i])return a[i]-b[i];
    return 0;
  });
  shapeMap.clear();
  for(let id=0;id<shapeList.length;id+=1)shapeMap.set(keyOf(shapeList[id]),id);

  const lineCount=lines.length,shapeCount=shapeList.length;
  const maxBasis=lineCount,coordWords=Math.ceil(maxBasis/32),shapeWordCount=Math.ceil(shapeCount/32);
  const metaOffset=columns,p0Offset=metaOffset+1,p1Offset=p0Offset+coordWords,keyWords=p1Offset+coordWords;
  const lineColumn=new Uint32Array(lineCount*4),lineRow=new Uint32Array(lineCount*4),lineShape=new Uint32Array(lineCount*16);
  const cellColumn=new Uint32Array(cellCount),cellRow=new Uint32Array(cellCount);
  for(let cell=0;cell<cellCount;cell+=1){cellColumn[cell]=cell%columns;cellRow[cell]=(cell/columns)|0;}
  const shapeSize=new Uint32Array(shapeCount),shapeCells=new Uint32Array(shapeCount*4),reflect=new Uint32Array(shapeCount),
    pairedResponseCover=new Uint8Array(shapeCount);
  const removeAt=new Int32Array(shapeCount*4);
  shapeCells.fill(0xffffffff);removeAt.fill(-1);

  for(let l=0;l<lineCount;l+=1){
    const line=lines[l];
    for(let i=0;i<4;i+=1){lineColumn[l*4+i]=line[i]%columns;lineRow[l*4+i]=(line[i]/columns)|0;}
    for(let bits=1;bits<16;bits+=1){
      const cells=[];for(let i=0;i<4;i+=1)if(bits&(1<<i))cells.push(line[i]);cells.sort((a,b)=>a-b);
      lineShape[l*16+bits]=shapeMap.get(keyOf(cells));
    }
  }
  let pairShapeStart=shapeCount,tripleShapeStart=shapeCount,quadShapeStart=shapeCount;
  for(let id=0;id<shapeCount;id+=1){
    const cells=shapeList[id],size=cells.length;shapeSize[id]=size;
    if(size>=2&&pairShapeStart===shapeCount)pairShapeStart=id;
    if(size>=3&&tripleShapeStart===shapeCount)tripleShapeStart=id;
    if(size>=4&&quadShapeStart===shapeCount)quadShapeStart=id;
    for(let i=0;i<size;i+=1){
      const cell=cells[i];shapeCells[id*4+i]=cell;
      if((cellRow[cell]&1)===((rows-1)&1))pairedResponseCover[id]=1;
    }
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
    for(let cell=0;cell<cellCount;cell+=1){
      const row=cell*shapeCount;
      for(let id=0;id<shapeCount;id+=1)removeByCell[row+id]=id;
    }
    for(let id=0;id<shapeCount;id+=1){
      const size=shapeSize[id],base=id*4;
      for(let pos=0;pos<size;pos+=1){
        const cell=shapeCells[base+pos];
        removeByCell[cell*shapeCount+id]=removeAt[base+pos];
      }
    }
    specializationBytes+=removeBytes;
  }
  const subsetBytes=shapeCount*shapeCount*4;
  if(specializationBytes+subsetBytes<=specializationBudgetBytes){
    subsetTable=new Uint32Array(shapeCount*shapeCount);
    for(let a=0;a<shapeCount;a+=1)for(let b=0;b<shapeCount;b+=1){
      const aSize=shapeSize[a],bSize=shapeSize[b];if(aSize>bSize)continue;
      const ab=a*4,bb=b*4;let i=0,j=0;
      while(i<aSize&&j<bSize){
        const av=shapeCells[ab+i],bv=shapeCells[bb+j];
        if(av===bv){i+=1;j+=1;}
        else if(bv<av)j+=1;
        else break;
      }
      subsetTable[a*shapeCount+b]=i===aSize?1:0;
    }
    specializationBytes+=subsetBytes;
  }

  // Upset propagation is a dominant cofactor cost. Precompute only actual
  // strict-superset shape ids once so hot cofactors do not scan every
  // same-or-larger child-basis candidate through subsetTable.
  const strictSupersetOffset=new Uint32Array(shapeCount+1);
  let strictSupersetCount=0;
  for(let a=0;a<shapeCount;a+=1){
    strictSupersetOffset[a]=strictSupersetCount;
    const aSize=shapeSize[a],aBase=a*4;
    for(let b=a+1;b<shapeCount;b+=1){
      const bSize=shapeSize[b];if(bSize===aSize)continue;
      let isSubset;
      if(subsetTable)isSubset=subsetTable[a*shapeCount+b];
      else{
        const bBase=b*4;let i=0,j=0;
        while(i<aSize&&j<bSize){
          const av=shapeCells[aBase+i],bv=shapeCells[bBase+j];
          if(av===bv){i+=1;j+=1;}
          else if(bv<av)j+=1;
          else break;
        }
        isSubset=i===aSize?1:0;
      }
      if(isSubset)strictSupersetCount+=1;
    }
  }
  strictSupersetOffset[shapeCount]=strictSupersetCount;
  const strictSupersetIds=new Uint32Array(strictSupersetCount);
  let strictSupersetAt=0;
  for(let a=0;a<shapeCount;a+=1){
    const aSize=shapeSize[a],aBase=a*4;
    for(let b=a+1;b<shapeCount;b+=1){
      const bSize=shapeSize[b];if(bSize===aSize)continue;
      let isSubset;
      if(subsetTable)isSubset=subsetTable[a*shapeCount+b];
      else{
        const bBase=b*4;let i=0,j=0;
        while(i<aSize&&j<bSize){
          const av=shapeCells[aBase+i],bv=shapeCells[bBase+j];
          if(av===bv){i+=1;j+=1;}
          else if(bv<av)j+=1;
          else break;
        }
        isSubset=i===aSize?1:0;
      }
      if(isSubset)strictSupersetIds[strictSupersetAt++]=b;
    }
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

  const positionStride=rows+1,positionBits=columns*positionStride,
    positionMode=positionStride<32&&positionBits<=64?(columns===7&&rows===6?49:64):0,
    positionBitBase=new Uint32Array(columns),cpcTargetOwnerBase=((columns-1)*rows)&1;
  let positionEmptyLo=0,positionEmptyHi=0;
  if(positionMode)for(let c=0;c<columns;c+=1){
    const bit=c*positionStride;positionBitBase[c]=bit;
    if(bit<32)positionEmptyLo|=(1<<bit)>>>0;
    else positionEmptyHi|=(1<<(bit-32))>>>0;
  }

  return {columns,rows,cellCount,lineCount,shapeCount,maxBasis,coordWords,shapeWordCount,
    metaOffset,p0Offset,p1Offset,keyWords,edgeCapacity:columns,generatorWords:coordWords*2,
    lineColumn,lineRow,lineShape,cellColumn,cellRow,shapeSize,shapeCells,reflect,removeAt,removeByCell,subsetTable,strictSupersetOffset,strictSupersetIds,pairedResponseCover,
    pairShapeStart,tripleShapeStart,quadShapeStart,pairedResponseRowParity:(rows-1)&1,
    specializationBudgetBytes,specializationBytes,actionOrder:order,priorityByColumn,mirrorColumn,
    positionStride,positionBits,positionMode,positionBitBase,positionEmptyLo:positionEmptyLo>>>0,positionEmptyHi:positionEmptyHi>>>0,
    cpcTargetOwnerBase};
}

export function shareConnect4RbaGeometry32(g){
  if(!g||!Number.isSafeInteger(g.columns)||!Number.isSafeInteger(g.rows))
    throw new TypeError('prepared Connect4 RBA geometry required');
  const shared={};
  for(const key in g){
    const value=g[key];
    if(!ArrayBuffer.isView(value)){
      shared[key]=value;
      continue;
    }
    if(value.buffer instanceof SharedArrayBuffer){
      shared[key]=value;
      continue;
    }
    const copy=new value.constructor(new SharedArrayBuffer(value.byteLength));
    copy.set(value);
    shared[key]=copy;
  }
  return shared;
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

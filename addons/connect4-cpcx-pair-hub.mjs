// Current-rank response-capacity certificate. Exact prepared nonterminal q;
// caller rules out own immediate wins and dual opponent frontier obligations.

export function prepareConnect4CpcxPairHub32(g){
  const start=g.pairShapeStart,end=g.tripleShapeStart,columns=g.columns,rows=g.rows,
    limit=(columns>rows?columns:rows)-1,
    Field=limit<=255?Uint8Array:limit<=65535?Uint16Array:Uint32Array,
    pairs=new Field((end-start)*4),seen=new Uint8Array(columns),
    firstColumn=new Uint32Array(columns),p0=g.p0Offset,p1=g.p1Offset,
    forbiddenWords=Math.ceil(columns/32),forbidden=new Uint32Array((g.cellCount+1)*forbiddenWords),
    cellColumn=g.cellColumn,cellRow=g.cellRow;
  for(let id=start;id<end;id++){
    const at=(id-start)*4,base=id*4,a=g.shapeCells[base],b=g.shapeCells[base+1];
    pairs[at]=g.cellColumn[a];pairs[at+1]=g.cellRow[a];
    pairs[at+2]=g.cellColumn[b];pairs[at+3]=g.cellRow[b];
  }

  function addSpoke(words,offset,tc,tr,cc,cr,forced,forbiddenBase){
    if((forced>=0&&tc!==forced)||words[offset+tc]!==tr||
      cr!==words[offset+cc]+(cc===tc?1:0)||
      forbidden[forbiddenBase+(tc>>>5)]&(1<<(tc&31)))return -1;
    if(!seen[tc]){seen[tc]=1;firstColumn[tc]=cc;return -1;}
    if(firstColumn[tc]===cc)return -1;
    return tc;
  }

  function collectConnect4CpcxSingletons32(words,offset,basis,bi,n,mover,forbiddenBase){
    for(let w=0;w<forbiddenWords;w++)forbidden[forbiddenBase+w]=0;
    const opponent=offset+(mover?p0:p1);let forced=-1;
    for(let i=0;i<n;i++){
      const cell=basis[bi+i];if(cell>=start)break;
      if(!(words[opponent+(i>>>5)]&(1<<(i&31))))continue;
      const column=cellColumn[cell],row=cellRow[cell],height=words[offset+column];
      if(row===height){if(forced>=0)return -2;forced=column;}
      else if(row===height+1)forbidden[forbiddenBase+(column>>>5)]|=1<<(column&31);
    }
    return forced;
  }

  function findConnect4CpcxPairHub32(words,offset,basis,bi,n,mover,forced,forbiddenBase){
    if(!n||basis[bi+n-1]<start||basis[bi]>=end)return -1;
    for(let c=0;c<columns;c++)seen[c]=0;
    const own=offset+(mover?p1:p0),activeWords=(n+31)>>>5;
    for(let word=0;word<activeWords;word++){
      let bits=words[own+word];
      if(word+1===activeWords)bits&=0xffffffff>>>((-n)&31);
      while(bits){
        const low=bits&-bits,i=(word<<5)+31-Math.clz32(low),id=basis[bi+i];bits^=low;
        if(id<start)continue;if(id>=end)return -1;
        const at=(id-start)*4,ac=pairs[at],ar=pairs[at+1],bc=pairs[at+2],br=pairs[at+3];
        let candidate=addSpoke(words,offset,ac,ar,bc,br,forced,forbiddenBase);
        if(candidate>=0)return candidate;
        candidate=addSpoke(words,offset,bc,br,ac,ar,forced,forbiddenBase);
        if(candidate>=0)return candidate;
      }
    }
    return -1;
  }
  return {find:findConnect4CpcxPairHub32,collect:collectConnect4CpcxSingletons32,forbidden,forbiddenWords,
    fieldBytes:Field.BYTES_PER_ELEMENT,planBytes:pairs.byteLength,
    scratchBytes:seen.byteLength+firstColumn.byteLength+forbidden.byteLength};
}

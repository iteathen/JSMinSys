// Build-time standard-7x6 realization only. The caller owns cold admission:
// prepared standard geometry, grouped-mask profile, and (for dense:true) a
// non-null dense removal table. General/sparse consumers keep their own path.
import assert from 'node:assert/strict';

function once(source,needle,replacement){
  assert.equal(source.split(needle).length,2,'coordinate transform anchor: '+needle);
  return source.replace(needle,replacement);
}

export function optimizeMaskCoordinate(source,{dense=false}={}){
  assert.equal(typeof source,'string');
  assert.equal(typeof dense,'boolean');

  // These immutable references belong to the cofactor invocation, not to each
  // active source image. Keep terminal exits before the grouped-table loads.
  const tables='const offsets=profile.supersetWordOffsets,words=profile.supersetWords,masks=profile.supersetMasks;';
  source=once(source,'    '+tables+'\n','');
  source=once(source,
    '    p0Target=dst+g.p0Offset,p1Target=dst+g.p1Offset;\n  for(let i=0;i<n;i+=1){',
    '    p0Target=dst+g.p0Offset,p1Target=dst+g.p1Offset;\n  '+tables+'\n  for(let i=0;i<n;i+=1){');

  source=once(source,
    '      const word=words[at];let bits=masks[at]&seen[word];',
    '      const word=words[at],shapeBase=word<<5;let bits=masks[at]&seen[word];');
  source=once(source,
    'id=(word<<5)+(31-Math.clz32(bit))',
    'id=shapeBase+(31-Math.clz32(bit))');

  // Bitwise coordinates are numbers; the publication flags are booleans.
  // Avoid a zero-or-boolean union and repeated generic truthiness lowering.
  source=once(source,'let write0=active0&&(player===0||image===id),',
    'let write0=(active0!==0)&&(player===0||image===id),');
  source=once(source,'write1=active1&&(player===1||image===id);',
    'write1=(active1!==0)&&(player===1||image===id);');

  if(dense){
    source=once(source,
      '  const remove=profile.prepareRemove(g,cell);',
      '  const remove=cell*625,removeByCell=g.removeByCell;');
    source=once(source,
      '    const id=profile.removePrepared(g,parent[parentOffset+i],remove);',
      '    const id=removeByCell[remove+parent[parentOffset+i]];');
  }

  // Match complete property names so a future similarly named field cannot
  // silently become a numeric-token prefix. Every listed field is present in
  // the admitted grouped-mask source; absence means the generator needs review.
  const constants={columns:7,cellCount:42,shapeWordCount:20,metaOffset:7,
    p0Offset:8,p1Offset:11,coordWords:3,keyWords:14};
  for(const [name,value] of Object.entries(constants)){
    const pattern=new RegExp('\\bg\\.'+name+'\\b','g');
    assert.ok(pattern.test(source),'missing standard geometry field: '+name);
    source=source.replace(pattern,String(value));
  }
  return source;
}

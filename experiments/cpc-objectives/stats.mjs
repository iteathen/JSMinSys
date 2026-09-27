// Cold, eight-block descriptive statistics; primary metric supplied explicitly.
export function compareArms(rows,field){
  if(rows.length!==32)throw Error('expected 32 samples');
  const blocks=Array.from({length:8},()=>({}));
  for(const r of rows){
    if(!Number.isInteger(r.block)||r.block<0||r.block>7||!['A','B','C','D'].includes(r.arm))throw Error('invalid block/arm');
    const x=Number(r[field]);
    if(!Number.isFinite(x)||x<=0||blocks[r.block][r.arm]!==undefined)throw Error('invalid measurement/duplicate');
    blocks[r.block][r.arm]=x;
  }
  if(blocks.some(b=>Object.keys(b).length!==4))throw Error('incomplete block');
  return Object.fromEntries([...'BCD'].map(arm=>{
    const ratios=blocks.map(b=>b[arm]/b.A),m=ratios.reduce((a,b)=>a+b)/8,
      se=Math.sqrt(ratios.reduce((a,b)=>a+(b-m)**2,0)/7/8);
    return [arm,{meanDeltaPct:100*(m-1),interval95Pct:[100*(m-2.365*se-1),100*(m+2.365*se-1)],blockRatios:ratios}];
  }));
}

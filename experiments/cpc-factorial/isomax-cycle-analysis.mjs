// COLD analysis only. Ratios are block-paired; different cost denominators stay separate.
export function validateCycleSample(s,expectedLibrarySha,expectedMeasurement){
  const sum=BigInt(s.bootstrapCycles)+BigInt(s.setupCycles)+BigInt(s.solveCycles);
  if(sum!==BigInt(s.totalProcessCycles))throw Error('cycle partition does not close');
  if(s.libraryDirty)throw Error('dirty library cannot qualify');
  if(expectedLibrarySha&&s.librarySha!==expectedLibrarySha)throw Error('library revision changed during campaign');
  if(expectedMeasurement&&s.measurement!==expectedMeasurement)throw Error('unexpected measurement mode');
  if(expectedMeasurement==='production'&&s.totalNodes!==null)throw Error('production sample was instrumented');
  if(expectedMeasurement==='all-worker-node-instrumentation'&&s.totalNodes===null)
    throw Error('instrumented sample is missing all-worker counters');
  if(!s.oracleMatched||!s.cleanup||s.workersExited!==s.workers||s.errors.length)
    throw Error('incorrect/incomplete sample or cleanup');
  if(s.totalNodes!==null){
    if(s.benchmarkNodeCounts.length!==s.workers||s.benchmarkNodeCounts.some(n=>!Number.isSafeInteger(n)||n<0))
      throw Error('invalid all-worker counters');
    if(s.benchmarkNodeCounts[s.winner]!==s.winnerMetrics.nodes)
      throw Error('winner counter disagrees with production metric');
    if(s.totalNodes!==s.benchmarkNodeCounts.reduce((a,b)=>a+b,0)||s.totalNodes<s.winnerMetrics.nodes)
      throw Error('node total does not close');
  }
}

export function summarizeCycleBlocks(samples,mode){
  const fields=['totalProcessCycles','solveCycles','bootstrapCycles','setupCycles','wallMs','cpuMs'];
  const blocks=[...new Set(samples.map(s=>s.block))];
  const stats={};
  for(const field of fields){
    const ratios=[];
    for(const block of blocks){
      const rows=samples.filter(s=>s.block===block),a=rows.filter(s=>s.arm==='A'),b=rows.filter(s=>s.arm==='B');
      if(a.length!==2||b.length!==2)throw Error('incomplete ABBA block');
      const mean=r=>r.reduce((n,x)=>n+Number(x[field]),0)/r.length;
      ratios.push(mean(b)/mean(a));
    }
    const mean=ratios.reduce((a,b)=>a+b,0)/ratios.length;
    const se=ratios.length>1?Math.sqrt(ratios.reduce((a,r)=>a+(r-mean)**2,0)/(ratios.length-1)/ratios.length):Infinity;
    // Student-t two-sided 95%, df=blocks-1. Descriptive screen: independent
    // confirmation remains required and normal/block-stationarity is not assumed proven.
    const t=[Infinity,Infinity,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131][ratios.length];
    stats[field]={blockRatios:ratios,meanDeltaPct:100*(mean-1),
      interval95Pct:Number.isFinite(se*t)?[100*(mean-t*se-1),100*(mean+t*se-1)]:null};
  }
  return {mode,blocks:blocks.length,samples:samples.length,stats,
    promotion:'NOT_QUALIFIED_BY_SCREEN',
    rule:'No production acceptance from calibration or one fixture. Repeatable >1% total-cycle regression blocks promotion; noisy results remain unqualified.'};
}

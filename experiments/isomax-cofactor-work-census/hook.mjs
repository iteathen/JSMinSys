// Measurement-only cofactor dynamic-work census. Never use instrumented time.
import {registerHooks} from 'node:module';
const state={
  calls:0,deepCalls:0,sumN:0,sumCN:0,maxN:0,maxCN:0,
  guardImages:0,preGuardPlayers:0,absorbedImages:0,expandedImages:0,expandedPlayers:0,
  subsetTests:0,
  rankDeepCalls:new Float64Array(43),rankN:new Float64Array(43),rankCN:new Float64Array(43),
  rankGuardImages:new Float64Array(43),rankExpandedImages:new Float64Array(43),rankSubsetTests:new Float64Array(43),
};
globalThis.__ISOMAX_COF_WORK_CENSUS=state;
function replaceExact(source,from,to,count=1){
  if(source.split(from).length-1!==count)throw new Error(`cofactor work census source guard failed: ${from}`);
  return source.replace(from,to);
}
registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  if(!url.endsWith('/addons/rba-connect4-coordinate.mjs'))return result;
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');
  source=`const __cofWork=globalThis.__ISOMAX_COF_WORK_CENSUS;\n`+source;
  source=replaceExact(source,
`  const meta=source[src+g.metaOffset],rank=meta>>>2,
    cell=height*g.columns+column,player=rank&1;`,
`  const meta=source[src+g.metaOffset],rank=meta>>>2,
    cell=height*g.columns+column,player=rank&1;
  if(__cofWork)__cofWork.calls+=1;`);
  source=replaceExact(source,
`  const cn=connect4RbaCofactorBasis(g,profile,basis,bi,n,cell,childBasis,ci,seen,removed,seenOffset);sizes[sizeIndex]=cn;`,
`  if(__cofWork){
    __cofWork.deepCalls+=1;__cofWork.sumN+=n;if(n>__cofWork.maxN)__cofWork.maxN=n;
    __cofWork.rankDeepCalls[rank]+=1;__cofWork.rankN[rank]+=n;
  }
  const cn=connect4RbaCofactorBasis(g,profile,basis,bi,n,cell,childBasis,ci,seen,removed,seenOffset);sizes[sizeIndex]=cn;
  if(__cofWork){
    __cofWork.sumCN+=cn;if(cn>__cofWork.maxCN)__cofWork.maxCN=cn;
    __cofWork.rankCN[rank]+=cn;
  }`);
  source=replaceExact(source,
`    write0=write0&&!(target[p0Target+targetWord]&targetMask);
    write1=write1&&!(target[p1Target+targetWord]&targetMask);
    if(!write0&&!write1)continue;`,
`    if(__cofWork){
      __cofWork.guardImages+=1;__cofWork.rankGuardImages[rank]+=1;
      __cofWork.preGuardPlayers+=(write0?1:0)+(write1?1:0);
    }
    write0=write0&&!(target[p0Target+targetWord]&targetMask);
    write1=write1&&!(target[p1Target+targetWord]&targetMask);
    if(!write0&&!write1){if(__cofWork)__cofWork.absorbedImages+=1;continue;}
    if(__cofWork){
      __cofWork.expandedImages+=1;__cofWork.rankExpandedImages[rank]+=1;
      __cofWork.expandedPlayers+=(write0?1:0)+(write1?1:0);
    }`);
  source=replaceExact(source,
`    const subset=profile.prepareSubset(g,image);
    for(;j<cn;j+=1)if(profile.shapeSubsetPrepared(g,subset,childBasis[ci+j])){`,
`    const subset=profile.prepareSubset(g,image);
    if(__cofWork){const tests=cn-j;__cofWork.subsetTests+=tests;__cofWork.rankSubsetTests[rank]+=tests;}
    for(;j<cn;j+=1)if(profile.shapeSubsetPrepared(g,subset,childBasis[ci+j])){`);
  return {...result,source};
}});

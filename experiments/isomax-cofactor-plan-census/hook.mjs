// Measurement-only source hook for cofactor support-plan reuse.
// Never use instrumented elapsed time as performance evidence.
import {registerHooks} from 'node:module';

const SUPPORTS=7**7,COLUMNS=7,KEYS=SUPPORTS*COLUMNS;
const state={
  planCounts:new Uint32Array(KEYS),
  deepCounts:new Uint32Array(KEYS),
  supportSeen:new Uint8Array(SUPPORTS),
  rankCalls:new Float64Array(43),
  rankRepeated:new Float64Array(43),
  rankDeepCalls:new Float64Array(43),
  rankDeepRepeated:new Float64Array(43),
  childSizeCalls:new Float64Array(70),
  childSizeFirst:new Float64Array(70),
  totalCalls:0,repeatedCalls:0,uniquePlans:0,uniqueSupports:0,
  deepCalls:0,deepRepeatedCalls:0,uniqueDeepPlans:0,
};
globalThis.__ISOMAX_COF_PLAN_CENSUS=state;

function replaceExact(source,from,to,count=1){
  if(source.split(from).length-1!==count)throw new Error(`plan census source guard failed: ${from}`);
  return source.replace(from,to);
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  if(!url.endsWith('/addons/rba-connect4-coordinate.mjs'))return result;
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');
  const prelude=`
const __planCensus=globalThis.__ISOMAX_COF_PLAN_CENSUS;
function __planSupportCode(g,source,src){
  if(g.columns!==7||g.rows!==6)return -1;
  let code=0,mul=1;
  for(let c=0;c<7;c+=1){code+=source[src+c]*mul;mul*=7;}
  return code;
}
function __planEnter(g,source,src,column,rank){
  if(!__planCensus)return;
  const code=__planSupportCode(g,source,src);if(code<0)return;
  const key=code*7+column,prior=__planCensus.planCounts[key]++;
  __planCensus.totalCalls+=1;__planCensus.rankCalls[rank]+=1;
  if(prior){__planCensus.repeatedCalls+=1;__planCensus.rankRepeated[rank]+=1;}
  else __planCensus.uniquePlans+=1;
  if(!__planCensus.supportSeen[code]){__planCensus.supportSeen[code]=1;__planCensus.uniqueSupports+=1;}
}
function __planDeep(g,source,src,column,rank,cn){
  if(!__planCensus)return;
  const code=__planSupportCode(g,source,src);if(code<0)return;
  const key=code*7+column,prior=__planCensus.deepCounts[key]++;
  __planCensus.deepCalls+=1;__planCensus.rankDeepCalls[rank]+=1;
  if(prior){__planCensus.deepRepeatedCalls+=1;__planCensus.rankDeepRepeated[rank]+=1;}
  else __planCensus.uniqueDeepPlans+=1;
  if(cn<__planCensus.childSizeCalls.length){
    __planCensus.childSizeCalls[cn]+=1;
    if(!prior)__planCensus.childSizeFirst[cn]+=1;
  }
}
`;
  source=prelude+source;
  source=replaceExact(source,
`  const meta=source[src+g.metaOffset],rank=meta>>>2,
    cell=height*g.columns+column,player=rank&1;`,
`  const meta=source[src+g.metaOffset],rank=meta>>>2,
    cell=height*g.columns+column,player=rank&1;
  __planEnter(g,source,src,column,rank);`);
  source=replaceExact(source,
`  const cn=connect4RbaCofactorBasis(g,profile,basis,bi,n,cell,childBasis,ci,seen,removed,seenOffset);sizes[sizeIndex]=cn;`,
`  const cn=connect4RbaCofactorBasis(g,profile,basis,bi,n,cell,childBasis,ci,seen,removed,seenOffset);sizes[sizeIndex]=cn;
  __planDeep(g,source,src,column,rank,cn);`);
  return {...result,source};
}});

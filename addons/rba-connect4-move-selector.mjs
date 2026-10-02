import {
  evaluateConnect4RankLocalLanding32,
  RANK_LOCAL_CERTIFIED,
} from './connect4-rank-local-presearch.mjs';
import {runLazySmpConnect4Rba32} from './rba-connect4-lazy-smp-host.mjs';

// Additive IsoMax entry point. The existing Lazy SMP exact-search function is
// intentionally unchanged and remains available for callers that want search
// unconditionally.
export async function runIsoMaxConnect4Move32(moves,options={}){
  const local=evaluateConnect4RankLocalLanding32(moves,{geometry:options.geometry});
  if(local.status===RANK_LOCAL_CERTIFIED)return {
    status:'RANK_LOCAL_MOVE',
    rootWdl:null,
    move:local.move,
    source:'RANK_LOCAL',
    searchStarted:false,
    preSearch:local,
    winner:-1,
    winnerMetrics:null,
    workersUsed:0,
    requestedWorkers:options.workers??2,
    elapsedMs:0,
  };
  const searched=await runLazySmpConnect4Rba32(moves,options);
  return {
    ...searched,
    source:'SEARCH',
    searchStarted:true,
    preSearch:local,
  };
}

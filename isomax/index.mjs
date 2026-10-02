// Public package boundary. Re-exports only; no new search or worker wrapper.
export {prepareConnect4RbaGeometry} from './runtime/addons/rba-connect4-geometry.mjs';
export {evaluateConnect4RankLocalLanding32} from './runtime/addons/connect4-rank-local-presearch.mjs';
export {runLazySmpConnect4Rba32} from './runtime/experiments/isomax-lean/host.mjs';

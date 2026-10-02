// Cold adapter for valid boards too small to contain a winning line.
// All hot functions remain the original dimension-driven implementations.
import {prepareConnect4LiveLineEvaluator32 as prepare} from '../../addons/connect4-live-line-evaluator.mjs';
export {resetConnect4LiveLineState32,advanceConnect4LiveLineState32,
  evaluateConnect4LiveLineCell32,evaluateConnect4LiveLine3x32} from '../../addons/connect4-live-line-evaluator.mjs';
export function prepareConnect4LiveLineEvaluator32(g){
  if(g.lineCount!==0)return prepare(g);
  return {columns:g.columns,rows:g.rows,cellCount:g.cellCount,lineCount:0,
    wordCount:0,stateWords:0,through:new Uint32Array(0),all:new Uint32Array(0)};
}

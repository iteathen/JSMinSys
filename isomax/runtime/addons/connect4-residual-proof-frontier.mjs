// COLD actual-coordinate-span binding, board dimensions stay generic.
import {prepareConnect4ResidualProofFrontierSpan32} from './connect4-residual-proof-frontier-span.mjs';
import {prepareConnect4ResidualProofFrontierThree32} from './connect4-residual-proof-frontier-three.mjs';
export function prepareConnect4ResidualProofFrontier32(g){
  return g.coordWords===3?prepareConnect4ResidualProofFrontierThree32(g):prepareConnect4ResidualProofFrontierSpan32(g);
}

import {encodeSearchMode} from './mode-controls.mjs';

// STRATEGIST ONLY. Diagnostic policies qualify mode ownership/delivery, not
// expansion detection or optimum cadence. Never imported by the evaluator.
export const MODE_POLICIES=['modes-deep','modes-shallow','modes-switch-check','modes-wide-helper','modes-wide-anchor'];
export function modePolicyFlags(name,elapsedMs,workerIndex=0){
  if(name==='modes-deep')return 0;
  if(name==='modes-wide-helper'||name==='modes-wide-anchor')
    return encodeSearchMode({shallow:workerIndex===(name==='modes-wide-helper'?1:0),stride:2});
  if(name==='modes-shallow')return encodeSearchMode({shallow:true});
  if(name!=='modes-switch-check')throw RangeError('mode policy');
  return encodeSearchMode({shallow:elapsedMs<5||(elapsedMs>=10&&elapsedMs<15)});
}

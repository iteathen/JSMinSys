import {encodeActions} from './controls.mjs';

export const ACTION_POLICIES=['action-inert','action-sample8','action-private','action-private-helper',
  'action-share-on-reuse','action-proof','action-proof-helper','action-proof-on-reuse',
  'action-proof-private','action-reverse-helper','action-reverse-proof','action-proof-sample8'];

// Strategist only. Reuse is an observed cache event, not proof of useful
// cross-worker work or root progress. Sticky phase avoids oscillation.
export function advanceActionPolicy(state,{hits}){
  if(hits>=64)state.reuseSeen=true;
}

export function actionPolicyFlags(name,worker,state){
  if(!ACTION_POLICIES.includes(name))throw RangeError('action policy');
  return encodeActions({
    shareExponent:name==='action-sample8'||name==='action-proof-sample8'?3:null,
    privateOnly:name==='action-private'||!!worker&&(name==='action-private-helper'||
      name==='action-proof-private'||name==='action-share-on-reuse'&&!state.reuseSeen),
    frontierProof:name==='action-proof'||name==='action-proof-sample8'||name==='action-proof-on-reuse'&&state.reuseSeen||
      !!worker&&['action-proof-helper','action-proof-private','action-reverse-proof'].includes(name),
    reverse:!!worker&&(name==='action-reverse-helper'||name==='action-reverse-proof'),
  });
}

import {createConnect4RbaSharedExactCache32} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-shared-exact-cache.mjs';
import {probeConnect4RbaSharedExactCacheUncounted32,storeConnect4RbaSharedExactCacheUncounted32} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-shared-exact-cache-uncounted.mjs';
const cache=createConnect4RbaSharedExactCache32({capacity:16,keyWords:1}),key=new Uint32Array([1]);
storeConnect4RbaSharedExactCacheUncounted32(cache,key,0,2,1);
probeConnect4RbaSharedExactCacheUncounted32(cache,key,0,1);

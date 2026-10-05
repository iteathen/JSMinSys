import fs from 'node:fs';
import {queryWindowsTopology,targetForProcessor} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/worker-affinity.mjs';
const topology=await queryWindowsTopology(),target=targetForProcessor(topology,0,12);
if(target.efficiency!==Math.min(...topology.cores.map(x=>x.efficiency)))throw Error('requested maintenance target is not E-core class');
fs.writeFileSync('C:/r/minimal-worker-localhost-20261004/maintenance-preflight/topology.json',JSON.stringify({topology,target,node:process.version,v8:process.versions.v8},null,2));
console.log(JSON.stringify(target));

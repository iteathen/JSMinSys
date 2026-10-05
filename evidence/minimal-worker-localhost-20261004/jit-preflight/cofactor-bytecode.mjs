import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-ingress.mjs';
import {connect4RbaDenseCofactorNonWinningKnownHeight} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-coordinate-dense.mjs';
const g=prepareConnect4RbaGeometry({columns:7,rows:6}),p=prepareConnect4RbaExecutionProfile(g),s=prepareConnect4RbaCoordinateScratch(g),root=connect4RbaFromMoves([],{geometry:g,positionCode:false});
connect4RbaDenseCofactorNonWinningKnownHeight(g,p,root.words,0,root.basis,0,root.basis.length,3,0,new Uint32Array(g.keyWords),0,new Uint32Array(g.maxBasis),0,s.seen,new Uint32Array(1),0,s.map,s.inverse);

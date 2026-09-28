import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';

function bitsForHeight(rows){return Math.ceil(Math.log2(rows+1));}
function compactLayout(g){
  const prefix=Math.min(2,g.columns),heightBits=bitsForHeight(g.rows),
    supportBits=(g.columns-prefix)*heightBits+2,
    supportWords=Math.ceil(supportBits/32),
    fullCoordWords=g.coordWords?g.coordWords-1:0,
    tailBits=g.coordWords?g.lineCount-fullCoordWords*32:0,
    packedTail=!!g.coordWords&&tailBits<=16,
    coordWords=g.coordWords?(2*fullCoordWords+(packedTail?1:2)):0;
  return {prefix,heightBits,supportBits,supportWords,fullCoordWords,tailBits,packedTail,
    compactWords:prefix+supportWords+coordWords};
}
function lowMask(bits){return bits===32?0xffffffff:((2**bits)-1)>>>0;}
function writeField(out,base,bitPos,value,width){
  let remaining=width,v=value>>>0,pos=bitPos;
  while(remaining){
    const shift=pos&31,room=32-shift,take=Math.min(remaining,room),mask=lowMask(take),
      part=(v&mask)>>>0,index=base+(pos>>>5);
    out[index]=(out[index]|((part<<shift)>>>0))>>>0;
    v=take===32?0:Math.floor(v/(2**take));
    pos+=take;remaining-=take;
  }
  return pos;
}
function readField(words,base,bitPos,width){
  let remaining=width,pos=bitPos,out=0,outShift=0;
  while(remaining){
    const shift=pos&31,room=32-shift,take=Math.min(remaining,room),mask=lowMask(take),
      part=(words[base+(pos>>>5)]>>>shift)&mask;
    out+=part*(2**outShift);
    pos+=take;remaining-=take;outShift+=take;
  }
  return out>>>0;
}
function packIdentity(g,words){
  const l=compactLayout(g),out=new Uint32Array(l.compactWords);
  for(let c=0;c<l.prefix;c++)out[c]=words[c];
  let bitPos=0;
  for(let c=l.prefix;c<g.columns;c++)
    bitPos=writeField(out,l.prefix,bitPos,words[c],l.heightBits);
  bitPos=writeField(out,l.prefix,bitPos,words[g.metaOffset]&3,2);
  assert.equal(bitPos,l.supportBits);
  let at=l.prefix+l.supportWords;
  for(let w=0;w<l.fullCoordWords;w++)out[at++]=words[g.p0Offset+w];
  for(let w=0;w<l.fullCoordWords;w++)out[at++]=words[g.p1Offset+w];
  if(g.coordWords){
    const mask=lowMask(l.tailBits),p0=words[g.p0Offset+l.fullCoordWords]&mask,
      p1=words[g.p1Offset+l.fullCoordWords]&mask;
    if(l.packedTail)out[at++]=(p0|((p1<<l.tailBits)>>>0))>>>0;
    else{out[at++]=p0;out[at++]=p1;}
  }
  assert.equal(at,out.length);
  return out;
}
function unpackIdentity(g,compact){
  const l=compactLayout(g);assert.equal(compact.length,l.compactWords);
  const out=new Uint32Array(g.keyWords);
  for(let c=0;c<l.prefix;c++)out[c]=compact[c];
  let bitPos=0,rank=0;
  for(let c=0;c<l.prefix;c++)rank+=out[c];
  for(let c=l.prefix;c<g.columns;c++){
    out[c]=readField(compact,l.prefix,bitPos,l.heightBits);
    bitPos+=l.heightBits;rank+=out[c];
  }
  const terminal=readField(compact,l.prefix,bitPos,2);bitPos+=2;
  assert.equal(bitPos,l.supportBits);
  out[g.metaOffset]=((rank<<2)|terminal)>>>0;
  let at=l.prefix+l.supportWords;
  for(let w=0;w<l.fullCoordWords;w++)out[g.p0Offset+w]=compact[at++];
  for(let w=0;w<l.fullCoordWords;w++)out[g.p1Offset+w]=compact[at++];
  if(g.coordWords){
    const mask=lowMask(l.tailBits);
    if(l.packedTail){
      const packed=compact[at++];
      out[g.p0Offset+l.fullCoordWords]=packed&mask;
      out[g.p1Offset+l.fullCoordWords]=(packed>>>l.tailBits)&mask;
    }else{
      out[g.p0Offset+l.fullCoordWords]=compact[at++]&mask;
      out[g.p1Offset+l.fullCoordWords]=compact[at++]&mask;
    }
  }
  assert.equal(at,compact.length);
  return out;
}
function key(words){return Array.from(words).map(x=>x.toString(16).padStart(8,'0')).join('');}
function makeRandom(seed){
  let x=seed>>>0;
  return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;};
}
function verifyState(g,words){
  let sum=0;for(let c=0;c<g.columns;c++){assert.ok(words[c]<=g.rows);sum+=words[c];}
  assert.equal(words[g.metaOffset]>>>2,sum,'rank must equal support sum');
  if(g.coordWords){
    const l=compactLayout(g);
    if(l.tailBits<32){
      assert.equal(words[g.p0Offset+l.fullCoordWords]>>>l.tailBits,0,'P0 coordinate padding must be zero');
      assert.equal(words[g.p1Offset+l.fullCoordWords]>>>l.tailBits,0,'P1 coordinate padding must be zero');
    }
  }
  const compact=packIdentity(g,words),round=unpackIdentity(g,compact);
  assert.deepEqual(round,words,'compact identity must round-trip exactly');
  return compact;
}

const geometries=[[1,1],[3,3],[4,4],[5,4],[6,5],[7,6],[8,7],[4,7],[9,5],[10,10]];
const report=[];
for(let gi=0;gi<geometries.length;gi++){
  const [columns,rows]=geometries[gi],g=prepareConnect4RbaGeometry({columns,rows}),
    l=compactLayout(g),seen=new Map(),random=makeRandom(0x9e3779b9^(columns<<16)^rows);
  let states=0,duplicates=0;
  for(let game=0;game<48;game++){
    const moves=[],heights=new Uint32Array(columns);
    for(let ply=0;ply<=g.cellCount;ply++){
      const root=connect4RbaFromMoves(moves,{geometry:g,canonical:true,positionCode:false}),
        compact=verifyState(g,root.words),ck=key(compact),fk=key(root.words),prior=seen.get(ck);
      if(prior!==undefined){assert.equal(prior,fk,'compact collision must imply identical full q');duplicates++;}
      else seen.set(ck,fk);
      states++;
      if(root.words[g.metaOffset]&3)break;
      const legal=[];for(let c=0;c<columns;c++)if(heights[c]<rows)legal.push(c);
      if(!legal.length)break;
      const c=legal[random()%legal.length];moves.push(c);heights[c]+=1;
    }
  }
  report.push({columns,rows,lineCount:g.lineCount,coordWords:g.coordWords,keyWords:g.keyWords,
    compactWords:l.compactWords,prefixHeights:l.prefix,heightBits:l.heightBits,
    supportWords:l.supportWords,tailBits:l.tailBits,packedTail:l.packedTail,states,duplicates});
}
const standard=report.find(x=>x.columns===7&&x.rows===6);
assert.equal(standard.keyWords,14);assert.equal(standard.compactWords,8);
assert.equal(report.find(x=>x.columns===4&&x.rows===4).compactWords,4);
assert.equal(report.find(x=>x.columns===10&&x.rows===10).compactWords,19);
console.log(JSON.stringify({kind:'isomax-compact-shared-identity-check-v1',status:'PASS',report},null,2));

import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('./',import.meta.url),lock=JSON.parse(readFileSync(new URL('provenance.json',base)));
for(const [path,record] of Object.entries(lock.files)){
  assert.ok(!path.startsWith('/')&&!path.split('/').includes('..'));
  const text=readFileSync(new URL(path,base),'utf8').replaceAll('\r\n','\n');
  assert.equal(createHash('sha256').update(text).digest('hex'),record.sha256,path);
  if(path.startsWith('runtime/')&&path.endsWith('.mjs'))
    for(const m of text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'').matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)){
      if(m[1].startsWith('node:'))continue;
      assert.ok(m[1].startsWith('.'),'external dependency '+m[1]);
      const url=new URL(m[1],new URL(path,base));
      assert.ok(url.href.startsWith(new URL('runtime/',base).href),'dependency escapes package');
      assert.ok(lock.files[decodeURIComponent(url.href.slice(base.href.length))],'unlocked dependency '+url);
    }
}
const actual=readdirSync(new URL('runtime/',base),{recursive:true,withFileTypes:true});
assert.equal(actual.filter(x=>x.isFile()).length,Object.keys(lock.files).filter(x=>x.startsWith('runtime/')).length);
assert.equal(JSON.parse(readFileSync(new URL('package.json',base))).private,true,'publication remains disabled');
console.log(`Verified ${Object.keys(lock.files).length} locked files; all runtime imports stay inside this package.`);

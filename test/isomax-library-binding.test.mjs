import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

test('packaged RBA kernels are the canonical support libraries, including variable geometry',()=>{
  const root=new URL('../',import.meta.url);
  for(const name of ['geometry','profile','coordinate','coordinate-prepared','coordinate-dense']){
    const path='addons/rba-connect4-'+name+'.mjs';
    const read=prefix=>readFileSync(new URL(prefix+path,root),'utf8').replaceAll('\r\n','\n');
    assert.equal(read('isomax/runtime/'),read(''),path+' must be repackaged when its owner changes');
  }
  const runtime=new URL('isomax/runtime/experiments/isomax-lean/',root);
  assert.equal(existsSync(new URL('profile-masks.mjs',runtime)),false,'no private geometry compiler');
  for(const name of ['solver','solver-dense','solver-general','solver-general-dense',
    'solver-general-wide','solver-general-wide-dense','solver-general-unpacked',
    'solver-general-unpacked-dense','solver-general-wide-unpacked','solver-general-wide-unpacked-dense']){
    const source=readFileSync(new URL(name+'.mjs',runtime),'utf8');
    assert.match(source,/from '\.\.\/\.\.\/addons\/rba-connect4-profile\.mjs'/);
    assert.match(source,/from '\.\.\/\.\.\/addons\/rba-connect4-coordinate-(?:dense|prepared)\.mjs'/);
    assert.doesNotMatch(source,/from '\.\/coordinate|from '\.\/profile-masks/);
  }
});

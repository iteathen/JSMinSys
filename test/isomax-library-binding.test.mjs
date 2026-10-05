import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

test('packaged RBA kernels bind their frozen canonical source and explicit cold corrections',()=>{
  const root=new URL('../',import.meta.url);
  const lock=JSON.parse(readFileSync(new URL('isomax/provenance.json',root))),
    corrections=JSON.parse(readFileSync(new URL('isomax/cold-corrections.json',root))),
    normalize=text=>text.replaceAll('\r\n','\n'),
    digest=text=>createHash('sha256').update(text).digest('hex');
  assert.match(lock.sourceCommit,/^[0-9a-f]{40}$/);
  assert.equal(corrections.baseSourceCommit,lock.sourceCommit);
  // Active research libraries can evolve independently of this measured package.
  // Repackaging them would change its frozen hot code and historical identity.
  const paths=new Set(['geometry','profile','coordinate','coordinate-prepared','coordinate-dense']
    .map(name=>'addons/rba-connect4-'+name+'.mjs'));
  for(const path of Object.keys(corrections.files))paths.add(path);
  for(const path of Object.keys(corrections.additions))paths.add(path);
  for(const path of paths){
    let expected;
    const addition=corrections.additions[path],correction=corrections.files[path];
    if(addition){
      expected=addition.text;assert.equal(digest(expected),addition.sha256,path+' cold addition identity');
    }else{
      expected=normalize(execFileSync('git',['show',lock.sourceCommit+':'+path],{cwd:fileURLToPath(root),encoding:'utf8'}));
      if(correction){
        assert.equal(digest(expected),correction.sourceSha256,path+' frozen correction input');
        for(const {before,after} of correction.replacements){
          assert.ok(before);assert.equal(expected.split(before).length,2,path+' unique correction anchor');
          expected=expected.replace(before,after);
        }
        assert.equal(digest(expected),correction.sha256,path+' cold correction output');
      }
    }
    const actual=normalize(readFileSync(new URL('isomax/runtime/'+path,root),'utf8'));
    assert.equal(actual,expected,path+' must match declared frozen source plus explicit corrections');
    assert.equal(digest(actual),lock.files['runtime/'+path].sha256,path+' package provenance identity');
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

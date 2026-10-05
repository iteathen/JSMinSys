import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Trusted canonical-LF SHA-256 identities from this immutable source tree.
// Keep normal qualification runnable in shallow checkouts and source snapshots;
// only the separate maintainer prepare --check tool requires Git history.
const frozenSourceCommit='ab628f21fa8c989aa7fc1bc416b23ed126f82b93';
const frozenHashes={
  'addons/rba-connect4-geometry.mjs':'e57f6ad08215062587c08780540098c9573e105031d8ebadf87c202ad5c01c8f',
  'addons/rba-connect4-profile.mjs':'edd8d17bcafdb2349b688f880ff2ba26cf362003eb4969ee0d98dacb65f11727',
  'addons/rba-connect4-coordinate.mjs':'b299993155d9f0bb66c81bda032d27bba0306b41dbb053ec913a4670a613c2c7',
  'addons/rba-connect4-coordinate-prepared.mjs':'4df62559637083d4a9eb1108662ebe670699e1871dfc249ec3d820183b490b52',
  'addons/rba-connect4-coordinate-dense.mjs':'b463803372aab8ecdfbbe6185a5af1f421752e4fc00313cd6854bdf74712c71c',
  // Pin the admitted cold overlays' frozen inputs as well as the five libraries.
  'addons/connect4-rank-local-presearch.mjs':'f3bfd946a3f624e0a56b6982c86985bf03a5833fa085eebbefa5fd3cdbf8f190',
  'addons/branch-manager-host.mjs':'ae9f76f43677852e5da2855cde7e2d4ceea321a21995e0312b1c6a665b48d052',
  'experiments/isomax-lean/host.mjs':'6d8b52a75261c8a810198f7545cd3e990423353a15d22633d520efe1da388e3a',
  'experiments/isomax-lean/shared-cache.mjs':'a6b33afe59164165a5618de27d2f07b8757bf30b74f97e12827e156440793974',
  'experiments/isomax-lean/worker-dense.mjs':'00387713eeecfbc3779d1e671c2da6bd033676e81cec6ea1b3d883198251076e',
  'experiments/isomax-lean/worker-general-dense.mjs':'2d42ff46d7c8a3e0bb73a165ff0c9829ff01cf88f7cf82c2472b299c8675bc39',
  'experiments/isomax-lean/worker-general-unpacked-dense.mjs':'400342164c9500e6c4f27e920b333982df57ea479a0835c86ea64573cbd7f8b7',
  'experiments/isomax-lean/worker-general-unpacked.mjs':'f29f983d85e30cf57037029333a11568b60bb8ffc429167b8d4fa6e3328aac63',
  'experiments/isomax-lean/worker-general-wide-dense.mjs':'7915f853dd4935ddcda2f57655a79d6718dcd4baf0126f2d4b639e45ba0e8b90',
  'experiments/isomax-lean/worker-general-wide-unpacked-dense.mjs':'244fb375ac9e32dee70b9cf8c0d6e595ad35dda009e33c256567d24af308f0fd',
  'experiments/isomax-lean/worker-general-wide-unpacked.mjs':'9a4f75c6b5826c9f8c51a245d404c584f4d9f05c9e52ea8c28fda06aaab25b82',
  'experiments/isomax-lean/worker-general-wide.mjs':'921dfca6594b83338a0c51608c2af0bb05ab18ccb8538dde833109af193a70d2',
  'experiments/isomax-lean/worker-general.mjs':'167c40e0fbf76639c07f3243daf444663e59e18be31a89546215f46aa600d5ea',
  'experiments/isomax-lean/worker.mjs':'be0ce10a9709f8804f04477e877d7bf90f40f25aa45d6dfddfd1258f1d92117c',
};

test('packaged RBA kernels bind their frozen canonical source and explicit cold corrections',()=>{
  const root=new URL('../',import.meta.url);
  const lock=JSON.parse(readFileSync(new URL('isomax/provenance.json',root))),
    corrections=JSON.parse(readFileSync(new URL('isomax/cold-corrections.json',root))),
    normalize=text=>text.replaceAll('\r\n','\n'),
    digest=text=>createHash('sha256').update(text).digest('hex');
  assert.equal(lock.sourceCommit,frozenSourceCommit);
  assert.equal(corrections.baseSourceCommit,frozenSourceCommit);
  // Active research libraries can evolve independently of this measured package.
  // Repackaging them would change its frozen hot code and historical identity.
  const paths=new Set(['geometry','profile','coordinate','coordinate-prepared','coordinate-dense']
    .map(name=>'addons/rba-connect4-'+name+'.mjs'));
  for(const path of Object.keys(corrections.files))paths.add(path);
  for(const path of Object.keys(corrections.additions))paths.add(path);
  for(const path of paths){
    const actual=normalize(readFileSync(new URL('isomax/runtime/'+path,root),'utf8'));
    const addition=corrections.additions[path],correction=corrections.files[path];
    if(addition){
      assert.ok(!frozenHashes[path],path+' cannot replace frozen source through the addition path');
      assert.equal(actual,addition.text,path+' cold addition content');
      assert.equal(digest(actual),addition.sha256,path+' cold addition identity');
    }else{
      assert.ok(frozenHashes[path],path+' requires an independently pinned frozen identity');
      let original=actual;
      if(correction){
        assert.equal(correction.sourceSha256,frozenHashes[path],path+' declared frozen correction input');
        assert.equal(digest(actual),correction.sha256,path+' cold correction output');
        // Recover and authenticate the frozen base without loading a Git object.
        for(const {before,after} of [...correction.replacements].reverse()){
          assert.ok(before);assert.ok(after);
          assert.equal(original.split(after).length,2,path+' unique reverse correction anchor');
          original=original.replace(after,before);
        }
        assert.equal(digest(original),frozenHashes[path],path+' recovered frozen correction input');
        let roundTrip=original;
        for(const {before,after} of correction.replacements){
          assert.equal(roundTrip.split(before).length,2,path+' unique correction anchor');
          roundTrip=roundTrip.replace(before,after);
        }
        assert.equal(roundTrip,actual,path+' cold correction roundtrip');
      }
      assert.equal(digest(original),frozenHashes[path],path+' frozen canonical source identity');
    }
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

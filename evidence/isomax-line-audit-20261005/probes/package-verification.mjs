// Audit-only: mutate a disposable copy, never the installed solver package.
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, realpathSync, renameSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const temporaryRoot = realpathSync(mkdtempSync(join(tmpdir(), 'isomax-package-audit-')));
const packageCopy = resolve(temporaryRoot, 'package');
assert.ok(packageCopy.startsWith(temporaryRoot + '\\') || packageCopy.startsWith(temporaryRoot + '/'));
try {
  cpSync(fileURLToPath(new URL('../../../isomax/', import.meta.url)), packageCopy, {recursive:true});
  for (const file of ['index.mjs','profile.json']) renameSync(join(packageCopy,file),join(packageCopy,file+'.removed'));
  const result=spawnSync(process.execPath,[join(packageCopy,'verify.mjs')],{encoding:'utf8'});
  console.log(JSON.stringify({removed:['index.mjs','profile.json'],exitStatus:result.status,stdout:result.stdout,stderr:result.stderr}));
  assert.equal(result.status,0,'finding no longer reproduces; reassess audit');
} finally {
  // The recursively removed target is the checked, freshly created temporary root.
  assert.equal(realpathSync(temporaryRoot),temporaryRoot);
  assert.ok(temporaryRoot.startsWith(realpathSync(tmpdir())));
  rmSync(temporaryRoot,{recursive:true,force:true});
}

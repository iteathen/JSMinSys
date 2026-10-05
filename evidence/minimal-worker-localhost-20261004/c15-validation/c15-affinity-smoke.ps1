$ErrorActionPreference='Stop'
Set-Location C:/r/jsminsys-cpc-rebuild-20261004
$dir='C:/r/minimal-worker-localhost-20261004/c15-affinity-smoke'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$config=Get-Content evidence/minimal-worker-localhost-20261004/immediate-win-01/invocation.json -Raw | ConvertFrom-Json
$config.upstream_commit=(git rev-parse HEAD)
$config.arguments=@('--max-inlined-bytecode-size=600','--max-inlined-bytecode-size-cumulative=2400','--import','file:///C:/r/jsminsys-cpc-rebuild-20261004/tools/benchmark-v8-startup-preload.mjs','--experimental-ffi','--import','file:///C:/r/jsminsys-cpc-rebuild-20261004/tools/worker-affinity-preload.mjs','C:/r/minimal-worker-localhost-20261004/c15-affinity-smoke.mjs')
$config.affinityMask=4181
$config.timeoutMs=30000
$config.environment.JMS_WORKER_AFFINITY_REPORT="$dir/affinity"
$config.environment | Add-Member -NotePropertyName JMS_MAINTENANCE_AFFINITY_FILE -NotePropertyValue 'C:/r/jsminsys-cpc-rebuild-20261004/evidence/minimal-worker-localhost-20261004/maintenance-preflight/target.json' -Force
$config.stdout="$dir/stdout.json"
$config.stderr="$dir/stderr.txt"
$config.measurement="$dir/measurement.json"
$config | ConvertTo-Json -Depth 10 | Set-Content "$dir/invocation.json"
& C:/r/c4-external-20261004/research/benchmarks/c4-0011-external-20261004/measure.ps1 -Config "$dir/invocation.json"
Get-Content "$dir/stdout.json","$dir/measurement.json"
Get-ChildItem "$dir/affinity-*.json" | ForEach-Object {Get-Content $_.FullName}

param([Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9-]+$')][string]$Name,[string]$LocalLayout='split',[switch]$Inlining,[switch]$CpuProfile)
$ErrorActionPreference='Stop'
$repo='C:/r/jsminsys-cpc-rebuild-20261004'
Set-Location $repo
if(Get-CimInstance Win32_Process | Where-Object {$_.Name -eq 'node.exe' -and $_.CommandLine -match 'bench-minimal-i5.mjs|probes.diagnostic.mjs'}){throw 'Solver workload already active'}
$runDir="C:/r/minimal-worker-localhost-20261004/$Name"
if(Test-Path "$runDir/measurement.json"){throw 'Run already exists'}
New-Item -ItemType Directory -Force -Path "$runDir/temp","$runDir/affinity" | Out-Null
$config=Get-Content evidence/minimal-worker-localhost-20261004/c4ideas-c20-01/invocation.json -Raw | ConvertFrom-Json
$config.upstream_commit=git rev-parse HEAD
$config.arguments[-1]="$repo/evidence/c4-inspired-optimization-20261005/probes/diagnostic.mjs"
if($Inlining){$config.arguments=@('--trace-turbo-inlining')+@($config.arguments)}
if($CpuProfile){$config.arguments=@('--cpu-prof',"--cpu-prof-dir=$runDir")+@($config.arguments)}
$config.environment.JMS_BENCH_LOCAL_TT_LAYOUT=$LocalLayout
$config.environment.JMS_WORKER_AFFINITY_REPORT="$runDir/affinity"
$config.environment.TEMP="$runDir/temp"; $config.environment.TMP="$runDir/temp"
$config.timeoutMs=60000
$config.stdout="$runDir/stdout.txt"; $config.stderr="$runDir/stderr.txt"; $config.measurement="$runDir/measurement.json"
$config | ConvertTo-Json -Depth 10 | Set-Content "$runDir/invocation.json"
& C:/r/c4-external-20261004/research/benchmarks/c4-0011-external-20261004/measure.ps1 -Config "$runDir/invocation.json"
$out="evidence/minimal-worker-localhost-20261004/$Name"
New-Item -ItemType Directory -Force -Path $out | Out-Null
Copy-Item -Path "$runDir/*.json","$runDir/*.txt" -Destination $out -Force
Get-Content "$runDir/measurement.json"

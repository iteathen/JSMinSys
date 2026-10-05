param([Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9-]+$')][string]$Name,[UInt64]$SharedCapacity=0,[UInt64]$LocalCapacity=0)
$ErrorActionPreference='Stop'
$repo='C:/r/jsminsys-cpc-rebuild-20261004'
Set-Location $repo
$existing=Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*bench-minimal-i5.mjs*' }
if($existing){throw 'An existing benchmark is running'}
$runDir="C:/r/minimal-worker-localhost-20261004/$Name"
if(Test-Path "$runDir/measurement.json"){throw 'Run already exists'}
New-Item -ItemType Directory -Force -Path "$runDir/temp","$runDir/affinity" | Out-Null
$config=Get-Content evidence/minimal-worker-localhost-20261004/immediate-win-01/invocation.json -Raw | ConvertFrom-Json
$config.upstream_commit=(git rev-parse HEAD)
if($SharedCapacity){$config.environment | Add-Member -NotePropertyName JMS_BENCH_SHARED_CAPACITY -NotePropertyValue ([string]$SharedCapacity) -Force}
if($LocalCapacity){$config.environment | Add-Member -NotePropertyName JMS_BENCH_LOCAL_CAPACITY -NotePropertyValue ([string]$LocalCapacity) -Force}
$config.environment.TEMP="$runDir/temp"
$config.environment.TMP="$runDir/temp"
$config.environment.JMS_WORKER_AFFINITY_REPORT="$runDir/affinity"
$config.stdout="$runDir/stdout.json"
$config.stderr="$runDir/stderr.txt"
$config.measurement="$runDir/measurement.json"
$config | ConvertTo-Json -Depth 10 | Set-Content "$runDir/invocation.json"
Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' } | Select-Object ProcessId,ParentProcessId,Name,CommandLine | ConvertTo-Json -Depth 5 | Set-Content "$runDir/preflight-processes.json"
Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory,TotalVirtualMemorySize,FreeVirtualMemory | ConvertTo-Json | Set-Content "$runDir/preflight-memory.json"
git status --short | Set-Content "$runDir/source-status.txt"
& C:/r/c4-external-20261004/research/benchmarks/c4-0011-external-20261004/measure.ps1 -Config "$runDir/invocation.json"
$remaining=Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*bench-minimal-i5.mjs*' }
[pscustomobject]@{checkedAt=(Get-Date).ToString('o');remainingBenchmarkProcesses=@($remaining | Select-Object ProcessId,CommandLine);clean=(@($remaining).Count -eq 0)} | ConvertTo-Json -Depth 6 | Set-Content "$runDir/cleanup-verification.json"
$evidenceDir="evidence/minimal-worker-localhost-20261004/$Name"
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
Copy-Item -Path "$runDir/*.json","$runDir/*.txt" -Destination $evidenceDir -Force
Get-Content "$runDir/stdout.json","$runDir/measurement.json","$runDir/cleanup-verification.json"

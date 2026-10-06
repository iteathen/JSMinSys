param([Parameter(Mandatory=$true)][string]$NodePath,[string]$OutputDirectory=(Join-Path $env:TEMP ('isomax-'+[guid]::NewGuid())))
$ErrorActionPreference='Stop'
$binary=(Resolve-Path -LiteralPath $NodePath).Path
if((Get-CimInstance Win32_Processor).Name -notmatch 'i5-12600K'){throw 'This affinity profile requires the measured i5-12600K. Use node run.mjs on other machines.'}
$version=& $binary --version
if($version -ne 'v27.0.0-nightly20260928b59840b593'){throw 'Recorded Node27 nightly required for measured affinity. Use node run.mjs for other runtimes.'}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$info=[System.Diagnostics.ProcessStartInfo]::new()
$info.FileName=$binary
$info.WorkingDirectory=$PSScriptRoot
$info.UseShellExecute=$false
$info.RedirectStandardOutput=$true
$info.RedirectStandardError=$true
foreach($arg in @('--max-inlined-bytecode-size=2400','--max-inlined-bytecode-size-cumulative=9600','--import',([uri]::new((Join-Path $PSScriptRoot 'runtime/tools/benchmark-v8-startup-preload.mjs')).AbsoluteUri),'--experimental-ffi','--import',([uri]::new((Join-Path $PSScriptRoot 'runtime/tools/worker-affinity-preload.mjs')).AbsoluteUri),(Join-Path $PSScriptRoot 'cli.mjs'),'--workers','4')){$info.ArgumentList.Add($arg)}
$info.Environment['JMS_WORKER_AFFINITY_FILE']=Join-Path $PSScriptRoot 'targets.json'
$info.Environment['JMS_WORKER_AFFINITY_REPORT']=Join-Path $OutputDirectory 'affinity'
$process=[System.Diagnostics.Process]::Start($info)
$outputTask=$process.StandardOutput.ReadToEndAsync()
$errorTask=$process.StandardError.ReadToEndAsync()
try {
 $process.ProcessorAffinity=[IntPtr]85
 if(!$process.WaitForExit(650000)){throw 'External650s safety ceiling exceeded.'}
 if($process.ExitCode -ne 0){throw ('Solver failed with exit '+$process.ExitCode)}
} finally {
 if(!$process.HasExited){$process.Kill();$process.WaitForExit()}
 $outputText=$outputTask.GetAwaiter().GetResult()
 $errorText=$errorTask.GetAwaiter().GetResult()
 [System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'result.json'),$outputText)
 [System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'stderr.txt'),$errorText)
 $process.Dispose()
}
Write-Output $outputText
Write-Host ('Affinity reports: '+$OutputDirectory)

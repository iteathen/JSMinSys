param([Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9-]+$')][string]$Name)
$ErrorActionPreference='Stop'
$repo=[System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Set-Location -LiteralPath $repo
# Recovered selected localhost settings, not the old launcher/profile defaults.
& (Join-Path $repo 'evidence/minimal-worker-localhost-20261004/run-campaign.ps1') `
 -Name $Name -SharedCapacity 134217728 -LocalCapacity 8388608 -SharedProofBounds `
 -SupportPlanBudget 1073741824 -SupportClosures -SupportReflection `
 -PrivateLayout native -BasisViews `
 -NodeFlags @('--max-inlined-bytecode-size=2400','--max-inlined-bytecode-size-cumulative=9600')
exit $LASTEXITCODE

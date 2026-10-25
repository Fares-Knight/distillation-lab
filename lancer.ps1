[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('dev', 'preview', 'test', 'build')]
    [string]$Action = 'dev',

    [ValidateRange(0, 65535)]
    [int]$Port = 0
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$nodeDirectory = Join-Path $projectRoot '.tools\node-v24.22.0-win-x64'
$nodeExecutable = Join-Path $nodeDirectory 'node.exe'
$npmCli = Join-Path $nodeDirectory 'node_modules\npm\bin\npm-cli.js'

if (-not (Test-Path -LiteralPath $nodeExecutable -PathType Leaf) -or
    -not (Test-Path -LiteralPath $npmCli -PathType Leaf)) {
    throw 'Node portable est absent. Voir README.md pour le lancement avec Node et npm standards. Aucune installation automatique.'
}
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules') -PathType Container)) {
    throw 'Les dependances locales sont absentes. Voir README.md. Ce script ne les installe pas.'
}
if ($Action -eq 'preview' -and -not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist\index.html') -PathType Leaf)) {
    throw 'Distribution absente : executer .\lancer.ps1 build avant preview.'
}
if ($Port -ne 0 -and $Action -notin @('dev', 'preview')) {
    throw 'Le parametre -Port concerne seulement dev et preview.'
}

$npmArguments = @($npmCli, 'run', $Action)
if ($Port -ne 0) {
    $npmArguments += @('--', '--port', [string]$Port)
}

$previousPath = $env:PATH
$resultCode = 1
Push-Location -LiteralPath $projectRoot
try {
    # Child processes find the same portable Node. The caller's PATH is restored.
    $env:PATH = $nodeDirectory + [IO.Path]::PathSeparator + $previousPath
    & $nodeExecutable @npmArguments
    $resultCode = $LASTEXITCODE
}
finally {
    $env:PATH = $previousPath
    Pop-Location
}
exit $resultCode

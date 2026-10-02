#Requires -Version 7.0
$ErrorActionPreference = 'Stop'
$repository = Split-Path -Parent $PSScriptRoot
Push-Location $repository
try {
    dotnet test CadastroCurriculos.sln --verbosity minimal
    if ($LASTEXITCODE -ne 0) { throw 'Os testes do backend falharam.' }
    Push-Location frontend
    try {
        npm run lint
        if ($LASTEXITCODE -ne 0) { throw 'O lint do frontend falhou.' }
        npm run format:check
        if ($LASTEXITCODE -ne 0) { throw 'A formatação do frontend está fora do padrão.' }
        npm test
        if ($LASTEXITCODE -ne 0) { throw 'Os testes do frontend falharam.' }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'O build do frontend falhou.' }
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}

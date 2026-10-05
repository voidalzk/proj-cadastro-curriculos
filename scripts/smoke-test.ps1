#Requires -Version 7.0
param(
    [string]$BaseUrl = 'http://localhost:5000',
    [string]$PdfPath = (Join-Path $PSScriptRoot '../samples/curriculo-ficticio.pdf')
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')

function Assert-True([bool]$Condition, [string]$Message) {
    if (!$Condition) { throw $Message }
}

$health = Invoke-RestMethod "$BaseUrl/health/ready"
Assert-True ($health.status -eq 'ok') 'O banco de dados não está disponível.'

$inputData = @{
    fullName = '  Candidato Fictício - Teste de integração  '
    email = "TESTE-$([Guid]::NewGuid().ToString('N'))@example.com"
}
$response = Invoke-WebRequest "$BaseUrl/api/candidates" -Method Post -ContentType 'application/json' -Body ($inputData | ConvertTo-Json)
Assert-True ($response.StatusCode -eq 201) 'O cadastro deve retornar HTTP 201.'
$candidate = $response.Content | ConvertFrom-Json
Assert-True ($candidate.fullName -eq $inputData.fullName.Trim()) 'O nome deve ser normalizado.'
Assert-True ($candidate.email -eq $inputData.email.ToLowerInvariant()) 'O e-mail deve ser normalizado.'
Assert-True ($null -eq $candidate.phone) 'O telefone deve ser opcional.'
Assert-True ($null -eq $candidate.professionalSummary) 'O resumo deve ser opcional.'

$detail = Invoke-RestMethod "$BaseUrl/api/candidates/$($candidate.id)"
Assert-True ($detail.email -eq $candidate.email) 'Os detalhes devem consultar o candidato salvo.'
$list = Invoke-RestMethod "$BaseUrl/api/candidates"
Assert-True ($candidate.id -in $list.id) 'O candidato deve aparecer na listagem.'

$invalid = Invoke-WebRequest "$BaseUrl/api/candidates" -Method Post -ContentType 'application/json' -Body '{"fullName":"Ana Silva","email":"invalido"}' -SkipHttpErrorCheck
Assert-True ($invalid.StatusCode -eq 400) 'E-mail inválido deve retornar HTTP 400.'
$missing = Invoke-WebRequest "$BaseUrl/api/candidates/$([Guid]::NewGuid())" -SkipHttpErrorCheck
Assert-True ($missing.StatusCode -eq 404) 'Candidato inexistente deve retornar HTTP 404.'

Assert-True (Test-Path -LiteralPath $PdfPath) 'Informe em -PdfPath um currículo fictício em PDF para testar a importação.'
$beforeImportList = Invoke-RestMethod "$BaseUrl/api/candidates"
$extracted = Invoke-RestMethod "$BaseUrl/api/resumes/extract" -Method Post -Form @{ file = Get-Item -LiteralPath $PdfPath }
Assert-True (![string]::IsNullOrWhiteSpace($extracted.fullName)) 'O PDF de teste deve ter um nome identificável.'
Assert-True (![string]::IsNullOrWhiteSpace($extracted.email)) 'O PDF de teste deve ter um e-mail identificável.'
$afterImportList = Invoke-RestMethod "$BaseUrl/api/candidates"
Assert-True ($beforeImportList.Count -eq $afterImportList.Count) 'Importar PDF não deve salvar um candidato.'

$reviewed = @{
    fullName = $extracted.fullName + ' - Revisado'
    email = "pdf-$([Guid]::NewGuid().ToString('N'))@example.com"
    phone = $extracted.phone
    interestArea = 'Desenvolvimento backend'
    professionalSummary = 'Resumo preenchido após revisar a importação.'
}
$saved = Invoke-RestMethod "$BaseUrl/api/candidates" -Method Post -ContentType 'application/json' -Body ($reviewed | ConvertTo-Json)
$savedDetail = Invoke-RestMethod "$BaseUrl/api/candidates/$($saved.id)"
Assert-True ($savedDetail.fullName -eq $reviewed.fullName) 'O nome revisado deve ser salvo.'
Assert-True ($savedDetail.email -eq $reviewed.email) 'O e-mail corrigido deve ser salvo.'
Assert-True ($savedDetail.phone -eq $reviewed.phone) 'O telefone importado deve ser salvo.'
Assert-True ($savedDetail.professionalSummary -eq $reviewed.professionalSummary) 'O resumo manual deve ser salvo.'
$list = Invoke-RestMethod "$BaseUrl/api/candidates"
Assert-True ($saved.id -in $list.id) 'O candidato importado deve aparecer na listagem.'

$invalidPdf = Join-Path ([System.IO.Path]::GetTempPath()) ("curriculo-invalido-" + [Guid]::NewGuid().ToString('N') + '.pdf')
try {
    [System.IO.File]::WriteAllText($invalidPdf, 'Este arquivo não é um PDF.')
    $failedImport = Invoke-WebRequest "$BaseUrl/api/resumes/extract" -Method Post -Form @{ file = Get-Item -LiteralPath $invalidPdf } -SkipHttpErrorCheck
    Assert-True ($failedImport.StatusCode -eq 422) 'Um arquivo renomeado deve falhar na leitura.'
    $manualAfterFailure = Invoke-RestMethod "$BaseUrl/api/candidates" -Method Post -ContentType 'application/json' -Body (@{
        fullName = 'Cadastro manual após falha de importação'
        email = "manual-$([Guid]::NewGuid().ToString('N'))@example.com"
    } | ConvertTo-Json)
    $manualDetail = Invoke-RestMethod "$BaseUrl/api/candidates/$($manualAfterFailure.id)"
    Assert-True ($manualDetail.email -eq $manualAfterFailure.email) 'O cadastro manual deve funcionar após falha na importação.'
} finally {
    Remove-Item -LiteralPath $invalidPdf -ErrorAction SilentlyContinue
}

Write-Output 'Integração verificada: cadastro manual, importação sem salvar, revisão, persistência, listagem, detalhes e cadastro após falha de leitura.'
Write-Output "Registros fictícios criados: $($candidate.id), $($saved.id), $($manualAfterFailure.id)"

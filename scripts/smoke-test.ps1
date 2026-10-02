#Requires -Version 7.0
param([string]$BaseUrl = 'http://localhost:5000')

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

Write-Output "Integração verificada: cadastro manual, normalização, persistência, listagem, detalhes, validação e HTTP 404."
Write-Output "Registro fictício criado para conferência: $($candidate.id)"

# Cadastro de currículos

Aplicação para cadastrar e consultar candidatos, feita com React, ASP.NET Core e SQL Server.

O cadastro pode ser preenchido manualmente ou com ajuda de um currículo em PDF. A importação tenta encontrar nome, e-mail e telefone. Os dados podem ser corrigidos no mesmo formulário antes de salvar.

## Funcionalidades

- Cadastro manual, sem necessidade de enviar um arquivo.
- Importação opcional de PDF de até 5 MB, com leitura feita no backend.
- Preenchimento dos campos vazios, preservando o que já foi digitado.
- Validação de nome e e-mail obrigatórios e do formato do e-mail.
- Listagem com busca por nome, e-mail ou área de interesse.
- Tela de detalhes do candidato.
- Persistência no SQL Server.
- Mensagens de sucesso, arquivo inválido, falha na leitura e erro no cadastro.

A importação não salva um candidato. O cadastro só acontece ao clicar em **Salvar candidato**. Uma falha na leitura do PDF não impede o preenchimento manual.

## Tecnologias

| Tecnologia                             | Versão            |
| -------------------------------------- | ----------------- |
| React / React DOM                      | 19.3.0            |
| TypeScript                             | 6.0.3             |
| Vite                                   | 8.3.2             |
| React Router                           | 7.18.4            |
| Node.js / npm                          | 24.15.0 / 11.12.1 |
| .NET SDK                               | 10.0.401          |
| ASP.NET Core / Entity Framework Core   | 10.0.12           |
| PdfPig                                 | 0.1.16            |
| SQL Server LocalDB usado nos testes    | 17.0.4025.3       |
| SQL Server no Docker, como alternativa | 2022 Developer    |
| xUnit                                  | 2.9.3             |
| Vitest                                 | 5.0.3             |
| Testing Library React                  | 16.3.3            |

As dependências estão registradas em `package-lock.json` e `packages.lock.json`.

## Estrutura

```text
frontend/src/
  app/                    Rotas e estilos
  features/candidates/    Cadastro, importação, listagem e detalhes
  lib/                    Cliente HTTP
  test/                   Configuração dos testes
backend/
  src/CadastroCurriculos.Api/
    Controllers/          Endpoints
    Data/Migrations/      Banco e migrations
    DTOs/                 Dados de entrada e saída
    Errors/               Tratamento de erros
    Models/               Modelo do candidato
    Services/             Leitura e identificação dos dados do PDF
  tests/CadastroCurriculos.Api.Tests/
database/                 Script SQL
samples/                  Currículo fictício
scripts/                  Testes e verificação da integração
```

## Requisitos

- .NET SDK 10.0.401 ou uma versão compatível da linha 10.0, conforme `global.json`.
- Node.js 24.15.0 e npm.
- SQL Server disponível, instalado ou em Docker. No Windows, também é possível usar LocalDB.
- PowerShell 7 para os scripts `.ps1`. Os comandos individuais podem ser executados em outro terminal.

Execute os comandos a partir da raiz do repositório.

## Instalar as dependências

```sh
dotnet tool restore
dotnet restore --locked-mode
npm ci --prefix frontend
```

## Configurar o banco

Escolha uma das opções abaixo.

### LocalDB no Windows

O `appsettings.json` usa a instância `CurriculosDev`, com autenticação do Windows e banco `CadastroCurriculos`.

```powershell
SqlLocalDB create CurriculosDev
SqlLocalDB start CurriculosDev
```

Se a instância já existir, execute apenas o comando de início.

### Outra instância de SQL Server

Copie o exemplo e ajuste a conexão:

```powershell
Copy-Item backend/src/CadastroCurriculos.Api/appsettings.Local.example.json backend/src/CadastroCurriculos.Api/appsettings.Local.json
```

Exemplo de configuração:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=CadastroCurriculos;User Id=SEU_USUARIO;Password=SUA_SENHA;Encrypt=True;TrustServerCertificate=True"
  }
}
```

Substitua servidor, usuário e senha pelos dados do seu ambiente. O arquivo `appsettings.Local.json` é ignorado pelo Git. `TrustServerCertificate=True` é usado para a conexão local.

Também é possível configurar a conexão por variável de ambiente, que tem prioridade sobre os arquivos:

```powershell
$env:ConnectionStrings__DefaultConnection = 'Server=localhost,1433;Database=CadastroCurriculos;User Id=SEU_USUARIO;Password=SUA_SENHA;Encrypt=True;TrustServerCertificate=True'
```

Nesse caso, execute a migration e inicie a API no terminal em que a variável foi definida.

### SQL Server no Docker

Com Docker em execução, copie o exemplo:

```powershell
Copy-Item .env.example .env
```

Preencha `SQL_SERVER_PASSWORD` no `.env` com uma senha que atenda às regras do SQL Server. Depois, inicie o container:

```sh
docker compose up -d sqlserver
docker compose logs sqlserver
```

Aguarde o banco ficar disponível. Configure a conexão da API conforme a seção anterior, usando `Server=localhost,1433`, `User Id=sa` e a senha definida no `.env`.

O `.env` é usado pelo Docker; a API recebe a conexão pelo arquivo local ou pela variável de ambiente. O volume do container mantém os dados entre reinícios. A verificação do projeto foi feita com LocalDB; a alternativa em Docker não foi executada nessa verificação.

## Criar a estrutura do banco

Com a conexão configurada:

```sh
dotnet ef database update --project backend/src/CadastroCurriculos.Api
```

A migration cria o banco, se o usuário tiver permissão, e a tabela `Candidates`. Ela não é aplicada automaticamente ao iniciar a API.

Como alternativa, crie um banco vazio chamado `CadastroCurriculos` e execute [database/001_initial.sql](database/001_initial.sql) pelo SQL Server Management Studio ou `sqlcmd`. O script é idempotente. Use a migration ou o script para criar a estrutura.

O banco começa vazio. Os registros usados no desenvolvimento não fazem parte do repositório.

## Executar

Inicie a API em um terminal:

```sh
dotnet run --project backend/src/CadastroCurriculos.Api --launch-profile http
```

Em outro terminal, inicie o frontend:

```sh
npm run dev --prefix frontend
```

- Frontend: [http://localhost:5173](http://localhost:5173).
- API em execução: [http://localhost:5000/health](http://localhost:5000/health).
- Conexão com o banco: [http://localhost:5000/health/ready](http://localhost:5000/health/ready).

O Vite encaminha as chamadas de `/api` para `http://localhost:5000`. Para usar outro endereço, copie `frontend/.env.example` para `frontend/.env.local` e ajuste `VITE_API_URL`, incluindo o caminho `/api`. Quando o frontend acessar a API em outra origem, ajuste também `Cors:AllowedOrigins` no backend.

## Testar o cadastro com PDF

1. Abra a tela de novo cadastro.
2. Selecione [samples/curriculo-ficticio.pdf](samples/curriculo-ficticio.pdf) e clique em **Importar PDF**.
3. Confira nome, e-mail e telefone. Corrija ou complete os dados.
4. Clique em **Salvar candidato**.
5. Confira a tela de detalhes e a presença do candidato na listagem.

Para testar o cadastro manual, preencha o mesmo formulário sem selecionar um arquivo. Também é possível continuar manualmente após um erro de importação.

O arquivo PDF é usado apenas para leitura. Ele não é armazenado como anexo no banco.

## Validações e limitações

- Nome: obrigatório, até 150 caracteres.
- E-mail: obrigatório, com formato válido, até 254 caracteres.
- Telefone: opcional, até 30 caracteres.
- Área ou cargo: opcional, até 150 caracteres.
- Resumo profissional: opcional, até 3.000 caracteres.
- PDF: não vazio, até 5 MB (5.242.880 bytes). O backend confere extensão, tipo informado, assinatura do arquivo e tenta abrir o documento.

A extração usa texto do PDF e regras simples. O nome é procurado em um campo identificado como nome ou nas primeiras linhas do currículo. E-mail e telefone são identificados por padrões; o telefone considera formatos brasileiros. Área de interesse e resumo são preenchidos manualmente.

Currículos com várias colunas ou diagramação diferente podem gerar resultados incompletos ou incorretos. Quando houver mais de um e-mail ou telefone, é usado o primeiro encontrado. Confira os dados antes de salvar.

Não há OCR. PDFs digitalizados sem texto, protegidos ou corrompidos recebem uma mensagem de erro e permitem continuar o cadastro manual. A leitura também limita o documento a 100 páginas e 200.000 caracteres de texto.

A busca é feita sobre a lista carregada, sem paginação no backend. E-mails repetidos são permitidos. Não há autenticação.

## Testes

Os testes automatizados de backend e frontend não precisam de um banco ativo.

```sh
dotnet test CadastroCurriculos.sln
npm test --prefix frontend
npm run lint --prefix frontend
npm run format:check --prefix frontend
npm run build --prefix frontend
```

Ou execute as verificações com PowerShell 7:

```powershell
./scripts/test.ps1
```

Na verificação da implementação, passaram 32 testes de backend e 22 de frontend. Eles cobrem validação dos campos, upload, leitura completa e parcial, PDF protegido ou sem texto, limites de tamanho e preservação do formulário após falha.

Com API e banco em execução, rode a verificação da integração:

```powershell
./scripts/smoke-test.ps1
```

É possível informar outro endereço de API e outro PDF fictício:

```powershell
./scripts/smoke-test.ps1 -BaseUrl http://localhost:5000 -PdfPath ./samples/curriculo-ficticio.pdf
```

O script verifica cadastro manual, importação sem salvar, revisão dos dados, listagem, detalhes e cadastro após falha na leitura. Ele cria três candidatos fictícios, que permanecem no banco para conferência. Use um banco de testes.

A integração com SQL Server real foi verificada localmente, incluindo uma instalação limpa com banco novo e consulta dos registros após reiniciar a API.

## Endpoints

| Método | Rota                   | Descrição                                    |
| ------ | ---------------------- | -------------------------------------------- |
| GET    | `/health`              | Verifica se a API está em execução           |
| GET    | `/health/ready`        | Verifica a conexão com o banco               |
| GET    | `/api/candidates`      | Lista os candidatos                          |
| GET    | `/api/candidates/{id}` | Consulta os detalhes                         |
| POST   | `/api/candidates`      | Salva o cadastro revisado                    |
| POST   | `/api/resumes/extract` | Recebe o PDF e retorna os campos encontrados |

O endpoint de importação recebe `multipart/form-data` com o arquivo no campo `file`. Nome, e-mail e telefone podem ser `null`; o campo `warnings` informa o que não foi identificado.

O cadastro retorna `201`. Erros de validação retornam `400`, candidato inexistente retorna `404`, falha na leitura do PDF retorna `422` e envios que excedem o limite do corpo da requisição também podem retornar `413`. As mensagens são apresentadas em português.

O relato de desenvolvimento e uso de IA está em [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md).

# Desenvolvimento

Usei a IA para dar o start no projeto e ir implementando o backend em .NET enquanto aprendia C# e ASP.NET Core. Também usei para entender como ler o texto dos PDFs, identificar nome, e-mail e telefone e preencher o formulário com essas informações, além de ajudar na estilização do frontend, produziu o currículo fictício e ajudou a documentar o projeto no README.md.

Demorei aproximadamente 17 horas no total. O frontend foi rápido, mas o backend levou mais tempo porque eu estava aprendendo .NET durante o desenvolvimento.

Comecei pelo cadastro manual, pela listagem e pela tela de detalhes. Depois veio a importação do PDF, usando o mesmo formulário e permitindo corrigir os dados antes de salvar. Usei React com TypeScript no frontend, ASP.NET Core com Entity Framework Core no backend e SQL Server no banco. A leitura do PDF foi feita com PdfPig.

Utilizei o Codex com GPT-6, para tirar dúvidas e receber ajuda com explicações e código. Alguns pedidos foram como organizar o backend em .NET, como receber e ler um PDF e organizar o CSS.

Durante os ajustes, o visual foi simplificado e a importação passou a preservar os campos já preenchidos. Também foi corrigido o retorno de arquivos grandes para mostrar uma mensagem clara. O PDF serve para ajudar no preenchimento; o cadastro só é salvo depois da revisão.

A verificação incluiu 32 testes de backend, 22 de frontend, build, lint e formatação, além dos fluxos no navegador e da integração com SQL Server. Também foi conferida a configuração em uma cópia limpa com banco novo e a persistência dos dados após reiniciar a API.

A principal dificuldade foi aprender .NET junto com o desenvolvimento do backend. A extração usa regras simples e pode precisar de correção manual. PDFs digitalizados não têm OCR nesta solução. Com mais tempo, eu testaria mais formatos de currículo, melhoraria a identificação dos campos e adicionaria paginação.

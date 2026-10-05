using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using CadastroCurriculos.Api.DTOs;
using CadastroCurriculos.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CadastroCurriculos.Api.Tests;

public class ResumesApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public ResumesApiTests(WebApplicationFactory<Program> factory)
    {
        client = factory.CreateClient();
    }

    [Fact]
    public async Task ExtractsContactWithoutAccessingDatabase()
    {
        var response = await Upload(ResumePdf.Create("Ana Martins Silva", "ANA@example.com", "+55 (11) 98765-4321"));
        var result = await response.Content.ReadFromJsonAsync<ResumeExtractionResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Ana Martins Silva", result!.FullName);
        Assert.Equal("ana@example.com", result.Email);
        Assert.Equal("+55 (11) 98765-4321", result.Phone);
        Assert.Empty(result.Warnings);
    }

    [Fact]
    public async Task ReturnsPartialFieldsAndWarnings()
    {
        var response = await Upload(ResumePdf.Create("Curriculo", "ana@example.com"));
        var result = await response.Content.ReadFromJsonAsync<ResumeExtractionResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Null(result!.FullName);
        Assert.Null(result.Phone);
        Assert.Equal("ana@example.com", result.Email);
        Assert.Equal(2, result.Warnings.Count);
    }

    [Fact]
    public async Task PrefersLabeledNameAndIgnoresHeadings()
    {
        var response = await Upload(ResumePdf.Create("Curriculo profissional", "Nome completo: Jose da Silva", "Contato", "(21) 3456-7890"));
        var result = await response.Content.ReadFromJsonAsync<ResumeExtractionResponse>();

        Assert.Equal("Jose da Silva", result!.FullName);
        Assert.Equal("(21) 3456-7890", result.Phone);
    }

    [Fact]
    public async Task DoesNotUseProfessionalHeadingAsName()
    {
        var response = await Upload(ResumePdf.Create("Experiencia profissional", "Desenvolvedor de sistemas", "teste@example.com"));
        var result = await response.Content.ReadFromJsonAsync<ResumeExtractionResponse>();

        Assert.Null(result!.FullName);
    }

    [Fact]
    public async Task RejectsMissingFile()
    {
        using var form = new MultipartFormDataContent();
        var response = await client.PostAsync("/api/resumes/extract", form);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RejectsEmptyFile() =>
        await AssertProblem(await Upload([]), HttpStatusCode.BadRequest, "vazio");

    [Theory]
    [InlineData("curriculo.txt", "application/pdf")]
    [InlineData("curriculo.pdf", "text/plain")]
    public async Task RejectsInvalidExtensionOrContentType(string name, string contentType) =>
        await AssertProblem(await Upload(ResumePdf.Create("Ana Silva"), name, contentType), HttpStatusCode.BadRequest, "PDF");

    [Fact]
    public async Task RejectsTextRenamedToPdf() =>
        await AssertProblem(await Upload(Encoding.UTF8.GetBytes("Ana Silva")), HttpStatusCode.UnprocessableEntity, "conteúdo");

    [Fact]
    public async Task RejectsCorruptedPdf() =>
        await AssertProblem(await Upload("%PDF-1.4\ncorrompido"u8.ToArray()), HttpStatusCode.UnprocessableEntity, "corrompido");

    [Fact]
    public async Task RejectsProtectedPdf() =>
        await AssertProblem(await Upload(ResumePdf.Protected()), HttpStatusCode.UnprocessableEntity, "protegido");

    [Fact]
    public async Task RejectsScannedPdfWithoutText() =>
        await AssertProblem(await Upload(ResumePdf.Scanned()), HttpStatusCode.UnprocessableEntity, "texto extraível");

    [Fact]
    public async Task AcceptsExactlyFiveMegabytes()
    {
        var response = await Upload(ResumePdf.WithSize(ResumeExtractionService.MaxFileSize));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RejectsOneByteOverFiveMegabytes() =>
        await AssertProblem(await Upload(new byte[ResumeExtractionService.MaxFileSize + 1]), HttpStatusCode.BadRequest, "5 MB");

    [Fact]
    public async Task RejectsRequestOverTransportLimit() =>
        await AssertProblem(await Upload(new byte[ResumeExtractionService.MaxMultipartSize + 1]), HttpStatusCode.RequestEntityTooLarge, "5 MB");

    [Fact]
    public async Task RejectsLargeUploadWithoutContentLength() =>
        await AssertProblem(await Upload(new byte[ResumeExtractionService.MaxMultipartSize + 1], streamed: true), HttpStatusCode.RequestEntityTooLarge, "5 MB");

    [Theory]
    [InlineData("CURRICULO.PDF", "application/pdf")]
    [InlineData("curriculo.pdf", "application/octet-stream")]
    public async Task AcceptsPdfWithCommonBrowserFileTypes(string name, string contentType)
    {
        var response = await Upload(ResumePdf.Create("Ana Silva"), name, contentType);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<HttpResponseMessage> Upload(byte[] bytes,
        string name = "curriculo.pdf", string contentType = "application/pdf", bool streamed = false)
    {
        using var form = new MultipartFormDataContent();
        HttpContent file = streamed ? new StreamingFileContent(bytes) : new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(file, "file", name);
        return await client.PostAsync("/api/resumes/extract", form);
    }

    private static async Task AssertProblem(HttpResponseMessage response, HttpStatusCode status, string message)
    {
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal(status, response.StatusCode);
        Assert.Contains(message, problem!.Title);
    }

    private class StreamingFileContent(byte[] bytes) : HttpContent
    {
        protected override Task SerializeToStreamAsync(Stream stream, TransportContext? context) =>
            stream.WriteAsync(bytes).AsTask();

        protected override bool TryComputeLength(out long length)
        {
            length = 0;
            return false;
        }
    }
}

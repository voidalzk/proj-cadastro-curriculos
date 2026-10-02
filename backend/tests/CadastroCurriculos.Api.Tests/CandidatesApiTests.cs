using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CadastroCurriculos.Api.Tests;

public class CandidatesApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public CandidatesApiTests(WebApplicationFactory<Program> factory)
    {
        client = factory.CreateClient();
    }

    [Theory]
    [InlineData("", "ana@example.com", "FullName")]
    [InlineData("Ana Silva", "ana@empresa", "Email")]
    public async Task ReturnsFieldErrorsWithoutAccessingDatabase(string fullName, string email, string field)
    {
        var response = await client.PostAsJsonAsync("/api/candidates", new { fullName, email });
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains(field, problem!.Errors.Keys);
    }

    [Fact]
    public async Task HealthDoesNotDependOnDatabase()
    {
        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}

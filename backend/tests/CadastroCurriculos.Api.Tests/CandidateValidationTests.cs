using System.ComponentModel.DataAnnotations;
using CadastroCurriculos.Api.DTOs;

namespace CadastroCurriculos.Api.Tests;

public class CandidateValidationTests
{
    [Theory]
    [InlineData("", "ana@example.com", "FullName")]
    [InlineData("   ", "ana@example.com", "FullName")]
    [InlineData("Ana Silva", "", "Email")]
    [InlineData("Ana Silva", "ana", "Email")]
    [InlineData("Ana Silva", "ana@empresa", "Email")]
    [InlineData("Ana Silva", "ana @example.com", "Email")]
    public void RejectsInvalidRequiredFields(string name, string email, string field)
    {
        var request = new CreateCandidateRequest { FullName = name, Email = email };
        var errors = new List<ValidationResult>();

        var valid = Validator.TryValidateObject(request, new ValidationContext(request), errors, true);

        Assert.False(valid);
        Assert.Contains(errors, error => error.MemberNames.Contains(field));
    }

    [Fact]
    public void AcceptsManualRegistrationWithoutOptionalFields()
    {
        var request = new CreateCandidateRequest { FullName = "Ana Silva", Email = "ana@example.com" };

        Assert.True(Validator.TryValidateObject(request, new ValidationContext(request), [], true));
    }

    [Theory]
    [InlineData("FullName", 151)]
    [InlineData("Phone", 31)]
    [InlineData("InterestArea", 151)]
    [InlineData("ProfessionalSummary", 3001)]
    public void RejectsFieldsLargerThanDatabaseColumns(string field, int length)
    {
        var request = new CreateCandidateRequest { FullName = "Ana Silva", Email = "ana@example.com" };
        typeof(CreateCandidateRequest).GetProperty(field)!.SetValue(request, new string('a', length));
        var errors = new List<ValidationResult>();

        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), errors, true));
        Assert.Contains(errors, error => error.MemberNames.Contains(field));
    }
}

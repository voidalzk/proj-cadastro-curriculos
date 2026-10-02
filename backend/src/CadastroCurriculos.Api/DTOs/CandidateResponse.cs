using CadastroCurriculos.Api.Models;

namespace CadastroCurriculos.Api.DTOs;

public record CandidateResponse(
    Guid Id, string FullName, string Email, string? Phone,
    string? InterestArea, string? ProfessionalSummary, DateTimeOffset CreatedAt)
{
    public static CandidateResponse FromCandidate(Candidate candidate) => new(
        candidate.Id, candidate.FullName, candidate.Email, candidate.Phone,
        candidate.InterestArea, candidate.ProfessionalSummary, candidate.CreatedAt);
}

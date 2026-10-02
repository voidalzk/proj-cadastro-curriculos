using CadastroCurriculos.Api.Data;
using CadastroCurriculos.Api.DTOs;
using CadastroCurriculos.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CadastroCurriculos.Api.Controllers;

[ApiController]
[Route("api/candidates")]
public class CandidatesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CandidateResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var candidates = await db.Candidates.AsNoTracking()
            .OrderByDescending(candidate => candidate.CreatedAt)
            .ThenBy(candidate => candidate.Id)
            .ToListAsync(cancellationToken);

        return Ok(candidates.Select(CandidateResponse.FromCandidate).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CandidateResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var candidate = await db.Candidates.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (candidate is null)
            return Problem(statusCode: 404, title: "Candidato não encontrado.");

        return Ok(CandidateResponse.FromCandidate(candidate));
    }

    [HttpPost]
    public async Task<ActionResult<CandidateResponse>> Create(
        CreateCandidateRequest request, CancellationToken cancellationToken)
    {
        var candidate = new Candidate
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = TrimOptional(request.Phone),
            InterestArea = TrimOptional(request.InterestArea),
            ProfessionalSummary = TrimOptional(request.ProfessionalSummary)
        };

        db.Candidates.Add(candidate);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = candidate.Id },
            CandidateResponse.FromCandidate(candidate));
    }

    private static string? TrimOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

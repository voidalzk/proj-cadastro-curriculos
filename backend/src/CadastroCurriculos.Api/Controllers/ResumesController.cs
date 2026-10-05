using CadastroCurriculos.Api.DTOs;
using CadastroCurriculos.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CadastroCurriculos.Api.Controllers;

[ApiController]
[Route("api/resumes")]
public class ResumesController(ResumeExtractionService extraction) : ControllerBase
{
    [HttpPost("extract")]
    [RequestSizeLimit(ResumeExtractionService.MaxRequestSize)]
    [RequestFormLimits(MultipartBodyLengthLimit = ResumeExtractionService.MaxMultipartSize)]
    public async Task<ActionResult<ResumeExtractionResponse>> Extract(
        [FromForm] IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return Problem(statusCode: 400, title: "Selecione um PDF que não esteja vazio.");

        if (file.Length > ResumeExtractionService.MaxFileSize)
            return Problem(statusCode: 400, title: "O PDF deve ter no máximo 5 MB.");

        if (!Path.GetExtension(file.FileName).Equals(".pdf", StringComparison.OrdinalIgnoreCase)
            || file.ContentType is not ("application/pdf" or "application/octet-stream" or ""))
            return Problem(statusCode: 400, title: "Envie um arquivo PDF.");

        try
        {
            return Ok(await extraction.ExtractAsync(file, cancellationToken));
        }
        catch (InvalidDataException exception)
        {
            return Problem(statusCode: 422, title: exception.Message);
        }
    }
}

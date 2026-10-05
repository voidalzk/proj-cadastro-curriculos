namespace CadastroCurriculos.Api.DTOs;

public record ResumeExtractionResponse(
    string? FullName, string? Email, string? Phone, List<string> Warnings);

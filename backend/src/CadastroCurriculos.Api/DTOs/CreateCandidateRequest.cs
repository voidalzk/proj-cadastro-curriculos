using System.ComponentModel.DataAnnotations;

namespace CadastroCurriculos.Api.DTOs;

public class CreateCandidateRequest
{
    [Required(ErrorMessage = "Informe o nome completo.")]
    [StringLength(150, ErrorMessage = "O nome deve ter no máximo 150 caracteres.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Informe o e-mail.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    [RegularExpression(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", ErrorMessage = "Informe um e-mail válido.")]
    [StringLength(254, ErrorMessage = "O e-mail deve ter no máximo 254 caracteres.")]
    public string Email { get; set; } = string.Empty;

    [StringLength(30, ErrorMessage = "O telefone deve ter no máximo 30 caracteres.")]
    public string? Phone { get; set; }

    [StringLength(150, ErrorMessage = "A área ou cargo deve ter no máximo 150 caracteres.")]
    public string? InterestArea { get; set; }

    [StringLength(3000, ErrorMessage = "O resumo deve ter no máximo 3000 caracteres.")]
    public string? ProfessionalSummary { get; set; }
}

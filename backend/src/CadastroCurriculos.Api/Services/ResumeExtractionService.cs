using System.Text;
using System.Text.RegularExpressions;
using CadastroCurriculos.Api.DTOs;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;
using UglyToad.PdfPig.Exceptions;

namespace CadastroCurriculos.Api.Services;

public class ResumeExtractionService
{
    public const int MaxFileSize = 5 * 1024 * 1024;
    public const int MaxMultipartSize = MaxFileSize + 1024 * 1024;
    public const int MaxRequestSize = 30 * 1024 * 1024;

    private static readonly Regex EmailPattern = new(
        @"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", RegexOptions.None, TimeSpan.FromSeconds(1));
    private static readonly Regex PhonePattern = new(
        @"(?<!\d)(?:\+?55[\s.-]*)?\(?[1-9]\d\)?[\s.-]*9?\d{4}[\s.-]?\d{4}(?!\d)",
        RegexOptions.None, TimeSpan.FromSeconds(1));
    private static readonly Regex NamePattern = new(
        @"^[\p{L}][\p{L}'’.-]*(?:\s+[\p{L}][\p{L}'’.-]*){1,7}$",
        RegexOptions.None, TimeSpan.FromSeconds(1));
    private static readonly Regex HeadingPattern = new(
        @"^(curr[íi]culo|curriculum|dados|informa[çc][õo]es|contato|resumo|perfil|objetivo|experi[êe]ncia|forma[çc][ãa]o|habilidades|compet[êe]ncias|desenvolvedor|analista|engenheiro|telefone|e-mail|email|endere[çc]o|nascimento)\b",
        RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));

    public async Task<ResumeExtractionResponse> ExtractAsync(
        IFormFile file, CancellationToken cancellationToken)
    {
        using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        var bytes = stream.ToArray();

        if (!bytes.AsSpan().StartsWith("%PDF-"u8))
            throw new InvalidDataException("O conteúdo do arquivo não é um PDF válido.");

        string text;
        try
        {
            using var document = PdfDocument.Open(bytes);
            if (document.IsEncrypted)
                throw new InvalidDataException("O PDF está protegido. Envie uma versão sem proteção ou preencha o formulário.");

            if (document.NumberOfPages > 100)
                throw new InvalidDataException("O PDF tem muitas páginas. Envie um currículo com até 100 páginas ou preencha o formulário.");

            var content = new StringBuilder();
            foreach (var page in document.GetPages())
            {
                cancellationToken.ThrowIfCancellationRequested();
                content.AppendLine(ContentOrderTextExtractor.GetText(page));
                if (content.Length > 200_000)
                    throw new InvalidDataException("O PDF tem texto demais para importar. Preencha o formulário manualmente.");
            }
            text = content.ToString();
        }
        catch (PdfDocumentEncryptedException exception)
        {
            throw new InvalidDataException("O PDF está protegido. Envie uma versão sem proteção ou preencha o formulário.", exception);
        }
        catch (Exception exception) when (exception is not InvalidDataException and not OperationCanceledException)
        {
            throw new InvalidDataException("Não foi possível ler o PDF. Ele pode estar corrompido. Você pode preencher o formulário manualmente.", exception);
        }

        if (string.IsNullOrWhiteSpace(text))
            throw new InvalidDataException("O PDF não possui texto extraível. Arquivos digitalizados precisam ser preenchidos manualmente.");

        var fullName = FindName(text);
        var email = EmailPattern.Match(text).Value;
        var phone = PhonePattern.Match(text).Value;
        var warnings = new List<string>();

        if (fullName is null) warnings.Add("Nome não identificado.");
        if (email.Length == 0 || email.Length > 254) warnings.Add("E-mail não identificado.");
        if (phone.Length == 0 || phone.Length > 30) warnings.Add("Telefone não identificado.");

        return new ResumeExtractionResponse(fullName,
            email.Length is > 0 and <= 254 ? email.ToLowerInvariant() : null,
            phone.Length is > 0 and <= 30 ? phone : null, warnings);
    }

    private static string? FindName(string text)
    {
        var lines = text.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Select(line => Regex.Replace(line.Trim(), @"\s+", " "))
            .ToList();

        var labeledName = lines.FirstOrDefault(line =>
            Regex.IsMatch(line, @"^nome(?: completo)?\s*:", RegexOptions.IgnoreCase));
        if (labeledName is not null)
        {
            var name = labeledName[(labeledName.IndexOf(':') + 1)..].Trim();
            if (name.Length <= 150 && NamePattern.IsMatch(name)) return name;
        }

        // O nome costuma estar no início do currículo, antes das seções profissionais.
        return lines.Take(10).FirstOrDefault(line =>
            line.Length <= 150 && !HeadingPattern.IsMatch(line) && NamePattern.IsMatch(line));
    }
}

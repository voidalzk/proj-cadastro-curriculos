using System.Text;
using UglyToad.PdfPig.Content;
using UglyToad.PdfPig.Core;
using UglyToad.PdfPig.Fonts.Standard14Fonts;
using UglyToad.PdfPig.Writer;

namespace CadastroCurriculos.Api.Tests;

internal static class ResumePdf
{
    public static byte[] Create(params string[] lines)
    {
        var builder = new PdfDocumentBuilder();
        var page = builder.AddPage(PageSize.A4);
        var font = builder.AddStandard14Font(Standard14Font.Helvetica);
        for (var index = 0; index < lines.Length; index++)
            page.AddText(lines[index], 12, new PdfPoint(40, 780 - index * 20), font);
        return builder.Build();
    }

    public static byte[] Scanned()
    {
        var builder = new PdfDocumentBuilder();
        var page = builder.AddPage(PageSize.A4);
        var image = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAE0lEQVR4nGP8//8/AwMDEwMYAAAkBgMBXaJOiAAAAABJRU5ErkJggg==");
        page.AddPng(image, new PdfRectangle(0, 0, 595, 842));
        return builder.Build();
    }

    public static byte[] WithSize(int size)
    {
        // Um comentário no conteúdo da página permite testar o tamanho com um PDF válido.
        var content = "BT /F1 12 Tf 40 780 Td (Ana Silva) Tj ET\n%";
        var objects = new[]
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            ""
        };
        byte[] Build(int padding)
        {
            var text = new StringBuilder("%PDF-1.4\n");
            var offsets = new List<int>();
            var stream = content + new string(' ', padding) + "\n";
            objects[4] = $"<< /Length {stream.Length} >>\nstream\n{stream}endstream";
            for (var index = 0; index < objects.Length; index++)
            {
                offsets.Add(text.Length);
                text.Append($"{index + 1} 0 obj\n{objects[index]}\nendobj\n");
            }
            var xref = text.Length;
            text.Append("xref\n0 6\n0000000000 65535 f \n");
            foreach (var offset in offsets) text.Append($"{offset:D10} 00000 n \n");
            text.Append($"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n");
            return Encoding.ASCII.GetBytes(text.ToString());
        }
        var padding = Math.Max(0, size - Build(0).Length);
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var bytes = Build(padding);
            if (bytes.Length == size) return bytes;
            padding += size - bytes.Length;
        }
        throw new InvalidOperationException("Não foi possível gerar o PDF no tamanho solicitado.");
    }

    public static byte[] Protected() => Convert.FromBase64String(
        "JVBERi0xLjMKJeLjz9MKMSAwIG9iago8PAovUHJvZHVjZXIgPDJhNThhMzgzZGQ+Cj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovQ291bnQgMQovS2lkcyBbIDQgMCBSIF0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9SZXNvdXJjZXMgPDwKPj4KL01lZGlhQm94IFsgMC4wIDAuMCA1OTUgODQyIF0KL1BhcmVudCAyIDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovViAyCi9SIDMKL0xlbmd0aCAxMjgKL1AgNDI5NDk2NzI5MgovRmlsdGVyIC9TdGFuZGFyZAovTyA8YTI4NjhmMjc5Y2UzOGI2N2Q1M2I5OThlMjAwZDM0MjA2MWNlNjRjODcwN2M2M2I0Mzk1YzQwOWU3NzA2ZTFlMz4KL1UgPDlkMGFmOWQ4NjcwNGYwMWQxNDAyZjY3YmUzOTZkNTAyMjhiZjRlNWU0ZTc1OGE0MTY0MDA0ZTU2ZmZmYTAxMDg+Cj4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA1OSAwMDAwMCBuIAowMDAwMDAwMTE4IDAwMDAwIG4gCjAwMDAwMDAxNjcgMDAwMDAgbiAKMDAwMDAwMDI2MSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMyAwIFIKL0luZm8gMSAwIFIKL0lEIFsgPDM0MzEzNzMzMzAzMDY1MzM2MTMyMzM2MjY2NjYzMzM5NjI2NjY0MzQ2NDM3NjEzOTM0MzEzNDM4MzkzMTYzMzQ+IDwzNDMxMzczMzMwMzA2NTMzNjEzMjMzNjI2NjY2MzMzOTYyNjY2NDM0NjQzNzYxMzkzNDMxMzQzODM5MzE2MzM0PiBdCi9FbmNyeXB0IDUgMCBSCj4+CnN0YXJ0eHJlZgo0NzYKJSVFT0YK");
}

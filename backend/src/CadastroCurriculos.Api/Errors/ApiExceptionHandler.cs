using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace CadastroCurriculos.Api.Errors;

public class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Erro ao processar {Method} {Path}.",
            context.Request.Method, context.Request.Path);

        var databaseError = exception is SqlException or DbUpdateException;
        context.Response.StatusCode = databaseError ? 503 : 500;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = context.Response.StatusCode,
            Title = databaseError
                ? "Não foi possível acessar o banco de dados. Tente novamente."
                : "Não foi possível concluir a operação. Tente novamente."
        }, cancellationToken);

        return true;
    }
}

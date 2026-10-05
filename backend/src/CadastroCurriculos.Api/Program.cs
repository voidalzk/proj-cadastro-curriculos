using CadastroCurriculos.Api.Data;
using CadastroCurriculos.Api.Errors;
using CadastroCurriculos.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    var defaultResponse = options.InvalidModelStateResponseFactory;
    options.InvalidModelStateResponseFactory = context =>
        context.HttpContext.Request.Path == "/api/resumes/extract"
            ? new BadRequestObjectResult(new ProblemDetails
            {
                Status = 400,
                Title = "Não foi possível receber o arquivo. Envie um PDF de até 5 MB."
            })
            : defaultResponse(context);
});
builder.Services.AddScoped<ResumeExtractionService>();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors();
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/api/resumes/extract"
        && context.Request.ContentLength > ResumeExtractionService.MaxMultipartSize)
    {
        // Descarta o envio antes de responder para não interromper a conexão do cliente.
        await context.Request.Body.CopyToAsync(Stream.Null, context.RequestAborted);
        await Results.Problem(statusCode: 413, title: "O PDF deve ter no máximo 5 MB.")
            .ExecuteAsync(context);
        return;
    }
    await next(context);
});
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", async (AppDbContext db, CancellationToken cancellationToken) =>
    await db.Database.CanConnectAsync(cancellationToken)
        ? Results.Ok(new { status = "ok" })
        : Results.Problem(statusCode: 503, title: "Não foi possível conectar ao banco de dados."));
app.MapControllers();
app.Run();

public partial class Program;

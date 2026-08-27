/**
 * Arquivo: API/NETCORE/Program.cs
 * Objetivo: configura serviços, middlewares, CORS, autenticação e inicialização da API do Hórus PDV.
 * Entradas esperadas: espera configurações de ambiente/appsettings e registra o pipeline HTTP da aplicação.
 */
using HORUSPDV_API.Middlewares;
using HORUSPDV_API.Repositories;
using HORUSPDV_API.Repositories.DatabaseAccess;
using HORUSPDV_API.Services.Caixa;
using HORUSPDV_API.Services.Clientes;
using HORUSPDV_API.Services.Email;
using HORUSPDV_API.Services.Fornecedores;
using HORUSPDV_API.Services.Produtos;
using HORUSPDV_API.Services.Security;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.FileProviders;

// ContentRoot fixado na pasta do executável (não no diretório de trabalho):
// garante que wwwroot e DataBase/ sejam encontrados quando o .exe é aberto
// por atalho, de qualquer lugar. No Docker o AppContext.BaseDirectory é a
// pasta do app, então continua correto.
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});

var corsOrigins = (builder.Configuration["Security:CorsOrigins"] ??
                   "http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173,http://localhost:4173,https://localhost:4173,http://127.0.0.1:4173,https://127.0.0.1:4173")
    .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.Configure<HorusEmailOptions>(builder.Configuration.GetSection("Email"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("HorusPdvCorsPolicy", policyBuilder =>
    {
        policyBuilder
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddSingleton<Connection>();
builder.Services.AddScoped<ProdutoAB>();
builder.Services.AddScoped<ClienteAB>();
builder.Services.AddScoped<FornecedorAB>();
builder.Services.AddScoped<EmpresaAB>();
builder.Services.AddScoped<HistoricoVendasAB>();
builder.Services.AddScoped<ModuloMercadoAB>();
builder.Services.AddScoped<CaixaAB>();
builder.Services.AddScoped<HomeAB>();
builder.Services.AddScoped<RelatorioAB>();
builder.Services.AddScoped<HorusCaixaService>();
builder.Services.AddScoped<HorusSecurityStore>();
builder.Services.AddSingleton<HorusSecurityOptions>();
builder.Services.AddSingleton<HorusSecretProtector>();
builder.Services.AddSingleton<HorusJwtService>();
builder.Services.AddScoped<HorusEmailService>();
builder.Services.AddHttpClient<HorusRecaptchaService>();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IFornecedorService, FornecedorService>();

var app = builder.Build();

// Modo instalável / URL única: se houver um SPA compilado em wwwroot (ao lado do
// exe), a própria API serve o frontend. Usa um FileProvider explícito para não
// depender do WebRootPath. No Docker (sem wwwroot) o nginx continua servindo o SPA.
var webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
var serveSpa = File.Exists(Path.Combine(webRoot, "index.html"));
var spaFileProvider = serveSpa ? new PhysicalFileProvider(webRoot) : null;
Console.WriteLine($"[SPA] webRoot={webRoot} serveSpa={serveSpa} assetsExists={(spaFileProvider?.GetDirectoryContents("assets").Exists ?? false)}");

var securityOptions = app.Services.GetRequiredService<HorusSecurityOptions>();
securityOptions.Validate();
await HorusDatabaseInitializer.InitializeAsync(app.Services);

// Atrás de proxy que termina TLS (nuvem), lê X-Forwarded-Proto/-For para que
// Request.IsHttps e o IP reflitam a requisição original. Sem isso, o
// UseHttpsRedirection entra em loop e o cookie Secure fica incorreto.
if (securityOptions.TrustForwardedHeaders)
{
    var forwardedOptions = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    };
    forwardedOptions.KnownNetworks.Clear();
    forwardedOptions.KnownProxies.Clear();
    app.UseForwardedHeaders(forwardedOptions);
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Erro interno no servidor."
            });
        });
    });
    app.UseHsts();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
if (serveSpa)
{
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = spaFileProvider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = spaFileProvider });
}

app.UseRouting();

app.UseMiddleware<HorusSecurityHeadersMiddleware>();
app.UseCors("HorusPdvCorsPolicy");
app.UseMiddleware<HorusRequestTelemetryMiddleware>();
app.UseMiddleware<HorusRequestBodyLimitMiddleware>();
app.UseMiddleware<HorusRateLimitMiddleware>();
app.UseMiddleware<HorusAuthMiddleware>();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

// Fallback do SPA: qualquer rota que não seja /api e não seja arquivo estático
// devolve o index.html (client-side routing). Não intercepta /api.
if (serveSpa)
{
    app.MapFallbackToFile(
        "{*path:regex(^(?!api/).*$)}",
        "index.html",
        new StaticFileOptions { FileProvider = spaFileProvider });
}

app.Run();

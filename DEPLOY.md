# Deploy na nuvem (conferência do cliente)

Sistema em **imagem única** (`docker/app.Dockerfile`): a API .NET serve o SPA e a API
na mesma origem. Precisa de um **SQL Server** ao lado. Recomendado: **Railway**.

> Segredos (JWT, chave de criptografia, senha do SQL) **não** ficam no repositório.
> Use os valores enviados separadamente e cole nas variáveis do painel.

## Railway (recomendado)

### 1. Serviço do app (web)
1. railway.app → **New Project** → **Deploy from GitHub repo** → `horus-pdv-evelyn`.
2. Selecione a branch a publicar (ex.: `feat/branding-evelyn`).
3. Railway lê o `railway.json` e builda o `docker/app.Dockerfile`.

### 2. Serviço do banco (SQL Server)
1. No projeto: **New** → **Empty Service** → **Source: Docker Image**
   `mcr.microsoft.com/mssql/server:2022-latest`.
2. Adicione um **Volume** montado em `/var/opt/mssql` (persistência).
3. Variáveis do serviço de banco:
   - `ACCEPT_EULA=Y`
   - `MSSQL_PID=Express`
   - `MSSQL_SA_PASSWORD=<SQL_SA_PASSWORD>`

### 3. Variáveis do serviço do app
Nome interno do banco no Railway = `<nome-do-servico>.railway.internal`.

| Variável | Valor |
|---|---|
| `ConnectionStrings__HorusPdv` | `Server=<db>.railway.internal,1433;Database=HorusPdv;User Id=sa;Password=<SQL_SA_PASSWORD>;TrustServerCertificate=True;Encrypt=True;MultipleActiveResultSets=True` |
| `Auth__JwtSecret` | `<JWT_SECRET>` |
| `Security__EncryptionKey` | `<ENCRYPTION_KEY>` |
| `Security__TrustForwardedHeaders` | `true` |
| `Recaptcha__Enabled` | `false` (senão exige chave e o app não sobe) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_HTTP_PORTS` | `${{PORT}}` |
| `Security__CorsOrigins` | `https://<dominio-publico-do-app>` |

### 4. Domínio e primeiro acesso
1. No serviço do app: **Settings → Networking → Generate Domain**.
2. Atualize `Security__CorsOrigins` com a URL gerada e redeploy.
3. Acesse a URL → o banco é criado/populado no 1º boot (script `Resumo.sql`).
4. Use **Criar cadastro** para gerar o usuário administrador da demo.

## Observações
- **HTTPS**: o TLS termina no proxy do Railway; o `ForwardedHeaders` (ligado por
  `Security__TrustForwardedHeaders=true`) faz o app reconhecer https e evita loop de
  redirect + mantém o cookie `Secure` correto.
- **É demo/conferência**: dados podem ser resetados. Não use dados reais/fiscais aqui.
- **Custo**: usa os créditos gratuitos do Railway; o SQL Server consome memória —
  monitore o uso.

## Alternativas
- **Fly.io**: mesma imagem (`docker/app.Dockerfile`) + SQL Server em Machine com volume.
- **Render**: web service via Docker a partir do repo; SQL Server só como serviço
  privado Docker (não há SQL Server gerenciado). Postgres exigiria reescrever o T-SQL.
- **Vercel**: hospeda só o frontend estático — **não** roda a API .NET nem o SQL Server;
  precisaria da API/DB em Railway/Fly e ajuste de CORS/cookies (mais frágil).

# Deploy na nuvem (conferência do cliente)

Sistema em **imagem única** (`docker/app.Dockerfile`): a API .NET serve o SPA e a API
na mesma origem. Precisa de um **SQL Server** ao lado. Recomendado: **Render** (Blueprint).

> Segredos (JWT, chave de criptografia, senha do SQL) **não** ficam no repositório —
> são `sync: false` no `render.yaml` e preenchidos no painel. Use os valores enviados
> separadamente.

## Render (recomendado)

O `render.yaml` na raiz já descreve os 2 serviços: **evelyn-app** (web) e
**evelyn-sqlserver** (SQL Server privado com disco).

### 1. Criar pelo Blueprint
1. render.com → **New → Blueprint**.
2. Conecte o repositório `horus-pdv-evelyn`, branch **`main`**.
3. O Render lê o `render.yaml` e cria os dois serviços. Ele vai pedir os valores
   marcados como *sync:false* (os segredos) — preencha conforme abaixo.

### 2. Segredos a preencher (no painel, quando pedir)
| Serviço | Variável | Valor |
|---|---|---|
| evelyn-sqlserver | `MSSQL_SA_PASSWORD` | `<SQL_SA_PASSWORD>` |
| evelyn-app | `Auth__JwtSecret` | `<JWT_SECRET>` |
| evelyn-app | `Security__EncryptionKey` | `<ENCRYPTION_KEY>` |
| evelyn-app | `ConnectionStrings__HorusPdv` | `Server=evelyn-sqlserver,1433;Database=HorusPdv;User Id=sa;Password=<SQL_SA_PASSWORD>;TrustServerCertificate=True;Encrypt=True;MultipleActiveResultSets=True` |
| evelyn-app | `Security__CorsOrigins` | (deixe em branco por ora; preencha com a URL após o passo 3) |

> Host do banco = **nome do serviço** na rede interna do Render: `evelyn-sqlserver`,
> porta `1433` (formato SQL Server usa vírgula: `Server=evelyn-sqlserver,1433`).

### 3. Domínio e primeiro acesso
1. O serviço **evelyn-app** recebe uma URL `https://evelyn-app-XXXX.onrender.com`.
2. Atualize `Security__CorsOrigins` com essa URL e faça **Manual Deploy** (ou salve).
3. Acesse a URL → o banco é criado/populado no 1º boot (`Resumo.sql`).
4. Use **Criar cadastro** para gerar o usuário administrador da demo.

## Pontos importantes (honestos)
- **SQL Server precisa de RAM**: o serviço do banco está no plano **standard** (~2 GB).
  SQL Server 2022 não sobe de forma estável em 512 MB. Isso tem custo (~US$ na faixa do
  standard). O plano `starter` do **web** também é pago; o `free` hiberna após 15 min
  (cold start ~50s) — ok pra demo, ruim pra teste fluido.
- **HTTPS atrás do proxy**: `Security__TrustForwardedHeaders=true` liga o
  `UseForwardedHeaders`, então o app reconhece https, evita loop de redirect e mantém o
  cookie `Secure` correto.
- **Porta**: o Render roteia via `PORT` (definido = 8080, igual ao `ASPNETCORE_HTTP_PORTS`).
- **É conferência, não produção fiscal** — dados podem ser resetados.

## Alternativas
- **Railway**: `railway.json` incluso. Deploy do repo + serviço SQL Server (Docker image)
  com volume; mesmas variáveis. Também paga pela memória do SQL Server.
- **Fly.io**: mesma imagem (`docker/app.Dockerfile`) + SQL Server em Machine com volume.
- **Vercel**: hospeda só o frontend estático — **não** roda a API .NET nem o SQL Server.

# Imagem única de produção: a API .NET serve o SPA (frontend + backend juntos).
# Deploy em Railway/Render/Fly/VPS a partir de UMA imagem, expondo UMA URL.

# ---------- 1) Build do SPA (Vite) ----------
FROM node:22-alpine AS web
WORKDIR /web
COPY FRONTEND/package.json FRONTEND/package-lock.json ./
RUN npm ci
COPY FRONTEND/ ./
# .env.prod já define VITE_*_API_URL=/api/... (mesma origem da API)
RUN npm run build:prod

# ---------- 2) Publish da API (.NET 8) ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api
WORKDIR /src
COPY API/NETCORE/ ./
RUN dotnet restore HORUSPDV-API.csproj \
 && dotnet publish HORUSPDV-API.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---------- 3) Runtime: API + SPA em wwwroot ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=api /app/publish ./
COPY --from=web /web/dist ./wwwroot
# A porta é definida pelo provedor via ASPNETCORE_HTTP_PORTS (Railway/Render usam $PORT).
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "HORUSPDV-API.dll"]

# Build da API .NET 8 do Hórus PDV
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY API/NETCORE/ ./
RUN dotnet restore HORUSPDV-API.csproj \
 && dotnet publish HORUSPDV-API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "HORUSPDV-API.dll"]

# Build do frontend React/Vite e publicacao via nginx
FROM node:22-alpine AS build
WORKDIR /app
COPY FRONTEND/package.json FRONTEND/package-lock.json ./
RUN npm ci
COPY FRONTEND/ ./

# URLs relativas: o nginx faz proxy de /api para o container da API (same-origin).
ARG VITE_RECAPTCHA_SITE_KEY=""
RUN printf '%s\n' \
  "VITE_PRODUTO_API_URL=/api/Produto" \
  "VITE_CLIENTE_API_URL=/api/Cliente" \
  "VITE_FORNECEDOR_API_URL=/api/Fornecedor" \
  "VITE_HOME_API_URL=/api/Home" \
  "VITE_HISTORICO_VENDAS_API_URL=/api/HistoricoVendas" \
  "VITE_CAIXA_API_URL=/api/Caixa" \
  "VITE_USUARIOS_API_URL=/api/Usuario" \
  "VITE_SESSOES_API_URL=/api/Sessao" \
  "VITE_MODULOS_MERCADO_API_URL=/api/ModuloMercado" \
  "VITE_RELATORIOS_API_URL=/api/Relatorio" \
  "VITE_EMPRESA_API_URL=/api/Empresa" \
  "VITE_AUTH_API_URL=/api/Auth" \
  "VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY}" \
  > .env.prod \
 && npm run build:prod

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

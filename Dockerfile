# ---------- stage 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Envs do Vite sao injetadas em BUILD-TIME: precisam existir como ARG/ENV
# neste stage, senao o `npm run build` nao as enxerga (EasyPanel passa como
# build args).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- stage 2: serve ----------
FROM nginx:alpine
# Copia do STAGE de build (nao do contexto local): garante build limpo no
# EasyPanel/CI sem depender de dist/ pre-existente.
COPY --from=build /app/dist/ /usr/share/nginx/html/

# SPA fallback: any unknown route returns index.html
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

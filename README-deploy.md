# Deploy FMP Analytics (Docker / EasyPanel)

## Como funciona

A aplicacao e um SPA (Single Page Application) construido com Vite.
O Dockerfile tem dois stages:

1. **build** — `npm ci && npm run build`, gera arquivos estaticos em `dist/`
2. **serve** — `nginx:alpine` servindo `dist/` com fallback de SPA (`try_files ... /index.html`)

## Variaveis de ambiente

O Vite injeta variaveis em **build-time**, nao em runtime. As envs devem ser
definidas como **build args** no EasyPanel (ou `--build-arg` no Docker).

| Variavel              | Descricao                        |
|-----------------------|----------------------------------|
| VITE_SUPABASE_URL     | URL do projeto Supabase          |
| VITE_SUPABASE_ANON_KEY| Chave anon (publica) do Supabase |

**Troca de env exige rebuild da imagem.**

## Comando manual

```bash
docker build -t fmp-analytics .
docker run -p 80:80 fmp-analytics
```

## EasyPanel

1. Crie um novo app tipo Dockerfile
2. Defina as envs `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como build args
3. Deploy

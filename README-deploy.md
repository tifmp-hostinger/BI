# Deploy FMP Analytics (Docker / EasyPanel)

## Como funciona

A aplicacao e um SPA (Single Page Application) construido com Vite.
O Dockerfile tem dois stages:

1. **build** — `npm ci && npm run build`, gera arquivos estaticos em `dist/`
2. **serve** — `nginx:alpine` servindo `dist/` com fallback de SPA (`try_files ... /index.html`)

## Variaveis de ambiente

Um SPA estatico nao le variavel de ambiente sozinho: o JS ja foi compilado antes
do container subir. Por isso existem **dois caminhos**, e o app aceita os dois.

### Caminho 1 — build-time (`import.meta.env`)

O Vite embute o valor no bundle durante `npm run build`. Exige que a variavel
seja passada como **build arg** e que exista uma linha `ARG` correspondente no
`Dockerfile` — sem essa declaracao o Docker **descarta o build arg em silencio**.

| Variavel                      | Descricao                                    |
|-------------------------------|----------------------------------------------|
| VITE_SUPABASE_URL             | URL do projeto Supabase                      |
| VITE_SUPABASE_ANON_KEY        | Chave anon (publica) do Supabase             |
| VITE_AUTH_USER                | Usuario da tela de login                     |
| VITE_AUTH_PASSWORD            | Senha da tela de login                       |
| VITE_GROWTH_AJUSTE_ALUNO_RA   | RA do ajuste manual de faturamento (Pos)     |
| VITE_GROWTH_AJUSTE_DATA       | Data do ajuste manual (padrao 2026-05-28)    |

**Toda variavel `VITE_*` nova precisa ganhar um `ARG` + `ENV` no `Dockerfile`.**
Troca de valor exige **rebuild** da imagem.

### Caminho 2 — runtime (`/config.js`) — recomendado para as credenciais

Quando o container sobe, `docker/40-app-config.sh` (executado automaticamente
pelo entrypoint do nginx) gera `/usr/share/nginx/html/config.js` a partir das
variaveis de ambiente **do container**, e o `index.html` carrega esse arquivo
antes do bundle.

Vantagens:

- funciona mesmo que o painel de deploy passe as variaveis apenas como env de
  runtime, sem build arg — que e o modo de falha silenciosa mais comum;
- trocar usuario/senha exige apenas **reiniciar o container**, sem rebuild.

Hoje o `config.js` cobre `VITE_AUTH_USER` e `VITE_AUTH_PASSWORD`. O runtime tem
**precedencia** sobre o build-time; se ambos estiverem vazios, o app libera o
acesso sem tela de login (e avisa no console).

## Autenticacao

A tela de login (`src/components/auth/AuthGate.tsx`) e uma barreira provisoria
com usuario e senha fixos, valida por 1 hora apos o login.

> **Limite de seguranca:** a credencial fica no lado do cliente — no bundle ou
> em `/config.js`. Quem inspecionar o site consegue le-la. Isso impede acesso
> casual, **nao** e protecao contra alguem tecnicamente capaz. Para seguranca
> real por usuario, migrar para Supabase Auth.

### Diagnostico

Se o login rejeitar uma credencial que parece correta, abra o console do
navegador (F12). O app registra **origem** (`runtime` / `build` / `ausente`) e
**quantidade de caracteres** de cada valor — nunca o valor em si — e, apos uma
tentativa falha, qual dos dois campos nao conferiu. Isso distingue
"a variavel nao chegou" de "chegou diferente" (espaco sobrando, aspas, valor
trocado).

O log do container tambem mostra, no boot:
`[app-config] VITE_AUTH_USER: N caractere(s) | VITE_AUTH_PASSWORD: N caractere(s)`

## Cache

`index.html` e `config.js` sao servidos com `no-store` (`docker/nginx.conf`):
sao a porta de entrada do app e o arquivo de configuracao. Sem isso, um deploy
novo ou uma troca de senha poderiam nao ter efeito visivel, com o navegador
servindo a versao anterior. Os assets em `/assets/` tem hash no nome e sao
cacheados por 1 ano.

## Comando manual

```bash
# build-time (embute no bundle)
docker build -t fmp-analytics \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  .

# runtime (injetado no boot, sem rebuild)
docker run -p 80:80 \
  -e VITE_AUTH_USER=admin \
  -e VITE_AUTH_PASSWORD=troque-esta-senha \
  fmp-analytics
```

## EasyPanel

1. Crie um novo app tipo Dockerfile
2. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como **build args**
   (elas so funcionam em build-time)
3. Defina `VITE_AUTH_USER` e `VITE_AUTH_PASSWORD` no **Environment** do servico
   (funcionam em runtime; se o painel tambem as passar como build arg, tudo bem —
   o runtime tem precedencia)
4. Deploy

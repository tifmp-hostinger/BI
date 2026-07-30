#!/bin/sh
# Gera /usr/share/nginx/html/config.js a partir das variaveis de ambiente do
# container, toda vez que ele sobe.
#
# Por que existe: o app e um SPA estatico. `import.meta.env` do Vite so enxerga
# uma variavel se ela existir no momento do `npm run build` (build arg). Se a
# plataforma de deploy define a variavel apenas como env de RUNTIME do
# container, o valor nunca chega ao JS compilado e a configuracao some sem erro
# visivel. Este script cobre esse caso -- e permite trocar a credencial
# reiniciando o container, sem rebuild da imagem.
#
# O nginx oficial executa automaticamente todo /docker-entrypoint.d/*.sh antes
# de iniciar o servidor, entao nao ha ENTRYPOINT customizado aqui.
set -eu

CONFIG_FILE="/usr/share/nginx/html/config.js"

# Escapa o valor para nao quebrar a string JS gerada: remove quebras de linha e
# protege barra invertida e aspas. A substituicao de comando ja remove quebras
# de linha finais; o `tr` cobre as do meio.
escapa_js() {
  printf '%s' "${1:-}" | tr -d '\r\n' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

{
  printf 'window.__APP_CONFIG__ = {\n'
  printf '  "VITE_AUTH_USER": "%s",\n' "$(escapa_js "${VITE_AUTH_USER:-}")"
  printf '  "VITE_AUTH_PASSWORD": "%s"\n' "$(escapa_js "${VITE_AUTH_PASSWORD:-}")"
  printf '};\n'
} > "$CONFIG_FILE"

# Log sem expor valor: so diz se chegou, e com quantos caracteres.
printf '[app-config] VITE_AUTH_USER: %s caractere(s) | VITE_AUTH_PASSWORD: %s caractere(s)\n' \
  "$(printf '%s' "$(escapa_js "${VITE_AUTH_USER:-}")" | wc -c | tr -d ' ')" \
  "$(printf '%s' "$(escapa_js "${VITE_AUTH_PASSWORD:-}")" | wc -c | tr -d ' ')"

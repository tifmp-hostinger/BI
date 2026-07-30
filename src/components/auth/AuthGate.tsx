import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { leConfig } from '@/lib/runtimeConfig';

/**
 * Login/senha fixos, barreira de acesso provisória enquanto não há autenticação
 * por usuário (ex.: Supabase Auth).
 *
 * ATENÇÃO: a credencial fica no lado do cliente — embutida no bundle (build) ou
 * servida em /config.js (runtime). Quem inspecionar o site consegue lê-la. Isso
 * impede acesso casual, não é proteção contra alguém tecnicamente capaz.
 *
 * A configuração aceita as duas origens (runtime tem precedência) porque num
 * SPA estático a env var de build só existe se a plataforma passar build arg;
 * ver src/lib/runtimeConfig.ts.
 */
const cfgUser = leConfig('VITE_AUTH_USER', import.meta.env.VITE_AUTH_USER);
const cfgPassword = leConfig('VITE_AUTH_PASSWORD', import.meta.env.VITE_AUTH_PASSWORD);

const AUTH_USER = cfgUser.valor;
const AUTH_PASSWORD = cfgPassword.valor;
const AUTH_CONFIGURADO = Boolean(AUTH_USER && AUTH_PASSWORD);

const AUTH_STORAGE_KEY = 'fmp-bi-auth';
const AUTH_TTL_HORAS = 1;

type AuthArmazenada = { ok: true; expiraEm: number };

function lerAuthArmazenada(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as AuthArmazenada;
    return parsed.ok === true && parsed.expiraEm > Date.now();
  } catch {
    return false;
  }
}

function salvarAuth(): void {
  const registro: AuthArmazenada = {
    ok: true,
    expiraEm: Date.now() + AUTH_TTL_HORAS * 60 * 60 * 1000,
  };
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(registro));
  } catch {
    // localStorage indisponível (modo privado) — login vale só para esta aba.
  }
}

/**
 * Diagnóstico no console para quando o login rejeita uma credencial que o
 * operador jura estar certa. Mostra ORIGEM e TAMANHO, nunca o valor — o
 * suficiente para distinguir "variável não chegou" de "chegou diferente"
 * (espaço sobrando, aspas, valor trocado) sem imprimir a senha no console.
 */
function logDiagnostico(digitado?: { usuario: string; senha: string }): void {
  const linhas = [
    `[auth] usuário  → origem: ${cfgUser.origem}, caracteres: ${AUTH_USER.length}`,
    `[auth] senha    → origem: ${cfgPassword.origem}, caracteres: ${AUTH_PASSWORD.length}`,
  ];
  if (digitado) {
    linhas.push(
      `[auth] digitado → usuário: ${digitado.usuario.length} caractere(s), senha: ${digitado.senha.length} caractere(s)`,
      `[auth] confere  → usuário: ${digitado.usuario === AUTH_USER}, senha: ${digitado.senha === AUTH_PASSWORD}`,
    );
  }
  console.info(linhas.join('\n'));
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(lerAuthArmazenada);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!AUTH_CONFIGURADO) {
      console.warn(
        '[auth] VITE_AUTH_USER/VITE_AUTH_PASSWORD não configuradas — acesso liberado sem autenticação',
      );
    }
    if (!AUTH_CONFIGURADO || autenticado) return;
    logDiagnostico();
  }, [autenticado]);

  if (!AUTH_CONFIGURADO) return <>{children}</>;
  if (autenticado) return <>{children}</>;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Lê direto do formulário em vez do estado do React: gerenciador de senha e
    // autopreenchimento do navegador escrevem no campo sem disparar onChange em
    // alguns casos, e aí o estado ficaria vazio enquanto a tela mostra o campo
    // preenchido — rejeitando uma credencial visivelmente correta.
    const form = new FormData(e.currentTarget);
    const usuario = String(form.get('usuario') ?? '').trim();
    const senha = String(form.get('senha') ?? '');

    if (usuario === AUTH_USER && senha === AUTH_PASSWORD) {
      salvarAuth();
      setAutenticado(true);
      setErro(false);
      return;
    }
    setErro(true);
    logDiagnostico({ usuario, senha });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-md border border-line bg-white p-8 shadow-card"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-pill bg-fmp-muted text-fmp">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-semibold text-ink">Dashboards FMP</h1>
          <p className="mt-1 text-xs text-ink-3">Acesso restrito — informe usuário e senha.</p>
        </div>

        <label htmlFor="auth-usuario" className="mb-1 block text-xs font-medium text-ink-2">
          Usuário
        </label>
        <input
          id="auth-usuario"
          name="usuario"
          className="mb-4 w-full rounded-sm border border-line px-3 py-2 text-sm text-ink outline-none focus:border-fmp"
          onChange={() => setErro(false)}
          autoFocus
          autoComplete="username"
        />

        <label htmlFor="auth-senha" className="mb-1 block text-xs font-medium text-ink-2">
          Senha
        </label>
        <input
          id="auth-senha"
          name="senha"
          type="password"
          className="mb-4 w-full rounded-sm border border-line px-3 py-2 text-sm text-ink outline-none focus:border-fmp"
          onChange={() => setErro(false)}
          autoComplete="current-password"
        />

        {erro && (
          <p className="mb-4 text-xs text-danger">
            Usuário ou senha incorretos. Se acabou de configurar as credenciais, abra o console do
            navegador (F12) — há um diagnóstico lá.
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-pill bg-fmp py-2 text-sm font-medium text-white transition-all hover:bg-fmp-dark"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

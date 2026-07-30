import { useState, type FormEvent, type ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';

/**
 * Login/senha fixos por env var (VITE_AUTH_USER/VITE_AUTH_PASSWORD) — barreira
 * de acesso provisória enquanto não há autenticação por usuário (ex.: Supabase
 * Auth). ATENÇÃO: variável VITE_ é embutida no bundle JS público em
 * build-time, então a senha fica visível a quem inspecionar o bundle — não é
 * proteção contra alguém tecnicamente capaz, só impede acesso casual.
 */
const AUTH_USER = (import.meta.env.VITE_AUTH_USER ?? '') as string;
const AUTH_PASSWORD = (import.meta.env.VITE_AUTH_PASSWORD ?? '') as string;
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
  const registro: AuthArmazenada = { ok: true, expiraEm: Date.now() + AUTH_TTL_HORAS * 60 * 60 * 1000 };
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(registro));
  } catch {
    // localStorage indisponível (modo privado) — login vale só para esta aba.
  }
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(lerAuthArmazenada);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);

  if (!AUTH_USER || !AUTH_PASSWORD) {
    console.warn('[auth] VITE_AUTH_USER/VITE_AUTH_PASSWORD não configuradas — acesso liberado sem autenticação');
    return <>{children}</>;
  }

  if (autenticado) return <>{children}</>;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (usuario === AUTH_USER && senha === AUTH_PASSWORD) {
      salvarAuth();
      setAutenticado(true);
      setErro(false);
    } else {
      setErro(true);
    }
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
          className="mb-4 w-full rounded-sm border border-line px-3 py-2 text-sm text-ink outline-none focus:border-fmp"
          value={usuario}
          onChange={(e) => {
            setUsuario(e.target.value);
            setErro(false);
          }}
          autoFocus
          autoComplete="username"
        />

        <label htmlFor="auth-senha" className="mb-1 block text-xs font-medium text-ink-2">
          Senha
        </label>
        <input
          id="auth-senha"
          type="password"
          className="mb-4 w-full rounded-sm border border-line px-3 py-2 text-sm text-ink outline-none focus:border-fmp"
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
            setErro(false);
          }}
          autoComplete="current-password"
        />

        {erro && <p className="mb-4 text-xs text-danger">Usuário ou senha incorretos.</p>}

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

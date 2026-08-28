import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, LogOut, Menu, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
};

/** Iniciais para o avatar: primeiro e último nome, como "Rosangela Berg" → RB. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function Header({ title, subtitle, onOpenSidebar }: Props) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { perfil, ehAdmin, encerrarSessao } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  /*
   * Topbar de produto: 48px, breadcrumb no lugar do título grande — o nome
   * do painel já está aceso na sidebar, o topo só situa. O subtítulo
   * institucional vira o trecho discreto depois do ponto.
   */
  return (
    <header className="sticky top-0 z-20 glass-header">
      <div className="flex h-12 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-md p-1.5 text-ink-2 hover:bg-paper lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="hidden text-xs font-medium text-ink-3 sm:inline">FMP</span>
          <ChevronRight className="hidden h-3 w-3 text-ink-3/60 sm:inline" />
          <h1 className="truncate text-[13px] font-semibold text-ink">{title}</h1>
          {subtitle && (
            <span className="hidden truncate text-xs text-ink-3 md:inline">
              <span className="mx-1.5 text-ink-3/50">·</span>
              {subtitle}
            </span>
          )}
        </div>

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-md glass-button py-0 pl-1 pr-2"
            aria-haspopup
            aria-expanded={openDropdown}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-fmp text-[10px] font-bold text-white">
              {iniciais(perfil?.nome_completo ?? '')}
            </span>
            <span className="hidden max-w-[10rem] truncate text-xs font-medium text-ink-2 sm:inline">
              {perfil?.nome_completo ?? '—'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-3" />
          </button>

          {openDropdown && (
            <div className="absolute right-0 mt-2 w-60 rounded-lg glass-dropdown p-1.5 animate-slide-up">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-ink">
                  {perfil?.nome_completo ?? '—'}
                </p>
                <p className="truncate text-2xs text-ink-3">{perfil?.cargo ?? perfil?.codusuario}</p>
              </div>
              <div className="my-1 border-t border-line" />
              <Link
                to="/minha-conta"
                onClick={() => setOpenDropdown(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-2 no-underline hover:bg-paper"
              >
                <User className="h-3.5 w-3.5" /> Minha conta
              </Link>
              {ehAdmin && (
                <Link
                  to="/usuarios"
                  onClick={() => setOpenDropdown(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-2 no-underline hover:bg-paper"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Usuários
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(false);
                  void encerrarSessao().then(() => navigate('/'));
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-fmp hover:bg-fmp-muted"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

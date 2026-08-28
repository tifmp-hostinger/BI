import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Percent,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { FmpSimbolo } from '@/components/brand/FmpLogo';
import { useAuth } from '@/contexts/AuthContext';

/** Iniciais para o avatar: primeiro e último nome ("Rosangela Berg" → RB). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  MapPin,
  GraduationCap,
  DollarSign,
  UserPlus,
  Activity,
  Users,
  Shield,
  Target,
  Percent,
  TrendingUp,
};

type SidebarItem = {
  slug: string;
  title: string;
  subtitle?: string;
  icon: string;
  disabled?: boolean;
};

type Props = {
  items: SidebarItem[];
  open: boolean;
  onClose: () => void;
  /** Modo compacto (só ícones) no desktop. */
  colapsado?: boolean;
  onToggleColapso?: () => void;
};

/**
 * Sidebar em anatomia de produto (branch visual-saas): itens de UMA linha e
 * 36px com trilho vermelho no ativo, rótulos de seção pequenos, sem animação
 * por item — navegação é instantânea, não uma coreografia. Os subtítulos dos
 * painéis saíram das linhas (viravam duas alturas por item) e vivem no
 * `title` do hover.
 */

function rotuloSecao(texto: string) {
  return (
    <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
      {texto}
    </p>
  );
}

function classesItem(isActive: boolean): string {
  return `group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors no-underline ${
    isActive
      ? 'bg-white/[0.07] text-white'
      : 'text-white/55 hover:bg-white/[0.04] hover:text-white/90'
  }`;
}

/** Trilho de ativo: a marca registrada visual da navegação. */
function Trilho() {
  return (
    <span className="absolute -left-3 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-fmp" />
  );
}

export function Sidebar({ items, open, onClose, colapsado = false, onToggleColapso }: Props) {
  const { perfil } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col glass-drawer transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${colapsado ? 'lg:w-16' : ''}`}
      >
        {/* Cabeçalho do workspace */}
        <div
          className={`flex h-14 shrink-0 items-center border-b border-white/[0.06] ${
            colapsado ? 'justify-center px-2' : 'gap-2.5 px-4'
          }`}
        >
          <NavLink to="/" onClick={onClose} className="flex min-w-0 items-center gap-2.5 no-underline">
            <FmpSimbolo className="h-7 w-7 shrink-0" titulo="FMP" />
            {!colapsado && (
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold leading-tight text-white">
                  FMP Analytics
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] leading-tight text-white/35">
                  Business Intelligence
                </span>
              </span>
            )}
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 text-white/50 hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
          {onToggleColapso && (
            <button
              type="button"
              onClick={onToggleColapso}
              title={colapsado ? 'Expandir menu' : 'Recolher menu'}
              aria-label={colapsado ? 'Expandir menu' : 'Recolher menu'}
              className={`hidden rounded-md p-1.5 text-white/40 transition hover:bg-white/[0.06] hover:text-white lg:block ${
                colapsado ? '' : 'ml-auto'
              }`}
            >
              {colapsado ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Navegação */}
        <nav className={`flex-1 space-y-0.5 overflow-y-auto pb-4 ${colapsado ? 'px-2 pt-3' : 'px-3'}`}>
          {!colapsado && rotuloSecao('Geral')}
          <NavLink
            to="/"
            end
            onClick={onClose}
            title={colapsado ? 'Início' : undefined}
            className={({ isActive }) =>
              `${classesItem(isActive)} ${colapsado ? 'justify-center px-0' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !colapsado && <Trilho />}
                <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                {!colapsado && <span className="truncate">Início</span>}
              </>
            )}
          </NavLink>

          {!colapsado && rotuloSecao('Dashboards')}
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;

            if (item.disabled) {
              return (
                <div
                  key={item.slug}
                  title={item.title}
                  className={`flex h-9 cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 text-[13px] text-white/25 ${
                    colapsado ? 'justify-center px-0' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                  {!colapsado && (
                    <>
                      <span className="truncate">{item.title}</span>
                      <span className="ml-auto rounded-sm border border-white/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-white/30">
                        breve
                      </span>
                    </>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.slug}
                to={`/dashboards/${item.slug}`}
                onClick={onClose}
                title={item.subtitle ? `${item.title} — ${item.subtitle}` : item.title}
                className={({ isActive }) =>
                  `${classesItem(isActive)} ${colapsado ? 'justify-center px-0' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && !colapsado && <Trilho />}
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                    {!colapsado && <span className="truncate">{item.title}</span>}
                  </>
                )}
              </NavLink>
            );
          })}

          {perfil?.papel === 'admin' && (
            <>
              {!colapsado && rotuloSecao('Administração')}
              <NavLink
                to="/usuarios"
                onClick={onClose}
                title="Usuários — acessos da plataforma"
                className={({ isActive }) =>
                  `${classesItem(isActive)} ${colapsado ? 'justify-center px-0' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && !colapsado && <Trilho />}
                    <Shield className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                    {!colapsado && <span className="truncate">Usuários</span>}
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* Usuário */}
        <div className={`shrink-0 border-t border-white/[0.06] ${colapsado ? 'px-2 py-3' : 'px-3 py-3'}`}>
          <NavLink
            to="/minha-conta"
            onClick={onClose}
            title={perfil?.nome_completo ?? undefined}
            className={`flex items-center rounded-md no-underline transition hover:bg-white/[0.05] ${
              colapsado ? 'justify-center p-1.5' : 'gap-2.5 p-2'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-fmp text-[11px] font-bold text-white">
              {iniciais(perfil?.nome_completo ?? '')}
            </span>
            {!colapsado && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium leading-tight text-white/90">
                  {perfil?.nome_completo ?? '—'}
                </span>
                <span className="block truncate text-[10px] leading-tight text-white/40">
                  {perfil?.cargo ?? perfil?.codusuario ?? ''}
                </span>
              </span>
            )}
            {!colapsado && perfil?.papel === 'admin' && (
              <span className="rounded-sm bg-fmp/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fmp-300">
                Admin
              </span>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
}

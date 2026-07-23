import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Settings,
  Shield,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  MapPin,
  GraduationCap,
  DollarSign,
  UserPlus,
  Activity,
  Users,
  Shield,
  Settings,
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
};

export function Sidebar({ items, open, onClose }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col glass-drawer text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fmp-light to-fmp shadow-glow">
              <LayoutDashboard className="h-5 w-5 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">FMP Analytics</p>
              <p className="text-2xs uppercase tracking-widest text-white/50">
                Central de Dashboards
              </p>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 mt-2 px-3 text-2xs font-semibold uppercase tracking-widest text-white/40">
            Painel
          </p>
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? 'bg-fmp text-white shadow-glow'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 flex-shrink-0" strokeWidth={2.3} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Inicio</p>
              <p className="truncate text-2xs text-white/50">Visao geral</p>
            </div>
          </NavLink>

          <p className="mb-2 mt-5 px-3 text-2xs font-semibold uppercase tracking-widest text-white/40">
            Dashboards
          </p>
          {items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            const commonInner = (
              <>
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2.3} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.subtitle && (
                    <p className="truncate text-2xs text-white/50">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {item.disabled && (
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-2xs font-semibold text-white/60">
                    Em breve
                  </span>
                )}
              </>
            );

            if (item.disabled) {
              return (
                <div
                  key={item.slug}
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/40 animate-slide-right"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {commonInner}
                </div>
              );
            }

            return (
              <NavLink
                key={item.slug}
                to={`/dashboards/${item.slug}`}
                onClick={onClose}
                style={{ animationDelay: `${i * 40}ms` }}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all animate-slide-right ${
                    isActive
                      ? 'bg-fmp text-white shadow-glow'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {commonInner}
              </NavLink>
            );
          })}

          <p className="mb-2 mt-5 px-3 text-2xs font-semibold uppercase tracking-widest text-white/40">
            Administracao
          </p>
          <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-white/40">
            <Shield className="h-4 w-4" strokeWidth={2.3} />
            <div className="min-w-0">
              <p className="text-sm font-medium">Governanca</p>
              <p className="text-2xs text-white/50">Permissoes e auditoria</p>
            </div>
          </div>
          <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-white/40">
            <Settings className="h-4 w-4" strokeWidth={2.3} />
            <div className="min-w-0">
              <p className="text-sm font-medium">Configuracoes</p>
              <p className="text-2xs text-white/50">Preferencias do sistema</p>
            </div>
          </div>
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fmp-light to-fmp text-sm font-semibold text-white">
              FM
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                Equipe FMP
              </p>
              <p className="truncate text-2xs text-white/50">
                analytics@fmp.edu.br
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

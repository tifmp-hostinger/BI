import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { useDashboards } from '@/hooks/useDashboards';
import { ErrorState } from '@/components/ui/ErrorState';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  MapPin,
  GraduationCap,
  DollarSign,
  UserPlus,
  Activity,
  Users,
};

const COLOR_TOKENS: Record<
  string,
  { chip: string; halo: string; ring: string; accent: string }
> = {
  blue: {
    chip: 'bg-fmp-muted text-fmp-dark',
    halo: 'from-fmp-light/40 via-fmp/10 to-transparent',
    ring: 'ring-fmp/20',
    accent: 'text-fmp',
  },
  emerald: {
    chip: 'bg-success-light text-success-dark',
    halo: 'from-success/30 via-success/5 to-transparent',
    ring: 'ring-success/20',
    accent: 'text-success',
  },
  amber: {
    chip: 'bg-warning-light text-warning-dark',
    halo: 'from-warning/30 via-warning/5 to-transparent',
    ring: 'ring-warning/20',
    accent: 'text-warning',
  },
  rose: {
    chip: 'bg-danger-light text-danger-dark',
    halo: 'from-danger/30 via-danger/5 to-transparent',
    ring: 'ring-danger/20',
    accent: 'text-danger',
  },
  info: {
    chip: 'bg-info-light text-info-dark',
    halo: 'from-info/30 via-info/5 to-transparent',
    ring: 'ring-info/20',
    accent: 'text-info',
  },
  fmp: {
    chip: 'bg-fmp-muted text-fmp-dark',
    halo: 'from-fmp/30 via-fmp/5 to-transparent',
    ring: 'ring-fmp/20',
    accent: 'text-fmp',
  },
};

export function HomePage() {
  const { data, loading, error, refetch } = useDashboards();

  return (
    <AppShell
      title="Central de Dashboards"
      subtitle="Selecione um painel para comecar"
    >
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-3xl hero-gradient p-6 text-white shadow-card sm:p-10 animate-fade-in">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fmp-light/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-info/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-2xs font-medium uppercase tracking-widest text-white/80 ring-1 ring-inset ring-white/15">
                <Sparkles className="h-3 w-3" />
                Inteligencia institucional
              </span>
              <h1 className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
                Uma central para todos os dashboards da FMP
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
                Visao consolidada de indicadores academicos, financeiros,
                comerciais e geograficos, com dados atualizados em tempo real e
                pronta para novos modulos.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Link
                  to="/dashboards/presenca-nacional"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-fmp-dark shadow-glow transition-all hover:-translate-y-0.5"
                >
                  <MapPin className="h-4 w-4" />
                  Abrir Presenca Nacional
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-2xs font-medium text-white/80 ring-1 ring-inset ring-white/15">
                  <BarChart3 className="h-3 w-3" />
                  {data.length} dashboards catalogados
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 flex-col items-end gap-2 md:flex">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur ring-1 ring-inset ring-white/15">
                <p className="text-2xs uppercase tracking-widest text-white/60">
                  Atualizacao
                </p>
                <p className="mt-1 text-lg font-semibold">Tempo real</p>
                <p className="mt-1 text-2xs text-white/60">
                  Ultima sincronia agora ha pouco
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <ErrorState
            title="Nao foi possivel listar os dashboards"
            message={error}
            onRetry={refetch}
          />
        )}

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Dashboards disponiveis
              </h2>
              <p className="text-xs text-gray-500">
                Clique em um card para acessar os indicadores do painel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-2xl bg-white shadow-card"
                />
              ))}

            {!loading &&
              data.map((d, i) => {
                const Icon = ICONS[d.icon] ?? LayoutDashboard;
                const tokens = COLOR_TOKENS[d.color] ?? COLOR_TOKENS.fmp;
                const disabled = !d.is_active;

                const CardBody = (
                  <>
                    <div
                      className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${tokens.halo} blur-2xl`}
                    />
                    <div className="relative flex items-start justify-between gap-4">
                      <div
                        className={`rounded-xl p-3 ${tokens.chip} ring-1 ring-inset ${tokens.ring}`}
                      >
                        <Icon
                          className={`h-5 w-5 ${tokens.accent}`}
                          strokeWidth={2.2}
                        />
                      </div>
                      <Badge
                        variant={disabled ? 'neutral' : 'success'}
                        className="uppercase"
                      >
                        {disabled ? 'Em breve' : 'Disponivel'}
                      </Badge>
                    </div>

                    <div className="relative mt-6 space-y-2">
                      <p className="text-2xs font-medium uppercase tracking-widest text-gray-400">
                        {d.category}
                      </p>
                      <h3 className="text-base font-semibold text-gray-900">
                        {d.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-gray-500 line-clamp-3">
                        {d.description}
                      </p>
                    </div>

                    <div className="relative mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-2xs text-gray-500">
                        {disabled
                          ? 'Aguardando ativacao'
                          : 'Acessar dashboard'}
                      </span>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          disabled
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-fmp text-white group-hover:shadow-glow group-hover:-translate-y-0.5'
                        }`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </>
                );

                const baseClass = `group relative overflow-hidden rounded-2xl bg-white p-5 shadow-card transition-all duration-200 animate-slide-up`;

                if (disabled) {
                  return (
                    <div
                      key={d.id}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className={`${baseClass} cursor-not-allowed opacity-70`}
                    >
                      {CardBody}
                    </div>
                  );
                }
                return (
                  <Link
                    key={d.id}
                    to={`/dashboards/${d.slug}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className={`${baseClass} hover:-translate-y-0.5 hover:shadow-card-hover`}
                  >
                    {CardBody}
                  </Link>
                );
              })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

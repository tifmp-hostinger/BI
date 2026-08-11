import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  GraduationCap,
  History,
  LayoutDashboard,
  MapPin,
  Percent,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { AppShell, CHAVE_ULTIMO_DASHBOARD } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { useDashboards } from '@/hooks/useDashboards';
import { ErrorState } from '@/components/ui/ErrorState';
import { leMeta, leResumo } from '@/lib/datasetCache';
import { EXTRATORES_RESUMO } from '@/lib/resumoDashboards';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  MapPin,
  GraduationCap,
  DollarSign,
  UserPlus,
  Activity,
  Users,
  Target,
  Percent,
  TrendingUp,
};

const ACCENT: Record<string, { chip: string; icon: string }> = {
  fmp: { chip: 'bg-fmp-muted', icon: 'text-fmp' },
  emerald: { chip: 'bg-success-light', icon: 'text-success' },
  amber: { chip: 'bg-warning-light', icon: 'text-warning' },
  rose: { chip: 'bg-danger-light', icon: 'text-danger' },
  info: { chip: 'bg-info-light', icon: 'text-info' },
};

type ResumoCard = {
  itens: { rotulo: string; valor: string }[];
  /** Momento da gravação do cache do painel (epoch ms). */
  dadosDe: number | null;
};

/**
 * Números-manchete por painel, lidos das entradas `resumo:`/`meta:` que o
 * aquecimento grava no IndexedDB — leitura de bytes, nunca do dataset.
 * Enquanto o aquecimento estiver rodando (primeiro login do dia), os cards
 * vão ganhando os números à medida que cada painel fica pronto: relê a cada
 * 4s até completar ou desistir em ~2 min.
 */
function useResumosDashboards(): Record<string, ResumoCard> {
  const slugs = useMemo(() => Object.keys(EXTRATORES_RESUMO), []);
  const [resumos, setResumos] = useState<Record<string, ResumoCard>>({});

  useEffect(() => {
    let vivo = true;
    let tentativas = 0;

    const le = async () => {
      const pares = await Promise.all(
        slugs.map(async (slug) => {
          const [resumo, meta] = await Promise.all([leResumo(slug), leMeta(slug)]);
          return [slug, resumo, meta] as const;
        }),
      );
      if (!vivo) return true;
      const prontos: Record<string, ResumoCard> = {};
      for (const [slug, resumo, meta] of pares) {
        if (resumo) prontos[slug] = { itens: resumo.itens, dadosDe: meta?.gravadoEm ?? null };
      }
      setResumos(prontos);
      return Object.keys(prontos).length === slugs.length;
    };

    void le();
    const timer = setInterval(() => {
      tentativas += 1;
      void le().then((completo) => {
        if (completo || tentativas >= 30) clearInterval(timer);
      });
    }, 4000);

    return () => {
      vivo = false;
      clearInterval(timer);
    };
  }, [slugs]);

  return resumos;
}

function formataDadosDe(ms: number): string {
  const d = new Date(ms);
  const hoje = new Date();
  const mesmoDia =
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear();
  if (mesmoDia) {
    return `hoje às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function HomePage() {
  const { data, loading, error, refetch } = useDashboards();
  const resumos = useResumosDashboards();

  const disponiveis = data.filter((d) => d.is_active).length;
  const emBreve = data.length - disponiveis;

  const ultimoSlug = useMemo(() => {
    try {
      return localStorage.getItem(CHAVE_ULTIMO_DASHBOARD);
    } catch {
      return null;
    }
  }, []);
  const ultimoDashboard = data.find((d) => d.slug === ultimoSlug && d.is_active) ?? null;

  const paineisProntos = Object.keys(resumos).length;
  const sincronizadoEm = Object.values(resumos)
    .map((r) => r.dadosDe)
    .filter((v): v is number => v !== null)
    .sort((a, b) => b - a)[0];

  return (
    <AppShell title="Central de Dashboards" subtitle="Selecione um painel para começar">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Hero — dark editorial surface */}
        <section className="relative overflow-hidden rounded-lg hero-gradient p-6 text-cream shadow-card sm:p-10 animate-fade-in">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fmp/20 blur-3xl" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="fmp-eyebrow text-fmp-300">
                Inteligência institucional
              </span>
              <h1
                className="fmp-display mt-4 text-2xl text-cream sm:text-3xl lg:text-4xl"
                style={{ color: 'inherit' }}
              >
                Uma central para todos os dashboards da FMP
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/70 sm:text-base">
                Visão consolidada de indicadores acadêmicos, financeiros,
                comerciais e geográficos — carregados em segundo plano para
                abrir na hora, como um BI.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {ultimoDashboard ? (
                  <Link
                    to={`/dashboards/${ultimoDashboard.slug}`}
                    className="inline-flex items-center gap-2 rounded-pill bg-fmp px-5 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-fmp-dark no-underline"
                  >
                    <History className="h-4 w-4" />
                    Continuar em {ultimoDashboard.title}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link
                    to="/dashboards/presenca-nacional"
                    className="inline-flex items-center gap-2 rounded-pill bg-fmp px-5 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-fmp-dark no-underline"
                  >
                    <MapPin className="h-4 w-4" />
                    Abrir Presença Nacional
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-cream/70">
                  <BarChart3 className="h-3 w-3" />
                  {disponiveis} {disponiveis === 1 ? 'disponível' : 'disponíveis'}
                  {emBreve > 0 && ` · ${emBreve} em breve`}
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 flex-col items-end gap-2 md:flex">
              <div className="rounded-lg border border-cream/15 bg-cream/5 p-4 backdrop-blur">
                <p className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-widest text-cream/70">
                  <Zap className="h-3 w-3" />
                  Painéis prontos
                </p>
                <p className="fmp-kpi mt-1 text-lg leading-normal text-cream" style={{ color: 'inherit' }}>
                  {paineisProntos} de {Object.keys(EXTRATORES_RESUMO).length}
                </p>
                <p className="mt-1 text-2xs text-cream/70">
                  {sincronizadoEm
                    ? `Dados sincronizados ${formataDadosDe(sincronizadoEm)}`
                    : 'Carregando dados em segundo plano…'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <ErrorState
            title="Não foi possível listar os dashboards"
            message={error}
            onRetry={refetch}
          />
        )}

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="fmp-eyebrow">Catálogo</span>
              <h2 className="fmp-kpi mt-1 text-xl leading-normal">
                Dashboards disponíveis
              </h2>
              <p className="mt-0.5 text-xs text-ink-3">
                Os números abaixo já estão carregados no seu navegador — os
                painéis abrem na hora.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="relative h-56 overflow-hidden rounded-md border border-line bg-white shadow-card"
                >
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-paper to-transparent" />
                </div>
              ))}

            {!loading &&
              data.map((d, i) => {
                const Icon = ICONS[d.icon] ?? LayoutDashboard;
                const accent = ACCENT[d.color] ?? ACCENT.fmp;
                const disabled = !d.is_active;
                const resumo = resumos[d.slug];

                const CardBody = (
                  <>
                    <div className="relative flex items-start justify-between gap-4">
                      <div className={`rounded-sm p-3 ${accent.chip}`}>
                        <Icon className={`h-5 w-5 ${accent.icon}`} strokeWidth={2.2} />
                      </div>
                      {disabled && (
                        <Badge variant="neutral" className="uppercase">
                          Em breve
                        </Badge>
                      )}
                    </div>

                    <div className="relative mt-6 space-y-2">
                      <p className="text-2xs font-semibold uppercase tracking-widest text-ink-3">
                        {d.category}
                      </p>
                      <h3 className="fmp-kpi text-base leading-normal">
                        {d.title}
                      </h3>
                      {resumo && resumo.itens.length > 0 ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                          {resumo.itens.map((item) => (
                            <span key={item.rotulo} className="min-w-0">
                              <span className="fmp-kpi text-lg leading-normal">{item.valor}</span>{' '}
                              <span className="text-2xs text-ink-3">{item.rotulo}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed text-ink-3 line-clamp-3">
                          {d.description}
                        </p>
                      )}
                    </div>

                    <div className="relative mt-6 flex items-center justify-between border-t border-line pt-4">
                      <span className="text-2xs text-ink-3">
                        {disabled
                          ? 'Aguardando ativação'
                          : resumo?.dadosDe
                            ? `Dados de ${formataDadosDe(resumo.dadosDe)}`
                            : 'Acessar dashboard'}
                      </span>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          disabled
                            ? 'bg-paper text-ink-3'
                            : 'bg-fmp text-white group-hover:-translate-y-0.5 group-hover:shadow-glow'
                        }`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </>
                );

                const baseClass = `group relative overflow-hidden rounded-md border border-line bg-white p-5 shadow-card transition-all duration-200 animate-slide-up`;

                if (disabled) {
                  return (
                    <div
                      key={d.id}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className={`${baseClass} cursor-not-allowed opacity-60`}
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
                    className={`${baseClass} hover:-translate-y-0.5 hover:shadow-card-hover no-underline`}
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

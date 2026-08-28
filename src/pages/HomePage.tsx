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
} from 'lucide-react';
import { AppShell, CHAVE_ULTIMO_DASHBOARD } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { useDashboards } from '@/hooks/useDashboards';
import { ErrorState } from '@/components/ui/ErrorState';
import { leMeta } from '@/lib/datasetCache';

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

/**
 * Quando o dado de cada painel foi baixado — lido da entrada `meta:` que o
 * aquecimento grava no IndexedDB. É leitura de alguns bytes, nunca do
 * dataset.
 *
 * Esta é a ÚNICA informação de dado que a Central exibe, e de propósito.
 * Antes cada card trazia um "número-manchete" (matrículas, inscrições,
 * investimento). Eram contagens do dataset INTEIRO, sem filtro nenhum, e por
 * isso não batiam com o que o painel mostra ao abrir: Presidência abre no
 * vestibular vigente, Bolsas filtrado por ano, Growth só em Graduação e desde
 * out/2025. Só Presença Nacional coincidia, porque abre sem filtro. Um card
 * certo e quatro divergentes é pior que nenhum: o usuário não tem como saber
 * em qual confiar, e um número na porta de entrada que discorda do número lá
 * dentro derruba a confiança no BI inteiro.
 *
 * O frescor, ao contrário, é verdade absoluta: não depende de filtro, de
 * período nem de regra herdada. Enquanto o aquecimento roda (primeiro login
 * do dia), os cards vão ganhando a data conforme cada painel fica pronto:
 * relê a cada 4s até completar ou desistir em ~2 min.
 */
function useFrescorDashboards(slugs: string[]): Record<string, number> {
  const chave = slugs.join('|');
  const [frescor, setFrescor] = useState<Record<string, number>>({});

  useEffect(() => {
    const lista = chave ? chave.split('|') : [];
    let vivo = true;
    let tentativas = 0;

    const le = async () => {
      const pares = await Promise.all(
        lista.map(async (slug) => [slug, await leMeta(slug)] as const),
      );
      if (!vivo) return true;
      const prontos: Record<string, number> = {};
      for (const [slug, meta] of pares) {
        if (meta?.gravadoEm) prontos[slug] = meta.gravadoEm;
      }
      setFrescor(prontos);
      return Object.keys(prontos).length === lista.length;
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
  }, [chave]);

  return frescor;
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
  const { data, error, refetch } = useDashboards();

  const slugsAtivos = useMemo(
    () => data.filter((d) => d.is_active).map((d) => d.slug),
    [data],
  );
  const frescor = useFrescorDashboards(slugsAtivos);

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

  const sincronizadoEm = Object.values(frescor).sort((a, b) => b - a)[0];

  return (
    <AppShell title="Central de Dashboards" subtitle="Selecione um painel para começar">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/*
          Faixa de retomada, no lugar do "hero" escuro de 280px.
          O hero repetia em manchete o título que a barra de cima já dá
          ("Central de Dashboards") e um parágrafo institucional lido uma vez
          na vida; o que era realmente usado toda visita — voltar ao último
          painel — ficava enterrado no meio dele.

          Tudo aqui é conhecido no PRIMEIRO QUADRO: o catálogo é estático e o
          último painel vem do localStorage. Nada nesta faixa espera rede, e
          nada aparece depois empurrando o resto para baixo.
        */}
        <section className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md border border-line bg-card px-4 py-3 shadow-card animate-fade-in">
          {ultimoDashboard ? (
            <Link
              to={`/dashboards/${ultimoDashboard.slug}`}
              className="inline-flex items-center gap-2 rounded-pill bg-fmp px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-fmp-dark no-underline"
            >
              <History className="h-4 w-4" />
              Continuar em {ultimoDashboard.title}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              to="/dashboards/presenca-nacional"
              className="inline-flex items-center gap-2 rounded-pill bg-fmp px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-fmp-dark no-underline"
            >
              <MapPin className="h-4 w-4" />
              Abrir Presença Nacional
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-ink-3">
            <BarChart3 className="h-3 w-3" />
            {disponiveis} {disponiveis === 1 ? 'painel disponível' : 'painéis disponíveis'}
            {emBreve > 0 && ` · ${emBreve} em breve`}
          </span>

          {/*
            Sem contador de progresso aqui de propósito. O "N de 5 painéis
            prontos / Carregando em segundo plano…" que ficava neste lugar
            anunciava uma espera que o usuário não precisa fazer: os painéis
            já abrem, com ou sem aquecimento concluído. A linha abaixo só
            existe quando há resposta — e é informação de FRESCOR do dado,
            não de carregamento. Como é o último item da faixa (ml-auto),
            aparecer depois não desloca nada do que já está na tela.
          */}
          {sincronizadoEm && (
            <span className="ml-auto text-2xs text-ink-3 animate-fade-in">
              Dados sincronizados {formataDadosDe(sincronizadoEm)}
            </span>
          )}
        </section>

        {error && (
          <ErrorState
            title="Não foi possível listar os dashboards"
            message={error}
            onRetry={refetch}
          />
        )}

        <section className="space-y-4">
          <div>
            <span className="fmp-eyebrow">Catálogo</span>
            <h2 className="fmp-kpi mt-1 text-xl leading-normal">
              Dashboards disponíveis
            </h2>
            <p className="mt-0.5 text-xs text-ink-3">
              Os dados já estão carregados no seu navegador — os painéis abrem
              na hora.
            </p>
          </div>

          {/*
            Sem esqueleto de carregamento nesta grade: o catálogo é estático
            (ver useDashboards), então os cards existem no primeiro quadro. Só
            a data do dado chega depois, do cache — e chega dentro de um
            espaço já reservado, sem mexer no card.
          */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((d, i) => {
              const Icon = ICONS[d.icon] ?? LayoutDashboard;
              const accent = ACCENT[d.color] ?? ACCENT.fmp;
              const disabled = !d.is_active;
              const dadosDe = frescor[d.slug] ?? null;
              const ehUltimo = !disabled && d.slug === ultimoSlug;

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
                    {/* Vem do localStorage, não da rede: já está certo no
                        primeiro quadro e nunca aparece depois. */}
                    {ehUltimo && (
                      <Badge variant="neutral" className="uppercase">
                        Último acesso
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
                    {/* ALTURA RESERVADA (min-h, 3 linhas): descrições de 1, 2
                        e 3 linhas deixariam os cards com alturas diferentes e
                        a grade visivelmente torta. */}
                    <p className="min-h-[3.5rem] text-xs leading-relaxed text-ink-3 line-clamp-3">
                      {d.description}
                    </p>
                  </div>

                  {/* A data do dado chega do cache alguns instantes depois de
                      a página abrir. Ocupa o mesmo lugar e a mesma altura do
                      texto que substitui, então nada se move quando ela
                      aparece. */}
                  <div className="relative mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-2xs text-ink-3">
                      {disabled
                        ? 'Aguardando ativação'
                        : dadosDe
                          ? `Dados de ${formataDadosDe(dadosDe)}`
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

              const baseClass = `group relative overflow-hidden rounded-md border bg-card p-5 shadow-card transition-all duration-200 animate-slide-up ${
                ehUltimo ? 'border-fmp/40 ring-1 ring-fmp/20' : 'border-line'
              }`;

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

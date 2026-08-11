import { fmtBRL, fmtBRLCompact, fmtInt, fmtIntCompact, fmtPct, fmtRatio } from '@/lib/formatters';
import type { MediaMetrics, NegocioMetrics } from '../types';

function fmtOrDash(v: number | null, fmt: (n: number) => string): string {
  return v === null ? '--' : fmt(v);
}

/** % de passagem entre duas etapas do funil ("32% dos leads"). */
function passagem(de: number, para: number): string | null {
  if (de <= 0) return null;
  return `${Math.round((para / de) * 100)}%`;
}

/** Explicações do jargão de mídia — acessíveis no hover/long-press. */
const DICAS: Record<string, string> = {
  Impressões: 'Quantas vezes os anúncios apareceram na tela de alguém.',
  Alcance: 'Pessoas distintas que viram algum anúncio. O Google não informa esse número — com Google no recorte, mostra "--".',
  Frequência: 'Média de vezes que cada pessoa viu um anúncio (impressões ÷ alcance).',
  Clicks: 'Cliques nos anúncios.',
  CTR: 'Cliques ÷ impressões: de cada 100 exibições, quantas geraram clique.',
  CPC: 'Custo por clique: investimento ÷ cliques.',
};

/**
 * Painel direito: funil Leads → Inscritos → Matrículas com as TAXAS DE
 * PASSAGEM entre etapas (a informação que um funil deve entregar — as
 * larguras são esquemáticas, não proporcionais). Investimento vira legenda
 * (é R$, não uma etapa de pessoas) e Cancelados aparece como PERDA, fora da
 * rampa, com % sobre as matrículas.
 */
export function FunnelPanel({ media, negocio }: { media: MediaMetrics; negocio: NegocioMetrics }) {
  const etapas = [
    { label: 'Leads', valor: fmtInt(media.leads), width: 'w-full', taxa: null as string | null },
    { label: 'Inscritos', valor: fmtInt(negocio.inscritos), width: 'w-[78%]', taxa: passagem(media.leads, negocio.inscritos) },
    { label: 'Matrículas', valor: fmtInt(negocio.matriculas), width: 'w-[56%]', taxa: passagem(negocio.inscritos, negocio.matriculas) },
  ];
  const pctCancel =
    negocio.matriculas > 0 ? Math.round((negocio.cancelamentos / negocio.matriculas) * 100) : null;

  const midia = [
    { label: 'Impressões', valor: fmtIntCompact(media.impressoes), exato: fmtInt(media.impressoes) },
    { label: 'Alcance', valor: media.alcance === null ? '--' : fmtIntCompact(media.alcance), exato: media.alcance === null ? undefined : fmtInt(media.alcance) },
    { label: 'Frequência', valor: fmtOrDash(media.frequencia, fmtRatio), exato: undefined },
    { label: 'Clicks', valor: fmtIntCompact(media.clicks), exato: fmtInt(media.clicks) },
    { label: 'CTR', valor: fmtOrDash(media.ctr, fmtPct), exato: undefined },
    { label: 'CPC', valor: fmtOrDash(media.cpc, fmtBRLCompact), exato: media.cpc === null ? undefined : fmtBRL(media.cpc) },
  ];

  return (
    // @container: no desktop este painel vive numa coluna FIXA de 300px — a
    // grade interna precisa reagir à largura real do painel, não à viewport.
    <div className="@container rounded-md border border-line bg-white p-5 shadow-card animate-fade-in">
      <h3 className="fmp-kpi mb-1 text-sm leading-normal">
        Funil de Captação
      </h3>
      <p className="mb-4 text-2xs text-ink-3" title={fmtBRL(media.investimento)}>
        {fmtBRLCompact(media.investimento)} investidos no período
      </p>
      <div className="flex flex-col items-center gap-1.5">
        {etapas.map((e, i) => (
          <div key={e.label} className={`${e.width} min-w-[140px]`}>
            {e.taxa && (
              <p className="pb-0.5 text-center text-2xs text-ink-3">↓ {e.taxa}</p>
            )}
            <div
              className="flex flex-col items-center rounded-md px-3 py-2 text-center"
              style={{
                background: `rgba(238,42,66,${(0.95 - i * 0.18).toFixed(2)})`,
              }}
            >
              <span className="text-2xs font-medium uppercase tracking-widest text-white/85">{e.label}</span>
              <span className="fmp-kpi text-base leading-normal !text-white">
                {e.valor}
              </span>
            </div>
          </div>
        ))}
        {/* Perda — visualmente separada da rampa do funil */}
        <div className="mt-1 w-[56%] min-w-[140px]">
          <div className="flex flex-col items-center rounded-md border border-dashed border-line-2 bg-paper px-3 py-2 text-center">
            <span className="text-2xs font-medium uppercase tracking-widest text-ink-3">Cancelados</span>
            <span className="fmp-kpi text-base leading-normal">
              {fmtInt(negocio.cancelamentos)}
              {pctCancel !== null && (
                <span className="ml-1 text-2xs font-normal not-italic text-ink-3">
                  ({pctCancel}% das matrículas)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 @sm:grid-cols-3">
        {midia.map((m) => (
          <div key={m.label} className="min-w-0 text-center" title={DICAS[m.label]}>
            <p className="truncate text-2xs font-medium uppercase tracking-wider text-ink-3">{m.label}</p>
            <p className="fmp-kpi mt-0.5 break-words text-sm leading-tight" title={m.exato ?? DICAS[m.label]}>
              {m.valor}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

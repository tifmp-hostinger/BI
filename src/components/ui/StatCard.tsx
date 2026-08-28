import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, HelpCircle, Minus } from 'lucide-react';
import { BalaoInfo } from '@/components/ui/BalaoInfo';

/**
 * Grade padrão para linhas de StatCard, em TODOS os dashboards.
 *
 * Usa container queries (`@sm:`/`@2xl:`/`@4xl:`), não media queries de
 * viewport (`sm:`/`lg:`/`xl:`): a contagem de colunas reage à largura REAL
 * do espaço disponível para a grade, não à largura da janela. Isso resolve
 * dois problemas que breakpoint por viewport nunca resolve:
 *   1. Colapsar o menu lateral muda a largura do container sem mudar a
 *      viewport — com media query a grade não reagia; com container query,
 *      sim.
 *   2. Uma tela com painel lateral fixo (filtros, funil) tem MENOS espaço
 *      para a grade do que a viewport sugere — media query não sabe disso;
 *      container query mede o espaço real.
 *
 * Nunca mais que 4 colunas, mesmo com 7-8 cards na linha (ModalidadePosTab,
 * GraduacaoTab): cards extras quebram para a linha de baixo em vez de
 * espremer a coluna até ficar ilegível.
 *
 * CSS não permite um elemento ser container E responder à própria query —
 * por isso são DUAS classes para DOIS elementos: `STAT_GRID_CONTAINER`
 * no wrapper (ex. o `<section>`) e `STAT_GRID_CLASSES` na grade em si
 * (um `<div>` filho direto, com os StatCards dentro).
 */
export const STAT_GRID_CONTAINER = '@container';
export const STAT_GRID_CLASSES =
  'grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4';

type Trend = { value: number; direction: 'up' | 'down' | 'flat' };
type ColorKey = 'fmp' | 'success' | 'warning' | 'danger' | 'info' | 'gray';

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: Trend;
  /** Contra o que a tendência compara (ex. "vs. 2025/2"). */
  trendLabel?: string;
  color?: ColorKey;
  highlight?: boolean;
  index?: number;
  /** Explicação da métrica: vira um "?" que abre um balão ao clique/toque. */
  hint?: string;
  /** Valor por extenso no hover, quando `value` está abreviado (ex. "R$ 872 mil"). */
  exactValue?: string;
};

const COLOR_STYLES: Record<
  ColorKey,
  { icon: string; bg: string; bar: string; text: string }
> = {
  fmp: { icon: 'text-fmp', bg: 'bg-fmp-muted', bar: 'bg-fmp', text: 'text-fmp' },
  success: { icon: 'text-success', bg: 'bg-success-light', bar: 'bg-success', text: 'text-success-dark' },
  warning: { icon: 'text-warning', bg: 'bg-warning-light', bar: 'bg-warning', text: 'text-warning-dark' },
  danger: { icon: 'text-danger', bg: 'bg-danger-light', bar: 'bg-danger', text: 'text-danger-dark' },
  info: { icon: 'text-info', bg: 'bg-info-light', bar: 'bg-info', text: 'text-info-dark' },
  gray: { icon: 'text-ink-3', bg: 'bg-paper', bar: 'bg-sand', text: 'text-ink-2' },
};

/**
 * Tamanho do valor por CONTAINER (o card é @container) e por comprimento:
 * a grade dimensiona os cards por container query, então a fonte precisa
 * acompanhar a largura real do card — nunca a da viewport. Valores longos
 * ("R$ 123,45 mi") descem um degrau em vez de serem truncados: número
 * cortado com reticências é um número errado.
 */
function classeValor(texto: string): string {
  const longo = texto.length > 11;
  return longo
    ? 'text-lg @[15rem]:text-xl @[19rem]:text-2xl'
    : 'text-xl @[15rem]:text-2xl @[19rem]:text-3xl';
}

/**
 * "?" que abre balão de explicação ao clique/toque — tooltip nativo (title)
 * não existe em touch e some rápido no desktop; a explicação "mastigada"
 * precisa ser legível onde o usuário estiver. Via portal (BalaoInfo): um
 * balão absoluto comum era clipado pelo overflow-hidden do próprio card.
 */
export function HintPopover({ hint, label }: { hint: string; label: string }) {
  return (
    <BalaoInfo rotuloAcao={`O que é ${label}?`} gatilho={<HelpCircle className="h-3 w-3" strokeWidth={2.4} />}>
      <span className="block text-2xs font-normal normal-case leading-relaxed tracking-normal text-ink-2">
        {hint}
      </span>
    </BalaoInfo>
  );
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel = 'vs. período anterior',
  color = 'fmp',
  highlight = false,
  index = 0,
  hint,
  exactValue,
}: StatCardProps) {
  const styles = COLOR_STYLES[color];
  const TrendIcon =
    trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;
  const trendColor =
    trend?.direction === 'up' ? 'text-success' : trend?.direction === 'down' ? 'text-danger' : 'text-ink-3';
  const valorTexto = String(value);

  return (
    <div
      className={`@container relative overflow-hidden rounded-md border border-line bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover animate-slide-up ${
        highlight ? 'ring-1 ring-fmp/30' : ''
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* min-h de 2 linhas: sem isso, rótulos de 1, 2 e 3 linhas empurram
              o número para alturas diferentes e a grade fica visivelmente
              torta. Reservar o espaço alinha todos os números na mesma
              baseline. */}
          {/* Texto corrido, não flex: como flex, o rótulo virava um item e o
              "?" outro — em card estreito o rótulo tomava a largura toda e o
              "?" era espremido por cima do ícone. Em texto corrido ele flui
              junto e quebra linha com o rótulo.
              min-h de 2 linhas: rótulos de 1, 2 e 3 linhas empurravam o
              número para alturas diferentes e a grade ficava torta. */}
          <p className="min-h-[2.2em] text-2xs font-semibold uppercase leading-tight tracking-widest text-ink-3">
            {label}
            {hint && <HintPopover hint={hint} label={label} />}
          </p>
          <p
            className={`fmp-kpi mt-2 break-words leading-tight ${classeValor(valorTexto)}`}
            title={exactValue ?? valorTexto}
          >
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-ink-3 line-clamp-2">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`rounded-sm p-2.5 ${styles.bg}`}>
            <Icon className={`h-5 w-5 ${styles.icon}`} strokeWidth={2.2} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={`flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-2xs font-semibold ${trendColor}`}>
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-2xs text-ink-3">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="relative animate-slide-up overflow-hidden rounded-md border border-line bg-card p-5 shadow-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-paper">
        <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-fmp/50 to-transparent" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="relative h-2 w-20 overflow-hidden rounded bg-paper">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="relative h-7 w-24 overflow-hidden rounded bg-paper">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
        <div className="relative h-10 w-10 overflow-hidden rounded-sm bg-paper">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}

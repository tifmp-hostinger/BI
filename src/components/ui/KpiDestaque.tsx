import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { BalaoInfo } from '@/components/ui/BalaoInfo';

/**
 * Card do indicador PRINCIPAL de um painel.
 *
 * Existe porque uma faixa de seis a oito StatCards idênticos não tem
 * hierarquia: todos disputam a atenção em pé de igualdade e o olho não sabe
 * onde pousar. Cada painel elege um número que responde à pergunta central
 * da tela e o promove aqui; os demais continuam como StatCard de apoio.
 *
 * O tamanho do número acompanha a LARGURA DO CARD (container query) e o
 * comprimento do texto — mesmo princípio do StatCard, para valores longos
 * encolherem em vez de serem cortados.
 */
function classeValor(texto: string): string {
  const longo = texto.length > 11;
  return longo
    ? 'text-2xl @[22rem]:text-3xl @[30rem]:text-4xl'
    : 'text-3xl @[22rem]:text-4xl @[30rem]:text-5xl';
}

export function KpiDestaque({
  rotulo,
  valor,
  exato,
  hint,
  icon: Icon,
  apoio,
  proporcao,
  proporcaoRotulo,
  className = '',
}: {
  rotulo: string;
  valor: string;
  /** Valor por extenso no hover, quando `valor` está abreviado. */
  exato?: string;
  hint?: string;
  icon?: LucideIcon;
  /** Linha de leitura abaixo do número (comparação, composição, meta). */
  apoio?: ReactNode;
  /** 0 a 1 — desenha a barra de proporção sob o número. */
  proporcao?: number;
  proporcaoRotulo?: string;
  className?: string;
}) {
  const pct =
    proporcao === undefined || !Number.isFinite(proporcao)
      ? null
      : Math.max(0, Math.min(1, proporcao));

  return (
    <div
      className={`@container relative flex flex-col justify-between overflow-hidden rounded-md border border-fmp/30 bg-card p-5 shadow-card ring-1 ring-fmp/10 transition-all duration-200 hover:shadow-card-hover animate-slide-up ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fmp via-[#FF3B55] to-[#FF7A45]" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-2xs font-semibold uppercase leading-tight tracking-widest text-fmp-pressed">
          {rotulo}
          {hint && (
            <BalaoInfo
              rotuloAcao={`O que é ${rotulo}?`}
              gatilho={<HelpCircle className="h-3 w-3" strokeWidth={2.4} />}
              classeGatilho="cursor-help rounded-full p-1.5 -m-0.5 text-fmp-pressed transition hover:text-fmp focus-visible:text-fmp"
            >
              <span className="block text-2xs font-normal normal-case leading-relaxed tracking-normal text-ink-2">
                {hint}
              </span>
            </BalaoInfo>
          )}
        </p>
        {Icon && (
          <div className="rounded-sm bg-fmp-muted p-2.5 text-fmp">
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </div>
        )}
      </div>

      <p
        className={`fmp-kpi mt-3 break-words leading-tight ${classeValor(valor)}`}
        title={exato ?? valor}
      >
        {valor}
      </p>

      {pct !== null && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-pill bg-paper">
            <div
              className="h-full rounded-pill bg-fmp transition-all duration-700"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          {proporcaoRotulo && (
            <p className="mt-1.5 text-2xs text-ink-3">{proporcaoRotulo}</p>
          )}
        </div>
      )}

      {apoio && <div className="mt-3 text-xs leading-relaxed text-ink-2">{apoio}</div>}
    </div>
  );
}

export function KpiDestaqueSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-md border border-line bg-card p-5 shadow-card ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-paper">
        <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-fmp/50 to-transparent" />
      </div>
      <div className="relative h-2 w-32 overflow-hidden rounded bg-paper">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="relative mt-4 h-12 w-48 overflow-hidden rounded bg-paper">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="relative mt-4 h-2 w-full overflow-hidden rounded bg-paper">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}

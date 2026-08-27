import { CORES_CATEGORICAS } from '@/lib/chartColors';

/**
 * Parte-de-todo com POUCAS categorias: uma barra 100% segmentada com a
 * legenda-valor embaixo. Para 2–3 partes, responde "quanto de cada?" mais
 * direto que um donut — que para duas fatias vira um anel decorativo.
 * Nasceu no painel de Bolsas (Bolsas vs Descontos) e foi generalizada para
 * as demais distribuições de poucas partes.
 */
export function BarraProporcao({
  dados,
  formatarValor = (v) => v.toLocaleString('pt-BR'),
  nota,
  className = '',
}: {
  dados: { categoria: string; valor: number }[];
  /** Formata o valor na legenda (contagem, R$…). */
  formatarValor?: (v: number) => string;
  /** Linha de rodapé opcional (ex.: "1.234 benefícios no recorte"). */
  nota?: string;
  className?: string;
}) {
  const total = dados.reduce((soma, d) => soma + d.valor, 0);
  return (
    <div className={`flex flex-col justify-center gap-5 ${className}`}>
      <div className="flex h-9 w-full overflow-hidden rounded-pill">
        {dados.map((d, i) => {
          const pct = total > 0 ? (d.valor / total) * 100 : 0;
          return (
            <div
              key={d.categoria}
              style={{ width: `${pct}%`, background: CORES_CATEGORICAS[i % CORES_CATEGORICAS.length] }}
              title={`${d.categoria}: ${formatarValor(d.valor)} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>
      <ul className="space-y-2">
        {dados.map((d, i) => {
          const pct = total > 0 ? Math.round((d.valor / total) * 100) : 0;
          return (
            <li key={d.categoria} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: CORES_CATEGORICAS[i % CORES_CATEGORICAS.length] }}
                />
                {d.categoria}
              </span>
              <span className="fmp-kpi text-base leading-normal">
                {formatarValor(d.valor)}{' '}
                <span className="text-xs font-normal text-ink-3">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
      {nota && <p className="text-2xs text-ink-3">{nota}</p>}
    </div>
  );
}

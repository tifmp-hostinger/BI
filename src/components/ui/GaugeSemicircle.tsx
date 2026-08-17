import { useId } from 'react';

type Props = {
  value: number | null;
  label?: string;
  size?: number;
  strokeWidth?: number;
  formatValue?: (v: number | null) => string;
  caption?: string;
};

/**
 * Semicircle gauge (0-100%). The visual fill is clamped to 100%, but the numeric
 * label shows the real percentage even when it exceeds the meta.
 * Uses the single FMP red; track is a faint sand tone.
 */
export function GaugeSemicircle({
  value,
  label,
  size = 200,
  strokeWidth = 18,
  formatValue,
  caption,
}: Props) {
  const uid = useId();
  const gradientId = `gauge-grad-${uid}`;
  const width = size;
  const height = size / 2 + strokeWidth;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - strokeWidth;

  /*
   * Ângulos do semicírculo SUPERIOR: 180° (ponta esquerda) → 270° (topo) →
   * 360° (ponta direita). `polar` usa y = cy + r·sin(a) e no SVG o y cresce
   * para BAIXO, então é essa faixa — e não -90→90 — que desenha a metade de
   * cima.
   *
   * Estava -90→90, que descreve a metade DIREITA (vertical, de 12h a 6h).
   * Como a altura do viewBox é `size/2 + strokeWidth`, calculada para um
   * semicírculo deitado, tudo abaixo dela era cortado: só ~57% do arco
   * aparecia. O preenchimento, medido sobre os 180° inteiros, alcançava a
   * borda do corte já em ~57% — daí 55,3%, 125% e 168% desenharem o mesmo
   * arco visualmente cheio, enquanto o número ao lado dizia coisas
   * diferentes.
   */
  const ANG_INICIO = 180;
  const ANG_FIM = 360;

  const trackPath = describeArc(cx, cy, r, ANG_INICIO, ANG_FIM);

  const clamped =
    value === null || !Number.isFinite(value)
      ? null
      : Math.max(0, Math.min(1, value));

  const fillEndAngle = clamped === null ? ANG_INICIO : ANG_INICIO + clamped * 180;
  const fillPath =
    clamped === null || clamped <= 0
      ? null
      : describeArc(cx, cy, r, ANG_INICIO, fillEndAngle);

  // 1 casa decimal: gauge é leitura de ordem de grandeza — "74,53%" é falsa
  // precisão e engorda o número; alinha com o fmtPct padrão do app.
  const display =
    formatValue?.(value) ??
    (value === null || !Number.isFinite(value)
      ? '—'
      : `${(value * 100).toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}%`);

  return (
    <div className="flex w-full flex-col items-center">
      {/* Sem width/height fixos: o viewBox mantém a proporção e o SVG encolhe
          junto com colunas mais estreitas que `size` em vez de estourar. */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        style={{ maxWidth: size }}
        role="img"
        aria-label={label ?? 'Indicador'}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--fmp-red)" stopOpacity={0.85} />
            <stop offset="100%" stopColor="var(--fmp-red)" />
          </linearGradient>
        </defs>
        <path
          d={trackPath}
          fill="none"
          stroke="var(--fmp-line)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="-mt-6 text-center">
        <p className="fmp-kpi text-2xl leading-normal tabular-nums">
          {display}
        </p>
        {label && (
          <p className="mt-0.5 text-2xs font-semibold uppercase tracking-widest text-ink-3">
            {label}
          </p>
        )}
        {caption && <p className="mt-0.5 text-xs text-ink-3">{caption}</p>}
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  const sweep = 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

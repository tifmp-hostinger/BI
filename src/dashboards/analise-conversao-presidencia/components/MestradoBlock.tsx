import { Award, BookMarked, GraduationCap, ScrollText, Target, TrendingUp, Users } from 'lucide-react';
import { GaugeSemicircle } from '@/components/ui/GaugeSemicircle';
import { BlockCard } from './BlockCard';
import { KpiRow } from './KpiRow';
import { fmtInt, fmtPercent } from '../formatters';
import type { MestradoKpis } from '../types';
import { LIMIAR_CONVERSAO_MESTRADO } from '../rules';

type Props = {
  kpis: MestradoKpis | null;
  anos: number[];
  ano: number;
  onAnoChange: (ano: number) => void;
  loading?: boolean;
};

export function MestradoBlock({ kpis, anos, ano, onAnoChange, loading }: Props) {
  return (
    <BlockCard
      title="Mestrado"
      subtitle="Funil por ano acadêmico"
      icon={ScrollText}
      actions={
        <label className="flex items-center gap-2 rounded-pill border border-line bg-white px-3 py-1.5 text-2xs font-semibold text-ink-2">
          <span className="text-ink-3">Ano</span>
          <select
            value={ano}
            onChange={(e) => onAnoChange(Number(e.target.value))}
            className="rounded-pill bg-transparent text-2xs font-semibold text-fmp focus:outline-none focus-visible:ring-2 focus-visible:ring-fmp/40"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      }
    >
      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-5">
        <div className="@xl:col-span-2 flex items-center justify-center">
          <GaugeSemicircle
            value={loading ? null : kpis?.percentualMeta ?? null}
            label="% Meta"
            caption={
              kpis
                ? `${fmtInt(kpis.matriculas)} novas / meta ${fmtInt(kpis.meta)}`
                : undefined
            }
          />
        </div>
        <div className="@xl:col-span-3">
          <KpiRow
            label="Vagas"
            value={kpis ? fmtInt(kpis.vagas) : '—'}
            icon={Award}
            tone="accent"
          />
          <KpiRow
            label="Meta de matrículas"
            value={kpis ? fmtInt(kpis.meta) : '—'}
            icon={Target}
          />
          <KpiRow
            label="Leads (Rubeus)"
            value={kpis ? fmtInt(kpis.leads) : '—'}
            icon={Users}
            hint="Interessados captados no CRM no ano selecionado"
          />
          <KpiRow
            label="Inscrições"
            value={kpis ? fmtInt(kpis.inscricoes) : '—'}
            icon={BookMarked}
          />
          <KpiRow
            label="Matrículas"
            value={kpis ? fmtInt(kpis.matriculas) : '—'}
            icon={GraduationCap}
            tone="success"
            hint={
              kpis
                ? `${fmtInt(kpis.matriculasQualificadas)} com situação qualificada`
                : undefined
            }
          />
          <KpiRow
            label="% Matrículas qualificadas"
            value={kpis ? fmtPercent(kpis.conversao) : '—'}
            icon={TrendingUp}
            tone={
              kpis && kpis.conversao !== null && kpis.conversao >= LIMIAR_CONVERSAO_MESTRADO
                ? 'success'
                : 'warning'
            }
            hint={
              kpis
                ? `Das ${fmtInt(kpis.matriculas)} matrículas, ${fmtInt(kpis.matriculasQualificadas)} estão qualificadas (regra herdada do relatório original). Verde a partir de ${Math.round(LIMIAR_CONVERSAO_MESTRADO * 100)}%.`
                : undefined
            }
          />
        </div>
      </div>
    </BlockCard>
  );
}

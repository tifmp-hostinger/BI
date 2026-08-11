import { Award, BookMarked, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { GaugeSemicircle } from '@/components/ui/GaugeSemicircle';
import { BlockCard } from './BlockCard';
import { KpiRow } from './KpiRow';
import { fmtInt, fmtPercent, formatPeriodoLetivo } from '../formatters';
import type { GraduacaoKpis, PeriodoLetivo } from '../types';
import { LIMIAR_CONVERSAO_GRAD } from '../rules';

type Props = {
  title: string;
  subtitle?: string;
  kpis: GraduacaoKpis | null;
  pletivos: PeriodoLetivo[];
  periodo: string;
  onPeriodoChange: (periodo: string) => void;
  loading?: boolean;
  /** KPIs do período anterior: liga os chips de variação ▲/▼ nas linhas. */
  comparacao?: GraduacaoKpis | null;
};

/** Variação percentual atual vs. referência (null quando não dá para comparar). */
function variacao(atual: number, referencia: number | undefined): number | null {
  if (referencia === undefined || referencia <= 0) return null;
  return (atual - referencia) / referencia;
}

export function GraduacaoBlock({
  title,
  subtitle,
  kpis,
  pletivos,
  periodo,
  onPeriodoChange,
  loading,
  comparacao,
}: Props) {
  const opcoes = pletivos
    .filter((p) => /^\d{2}-\d{2}$/.test(p.periodo))
    .map((p) => p.periodo);

  const pctInscLeads =
    kpis && kpis.leads > 0 ? Math.round((kpis.inscricoesLead / kpis.leads) * 100) : null;
  const conversaoPct =
    kpis && kpis.conversao !== null ? Math.round(kpis.conversao * 100) : null;

  return (
    <BlockCard
      title={title}
      subtitle={subtitle}
      icon={GraduationCap}
      actions={
        <label className="flex items-center gap-2 rounded-pill border border-line bg-white px-3 py-1.5 text-2xs font-semibold text-ink-2">
          <span className="text-ink-3">Período</span>
          <select
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="rounded-pill bg-transparent text-2xs font-semibold text-fmp focus:outline-none focus-visible:ring-2 focus-visible:ring-fmp/40"
          >
            {opcoes.map((p) => (
              <option key={p} value={p}>
                {formatPeriodoLetivo(p)}
              </option>
            ))}
          </select>
        </label>
      }
      footer={
        kpis?.processoFinalizado ? 'OBS.: Processo Seletivo Finalizado' : null
      }
      footerTone="alerta"
    >
      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-5">
        <div className="@xl:col-span-2 flex items-center justify-center">
          <GaugeSemicircle
            value={loading ? null : kpis?.percentualMeta ?? null}
            label="% Meta"
            caption={
              kpis
                ? `${fmtInt(kpis.matriculas)} de ${fmtInt(kpis.vagas)} vagas`
                : undefined
            }
          />
        </div>
        <div className="@xl:col-span-3">
          <KpiRow
            label="Vagas restantes"
            value={kpis ? fmtInt(Math.max(0, kpis.vagas - kpis.matriculas)) : '—'}
            icon={Award}
            tone="accent"
            hint={kpis ? `${fmtInt(kpis.vagas)} vagas no total` : undefined}
          />
          <KpiRow
            label="Leads (Rubeus)"
            value={kpis ? fmtInt(kpis.leads) : '—'}
            icon={Users}
            hint="Interessados captados no CRM na janela deste vestibular"
            delta={kpis && comparacao ? variacao(kpis.leads, comparacao.leads) : null}
          />
          <KpiRow
            label="Inscrições"
            value={kpis ? fmtInt(kpis.inscricoes) : '—'}
            icon={BookMarked}
            hint={
              kpis
                ? `${fmtInt(kpis.inscricoesLead)} vieram de leads${
                    pctInscLeads !== null ? ` (${pctInscLeads}% dos leads)` : ''
                  }`
                : undefined
            }
            delta={kpis && comparacao ? variacao(kpis.inscricoes, comparacao.inscricoes) : null}
          />
          <KpiRow
            label="Matrículas"
            value={kpis ? fmtInt(kpis.matriculas) : '—'}
            icon={GraduationCap}
            tone="success"
            delta={kpis && comparacao ? variacao(kpis.matriculas, comparacao.matriculas) : null}
          />
          <KpiRow
            label="% Conversão"
            value={kpis ? fmtPercent(kpis.conversao) : '—'}
            icon={TrendingUp}
            tone={
              kpis && kpis.conversao !== null && kpis.conversao >= LIMIAR_CONVERSAO_GRAD
                ? 'success'
                : 'warning'
            }
            hint={
              conversaoPct !== null
                ? `A cada 100 inscritos vindos de leads, ${conversaoPct} viram matrícula. Verde a partir de ${Math.round(LIMIAR_CONVERSAO_GRAD * 100)}%.`
                : 'Matrículas ÷ inscrições vindas de leads'
            }
          />
        </div>
      </div>
    </BlockCard>
  );
}

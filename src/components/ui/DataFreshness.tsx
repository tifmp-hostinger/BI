import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import {
  diasAtras,
  fetchFreshness,
  formataDataCurta,
  formataDataHora,
  type Freshness,
  type FreshnessResumo,
} from '@/lib/dataFreshness';

const AJUDA =
  'Duas fontes de data: "Carga em" é quando o dado entrou no banco (carimbo real). ' +
  '"Dados até" é uma estimativa — a data do registro mais recente na tabela, usada quando ' +
  'a fonte não registra o momento da carga. Um fim de semana sem movimento deixa esse ' +
  'segundo tipo desatualizado mesmo com a carga funcionando normalmente. As cargas rodam ' +
  'por um processo agendado, fora da aplicação.';

const ESTILO: Record<string, string> = {
  ok: 'text-ink-3',
  atencao: 'text-warning-dark',
  atrasado: 'text-danger',
  desconhecido: 'italic text-ink-3',
  erro: 'text-warning-dark',
};

function rotuloFonte(f: Freshness): string {
  if (f.tipoSinal === 'sem-sinal' || !f.data) return 'Sem sinal de frescor';
  if (f.tipoSinal === 'carga') return `Carga em ${formataDataHora(f.data)}`;
  return `Dados até ${formataDataCurta(f.data)}`;
}

function rotulo(resumo: FreshnessResumo): string {
  const f = resumo.maisAntiga;
  if (!f || !f.data) {
    return resumo.status === 'erro' ? 'Não foi possível verificar a data da carga' : 'Sem sinal de frescor';
  }
  const dias = diasAtras(f.horasAtras ?? 0);
  const base = rotuloFonte(f);

  switch (resumo.status) {
    case 'ok':
      return base;
    case 'atencao':
      return f.tipoSinal === 'carga'
        ? `${base} — última carga há ${dias} dia${dias === 1 ? '' : 's'}`
        : `${base} — pode haver carga parada`;
    case 'atrasado':
      return f.tipoSinal === 'carga'
        ? `Dado desatualizado — ${base}, há ${dias} dias`
        : `${base} (${dias} dias) — pode haver carga parada`;
    default:
      return base;
  }
}

function linhaDetalhe(f: Freshness): string {
  if (f.tipoSinal === 'sem-sinal') return `${f.tabela}: sem coluna de data de carga nem proxy de conteúdo`;
  if (!f.data) return `${f.tabela}: não foi possível verificar`;
  if (f.tipoSinal === 'carga') return `${f.tabela}: carga em ${formataDataHora(f.data)}`;
  const sazonalNota = f.sazonal
    ? ' — sazonal, só recebe registros em janelas específicas do ano; não conta para o aviso principal'
    : '';
  return `${f.tabela}: dados até ${formataDataCurta(f.data)} (proxy — não confirma quando a carga rodou)${sazonalNota}`;
}

/**
 * Detalhamento completo, em 3 blocos, exibido no tooltip: permite dizer
 * "o RM está em dia, o Rubeus parou" sem abrir o banco.
 */
function montaDetalhe(resumo: FreshnessResumo): string {
  const comCarga = resumo.fontesFato.filter((f) => f.tipoSinal === 'carga');
  const semCarga = resumo.fontesFato.filter((f) => f.tipoSinal === 'proxy' || f.tipoSinal === 'sem-sinal');
  const blocos: string[] = [];

  if (comCarga.length > 0) {
    blocos.push(['Fontes com carimbo de carga:', ...comCarga.map((f) => `  ${linhaDetalhe(f)}`)].join('\n'));
  }
  if (semCarga.length > 0) {
    blocos.push(['Fontes sem carimbo:', ...semCarga.map((f) => `  ${linhaDetalhe(f)}`)].join('\n'));
  }
  if (resumo.fontesDominio.length > 0) {
    blocos.push(
      [
        'Tabelas de referência (editadas à mão, sem alerta):',
        ...resumo.fontesDominio.map((f) => `  ${linhaDetalhe(f)}`),
      ].join('\n'),
    );
  }
  return blocos.join('\n\n');
}

/**
 * Carimbo de frescor do dado, compartilhado pelos dashboards.
 * NUNCA cai em "agora" silenciosamente: quando a data não pode ser
 * determinada, o texto diz exatamente isso.
 *
 * `proxies`: mapa tabela → maior data de conteúdo já calculada pelo
 * dashboard sobre o dataset que ele já tem em memória (ver
 * `maiorDataDoDataset` em lib/dataFreshness.ts). Sem isso as tabelas
 * "sem carimbo" desta lista aparecem como "sem sinal" — não disparamos
 * consulta nova para descobrir o proxy.
 */
export function DataFreshness({
  tabelas,
  proxies = {},
}: {
  tabelas: string[];
  proxies?: Record<string, Date | null>;
}) {
  const [resumo, setResumo] = useState<FreshnessResumo | null>(null);
  const chave = tabelas.join('|');
  const chaveProxies = Object.entries(proxies)
    .map(([k, v]) => `${k}=${v ? v.getTime() : ''}`)
    .sort()
    .join('|');

  useEffect(() => {
    let vivo = true;
    fetchFreshness(chave.split('|'), proxies)
      .then((r) => vivo && setResumo(r))
      .catch(() => {
        if (vivo) setResumo({ maisAntiga: null, fontesFato: [], fontesDominio: [], status: 'erro' });
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, chaveProxies]);

  if (!resumo) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs text-ink-3">
        <Clock className="h-3 w-3 animate-pulse" />
        Verificando data da carga…
      </span>
    );
  }

  const alerta = resumo.status === 'atrasado' || resumo.status === 'atencao';
  const detalhe = montaDetalhe(resumo);

  return (
    <span
      className={`inline-flex items-center gap-1 text-2xs ${ESTILO[resumo.status]}`}
      title={detalhe || undefined}
    >
      {alerta ? (
        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      ) : (
        <Clock className="h-3 w-3 flex-shrink-0" />
      )}
      {rotulo(resumo)}
      <span
        tabIndex={0}
        role="note"
        aria-label={AJUDA}
        title={AJUDA}
        className="cursor-help text-ink-3/70 transition hover:text-fmp focus:text-fmp focus:outline-none"
      >
        <HelpCircle className="h-3 w-3" strokeWidth={2.4} />
      </span>
    </span>
  );
}

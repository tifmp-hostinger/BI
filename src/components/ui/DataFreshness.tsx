import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import {
  diasAtras,
  fetchFreshness,
  formataDataHora,
  type FreshnessResumo,
} from '@/lib/dataFreshness';

const AJUDA =
  'A data indica quando os dados entraram no banco, não quando você abriu a tela. ' +
  'Quando um dashboard lê mais de uma tabela, mostramos a mais atrasada — se uma fonte ' +
  'parou de atualizar, é isso que você precisa saber. As cargas são executadas por um ' +
  'processo agendado, fora da aplicação.';

const ESTILO: Record<string, string> = {
  ok: 'text-ink-3',
  atencao: 'text-warning-dark',
  atrasado: 'text-danger',
  desconhecido: 'italic text-ink-3',
  erro: 'text-warning-dark',
};

function rotulo(resumo: FreshnessResumo): string {
  const f = resumo.maisAntiga;
  switch (resumo.status) {
    case 'ok':
      return `Dados de ${formataDataHora(f!.ultimaCarga!)}`;
    case 'atencao':
      return `Dados de ${formataDataHora(f!.ultimaCarga!)} — última carga há ${diasAtras(
        f!.horasAtras!,
      )} dia${diasAtras(f!.horasAtras!) === 1 ? '' : 's'}`;
    case 'atrasado':
      return `Dado desatualizado — última carga em ${formataDataHora(
        f!.ultimaCarga!,
      )}, há ${diasAtras(f!.horasAtras!)} dias`;
    case 'erro':
      return 'Não foi possível verificar a data da carga';
    default:
      return 'Data da última carga não disponível';
  }
}

/**
 * Carimbo de frescor do dado, compartilhado pelos dashboards.
 * NUNCA cai em "agora" silenciosamente: quando a data não pode ser
 * determinada, o texto diz exatamente isso.
 */
export function DataFreshness({ tabelas }: { tabelas: string[] }) {
  const [resumo, setResumo] = useState<FreshnessResumo | null>(null);
  const chave = tabelas.join('|');

  useEffect(() => {
    let vivo = true;
    fetchFreshness(chave.split('|'))
      .then((r) => vivo && setResumo(r))
      .catch(() => {
        if (vivo) setResumo({ maisAntiga: null, porTabela: [], status: 'erro' });
      });
    return () => {
      vivo = false;
    };
  }, [chave]);

  if (!resumo) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs text-ink-3">
        <Clock className="h-3 w-3 animate-pulse" />
        Verificando data da carga…
      </span>
    );
  }

  const alerta = resumo.status === 'atrasado' || resumo.status === 'atencao';
  // Detalhamento por fonte: permite dizer "o Meta está atualizado, o RM parou"
  // sem precisar abrir o banco.
  const detalhe = resumo.porTabela
    .map((f) => {
      if (f.semCarimbo) return `${f.tabela}: sem coluna de data de carga`;
      if (!f.ultimaCarga) return `${f.tabela}: não foi possível verificar`;
      return `${f.tabela}: ${formataDataHora(f.ultimaCarga)}`;
    })
    .join('\n');

  return (
    <span
      className={`inline-flex items-center gap-1 text-2xs ${ESTILO[resumo.status]}`}
      title={detalhe ? `Última carga por fonte:\n${detalhe}` : undefined}
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

import { useState } from 'react';
import { Table2 } from 'lucide-react';
import { InspetorDados, type ConjuntoDados } from '@/components/ui/InspetorDados';

/**
 * Botão "ver dados" autocontido: ícone de tabela que abre o Inspetor de Dados
 * com as linhas recebidas. Autocontido de propósito — encaixa no slot
 * `actions` de qualquer SectionCard (ou em qualquer toolbar) sem fiação de
 * estado em quem usa.
 */
export function BotaoInspecionar({
  titulo,
  arquivo,
  linhas,
  conjuntos,
  rotulo,
}: {
  titulo: string;
  /** Nome do CSV baixado (sem .csv). */
  arquivo: string;
  /** Atalho para o caso comum de um conjunto só. */
  linhas?: Record<string, unknown>[] | null;
  conjuntos?: ConjuntoDados[];
  /** Com rótulo vira botão de barra ("Explorar dados"); sem, é o ícone do card. */
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);

  const lista: ConjuntoDados[] =
    conjuntos ?? (linhas && linhas.length > 0 ? [{ nome: titulo, linhas }] : []);
  if (lista.length === 0 || lista.every((c) => c.linhas.length === 0)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Ver os dados de: ${titulo}`}
        title="Ver os dados deste gráfico (buscar, ordenar, baixar CSV)"
        className={
          rotulo
            ? 'inline-flex items-center gap-1.5 rounded-md border border-line-2 bg-card px-3 py-1.5 text-2xs font-medium text-ink-2 transition hover:border-fmp/60 hover:text-ink'
            : 'rounded-sm p-1.5 text-ink-3 transition hover:bg-paper hover:text-ink'
        }
      >
        <Table2 className="h-3.5 w-3.5" />
        {rotulo}
      </button>
      <InspetorDados
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={titulo}
        conjuntos={lista}
        nomeArquivo={arquivo}
      />
    </>
  );
}

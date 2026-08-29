import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search, X } from 'lucide-react';
import { baixarCsv } from '@/lib/exportarCsv';

/**
 * Inspetor de Dados — a porta de entrada universal para as linhas por trás de
 * qualquer número da plataforma.
 *
 * O app já baixa os dados para o navegador (é a arquitetura); o que faltava
 * era o usuário conseguir VÊ-LOS: conferir um total, achar um registro,
 * levar para o Excel. Antes disso, só a aba Origem e a tabela de Campanhas
 * permitiam descer ao dado — todo o resto era gráfico opaco.
 *
 * Busca, ordenação, paginação e exportação CSV rodam em memória sobre as
 * linhas recebidas — zero consulta nova.
 */

export type ConjuntoDados = {
  nome: string;
  linhas: Record<string, unknown>[];
};

/**
 * PRIVACIDADE — regra do projeto (docs/analise-conversao-presidencia-
 * observacoes.md §4): a interface não exibe CPF, RA, nome, telefone ou
 * e-mail; esses campos existem nas linhas apenas para cruzamentos em
 * memória. O inspetor OMITE essas colunas SEMPRE — é um filtro defensivo
 * central, para que nenhum ponto de fiação futuro vaze dado pessoal por
 * esquecimento. Vale também para o CSV exportado.
 */
const COLUNAS_SENSIVEIS = /^(ra|cpf|aluno|nome|pessoa|pessoa_nome|nomecompleto|nome_completo|email|e-mail|telefone|celular|fone)$/i;

const LINHAS_POR_PAGINA = 100;
/** Colunas inferidas das primeiras N linhas: cobre datasets esparsos sem varrer 100k linhas. */
const AMOSTRA_COLUNAS = 200;

function normaliza(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function inferirColunas(linhas: Record<string, unknown>[]): string[] {
  const chaves = new Set<string>();
  for (const l of linhas.slice(0, AMOSTRA_COLUNAS)) {
    for (const k of Object.keys(l)) chaves.add(k);
  }
  return Array.from(chaves).filter((c) => !COLUNAS_SENSIVEIS.test(c.trim()));
}

function formataValor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? v.toLocaleString('pt-BR')
      : v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
  return String(v);
}

export function InspetorDados({
  aberto,
  onFechar,
  titulo,
  conjuntos,
  nomeArquivo,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  /** Um ou mais conjuntos de linhas; com vários, um seletor alterna entre eles. */
  conjuntos: ConjuntoDados[];
  nomeArquivo: string;
}) {
  const [conjuntoIdx, setConjuntoIdx] = useState(0);
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<{ col: string; desc: boolean } | null>(null);
  const [pagina, setPagina] = useState(0);

  // Estado zerado ao abrir: o inspetor de um gráfico não deve herdar a busca
  // digitada no de outro.
  useEffect(() => {
    if (aberto) {
      setBusca('');
      setOrdem(null);
      setPagina(0);
      setConjuntoIdx(0);
    }
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberto, onFechar]);

  const conjunto = conjuntos[Math.min(conjuntoIdx, conjuntos.length - 1)];
  const linhas = useMemo(() => conjunto?.linhas ?? [], [conjunto]);
  const colunas = useMemo(() => inferirColunas(linhas), [linhas]);
  const houvePiiOmitida = useMemo(
    () => linhas.length > 0 && Object.keys(linhas[0] ?? {}).some((c) => COLUNAS_SENSIVEIS.test(c.trim())),
    [linhas],
  );

  const filtradas = useMemo(() => {
    if (!busca.trim()) return linhas;
    const alvo = normaliza(busca.trim());
    return linhas.filter((l) =>
      colunas.some((c) => {
        const v = l[c];
        return v !== null && v !== undefined && normaliza(String(v)).includes(alvo);
      }),
    );
  }, [linhas, colunas, busca]);

  const ordenadas = useMemo(() => {
    if (!ordem) return filtradas;
    const { col, desc } = ordem;
    const copia = [...filtradas];
    copia.sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
      return desc ? -cmp : cmp;
    });
    return copia;
  }, [filtradas, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / LINHAS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = ordenadas.slice(
    paginaAtual * LINHAS_POR_PAGINA,
    (paginaAtual + 1) * LINHAS_POR_PAGINA,
  );

  if (!aberto) return null;

  const alternarOrdem = (col: string) =>
    setOrdem((o) => (o?.col === col ? { col, desc: !o.desc } : { col, desc: true }));

  return createPortal(
    <div className="fixed inset-0 z-[110] flex justify-end" role="dialog" aria-modal="true" aria-label={`Dados: ${titulo}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onFechar} aria-hidden />

      <div className="relative flex h-full w-full max-w-[640px] flex-col border-l border-line bg-card shadow-lg animate-slide-right-in">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              Inspetor de dados
            </p>
            <h2 className="truncate text-sm font-semibold text-ink">{titulo}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => baixarCsv(nomeArquivo, ordenadas, colunas)}
              className="inline-flex items-center gap-1.5 rounded-md border border-line-2 bg-paper px-2.5 py-1.5 text-2xs font-medium text-ink-2 transition hover:border-fmp/60 hover:text-ink"
              title="Baixa o recorte atual (com busca e ordenação aplicadas) em CSV para o Excel"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar inspetor"
              className="rounded-md p-1.5 text-ink-3 transition hover:bg-paper hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
          {conjuntos.length > 1 && (
            <select
              value={conjuntoIdx}
              onChange={(e) => {
                setConjuntoIdx(Number(e.target.value));
                setBusca('');
                setOrdem(null);
                setPagina(0);
              }}
              className="rounded-md border border-line-2 bg-paper px-2 py-1.5 text-xs text-ink outline-none focus:border-fmp"
              aria-label="Conjunto de dados"
            >
              {conjuntos.map((c, i) => (
                <option key={c.nome} value={i}>
                  {c.nome} ({c.linhas.length.toLocaleString('pt-BR')})
                </option>
              ))}
            </select>
          )}
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
            <input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(0);
              }}
              placeholder="Buscar em qualquer coluna…"
              className="w-full rounded-md border border-line-2 bg-paper py-1.5 pl-8 pr-3 text-xs text-ink outline-none placeholder:text-ink-3/60 focus:border-fmp"
            />
          </label>
          <span className="shrink-0 text-2xs tabular-nums text-ink-3">
            {ordenadas.length.toLocaleString('pt-BR')} de {linhas.length.toLocaleString('pt-BR')} linhas
          </span>
        </div>

        {/* Tabela */}
        <div className="min-h-0 flex-1 overflow-auto">
          {visiveis.length === 0 ? (
            <p className="p-6 text-center text-xs text-ink-3">
              Nenhuma linha corresponde à busca.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-paper">
                <tr className="border-b border-line text-left">
                  {colunas.map((c) => {
                    const ativa = ordem?.col === c;
                    return (
                      <th key={c} className="whitespace-nowrap px-3 py-2" aria-sort={ativa ? (ordem!.desc ? 'descending' : 'ascending') : 'none'}>
                        <button
                          type="button"
                          onClick={() => alternarOrdem(c)}
                          title={`Ordenar por ${c}`}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition hover:text-fmp ${
                            ativa ? 'text-fmp' : 'text-ink-3'
                          }`}
                        >
                          {c}
                          {ativa ? (
                            ordem!.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((l, i) => (
                  <tr key={i} className="border-b border-line/50 text-ink-2 transition-colors hover:bg-paper">
                    {colunas.map((c) => {
                      const v = l[c];
                      const numerico = typeof v === 'number';
                      return (
                        <td
                          key={c}
                          className={`max-w-[260px] truncate px-3 py-1.5 ${numerico ? 'text-right tabular-nums' : ''}`}
                          title={v === null || v === undefined ? undefined : String(v)}
                        >
                          {formataValor(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Rodapé: paginação + nota de privacidade */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paginaAtual === 0}
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              className="rounded-md border border-line-2 bg-paper px-2.5 py-1 text-2xs font-medium text-ink-2 transition enabled:hover:border-fmp/60 enabled:hover:text-ink disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-2xs tabular-nums text-ink-3">
              Página {paginaAtual + 1} de {totalPaginas}
            </span>
            <button
              type="button"
              disabled={paginaAtual >= totalPaginas - 1}
              onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
              className="rounded-md border border-line-2 bg-paper px-2.5 py-1 text-2xs font-medium text-ink-2 transition enabled:hover:border-fmp/60 enabled:hover:text-ink disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
          {houvePiiOmitida && (
            <span className="text-2xs text-ink-3">
              Colunas com dados pessoais (nome, RA, CPF…) são omitidas por política de privacidade.
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

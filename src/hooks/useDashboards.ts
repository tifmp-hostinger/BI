import { useCallback, useEffect, useState } from 'react';
import type { Dashboard } from '@/lib/supabase';
import { SAMPLE_DASHBOARDS } from '@/lib/sampleData';
import { listDashboards } from '@/services/dashboardService';

type State = {
  data: Dashboard[];
  loading: boolean;
  error: string | null;
};

/**
 * Catálogo de navegação (menu lateral + cards da Central).
 *
 * Começa JÁ PREENCHIDO com o catálogo estático e `loading: false`. O catálogo
 * mora em código (`SAMPLE_DASHBOARDS`) porque a tabela `dashboards` não existe
 * neste projeto Supabase — ver o comentário longo em `dashboardService`. Antes
 * o hook abria em `loading: true` e ia à rede para descobrir uma lista que já
 * estava no bundle: o menu nascia vazio e a Central mostrava seis esqueletos
 * por uma ida e volta inteira, sempre. Navegação nunca deve esperar rede para
 * exibir o que o app já sabe.
 *
 * A consulta continua acontecendo: se um dia a tabela for criada, a resposta
 * substitui a lista — em silêncio, sem voltar a esqueleto e sem mover nada de
 * lugar, porque a quantidade e a ordem dos itens são as mesmas.
 */
export function useDashboards() {
  const [state, setState] = useState<State>({
    data: SAMPLE_DASHBOARDS,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      const data = await listDashboards();
      setState({ data, loading: false, error: null });
    } catch (err) {
      // Falha aqui NÃO pode esvaziar o menu: mantém a lista que já está na
      // tela (no mínimo o catálogo estático) e só registra o erro.
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar dashboards',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}

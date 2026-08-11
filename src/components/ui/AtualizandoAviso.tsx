import { RefreshCw } from 'lucide-react';

/**
 * Sinal discreto de que a tela está mostrando o dado guardado enquanto uma
 * versão mais nova é baixada por trás.
 *
 * Deliberadamente discreto: o dado exibido é válido e utilizável, então
 * bloquear a tela ou disparar um alerta seria pior que o problema. O usuário
 * só precisa saber que o número pode mudar em instantes.
 */
export function AtualizandoAviso({ visivel }: { visivel: boolean }) {
  if (!visivel) return null;
  return (
    <span
      role="status"
      // Herda a cor do contexto: este aviso aparece tanto no hero escuro
      // (4 painéis) quanto na barra clara do Growth — uma cor fixa de tinta
      // ficava ilegível sobre o escuro.
      className="inline-flex items-center gap-1 text-2xs text-current opacity-70"
      title="Os dados em tela vieram do cache local e estão sendo atualizados a partir do banco."
    >
      <RefreshCw className="h-3 w-3 animate-spin" />
      Atualizando…
    </span>
  );
}

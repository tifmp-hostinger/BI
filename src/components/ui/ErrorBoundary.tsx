import { Component, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import { pareceChunkDesatualizado, recarregaAposDeploy } from '@/lib/chunkDesatualizado';

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
  message: string;
  /** Erro de módulo que sumiu do servidor — ver lib/chunkDesatualizado. */
  posDeploy: boolean;
};

/**
 * Impede que um erro de renderização em um dashboard derrube a aplicação
 * inteira (antes, um erro desmontava a árvore React e o app "voltava" para a
 * home). Mostra um cartão de erro com "Tentar novamente" no lugar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '', posDeploy: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Erro inesperado ao renderizar',
      posDeploy: pareceChunkDesatualizado(error),
    };
  }

  componentDidCatch(error: unknown) {
    // Página pedindo um arquivo que o deploy novo apagou: recarregar resolve,
    // repetir o import não — é a mesma URL morta. A tentativa acontece aqui
    // (efeito colateral) e não em getDerivedStateFromError, que é estática e
    // deve ser pura.
    if (pareceChunkDesatualizado(error)) recarregaAposDeploy();
  }

  private reset = () => {
    this.setState({ hasError: false, message: '', posDeploy: false });
  };

  private recarrega = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Se chegou até aqui com posDeploy, a recarga automática já foi tentada
      // e não resolveu (ou estava travada). O botão passa a recarregar de
      // verdade, em vez de repetir o import que falhou.
      if (this.state.posDeploy) {
        return (
          <ErrorState
            title="Uma versão nova do painel foi publicada"
            message="Esta aba ainda está rodando a versão anterior. Recarregue a página para carregar a nova."
            onRetry={this.recarrega}
          />
        );
      }
      return (
        <ErrorState
          title={this.props.title ?? 'Algo deu errado ao exibir este conteúdo'}
          message={this.state.message}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

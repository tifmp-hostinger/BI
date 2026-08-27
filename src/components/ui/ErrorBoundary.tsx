import { Component, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import { pareceChunkDesatualizado, recarregaAposDeploy } from '@/lib/chunkDesatualizado';
import {
  pareceDomCorrompido,
  paginaTraduzida,
  recuperaDeDomCorrompido,
} from '@/lib/traducaoDoNavegador';

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
  message: string;
  /** Erro de módulo que sumiu do servidor — ver lib/chunkDesatualizado. */
  posDeploy: boolean;
  /** DOM reescrito por fora do React — ver lib/traducaoDoNavegador. */
  domCorrompido: boolean;
  /** A tradução do navegador estava ativa quando o erro aconteceu. */
  traduzida: boolean;
};

/**
 * Impede que um erro de renderização em um dashboard derrube a aplicação
 * inteira (antes, um erro desmontava a árvore React e o app "voltava" para a
 * home). Mostra um cartão de erro com "Tentar novamente" no lugar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
    posDeploy: false,
    domCorrompido: false,
    traduzida: false,
  };

  static getDerivedStateFromError(error: unknown): State {
    const domCorrompido = pareceDomCorrompido(error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Erro inesperado ao renderizar',
      posDeploy: pareceChunkDesatualizado(error),
      domCorrompido,
      // Lido no momento do erro: depois de uma recarga a marca pode não estar
      // mais lá, e é agora que ela explica o que aconteceu.
      traduzida: domCorrompido && paginaTraduzida(),
    };
  }

  componentDidCatch(error: unknown) {
    // Página pedindo um arquivo que o deploy novo apagou: recarregar resolve,
    // repetir o import não — é a mesma URL morta. A tentativa acontece aqui
    // (efeito colateral) e não em getDerivedStateFromError, que é estática e
    // deve ser pura.
    if (pareceChunkDesatualizado(error)) {
      recarregaAposDeploy();
      return;
    }
    // DOM reescrito por fora do React (tradução automática, extensão): o
    // "Tentar novamente" comum não resolve — ele re-renderiza a MESMA árvore
    // no mesmo DOM corrompido e falha na hora. Com a tradução ativa nem
    // recarregar resolve (o tradutor traduz de novo), e aí a função não
    // recarrega: a tela abaixo passa a instrução.
    if (pareceDomCorrompido(error)) recuperaDeDomCorrompido();
  }

  private reset = () => {
    this.setState({
      hasError: false,
      message: '',
      posDeploy: false,
      domCorrompido: false,
      traduzida: false,
    });
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

      // Tradução automática ligada: recarregar não resolve, porque o tradutor
      // reescreve o DOM de novo em toda visita. O usuário não tem como
      // adivinhar isso a partir de "Falha ao executar 'insertBefore'" — que
      // ele lê, para completar, TRADUZIDO. Então a tela diz o que desligar.
      if (this.state.traduzida) {
        return (
          <ErrorState
            title="Desligue a tradução automática desta página"
            message="O navegador está traduzindo o painel e isso reescreve a tela por baixo da aplicação, que para de funcionar. Clique com o botão direito na página e escolha “Nunca traduzir este site” (ou desmarque “Sempre traduzir inglês” em Configurações → Idiomas) e recarregue. O painel já é em português — não há nada a traduzir."
            onRetry={this.recarrega}
          />
        );
      }

      // Mesma corrupção de DOM, sem tradução detectada (extensão do navegador,
      // por exemplo). A recarga automática já foi tentada uma vez em
      // componentDidCatch; aqui o botão recarrega de verdade, em vez de
      // re-renderizar no DOM que já está inconsistente.
      if (this.state.domCorrompido) {
        return (
          <ErrorState
            title="A tela foi alterada por fora da aplicação"
            message="Algo no navegador (uma extensão ou a tradução automática) reescreveu a página e a aplicação perdeu a referência dos elementos. Recarregar resolve. Se voltar a acontecer sempre neste computador, vale testar em uma janela anônima, com as extensões desativadas."
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

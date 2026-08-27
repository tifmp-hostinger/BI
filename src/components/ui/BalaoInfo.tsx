import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Balão de informação acionado por clique/toque, renderizado via portal no
 * <body> com position:fixed.
 *
 * Por que portal: os gatilhos vivem dentro de cards e heroes com
 * overflow-hidden — um balão absoluto comum era CLIPADO pelo ancestral e o
 * conteúdo ficava ilegível. Fixed + portal escapa de qualquer clipping e
 * nunca cria overflow horizontal na página.
 */
export function BalaoInfo({
  rotuloAcao,
  gatilho,
  children,
  classeGatilho,
}: {
  /** aria-label do botão que abre o balão. */
  rotuloAcao: string;
  /** Conteúdo visual do botão (ex.: ícone "?"). */
  gatilho: ReactNode;
  children: ReactNode;
  classeGatilho?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const balaoRef = useRef<HTMLDivElement>(null);

  const LARGURA = 320;

  const abre = () => {
    const r = botaoRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = document.documentElement.clientWidth;
    const largura = Math.min(LARGURA, vw - 16);
    setPos({
      top: r.bottom + 6,
      // Preso à viewport: nunca vaza pela direita nem pela esquerda.
      left: Math.max(8, Math.min(r.left, vw - largura - 8)),
    });
    setAberto(true);
  };

  useEffect(() => {
    if (!aberto) return;
    const fechaFora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (botaoRef.current?.contains(alvo) || balaoRef.current?.contains(alvo)) return;
      setAberto(false);
    };
    const fechaEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false);
    };
    // position:fixed não acompanha o scroll — fechar é mais honesto que
    // deixar o balão descolado da âncora.
    const fechaScroll = () => setAberto(false);
    document.addEventListener('mousedown', fechaFora);
    document.addEventListener('keydown', fechaEsc);
    window.addEventListener('scroll', fechaScroll, true);
    return () => {
      document.removeEventListener('mousedown', fechaFora);
      document.removeEventListener('keydown', fechaEsc);
      window.removeEventListener('scroll', fechaScroll, true);
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        aria-label={rotuloAcao}
        onClick={() => (aberto ? setAberto(false) : abre())}
        className={classeGatilho ?? 'cursor-help rounded-full p-1.5 -m-0.5 text-ink-3 transition hover:text-fmp focus-visible:text-fmp'}
      >
        {gatilho}
      </button>
      {aberto && pos &&
        createPortal(
          <div
            ref={balaoRef}
            role="note"
            className="fixed z-[120] max-h-[60vh] overflow-y-auto rounded-md border border-line bg-white p-3 text-left shadow-lg animate-fade-in"
            style={{ top: pos.top, left: pos.left, width: `min(${LARGURA}px, calc(100vw - 16px))` }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

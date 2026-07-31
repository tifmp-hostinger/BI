/**
 * Identidade visual da FMP.
 *
 * O símbolo (estrela de quatro pontas com lados côncavos) é reproduzido em SVG,
 * então escala sem perder nitidez e herda a cor do contexto via `currentColor`.
 *
 * A marca completa combina o símbolo com o letreiro "FMP" em Outfit — a mesma
 * família já carregada pelo app. Se o arquivo oficial da marca for
 * disponibilizado, basta trocar o conteúdo de <FmpMarca> por um <img>/<svg>
 * apontando para ele; os pontos de uso (login, menu, rodapé) não mudam.
 */

const CAMINHO_ESTRELA =
  'M12 0 C12 6.63 6.63 12 0 12 C6.63 12 12 17.37 12 24 C12 17.37 17.37 12 24 12 C17.37 12 12 6.63 12 0 Z';

type SimboloProps = {
  className?: string;
  /** Rótulo acessível. Sem ele o símbolo é tratado como decorativo. */
  titulo?: string;
};

export function FmpSimbolo({ className = 'h-6 w-6', titulo }: SimboloProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <path d={CAMINHO_ESTRELA} />
    </svg>
  );
}

type MarcaProps = {
  /** Altura do letreiro. */
  className?: string;
  /** Em fundo escuro o letreiro fica claro e o símbolo mantém o vermelho. */
  variante?: 'claro' | 'escuro';
};

export function FmpMarca({ className = 'text-2xl', variante = 'escuro' }: MarcaProps) {
  const corTexto = variante === 'claro' ? 'text-cream' : 'text-fmp';
  const corSimbolo = variante === 'claro' ? 'text-cream' : 'text-ink';

  return (
    <span className="inline-flex items-start gap-1" role="img" aria-label="FMP">
      <span
        className={`${className} ${corTexto} font-extrabold leading-none tracking-tight`}
        aria-hidden
      >
        FMP
      </span>
      <FmpSimbolo className={`${corSimbolo} h-[0.45em] w-[0.45em] ${className}`} />
    </span>
  );
}

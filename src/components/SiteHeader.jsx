import logoSelleta from "../assets/logo-selleta.png";

export default function SiteHeader({ quantidadeCarrinho, onOpenCart }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#8a5d2b]/10 bg-[#fffaf5]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#inicio" aria-label="Voltar ao início">
          <img
            src={logoSelleta}
            alt="Selleta Modas"
            className="h-14 w-auto object-contain sm:h-16"
          />
        </a>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 text-sm font-semibold text-gray-700 md:flex"
        >
          <a href="#catalogo" className="transition hover:text-[#8a5d2b]">
            Coleção
          </a>
          <a href="#beneficios" className="transition hover:text-[#8a5d2b]">
            Benefícios
          </a>
          <a href="#como-comprar" className="transition hover:text-[#8a5d2b]">
            Como comprar
          </a>
        </nav>

        <button
          type="button"
          onClick={onOpenCart}
          aria-label={`Abrir carrinho com ${quantidadeCarrinho} item(ns)`}
          className="relative grid h-11 w-11 place-items-center rounded-full bg-[#8a5d2b] text-white shadow-md transition hover:bg-[#70491f]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386a1.5 1.5 0 011.415 1.026L5.76 6.75m0 0h13.74l-1.125 6.75H7.125m-1.365-6.75L7.125 13.5m0 0a2.25 2.25 0 104.5 0m4.5 0a2.25 2.25 0 104.5 0"
            />
          </svg>

          {quantidadeCarrinho > 0 && (
            <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1 text-xs font-bold">
              {quantidadeCarrinho}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

import { Link } from "react-router-dom";
import logoSelleta from "../assets/logo-selleta.png";

export default function SiteHeader({ quantidadeCarrinho, onOpenCart }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#8a5d2b]/10 bg-[#fffaf5]/95 backdrop-blur">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <a href="#inicio" aria-label="Voltar ao início" className="min-w-0 shrink">
          <img
            src={logoSelleta}
            alt="Selleta Modas"
            className="h-11 max-w-[9.5rem] object-contain sm:h-14 sm:max-w-none"
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
          <Link to="/cliente" className="transition hover:text-[#8a5d2b]">
            Minha conta
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/cliente"
            aria-label="Abrir minha conta"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#8a5d2b]/20 bg-white text-[#8a5d2b] transition hover:bg-[#fff2df] sm:h-11 sm:w-11 md:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75a17.933 17.933 0 01-7.5-1.632z"
              />
            </svg>
          </Link>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Abrir carrinho com ${quantidadeCarrinho} item(ns)`}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-[#8a5d2b] text-white shadow-md transition hover:bg-[#70491f] sm:h-11 sm:w-11"
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
      </div>
    </header>
  );
}

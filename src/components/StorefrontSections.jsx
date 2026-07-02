import { Link } from "react-router-dom";
import logoSelleta from "../assets/logo-selleta.png";

const beneficioIcones = {
  atendimento: (
    <path d="M8.25 10.5h7.5m-7.5 3h4.5M21 12a8.25 8.25 0 01-9.516 8.151L6 22.5l1.35-4.05A8.25 8.25 0 1121 12z" />
  ),
  seguranca: (
    <path d="M12 3l7.5 3v5.25c0 4.61-3.197 8.877-7.5 9.75-4.303-.873-7.5-5.14-7.5-9.75V6L12 3zm-2.25 9l1.5 1.5 3-3" />
  ),
  troca: (
    <path d="M16.5 3.75L21 8.25l-4.5 4.5M21 8.25H7.5A4.5 4.5 0 003 12.75m4.5 7.5L3 15.75l4.5-4.5M3 15.75h13.5a4.5 4.5 0 004.5-4.5" />
  ),
};

function BenefitIcon({ tipo }) {
  return (
    <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#fff2df] text-[#8a5d2b]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        {beneficioIcones[tipo]}
      </svg>
    </span>
  );
}

export function StoreHero({ whatsappNumero }) {
  const mensagem = encodeURIComponent(
    "Olá! Gostaria de conhecer as novidades da Selleta Modas."
  );

  return (
    <section
      id="inicio"
      className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#5f3a1c] via-[#8a5d2b] to-[#C58B39] px-5 py-12 text-white shadow-xl sm:px-10 sm:py-16 lg:px-16"
    >
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10" />
      <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-black/10" />
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="min-w-0 text-center lg:text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#ffe2b7] sm:text-sm">
            Curadoria Selleta
          </p>
          <h1 className="text-balance text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Elegância para viver todos os seus momentos
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0">
            Peças femininas selecionadas, opções de tamanho e cor e atendimento
            humano para você comprar com tranquilidade.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#catalogo"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 font-bold text-[#70491f] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Explorar coleção
            </a>
            <a
              href={`https://wa.me/${whatsappNumero}?text=${mensagem}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 py-3 font-bold text-white transition hover:bg-white/20"
            >
              Falar com a Selleta
            </a>
          </div>
        </div>

        <div className="hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm lg:block">
          <img
            src={logoSelleta}
            alt=""
            className="mx-auto w-36 brightness-0 invert opacity-90"
            aria-hidden="true"
          />
          <div className="mt-5 grid gap-3 text-sm">
            <p className="rounded-xl bg-black/10 px-4 py-3">Compra online ou pelo WhatsApp</p>
            <p className="rounded-xl bg-black/10 px-4 py-3">Estoque organizado por tamanho e cor</p>
            <p className="rounded-xl bg-black/10 px-4 py-3">Acompanhamento do pedido</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StoreBenefits() {
  const beneficios = [
    ["atendimento", "Atendimento próximo", "Converse com uma pessoa quando precisar."],
    ["seguranca", "Compra segura", "Confira opções e pagamento antes de concluir."],
    ["troca", "Troca facilitada", "Políticas claras para comprar com tranquilidade."],
  ];

  return (
    <section
      id="beneficios"
      aria-label="Diferenciais da loja"
      className="mb-14 grid gap-3 text-center sm:grid-cols-3"
    >
      {beneficios.map(([tipo, titulo, texto]) => (
        <article
          key={tipo}
          className="rounded-2xl border border-[#8a5d2b]/10 bg-white p-5 shadow-sm"
        >
          <BenefitIcon tipo={tipo} />
          <strong>{titulo}</strong>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">{texto}</p>
        </article>
      ))}
    </section>
  );
}

export function PurchaseGuide({ checkoutDiretoAtivo }) {
  const etapas = [
    ["1", "Escolha sua peça", "Veja detalhes, tamanhos, cores e estoque disponível."],
    ["2", "Monte seu pedido", "Adicione ao carrinho exatamente a combinação desejada."],
    [
      "3",
      "Escolha como finalizar",
      checkoutDiretoAtivo
        ? "Use o checkout com pagamento ou envie o pedido pelo WhatsApp."
        : "Envie o pedido pelo WhatsApp e confirme os detalhes com a equipe.",
    ],
  ];

  return (
    <section
      id="como-comprar"
      className="mt-16 overflow-hidden rounded-[2rem] bg-[#2f2924] px-5 py-10 text-white sm:px-10 sm:py-12"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e8bd7a] sm:text-sm">
          Simples e seguro
        </p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          Como comprar na Selleta
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
          Você escolhe com calma, confere cada opção e decide como prefere finalizar.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {etapas.map(([numero, titulo, texto]) => (
          <article key={numero} className="rounded-2xl bg-white/10 p-5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#C58B39] font-bold">
              {numero}
            </span>
            <h3 className="mt-4 font-bold">{titulo}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FloatingWhatsApp({ whatsappNumero }) {
  const mensagem = encodeURIComponent(
    "Olá! Gostaria de conhecer as novidades da Selleta Modas."
  );

  return (
    <a
      href={`https://wa.me/${whatsappNumero}?text=${mensagem}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Selleta Modas pelo WhatsApp"
      className="fixed bottom-4 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-green-600 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-green-700 sm:flex sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-3"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M12.04 2a9.84 9.84 0 00-8.49 14.8L2 22l5.35-1.5A9.99 9.99 0 1012.04 2zm5.77 14.08c-.24.68-1.4 1.3-1.94 1.38-.5.09-1.13.13-1.82-.09-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.26-.29.58-.36.77-.36h.55c.18 0 .41-.07.64.49.24.58.82 2 .89 2.14.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.3.38-.42.51-.14.14-.29.29-.12.58.17.29.75 1.24 1.61 2 .1.09 1.71 1.5 3.11 1.92.29.09.46.07.63-.12.17-.19.72-.84.91-1.13.19-.29.39-.24.65-.14.27.09 1.7.8 1.99.94.29.15.48.22.55.34.07.12.07.7-.17 1.38z" />
      </svg>
      <span className="sr-only sm:not-sr-only sm:inline">WhatsApp</span>
    </a>
  );
}

export function StoreFooter({ whatsappNumero }) {
  return (
    <footer className="mt-16 border-t border-[#8a5d2b]/15 pb-8 pt-10 text-gray-600">
      <div className="grid gap-8 text-center sm:grid-cols-3 sm:text-left">
        <div>
          <img src={logoSelleta} alt="Selleta Modas" className="mx-auto w-24 sm:mx-0" />
          <p className="mt-3 text-sm leading-relaxed">
            Moda feminina com atendimento próximo e compra do seu jeito.
          </p>
        </div>
        <div>
          <strong className="text-gray-900">Atendimento</strong>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a
              href={`https://wa.me/${whatsappNumero}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8a5d2b]"
            >
              Falar pelo WhatsApp
            </a>
            <Link to="/cliente" className="hover:text-[#8a5d2b]">Minha conta</Link>
            <Link to="/pedido" className="hover:text-[#8a5d2b]">Acompanhar pedido</Link>
          </div>
        </div>
        <div>
          <strong className="text-gray-900">Compra com confiança</strong>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/politicas" className="hover:text-[#8a5d2b]">
              Trocas, entrega e privacidade
            </Link>
            <span>Pagamento Pix ou na entrega, quando disponível</span>
            <span>Estoque atualizado por tamanho e cor</span>
          </div>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Selleta Modas. Todos os direitos reservados.
      </p>
    </footer>
  );
}

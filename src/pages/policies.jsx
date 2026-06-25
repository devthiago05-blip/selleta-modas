import { useEffect } from "react";
import { Link } from "react-router-dom";
import logoSelleta from "../assets/logo-selleta.png";

const whatsappNumero = String(
  import.meta.env.VITE_WHATSAPP_NUMBER || "5585992903028"
).replace(/\D/g, "");

const secoes = [
  {
    id: "trocas",
    titulo: "Trocas, devoluções e arrependimento",
    conteudo: [
      "Em compras realizadas pela internet, a cliente pode solicitar o cancelamento em até 7 dias corridos contados do recebimento, conforme o Código de Defesa do Consumidor.",
      "Para iniciar uma solicitação, entre em contato pelo WhatsApp informando o número do pedido. A equipe orientará a devolução e a restituição aplicável.",
      "Em casos de defeito, produto incorreto ou divergência com o pedido, preserve a peça e sua embalagem e entre em contato assim que identificar o problema.",
      "Trocas comerciais fora das hipóteses legais dependem da disponibilidade de estoque. A peça deve estar sem sinais de uso, lavagem, odores ou alterações e com etiquetas preservadas.",
    ],
  },
  {
    id: "entrega",
    titulo: "Entrega e frete",
    conteudo: [
      "O valor do catálogo e o subtotal do pedido não incluem automaticamente o frete. Prazo, modalidade, cobertura e custo da entrega são confirmados pela equipe antes do envio.",
      "A cliente deve fornecer endereço e telefone corretos. Eventuais custos de uma nova tentativa causada por endereço incorreto ou ausência poderão ser informados antes do reenvio.",
      "O prazo começa após a confirmação do pagamento, quando aplicável, e pode variar conforme localidade, disponibilidade e transportador.",
    ],
  },
  {
    id: "privacidade",
    titulo: "Privacidade e dados pessoais",
    conteudo: [
      "A Selleta Modas utiliza dados como nome, telefone, e-mail, endereço e informações do pedido para cadastro, atendimento, pagamento, entrega, segurança e cumprimento de obrigações legais.",
      "Os dados podem ser processados por serviços necessários à operação, como Supabase, Vercel e WhatsApp, observadas as respectivas medidas de segurança e políticas.",
      "O site usa armazenamento local do navegador para manter o carrinho e o último pedido. Esses dados podem ser apagados nas configurações do navegador.",
      "A titular pode solicitar confirmação, acesso, correção ou exclusão de dados quando aplicável. A solicitação deve ser feita pelo canal de atendimento, e a identidade poderá ser confirmada para proteger a conta.",
    ],
  },
  {
    id: "termos",
    titulo: "Termos de compra",
    conteudo: [
      "A compra está sujeita à disponibilidade de estoque e à confirmação dos dados do pedido. Erros evidentes de preço ou cadastro serão comunicados antes da conclusão.",
      "Pedidos por Pix permanecem com pagamento pendente até a conferência pela equipe. Dinheiro e cartão na entrega dependem da disponibilidade dessa modalidade.",
      "A cliente é responsável por manter os dados da conta e a senha em segurança. O uso indevido deve ser comunicado imediatamente.",
      "Estes termos podem ser atualizados para refletir melhorias operacionais ou exigências legais. A versão aplicável será a publicada no momento da compra.",
    ],
  },
];

export default function Policies() {
  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = "Políticas de compra | Selleta Modas";

    return () => {
      document.title = tituloAnterior;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <Link to="/" aria-label="Voltar para a loja">
          <img src={logoSelleta} alt="Selleta Modas" className="w-40" />
        </Link>
        <Link
          to="/"
          className="rounded-full border px-4 py-2 text-sm font-semibold text-[#8a5d2b]"
        >
          Voltar para a loja
        </Link>
      </header>

      <section className="py-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8a5d2b]">
          Compra transparente
        </p>
        <h1 className="mt-2 text-4xl font-bold">Políticas da Selleta Modas</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Informações sobre trocas, entrega, privacidade e condições de compra.
          Última atualização: 25 de junho de 2026.
        </p>

        <nav className="mt-7 flex flex-wrap gap-2" aria-label="Políticas">
          {secoes.map((secao) => (
            <a
              key={secao.id}
              href={`#${secao.id}`}
              className="rounded-full bg-[#fff7ed] px-4 py-2 text-sm font-semibold text-[#8a5d2b]"
            >
              {secao.titulo}
            </a>
          ))}
        </nav>
      </section>

      <div className="space-y-6">
        {secoes.map((secao) => (
          <section
            key={secao.id}
            id={secao.id}
            className="scroll-mt-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-2xl font-bold">{secao.titulo}</h2>
            <div className="mt-4 space-y-3 leading-relaxed text-gray-600">
              {secao.conteudo.map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-3xl bg-[#2f2924] p-6 text-white sm:p-8">
        <h2 className="text-2xl font-bold">Precisa de atendimento?</h2>
        <p className="mt-2 text-white/70">
          Fale com a equipe e informe o número do pedido quando houver.
        </p>
        <a
          href={`https://wa.me/${whatsappNumero}?text=${encodeURIComponent(
            "Olá! Preciso de ajuda com as políticas ou com um pedido da Selleta Modas."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex rounded-full bg-green-600 px-5 py-3 font-bold"
        >
          Falar pelo WhatsApp
        </a>
      </section>

      <p className="mt-8 text-center text-xs leading-relaxed text-gray-500">
        Este conteúdo apresenta as regras operacionais atuais e não substitui
        orientação jurídica específica.
      </p>
    </main>
  );
}

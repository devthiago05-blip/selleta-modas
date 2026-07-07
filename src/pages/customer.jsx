import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoSelleta from "../assets/logo-selleta.png";
import { vincularPedido } from "../lib/orders";
import {
  metodoPagamentoLabels,
  pagamentoLabels,
  pedidoLabels,
} from "../lib/order-status";
import {
  consultarBloqueioLogin,
  limparFalhasLogin,
  registrarFalhaLogin,
  registrarSessaoAtual,
} from "../lib/auth-security";
import { supabase } from "../lib/supabase";

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function Customer() {
  const [session, setSession] = useState(null);
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [tokenPedido, setTokenPedido] = useState("");
  const [telefonePedido, setTelefonePedido] = useState("");
  const [feedback, setFeedback] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [autenticando, setAutenticando] = useState(false);

  const carregarPedidos = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      setFeedback(
        error.code === "42P01"
          ? "A área de pedidos ainda está sendo configurada."
          : "Não foi possível carregar seus pedidos."
      );
      return;
    }

    setPedidos(data || []);
  }, []);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      const sessaoValida = data.session
        ? await registrarSessaoAtual(supabase)
        : false;

      if (data.session && !sessaoValida) {
        await supabase.auth.signOut({ scope: "local" });
        setFeedback("Esta conta foi acessada em outro dispositivo.");
      }

      setSession(sessaoValida ? data.session : null);
      setCarregando(false);
      if (sessaoValida) carregarPedidos();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, novaSession) => {
      setSession(novaSession);
      if (!novaSession) setPedidos([]);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [carregarPedidos]);

  async function autenticar(evento) {
    evento.preventDefault();
    setFeedback("");
    setAutenticando(true);

    if (modo === "cadastro") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: { full_name: nome.trim() },
        },
      });

      if (error) {
        setFeedback(
          "Não foi possível criar a conta. Verifique os dados e tente novamente."
        );
        setAutenticando(false);
        return;
      }

      if (data.session && !(await registrarSessaoAtual(supabase))) {
        await supabase.auth.signOut({ scope: "local" });
        setFeedback("Não foi possível validar esta sessão.");
        setAutenticando(false);
        return;
      }

      setFeedback(
        data.session
          ? "Conta criada com sucesso."
          : "Conta criada. Confira seu e-mail para confirmar o cadastro."
      );
      setAutenticando(false);
      return;
    }

    const bloqueio = consultarBloqueioLogin();
    if (bloqueio.bloqueado) {
      setFeedback(
        `Muitas tentativas. Aguarde ${bloqueio.minutosRestantes} minuto(s).`
      );
      setAutenticando(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      const falha = registrarFalhaLogin();
      setFeedback(
        falha.bloqueado
          ? `Muitas tentativas. Aguarde ${falha.minutosRestantes} minuto(s).`
          : `E-mail ou senha inválidos. Restam ${falha.tentativasRestantes} tentativa(s).`
      );
      setAutenticando(false);
      return;
    }

    if (!(await registrarSessaoAtual(supabase))) {
      await supabase.auth.signOut({ scope: "local" });
      setFeedback("Não foi possível validar esta sessão. Tente novamente.");
      setAutenticando(false);
      return;
    }

    limparFalhasLogin();
    setSession(data.session);
    await carregarPedidos();
    setAutenticando(false);
  }

  async function reivindicarPedido(evento) {
    evento.preventDefault();
    setFeedback("");

    try {
      const vinculado = await vincularPedido(
        tokenPedido,
        telefonePedido,
        session.access_token
      );

      if (!vinculado) throw new Error("Pedido não encontrado.");
      setFeedback("Pedido vinculado à sua conta.");
      setTokenPedido("");
      setTelefonePedido("");
      await carregarPedidos();
    } catch {
      setFeedback("Pedido não encontrado ou dados incorretos.");
    }
  }

  if (carregando) {
    return <main className="grid min-h-screen place-items-center">Carregando...</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <Link to="/">
          <img src={logoSelleta} alt="Selleta Modas" className="w-40" />
        </Link>
        <div className="flex items-center gap-2">
          <a
            href="/docs/Manual-Selleta-Modas.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-[#8a5d2b]"
          >
            Manual
          </a>
          {session && (
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-lg border px-4 py-2 font-semibold"
            >
              Sair
            </button>
          )}
        </div>
      </header>

      {!session ? (
        <section className="mx-auto mt-10 max-w-md rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-[#8a5d2b]">
            Área da cliente
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            {modo === "login" ? "Entrar na conta" : "Criar sua conta"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Acompanhe pedidos e consulte suas compras em um só lugar.
          </p>

          <form onSubmit={autenticar} className="mt-6 space-y-3">
            {modo === "cadastro" && (
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                className="w-full rounded-xl border p-3"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              autoComplete="email"
              className="w-full rounded-xl border p-3"
              required
            />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              minLength={6}
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              className="w-full rounded-xl border p-3"
              required
            />
            <button
              disabled={autenticando}
              className="w-full rounded-xl bg-[#8a5d2b] p-3 font-bold text-white disabled:opacity-60"
            >
              {autenticando
                ? "Aguarde..."
                : modo === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setModo(modo === "login" ? "cadastro" : "login");
              setFeedback("");
            }}
            className="mt-4 w-full text-sm font-semibold text-[#8a5d2b]"
          >
            {modo === "login"
              ? "Ainda não tenho conta"
              : "Já tenho uma conta"}
          </button>

          {feedback && (
            <p className="mt-4 rounded-xl bg-[#fff7ed] p-3 text-sm">
              {feedback}
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-3xl bg-[#2f2924] p-6 text-white sm:p-8">
            <p className="text-sm uppercase tracking-wider text-[#e8bd7a]">
              Minha conta
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Olá, {session.user.user_metadata?.full_name || session.user.email}
            </h1>
            <p className="mt-2 text-white/70">
              Consulte seus pedidos e acompanhe cada atualização.
            </p>
          </section>

          {feedback && (
            <p className="mt-5 rounded-xl bg-[#fff7ed] p-3">{feedback}</p>
          )}

          <section className="mt-8">
            <h2 className="text-2xl font-bold">Meus pedidos</h2>
            {pedidos.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed bg-white p-8 text-center text-gray-500">
                Nenhum pedido vinculado à sua conta.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {pedidos.map((pedido) => (
                  <article key={pedido.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="flex justify-between gap-3">
                      <strong>Pedido #{pedido.order_number}</strong>
                      <strong className="text-[#8a5d2b]">
                        {formatarPreco(pedido.subtotal)}
                      </strong>
                    </div>
                    <p className="mt-3 text-sm">
                      {pagamentoLabels[pedido.payment_status]} ·{" "}
                      {pedidoLabels[pedido.order_status]}
                    </p>
                    <p className="text-sm text-gray-500">
                      {metodoPagamentoLabels[pedido.payment_method]}
                    </p>
                    <div className="mt-4 space-y-1 border-t pt-3 text-sm">
                      {pedido.order_items?.map((item) => (
                        <p key={item.id}>
                          {item.quantity}× {item.product_name} — {item.size}/
                          {item.color}/{item.print || "Sem estampa"}
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10 rounded-2xl border bg-white p-5">
            <h2 className="text-xl font-bold">Vincular pedido anterior</h2>
            <p className="mt-1 text-sm text-gray-500">
              Use o código de acompanhamento e o telefone do pedido.
            </p>
            <form onSubmit={reivindicarPedido} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={tokenPedido}
                onChange={(e) => setTokenPedido(e.target.value)}
                placeholder="Código de acompanhamento"
                className="rounded-xl border p-3"
                required
              />
              <input
                type="tel"
                value={telefonePedido}
                onChange={(e) => setTelefonePedido(e.target.value)}
                placeholder="Telefone do pedido"
                className="rounded-xl border p-3"
                required
              />
              <button className="rounded-xl bg-[#8a5d2b] p-3 font-bold text-white sm:col-span-2">
                Vincular à minha conta
              </button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}

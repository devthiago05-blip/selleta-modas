import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function fazerLogin(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

    if (error) {
      setErro("E-mail ou senha inválidos.");
      setCarregando(false);
      return;
    }

    navigate("/admin", { replace: true });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={fazerLogin}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm border border-[#C58B39]/20"
      >
        <h1 className="text-2xl font-bold mb-2">
          Login Administrativo
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Acesso restrito à equipe Selleta Modas.
        </p>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="border p-3 w-full mb-3 rounded"
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          required
          className="border p-3 w-full mb-3 rounded"
        />

        {erro && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-[#8a5d2b] hover:bg-[#70491f] text-white p-3 rounded-lg font-semibold transition"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <a
          href="/docs/Manual-Selleta-Modas.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-sm font-semibold text-[#8a5d2b] hover:underline"
        >
          Abrir manual de operação
        </a>
      </form>
    </main>
  );
}

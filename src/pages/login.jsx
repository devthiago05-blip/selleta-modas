import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function fazerLogin(e) {
    e.preventDefault();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={fazerLogin}
        className="bg-white p-8 rounded-xl shadow w-96"
      >
        <h1 className="text-2xl font-bold mb-6">
          Login Administrativo
        </h1>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 w-full mb-3 rounded"
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="border p-3 w-full mb-3 rounded"
        />

        <button
          className="w-full bg-[#C58B39] text-white p-3 rounded"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
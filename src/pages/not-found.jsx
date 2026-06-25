import { Link } from "react-router-dom";
import logoSelleta from "../assets/logo-selleta.png";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <img
          src={logoSelleta}
          alt="Selleta Modas"
          className="mx-auto mb-6 w-48"
        />
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8a5d2b]">
          Página não encontrada
        </p>
        <h1 className="mt-2 text-4xl font-bold">Esse look saiu da vitrine.</h1>
        <p className="mx-auto mt-3 max-w-md text-gray-500">
          O endereço pode ter mudado. Volte para a coleção e encontre sua
          próxima peça favorita.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-[#8a5d2b] px-6 py-3 font-bold text-white"
        >
          Voltar para a loja
        </Link>
      </div>
    </main>
  );
}

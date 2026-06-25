import { useState } from "react";
import { supabase } from "../lib/supabase";

const inputClasse = "min-w-0 rounded-lg border border-gray-300 p-2 text-sm";

const novaVariacao = () => ({
  key: crypto.randomUUID(),
  size: "",
  color: "",
  print: "Sem estampa",
  sku: "",
  stock: "0",
  active: true,
});

export default function ProductVariantsEditor({
  produto,
  disponivel,
  onSaved,
}) {
  const [variacoes, setVariacoes] = useState(() =>
    (produto?.product_variants || []).map((variacao) => ({
      ...variacao,
      key: variacao.id,
      stock: String(variacao.stock ?? 0),
    }))
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  if (!disponivel) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        Execute <code>supabase/product-variants.sql</code> para liberar a grade.
      </div>
    );
  }

  function alterar(key, campo, valor) {
    setVariacoes((atuais) =>
      atuais.map((variacao) =>
        variacao.key === key ? { ...variacao, [campo]: valor } : variacao
      )
    );
  }

  async function salvarGrade() {
    setErro("");

    const payload = variacoes.map((variacao) => ({
      size: variacao.size.trim() || "Único",
      color: variacao.color.trim() || "Padrão",
      print: variacao.print.trim() || "Sem estampa",
      sku: variacao.sku.trim(),
      stock: Number(variacao.stock),
      active: variacao.active,
    }));

    if (
      payload.some(
        (variacao) =>
          !Number.isInteger(variacao.stock) || variacao.stock < 0
      )
    ) {
      setErro("Informe estoques inteiros e maiores ou iguais a zero.");
      return;
    }

    const combinacoes = new Set(
      payload.map((item) =>
        `${item.size}|${item.color}|${item.print}`.toLocaleLowerCase("pt-BR")
      )
    );

    if (combinacoes.size !== payload.length) {
      setErro("Há combinações duplicadas na grade.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.rpc("admin_replace_product_variants", {
      p_product_id: produto.id,
      p_variants: payload,
    });
    setSalvando(false);

    if (error) {
      setErro("Não foi possível salvar a grade.");
      return;
    }

    await onSaved();
  }

  return (
    <section className="rounded-xl border border-[#C58B39]/25 bg-[#fffaf3] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">Grade de variações</h3>
          <p className="text-xs text-gray-500">
            Cada linha representa uma combinação com estoque próprio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVariacoes((atuais) => [...atuais, novaVariacao()])}
          className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold"
        >
          + Adicionar
        </button>
      </div>

      {variacoes.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed bg-white p-4 text-center text-sm text-gray-500">
          Sem grade. O produto usa o estoque geral cadastrado acima.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {variacoes.map((variacao) => (
            <div
              key={variacao.key}
              className="grid gap-2 rounded-xl border bg-white p-3 sm:grid-cols-2"
            >
              <input
                value={variacao.size}
                onChange={(e) => alterar(variacao.key, "size", e.target.value)}
                placeholder="Tamanho: P, M, G"
                maxLength={30}
                className={inputClasse}
              />
              <input
                value={variacao.color}
                onChange={(e) => alterar(variacao.key, "color", e.target.value)}
                placeholder="Cor: Preto"
                maxLength={50}
                className={inputClasse}
              />
              <input
                value={variacao.print}
                onChange={(e) => alterar(variacao.key, "print", e.target.value)}
                placeholder="Estampa: Floral"
                maxLength={80}
                className={inputClasse}
              />
              <input
                value={variacao.sku}
                onChange={(e) => alterar(variacao.key, "sku", e.target.value)}
                placeholder="SKU (opcional)"
                maxLength={80}
                className={inputClasse}
              />
              <label className="flex items-center gap-2 text-sm">
                <span>Estoque</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={variacao.stock}
                  onChange={(e) =>
                    alterar(variacao.key, "stock", e.target.value)
                  }
                  className={`${inputClasse} w-24`}
                />
              </label>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={variacao.active}
                    onChange={(e) =>
                      alterar(variacao.key, "active", e.target.checked)
                    }
                    className="accent-[#8a5d2b]"
                  />
                  Ativa
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setVariacoes((atuais) =>
                      atuais.filter((item) => item.key !== variacao.key)
                    )
                  }
                  className="text-sm font-semibold text-red-700"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvarGrade}
        disabled={salvando}
        className="mt-4 w-full rounded-lg bg-[#2f2924] p-3 font-bold text-white"
      >
        {salvando ? "Salvando grade..." : "Salvar grade"}
      </button>
    </section>
  );
}

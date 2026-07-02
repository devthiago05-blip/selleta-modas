import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  CORES_COMUNS,
  normalizarOpcao,
  SEM_ESTAMPA,
  TAMANHOS_PADRAO,
} from "../lib/variants";

const campoClasse =
  "w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-[#C58B39] focus:ring-2 focus:ring-[#C58B39]/20";

const quantidadesVazias = () =>
  Object.fromEntries(TAMANHOS_PADRAO.map((tamanho) => [tamanho, "0"]));

function obterQuantidades(variacoes, cor, estampa) {
  const quantidades = quantidadesVazias();
  for (const tamanho of TAMANHOS_PADRAO) {
    const variacao = variacoes.find(
      (item) =>
        item.size === tamanho &&
        normalizarOpcao(item.color) === normalizarOpcao(cor) &&
        normalizarOpcao(item.print || SEM_ESTAMPA) ===
          normalizarOpcao(estampa)
    );
    quantidades[tamanho] = String(variacao?.stock ?? 0);
  }
  return quantidades;
}

export default function InventoryBalance({ produtos, onSaved }) {
  const produtoInicial = produtos[0];
  const variacoesIniciais = produtoInicial?.product_variants || [];
  const corInicial = variacoesIniciais[0]?.color || "Preto";
  const estampaInicial = variacoesIniciais[0]?.print || SEM_ESTAMPA;
  const [produtoId, setProdutoId] = useState(produtoInicial?.id || "");
  const [cor, setCor] = useState(corInicial);
  const [estampa, setEstampa] = useState(estampaInicial);
  const [quantidades, setQuantidades] = useState(() =>
    obterQuantidades(variacoesIniciais, corInicial, estampaInicial)
  );
  const [motivo, setMotivo] = useState("Balanço manual");
  const [historico, setHistorico] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const produto =
    produtos.find((item) => item.id === produtoId) || produtos[0];
  const variacoes = useMemo(
    () => produto?.product_variants || [],
    [produto]
  );
  const estampas = useMemo(() => {
    const opcoes = [
      ...new Set(variacoes.map((variacao) => variacao.print || SEM_ESTAMPA)),
    ];
    return opcoes.length ? opcoes : [SEM_ESTAMPA];
  }, [variacoes]);
  const possuiEstampa = estampas.some(
    (opcao) => normalizarOpcao(opcao) !== normalizarOpcao(SEM_ESTAMPA)
  );

  const carregarHistorico = useCallback(async () => {
    const { data, error } = await supabase
      .from("inventory_adjustments")
      .select(
        "id,product_name,size,color,print,previous_stock,new_stock,difference,reason,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) setHistorico(data || []);
  }, []);

  useEffect(() => {
    let ativo = true;
    supabase
      .from("inventory_adjustments")
      .select(
        "id,product_name,size,color,print,previous_stock,new_stock,difference,reason,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (ativo && !error) setHistorico(data || []);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function selecionarProduto(id) {
    const selecionado = produtos.find((item) => item.id === id);
    const opcoes = selecionado?.product_variants || [];
    const primeira = opcoes[0];
    const proximaCor = primeira?.color || "Preto";
    const proximaEstampa = primeira?.print || SEM_ESTAMPA;
    setProdutoId(id);
    setCor(proximaCor);
    setEstampa(proximaEstampa);
    setQuantidades(obterQuantidades(opcoes, proximaCor, proximaEstampa));
  }

  function selecionarCor(valor) {
    setCor(valor);
    setQuantidades(obterQuantidades(variacoes, valor, estampa));
  }

  function selecionarEstampa(valor) {
    setEstampa(valor);
    setQuantidades(obterQuantidades(variacoes, cor, valor));
  }

  async function salvarBalanco(evento) {
    evento.preventDefault();
    setFeedback(null);

    if (!produto || !cor.trim()) {
      setFeedback({ tipo: "erro", mensagem: "Selecione a referência e a cor." });
      return;
    }

    const quantidadesFormatadas = Object.fromEntries(
      TAMANHOS_PADRAO.map((tamanho) => [
        tamanho,
        Number(quantidades[tamanho]),
      ])
    );
    if (
      Object.values(quantidadesFormatadas).some(
        (quantidade) => !Number.isInteger(quantidade) || quantidade < 0
      )
    ) {
      setFeedback({
        tipo: "erro",
        mensagem: "Informe quantidades inteiras e maiores ou iguais a zero.",
      });
      return;
    }

    setSalvando(true);
    const { data, error } = await supabase.rpc("admin_balance_product_stock", {
      p_product_id: produto.id,
      p_color: cor.trim(),
      p_print: estampa,
      p_quantities: quantidadesFormatadas,
      p_reason: motivo.trim() || null,
    });
    setSalvando(false);

    if (error) {
      setFeedback({
        tipo: "erro",
        mensagem: error.message?.includes("Produto não encontrado")
          ? "A referência foi excluída. Atualize a página e selecione outra."
          : "Não foi possível salvar o balanço.",
      });
      return;
    }

    await onSaved();
    await carregarHistorico();
    setFeedback({
      tipo: "sucesso",
      mensagem:
        Number(data) > 0
          ? `Balanço salvo: ${data} tamanho(s) atualizado(s).`
          : "As quantidades já estavam atualizadas.",
    });
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
        Cadastre um produto antes de realizar o balanço.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <form
        onSubmit={salvarBalanco}
        className="rounded-2xl border border-[#C58B39]/20 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5">
          <h2 className="text-xl font-bold">Balanço de estoque</h2>
          <p className="text-sm text-gray-500">
            Informe a quantidade física encontrada. O valor substitui o estoque atual.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className="mb-1 block text-sm font-medium">Peça / referência</span>
            <select
              value={produto?.id || ""}
              onChange={(evento) => selecionarProduto(evento.target.value)}
              className={campoClasse}
              required
            >
              {produtos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.products}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Cor</span>
            <input
              list="cores-balanco"
              value={cor}
              onChange={(evento) => selecionarCor(evento.target.value)}
              maxLength={50}
              className={campoClasse}
              required
            />
            <datalist id="cores-balanco">
              {CORES_COMUNS.map((opcao) => (
                <option key={opcao.nome} value={opcao.nome} />
              ))}
            </datalist>
          </label>

          {possuiEstampa ? (
            <label>
              <span className="mb-1 block text-sm font-medium">Estampa</span>
              <select
                value={estampa}
                onChange={(evento) => selecionarEstampa(evento.target.value)}
                className={campoClasse}
              >
                {estampas.map((opcao) => (
                  <option key={opcao}>{opcao}</option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-lg bg-[#fff7ed] p-3 text-sm text-gray-600">
              Produto sem estampa
            </div>
          )}
        </div>

        <fieldset className="mt-6">
          <legend className="mb-3 font-semibold">Quantidade por tamanho</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TAMANHOS_PADRAO.map((tamanho) => (
              <label key={tamanho} className="rounded-xl border bg-[#fffaf3] p-3">
                <span className="mb-2 block text-center text-lg font-bold">
                  {tamanho}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quantidades[tamanho]}
                  onChange={(evento) =>
                    setQuantidades((atuais) => ({
                      ...atuais,
                      [tamanho]: evento.target.value,
                    }))
                  }
                  className={`${campoClasse} text-center`}
                  required
                />
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Motivo</span>
          <input
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            maxLength={200}
            className={campoClasse}
            placeholder="Ex.: contagem física da loja"
          />
        </label>

        {feedback && (
          <p
            role="status"
            className={`mt-4 rounded-lg p-3 text-sm ${
              feedback.tipo === "erro"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-800"
            }`}
          >
            {feedback.mensagem}
          </p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="mt-5 w-full rounded-xl bg-[#2f2924] p-3 font-bold text-white disabled:opacity-60"
        >
          {salvando ? "Salvando balanço..." : "Salvar balanço"}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-bold">Últimos ajustes</h2>
        </div>
        {historico.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">
            Nenhum balanço registrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Referência</th>
                  <th className="p-3">Variação</th>
                  <th className="p-3">Anterior</th>
                  <th className="p-3">Atual</th>
                  <th className="p-3">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((ajuste) => (
                  <tr key={ajuste.id} className="border-t">
                    <td className="p-3">
                      {new Date(ajuste.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 font-semibold">{ajuste.product_name}</td>
                    <td className="p-3">
                      {ajuste.color} / {ajuste.size}
                      {ajuste.print !== SEM_ESTAMPA ? ` / ${ajuste.print}` : ""}
                    </td>
                    <td className="p-3">{ajuste.previous_stock}</td>
                    <td className="p-3">{ajuste.new_stock}</td>
                    <td
                      className={`p-3 font-semibold ${
                        ajuste.difference < 0 ? "text-red-700" : "text-green-700"
                      }`}
                    >
                      {ajuste.difference > 0 ? "+" : ""}
                      {ajuste.difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

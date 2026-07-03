import { useState } from "react";
import { readSheet } from "read-excel-file/browser";
import { analisarPlanilhaProdutos, COLUNAS_IMPORTACAO } from "../lib/product-import";
import { supabase } from "../lib/supabase";

export default function ProductSpreadsheetImport({ produtos, gradeDisponivel, onImported }) {
  const [aberto, setAberto] = useState(false);
  const [arquivo, setArquivo] = useState("");
  const [itens, setItens] = useState([]);
  const [erros, setErros] = useState([]);
  const [lendo, setLendo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState("");

  function limparLeitura() {
    setArquivo("");
    setItens([]);
    setErros([]);
    setResultado("");
  }

  async function lerArquivo(evento) {
    const selecionado = evento.target.files?.[0];
    limparLeitura();
    if (!selecionado) return;
    setArquivo(selecionado.name);

    if (!selecionado.name.toLowerCase().endsWith(".xlsx") || selecionado.size > 5 * 1024 * 1024) {
      setErros(["Selecione um arquivo .xlsx de até 5 MB."]);
      return;
    }

    setLendo(true);
    try {
      const linhas = await readSheet(selecionado);
      const analise = analisarPlanilhaProdutos(
        linhas,
        produtos.map((produto) => produto.products)
      );
      setItens(analise.produtos);
      setErros(analise.erros);
    } catch {
      setErros(["Não foi possível ler o arquivo. Salve-o novamente no formato .xlsx."]);
    } finally {
      setLendo(false);
    }
  }

  async function copiarCabecalho() {
    await navigator.clipboard.writeText(
      COLUNAS_IMPORTACAO.map((coluna) => coluna.titulo).join("\t")
    );
    setResultado("Cabeçalho copiado. Cole na primeira linha do Excel.");
  }

  async function importar() {
    if (!itens.length || erros.length) return;
    setImportando(true);
    setResultado("");
    let concluidos = 0;

    for (const item of itens) {
      const { data, error } = await supabase
        .from("products")
        .insert(item.dados)
        .select("id")
        .single();

      if (error) {
        setErros([`Falha ao cadastrar “${item.dados.products}”. Nenhum outro item será importado.`]);
        break;
      }

      const { error: erroGrade } = await supabase.rpc("admin_replace_product_variants", {
        p_product_id: data.id,
        p_variants: item.variantes,
      });

      if (erroGrade) {
        await supabase.from("products").delete().eq("id", data.id);
        setErros([`Falha ao criar a grade de “${item.dados.products}”.`]);
        break;
      }
      concluidos += 1;
    }

    setImportando(false);
    if (concluidos > 0) {
      setResultado(`${concluidos} produto(s) importado(s) com grade P/M/G/GG.`);
      await onImported();
      setItens([]);
    }
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={!gradeDisponivel}
        className="rounded-xl bg-[#2f2924] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Importar produtos por Excel
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="excel-titulo">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#8a5d2b]">Cadastro em lote</p>
                <h2 id="excel-titulo" className="text-2xl font-bold">Importar planilha do Excel</h2>
                <p className="mt-1 text-sm text-gray-500">A primeira linha deve conter exatamente estes títulos. Uma linha representa uma cor/estampa da peça.</p>
              </div>
              <button type="button" onClick={() => setAberto(false)} className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-xl" aria-label="Fechar">×</button>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-[#fff7ed]">
                  <tr>{COLUNAS_IMPORTACAO.map((coluna) => <th key={coluna.letra} className="p-3">{coluna.letra}</th>)}</tr>
                </thead>
                <tbody>
                  <tr>{COLUNAS_IMPORTACAO.map((coluna) => <td key={coluna.letra} className="border-t p-3 font-semibold">{coluna.titulo}</td>)}</tr>
                  <tr className="text-gray-500">{COLUNAS_IMPORTACAO.map((coluna) => <td key={coluna.letra} className="border-t p-3">{coluna.exemplo}</td>)}</tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={copiarCabecalho} className="rounded-lg border px-4 py-2 font-semibold">Copiar cabeçalho</button>
              <label className="cursor-pointer rounded-lg bg-[#8a5d2b] px-4 py-2 font-semibold text-white">
                {lendo ? "Lendo..." : "Selecionar arquivo .xlsx"}
                <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={lerArquivo} disabled={lendo || importando} className="sr-only" />
              </label>
              {arquivo && <span className="self-center text-sm text-gray-500">{arquivo}</span>}
            </div>

            <p className="mt-3 text-sm text-gray-500">Repita o mesmo nome em linhas diferentes para cadastrar outras cores ou estampas. A imagem do produto é obrigatória; a imagem da estampa só é exigida quando houver estampa.</p>

            {erros.length > 0 && (
              <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <strong>Corrija antes de importar:</strong>
                <ul className="mt-2 list-disc space-y-1 pl-5">{erros.slice(0, 20).map((erro) => <li key={erro}>{erro}</li>)}</ul>
              </div>
            )}

            {itens.length > 0 && (
              <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
                <strong>Prévia aprovada: {itens.length} produto(s).</strong>
                <p className="mt-1">{itens.slice(0, 8).map((item) => item.dados.products).join(", ")}</p>
              </div>
            )}

            {resultado && <p className="mt-4 rounded-xl bg-[#fff7ed] p-4 text-sm font-semibold text-[#70491f]">{resultado}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setAberto(false)} className="rounded-lg border px-4 py-2 font-semibold">Fechar</button>
              <button type="button" onClick={importar} disabled={!itens.length || erros.length > 0 || importando} className="rounded-lg bg-[#2f2924] px-5 py-2 font-bold text-white disabled:opacity-50">
                {importando ? "Importando..." : "Confirmar importação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

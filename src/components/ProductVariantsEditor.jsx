import { useState } from "react";
import VariantGradeBuilder from "./VariantGradeBuilder";
import { enviarImagemProduto, removerImagemProduto } from "../lib/storage";
import { supabase } from "../lib/supabase";
import {
  chaveVariacao,
  CORES_COMUNS,
  completarGradePadrao,
  gerarCombinacoesGrade,
  normalizarOpcao,
  SEM_ESTAMPA,
  TAMANHOS_PADRAO,
} from "../lib/variants";

const inputClasse = "min-w-0 rounded-lg border border-gray-300 p-2 text-sm";

const novaVariacao = (dados = {}) => ({
  key: crypto.randomUUID(),
  size: "",
  color: "",
  print: SEM_ESTAMPA,
  print_image_url: null,
  sku: "",
  stock: "1",
  active: true,
  ...dados,
});

const corCadastrada = (cor) =>
  CORES_COMUNS.find(
    (opcao) => normalizarOpcao(opcao.nome) === normalizarOpcao(cor)
  )?.nome || cor;

function variacoesIniciais(produto) {
  const corPadrao =
    produto?.product_variants?.[0]?.color ||
    produto?.cores?.split(",").map((cor) => cor.trim()).find(Boolean) ||
    "Preto";

  return completarGradePadrao(produto?.product_variants || [], corPadrao).map((variacao) =>
    novaVariacao({
      ...variacao,
      key: variacao.id || crypto.randomUUID(),
      stock: String(variacao.stock ?? 0),
    })
  );
}

function estampasIniciais(produto) {
  const estampas = new Map();

  for (const variacao of produto?.product_variants || []) {
    if (normalizarOpcao(variacao.print) === normalizarOpcao(SEM_ESTAMPA)) {
      continue;
    }

    const chave = normalizarOpcao(variacao.print);
    if (!estampas.has(chave)) {
      estampas.set(chave, {
        key: crypto.randomUUID(),
        nome: variacao.print,
        imagemUrl: variacao.print_image_url || null,
        arquivo: null,
      });
    }
  }

  return [...estampas.values()];
}

export default function ProductVariantsEditor({
  produto,
  disponivel,
  onSaved,
}) {
  const [variacoes, setVariacoes] = useState(() => variacoesIniciais(produto));
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState([
    ...TAMANHOS_PADRAO,
  ]);
  const [coresSelecionadas, setCoresSelecionadas] = useState(() => {
    const cores = [
      ...new Set(
        (produto?.product_variants || []).map((variacao) =>
          corCadastrada(variacao.color)
        )
      ),
    ];
    return cores.length ? cores : ["Preto"];
  });
  const [estampas, setEstampas] = useState(() => estampasIniciais(produto));
  const [possuiEstampa, setPossuiEstampa] = useState(
    () => estampasIniciais(produto).length > 0
  );
  const [estoqueInicial, setEstoqueInicial] = useState("1");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const listaTamanhosId = `tamanhos-${produto.id}`;
  const listaCoresId = `cores-${produto.id}`;
  const listaEstampasId = `estampas-${produto.id}`;

  if (!disponivel) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        Execute o arquivo completo <code>supabase/product-variants.sql</code> no
        SQL Editor do Supabase e aguarde o cache do schema atualizar para
        liberar a grade.
      </div>
    );
  }

  function alterar(key, campo, valor) {
    setVariacoes((atuais) =>
      atuais.map((variacao) => {
        if (variacao.key !== key) return variacao;

        if (campo === "print") {
          const estampa = estampas.find(
            (item) => normalizarOpcao(item.nome) === normalizarOpcao(valor)
          );
          return {
            ...variacao,
            print: valor,
            print_image_url: estampa?.imagemUrl || null,
          };
        }

        return { ...variacao, [campo]: valor };
      })
    );
  }

  function alternarTamanho(tamanho) {
    setTamanhosSelecionados((atuais) =>
      atuais.includes(tamanho)
        ? atuais.filter((item) => item !== tamanho)
        : [...atuais, tamanho]
    );
  }

  function alternarCor(cor) {
    setCoresSelecionadas((atuais) =>
      atuais.includes(cor)
        ? atuais.filter((item) => item !== cor)
        : [...atuais, cor]
    );
  }

  function alterarEstampa(key, campo, valor) {
    setEstampas((atuais) =>
      atuais.map((estampa) =>
        estampa.key === key ? { ...estampa, [campo]: valor } : estampa
      )
    );
  }

  function removerEstampa(key) {
    setEstampas((atuais) => atuais.filter((estampa) => estampa.key !== key));
  }

  function adicionarEstampa() {
    setEstampas((atuais) => [
      ...atuais,
      {
        key: crypto.randomUUID(),
        nome: "",
        imagemUrl: null,
        arquivo: null,
      },
    ]);
  }

  function definirPossuiEstampa(valor) {
    setPossuiEstampa(valor);
    setErro("");

    if (valor) {
      if (estampas.length === 0) {
        setEstampas([
          {
            key: crypto.randomUUID(),
            nome: "",
            imagemUrl: null,
            arquivo: null,
          },
        ]);
      }
      return;
    }

    setEstampas([]);
    const unicas = new Map();
    for (const variacao of variacoes) {
      const atualizada = {
        ...variacao,
        print: SEM_ESTAMPA,
        print_image_url: null,
      };
      const chave = chaveVariacao(atualizada.size, atualizada.color, SEM_ESTAMPA);
      if (!unicas.has(chave)) unicas.set(chave, atualizada);
    }
    setVariacoes([...unicas.values()]);
  }

  function gerarGrade() {
    setErro("");
    setAviso("");
    const estoque = Number(estoqueInicial);

    if (tamanhosSelecionados.length === 0 || coresSelecionadas.length === 0) {
      setErro("Selecione pelo menos um tamanho e uma cor.");
      return;
    }

    if (!Number.isInteger(estoque) || estoque < 0) {
      setErro("O estoque inicial deve ser um número inteiro maior ou igual a zero.");
      return;
    }

    const estampasValidas = possuiEstampa
      ? estampas.filter((estampa) => estampa.nome.trim())
      : [];

    if (
      possuiEstampa &&
      (estampasValidas.length !== estampas.length || estampas.length === 0)
    ) {
      setErro("Informe o nome de todas as estampas.");
      return;
    }

    if (
      new Set(estampasValidas.map((estampa) => normalizarOpcao(estampa.nome)))
        .size !== estampasValidas.length
    ) {
      setErro("Não cadastre duas estampas com o mesmo nome.");
      return;
    }

    if (
      estampasValidas.some(
        (estampa) => !estampa.arquivo && !estampa.imagemUrl
      )
    ) {
      setErro("Adicione uma imagem para cada estampa.");
      return;
    }

    const totalCombinacoes =
      tamanhosSelecionados.length *
      coresSelecionadas.length *
      Math.max(1, estampasValidas.length);
    if (totalCombinacoes > 100) {
      setErro("Selecione menos opções. Cada produto aceita até 100 combinações.");
      return;
    }

    const existentes = new Map(
      variacoes.map((variacao) => [
        chaveVariacao(variacao.size, variacao.color, variacao.print),
        variacao,
      ])
    );
    const geradas = gerarCombinacoesGrade({
      tamanhos: tamanhosSelecionados,
      cores: coresSelecionadas,
      estampas: estampasValidas.map((estampa) => ({
        nome: estampa.nome.trim(),
        imagemUrl: estampa.imagemUrl,
      })),
      estoqueInicial: estoque,
    }).map((variacao) => {
      const existente = existentes.get(
        chaveVariacao(variacao.size, variacao.color, variacao.print)
      );

      return novaVariacao({
        ...variacao,
        ...(existente || {}),
        size: variacao.size,
        color: variacao.color,
        print: variacao.print,
        print_image_url:
          variacao.print_image_url || existente?.print_image_url || null,
        key: existente?.key || crypto.randomUUID(),
      });
    });

    setVariacoes(geradas);
    setAviso(
      `${geradas.length} combinações preparadas. Revise os estoques e clique em Salvar grade.`
    );
  }

  async function salvarGrade() {
    setErro("");
    setAviso("");

    if (variacoes.length === 0) {
      setErro("Adicione ou gere pelo menos uma combinação.");
      return;
    }

    const payloadBase = variacoes.map((variacao) => ({
      size: variacao.size.trim() || "Único",
      color: variacao.color.trim() || "Padrão",
      print: possuiEstampa ? variacao.print.trim() || SEM_ESTAMPA : SEM_ESTAMPA,
      print_image_url: possuiEstampa ? variacao.print_image_url : null,
      sku: variacao.sku.trim(),
      stock: Number(variacao.stock),
      active: variacao.active,
    }));

    if (
      payloadBase.some(
        (variacao) =>
          !Number.isInteger(variacao.stock) || variacao.stock < 0
      )
    ) {
      setErro("Informe estoques inteiros e maiores ou iguais a zero.");
      return;
    }

    if (!payloadBase.some((variacao) => variacao.active && variacao.stock > 0)) {
      setErro(
        "A grade precisa ter ao menos uma combinação ativa com estoque maior que zero."
      );
      return;
    }

    const combinacoes = new Set(
      payloadBase.map((item) =>
        chaveVariacao(item.size, item.color, item.print)
      )
    );

    if (combinacoes.size !== payloadBase.length) {
      setErro("Há combinações duplicadas na grade.");
      return;
    }

    if (
      estampas.some(
        (estampa) =>
          estampa.arquivo &&
          (!estampa.arquivo.type.startsWith("image/") ||
            estampa.arquivo.size > 5 * 1024 * 1024)
      )
    ) {
      setErro("Cada imagem de estampa deve ser PNG, JPG ou WebP de até 5 MB.");
      return;
    }

    setSalvando(true);
    const imagensEnviadas = [];
    const urlsEstampas = new Map(
      estampas.map((estampa) => [
        normalizarOpcao(estampa.nome),
        estampa.imagemUrl || null,
      ])
    );

    for (const estampa of estampas) {
      if (!estampa.arquivo) continue;

      const { data, error } = await enviarImagemProduto(
        estampa.arquivo,
        `estampas/${produto.id}`
      );

      if (error) {
        await Promise.all(imagensEnviadas.map(removerImagemProduto));
        setSalvando(false);
        setErro("Não foi possível enviar uma das imagens de estampa.");
        return;
      }

      imagensEnviadas.push(data.publicUrl);
      urlsEstampas.set(normalizarOpcao(estampa.nome), data.publicUrl);
    }

    const payload = payloadBase.map((variacao) => ({
      ...variacao,
      print_image_url:
        variacao.print === SEM_ESTAMPA
          ? null
          : urlsEstampas.get(normalizarOpcao(variacao.print)) ||
            variacao.print_image_url ||
            null,
    }));

    if (
      payload.some(
        (variacao) =>
          normalizarOpcao(variacao.print) !== normalizarOpcao(SEM_ESTAMPA) &&
          !variacao.print_image_url
      )
    ) {
      await Promise.all(imagensEnviadas.map(removerImagemProduto));
      setSalvando(false);
      setErro("Selecione uma imagem para cada estampa usada na grade.");
      return;
    }

    const { error } = await supabase.rpc("admin_replace_product_variants", {
      p_product_id: produto.id,
      p_variants: payload,
    });

    if (error) {
      await Promise.all(imagensEnviadas.map(removerImagemProduto));
      setSalvando(false);
      setErro(
        error.message?.includes("Produto não encontrado")
          ? "Este produto foi excluído. Feche a edição e selecione um produto existente."
          : "Não foi possível salvar a grade. Atualize a página e tente novamente."
      );
      return;
    }

    const imagensEmUso = new Set(
      payload.map((variacao) => variacao.print_image_url).filter(Boolean)
    );
    const imagensAntigas = [
      ...new Set(
        (produto.product_variants || [])
          .map((variacao) => variacao.print_image_url)
          .filter((url) => url && !imagensEmUso.has(url))
      ),
    ];
    await Promise.all(imagensAntigas.map(removerImagemProduto));
    setSalvando(false);
    await onSaved();
  }

  return (
    <section className="rounded-xl border border-[#C58B39]/25 bg-[#fffaf3] p-4">
      <div>
        <h3 className="font-bold">Grade de variações</h3>
        <p className="text-xs text-gray-500">
          Gere as combinações e informe o estoque real de cada uma.
        </p>
      </div>

      <VariantGradeBuilder
        tamanhosSelecionados={tamanhosSelecionados}
        coresSelecionadas={coresSelecionadas}
        possuiEstampa={possuiEstampa}
        estampas={estampas}
        estoqueInicial={estoqueInicial}
        onAlternarTamanho={alternarTamanho}
        onAlternarCor={alternarCor}
        onPossuiEstampaChange={definirPossuiEstampa}
        onAdicionarEstampa={adicionarEstampa}
        onAlterarEstampa={alterarEstampa}
        onRemoverEstampa={removerEstampa}
        onEstoqueInicialChange={setEstoqueInicial}
        onGerar={gerarGrade}
      />

      {variacoes.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed bg-white p-4 text-center text-sm text-gray-500">
          Sem grade. Selecione tamanhos e cores para gerar as combinações.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {variacoes.map((variacao) => (
            <div
              key={variacao.key}
              className="grid gap-2 rounded-xl border bg-white p-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <input
                list={listaTamanhosId}
                value={variacao.size}
                onChange={(evento) =>
                  alterar(variacao.key, "size", evento.target.value)
                }
                placeholder="Tamanho"
                maxLength={30}
                className={inputClasse}
              />
              <input
                list={listaCoresId}
                value={variacao.color}
                onChange={(evento) =>
                  alterar(variacao.key, "color", evento.target.value)
                }
                placeholder="Cor"
                maxLength={50}
                className={inputClasse}
              />
              {possuiEstampa && (
                <input
                  list={listaEstampasId}
                  value={variacao.print}
                  onChange={(evento) =>
                    alterar(variacao.key, "print", evento.target.value)
                  }
                  placeholder="Estampa"
                  maxLength={80}
                  className={inputClasse}
                />
              )}
              <input
                value={variacao.sku}
                onChange={(evento) =>
                  alterar(variacao.key, "sku", evento.target.value)
                }
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
                  onChange={(evento) =>
                    alterar(variacao.key, "stock", evento.target.value)
                  }
                  className={`${inputClasse} w-24`}
                />
              </label>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={variacao.active}
                    onChange={(evento) =>
                      alterar(variacao.key, "active", evento.target.checked)
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

      <datalist id={listaTamanhosId}>
        {TAMANHOS_PADRAO.map((tamanho) => (
          <option key={tamanho} value={tamanho} />
        ))}
      </datalist>
      <datalist id={listaCoresId}>
        {CORES_COMUNS.map((cor) => (
          <option key={cor.nome} value={cor.nome} />
        ))}
      </datalist>
      <datalist id={listaEstampasId}>
        {estampas.map((estampa) => (
          <option key={estampa.key} value={estampa.nome} />
        ))}
      </datalist>

      {erro && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {aviso}
        </p>
      )}

      <button
        type="button"
        onClick={salvarGrade}
        disabled={salvando}
        className="mt-4 w-full rounded-lg bg-[#2f2924] p-3 font-bold text-white disabled:opacity-60"
      >
        {salvando ? "Salvando grade..." : "Salvar grade"}
      </button>
    </section>
  );
}

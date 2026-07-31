/* ============================================================
   ABA: PLANILHA (scorecard de SLA)
   Diferente das outras abas: não vem de planilha do Google
   Sheets — é um formulário interativo. Os itens/categorias/pesos
   ficam fixos aqui no código (fácil de expandir depois), e as
   escolhas do usuário (avaliação selecionada + se o item conta
   ou não na nota) ficam salvas no localStorage do navegador,
   pra não se perder ao atualizar a página.

   Lógica da nota final: "desconsiderar" um item COMPENSA em vez
   de PUNIR — o peso dele sai tanto do numerador quanto do
   denominador do cálculo, então os itens restantes preenchem
   proporcionalmente os 100%, em vez de a nota cair porque um
   item ficou de fora.

   Depende dos helpers genéricos definidos em /script.js
   (showLoading, showError, hideError, updateLastUpdated, Dashboard).
============================================================ */

/* ============================================================
   DADOS — categorias e itens do SLA
   Cada item tem um id estável (usado na chave do localStorage),
   uma lista de "bandas" (as faixas de pontuação) e um peso (%).
============================================================ */
const CATEGORIAS = [
  {
    id: "operacional",
    nome: "Avaliação Operacional",
    itens: [
      {
        id: "op-limpeza-concorrente",
        titulo: "Limpeza concorrente",
        texto: "Limpezas concorrentes realizadas diariamente em todas as áreas no mês. Tem a finalidade de garantir ambientes higienizados e organizados.",
        peso: 10,
        bandas: [
          { label: "Igual ou acima de 85%", valor: 1 },
          { label: "Entre 84,99% e 80%", valor: 0.75 },
          { label: "Entre 79,99% e 75%", valor: 0.50 },
          { label: "Abaixo de 74,99%", valor: 0 },
        ],
      },
      {
        id: "op-limpeza-terminal",
        titulo: "Terminal programada",
        texto: "Limpezas Terminais Programadas x Realizadas no mês, considerando as frequências e criticidade das áreas, de acordo com as normas da ANVISA e SCIH do Cliente.",
        peso: 10,
        bandas: [
          { label: "Igual ou acima de 85%", valor: 1 },
          { label: "Entre 84,99% e 80%", valor: 0.75 },
          { label: "Entre 79,99% e 75%", valor: 0.50 },
          { label: "Abaixo de 74,99%", valor: 0 },
        ],
      },
    ],
  },
  {
    id: "qualidade",
    nome: "Qualidade",
    itens: [
      {
        id: "qual-checklist-qtd",
        titulo: "Qtd. checklists de qualidade",
        texto: "Quantidade de Checklist de Qualidade realizados (mínimo 1 checagem mensal, sendo obrigatório 01 medição/mês, realizadas em conjunto entre Cliente e Manserv, com áreas previamente alinhadas através de sorteio).",
        peso: 3,
        bandas: [
          { label: "Igual ou acima de 12", valor: 1 },
          { label: "Igual a 10", valor: 0.75 },
          { label: "Igual a 9", valor: 0.50 },
          { label: "Igual ou abaixo de 8", valor: 0 },
        ],
      },
      {
        id: "qual-checklist-nota",
        titulo: "Nota checklist de qualidade",
        texto: "Resultado do Checklist de Qualidade - Média do resultado das avaliações de Boas Práticas trimestral.",
        peso: 6,
        bandas: [
          { label: "Igual ou acima de 85%", valor: 1 },
          { label: "Entre 84,99% e 80%", valor: 0.75 },
          { label: "Entre 79,99% e 75%", valor: 0.50 },
          { label: "Abaixo de 74,99%", valor: 0 },
        ],
      },
      {
        id: "qual-tempo-espera-higiene",
        titulo: "Tempo de espera para higiene",
        texto: "Tempo Médio de Espera para Higiene.",
        peso: 6,
        bandas: [
          { label: "Tempo médio até 35 minutos", valor: 1 },
          { label: "Tempo médio entre 36 e 40 minutos", valor: 0.75 },
          { label: "Tempo médio entre 41 e 49 minutos", valor: 0.50 },
          { label: "Tempo médio acima de 50 minutos", valor: 0 },
        ],
      },
      {
        id: "qual-tempo-limpeza-terminal",
        titulo: "Tempo de limpeza de quartos",
        texto: "Tempo Médio de Limpeza Terminal de Quartos.",
        peso: 6,
        bandas: [
          { label: "Tempo médio até 20 minutos", valor: 1 },
          { label: "Tempo médio até 25 minutos", valor: 0.75 },
          { label: "Tempo médio até 30 minutos", valor: 0.50 },
          { label: "Tempo médio acima de 35 minutos", valor: 0 },
        ],
      },
      {
        id: "qual-tempo-limpeza-sala-cirurgica",
        titulo: "Concorrente de sala cirúrgica",
        texto: "Tempo Médio de Limpeza Concorrente de Sala Cirúrgica (entre as cirurgias).",
        peso: 6,
        bandas: [
          { label: "Tempo médio até 20 minutos", valor: 1 },
          { label: "Tempo médio até 25 minutos", valor: 0.75 },
          { label: "Tempo médio até 30 minutos", valor: 0.50 },
          { label: "Tempo médio acima de 35 minutos", valor: 0 },
        ],
      },
      {
        id: "qual-satisfacao-cliente",
        titulo: "Satisfação Cliente",
        texto: "Satisfação do Cliente: deve ser utilizado o instrumento do próprio Cliente para monitoramento da Satisfação.",
        peso: 3,
        bandas: [
          { label: "Igual ou acima de 80%", valor: 1 },
          { label: "Entre 79,99% e 75%", valor: 0.75 },
          { label: "Entre 74,99% e 65%", valor: 0.50 },
          { label: "Abaixo de 64,99%", valor: 0 },
        ],
      },
    ],
  },
  {
    id: "gestao",
    nome: "Avaliação da Gestão",
    itens: [
      {
        id: "gestao-inspecao-lideranca",
        titulo: "Inspeção Operacional",
        texto: "Inspeção Operacional - Liderança.",
        peso: 10,
        bandas: [
          { label: "Realizou 3 ou mais inspeções", valor: 1 },
          { label: "Realizou 1 ou 2 inspeções", valor: 0.5 },
          { label: "Não realizou inspeção", valor: 0 },
        ],
      },
      {
        id: "gestao-treinamento-pratico",
        titulo: "Treinamento Prático",
        texto: "Quantidade de Treinamento Prático (EAD e/ou Presencial) realizados - 02 treinamentos por colaborador.",
        peso: 10,
        bandas: [
          { label: "Realizou 2 treinamentos", valor: 1 },
          { label: "Realizou 1 treinamento", valor: 0.5 },
          { label: "Não realizou treinamento", valor: 0 },
        ],
      },
    ],
  },
  {
    id: "ssma",
    nome: "SSMA",
    itens: [
      {
        id: "ssma-pcmso",
        titulo: "PCMSO",
        texto: "PCMSO (Programa de Controle Médico de Saúde Ocupacional) atualizado/em dia.",
        peso: 5,
        bandas: [
          { label: "Possui na Validade", valor: 1 },
          { label: "Não possui ou está Vencido", valor: 0 },
        ],
      },
      {
        id: "ssma-pgr",
        titulo: "PGR",
        texto: "PGR (Programa de Gerenciamento de Riscos) atualizado/em dia.",
        peso: 5,
        bandas: [
          { label: "Possui na Validade", valor: 1 },
          { label: "Não possui ou está Vencido", valor: 0 },
        ],
      },
      {
        id: "ssma-epi-ficha",
        titulo: "Ficha de EPI",
        texto: "Ficha de Registro de EPI dos funcionários em dia.",
        peso: 5,
        bandas: [
          { label: "Possui", valor: 1 },
          { label: "Não possui ou está Desatualizada", valor: 0 },
        ],
      },
      {
        id: "ssma-acidentes",
        titulo: "Acidentes de Trabalho",
        texto: "Quantidade de Acidente de trabalho com pérfuro cortante.",
        peso: 5,
        bandas: [
          { label: "Sem Acidentes", valor: 1 },
          { label: "1 acidente por mês", valor: 0.5 },
          { label: "2 ou mais acidentes por mês", valor: 0 },
        ],
      },
      {
        id: "ssma-doc-tecnica",
        titulo: "Documentação Técnica",
        texto: "Documentação Técnica.",
        peso: 10,
        bandas: [
          { label: "Igual ou acima de 85%", valor: 1 },
          { label: "Entre 84,99% e 80%", valor: 0.75 },
          { label: "Entre 79,99% e 75%", valor: 0.50 },
          { label: "Abaixo de 74,99%", valor: 0 },
        ],
      },
    ],
  },
];

/* ============================================================
   STATE — seleção do usuário por item
   { [itemId]: { bandaIndex: number|null, considerado: boolean } }
============================================================ */
const STORAGE_KEY = "planilha-sla:avaliacoes";
let STATE = {};

function estadoPadraoItem() {
  return { bandaIndex: null, considerado: true };
}

function carregarEstado() {
  STATE = {};
  CATEGORIAS.forEach(cat => {
    cat.itens.forEach(item => {
      STATE[item.id] = estadoPadraoItem();
    });
  });

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(id => {
        if (STATE[id]) STATE[id] = { ...STATE[id], ...parsed[id] };
      });
    }
  } catch (e) {
    console.warn("Não foi possível carregar avaliações salvas:", e);
  }
}

function salvarEstado() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
  } catch (e) {
    console.warn("Não foi possível salvar as avaliações:", e);
  }
}

/* ============================================================
   CLASSIFICAÇÃO FINAL (faixas de pagamento conforme a nota)
============================================================ */
const CLASSIFICACOES = [
  {
    id: "ok",
    faixa: "Igual ou acima de 85%",
    consequencia: "100% do pagamento",
    min: 85,
  },
  {
    id: "warn",
    faixa: "De 84,99% a 80%",
    consequencia: "100% do pagamento + Apresentação de Plano de Ação",
    min: 80,
  },
  {
    id: "bad",
    faixa: "De 79,99% a 75%",
    consequencia: "Desconto de 0,5% do pagamento mensal no mês de medição (se houver recorrência de 3 meses abaixo de 85%)",
    min: 75,
  },
  {
    id: "critical",
    faixa: "Igual ou inferior a 74,99%",
    consequencia: "Desconto de 1% do pagamento, no mês de medição",
    min: -Infinity,
  },
];

function classificar(nota) {
  if (nota === null) return null;
  return CLASSIFICACOES.find(c => nota >= c.min);
}

/* ============================================================
   CÁLCULO
   Um item só entra no cálculo (numerador E denominador) se
   estiver considerado E já tiver uma avaliação selecionada.
   Isso garante que desconsiderar OU ainda não ter avaliado um
   item nunca "puna" a nota — os pesos restantes é que definem
   os 100% da conta.
============================================================ */
function todosItens() {
  return CATEGORIAS.flatMap(cat => cat.itens.map(item => ({ ...item, categoriaId: cat.id })));
}

function calcularResultado(item) {
  const estado = STATE[item.id];
  if (!estado.considerado || estado.bandaIndex === null || estado.bandaIndex === undefined) {
    return null; // não entra no cálculo
  }
  const banda = item.bandas[estado.bandaIndex];
  return item.peso * banda.valor; // pontos percentuais contribuídos
}

function calcularNota(itens) {
  let pesoConsiderado = 0;
  let pontosObtidos = 0;

  itens.forEach(item => {
    const resultado = calcularResultado(item);
    if (resultado !== null) {
      pesoConsiderado += item.peso;
      pontosObtidos += resultado;
    }
  });

  const nota = pesoConsiderado > 0 ? (pontosObtidos / pesoConsiderado) * 100 : null;
  return { nota, pesoConsiderado, pontosObtidos };
}

/* ============================================================
   RENDER — resumo geral (topo da página)
============================================================ */
function renderResumo() {
  const itens = todosItens();
  const { nota, pesoConsiderado } = calcularNota(itens);

  const avaliados = itens.filter(item => {
    const e = STATE[item.id];
    return e.considerado && e.bandaIndex !== null && e.bandaIndex !== undefined;
  }).length;

  const desconsiderados = itens.filter(item => !STATE[item.id].considerado).length;
  const pendentes = itens.length - avaliados - desconsiderados;

  const notaEl = document.getElementById("kpiNotaFinal");
  const notaFootEl = document.getElementById("kpiNotaFinalFoot");
  const notaIconEl = document.getElementById("kpiNotaFinalIcon");

  if (nota === null) {
    notaEl.textContent = "—";
    notaFootEl.textContent = "Nenhum item avaliado ainda";
  } else {
    notaEl.textContent = formatDecimal(nota, 1) + "%";
    const isGood = nota >= 85;
    notaFootEl.innerHTML = `<i class="fa-solid ${isGood ? "fa-circle-check" : "fa-triangle-exclamation"}"></i> Sobre ${formatDecimal(pesoConsiderado, 0)}% de peso considerado`;
    notaIconEl.classList.toggle("icon-green", isGood);
    notaIconEl.classList.toggle("icon-red", !isGood);
  }

  document.getElementById("kpiItensAvaliados").textContent = formatInt(avaliados) + " / " + formatInt(itens.length);
  document.getElementById("kpiItensDesconsiderados").textContent = formatInt(desconsiderados);
  document.getElementById("kpiItensPendentes").textContent = formatInt(pendentes);

  renderClassificacao(nota);
}

/* ============================================================
   RENDER — painel de classificação do pagamento
============================================================ */
function renderClassificacao(nota) {
  const atual = classificar(nota);
  const list = document.getElementById("classificacaoList");
  list.innerHTML = "";

  CLASSIFICACOES.forEach(c => {
    const isAtiva = atual && atual.id === c.id;
    const row = document.createElement("div");
    row.className = "classificacao-row" + (isAtiva ? " ativa" : "");
    row.innerHTML = `
      <span class="classificacao-dot dot-${c.id}"></span>
      <div class="classificacao-texto">
        <strong>${c.faixa}</strong>
        <span>${c.consequencia}</span>
      </div>
      ${isAtiva ? '<span class="classificacao-badge">Faixa atual</span>' : ""}
    `;
    list.appendChild(row);
  });
}

/* ============================================================
   RENDER — uma categoria (painel com tabela de itens)
============================================================ */
function renderCategoria(categoria) {
  const { nota } = calcularNota(categoria.itens);
  const notaBadge = document.getElementById("catNota-" + categoria.id);
  if (notaBadge) {
    notaBadge.textContent = nota === null ? "—" : formatDecimal(nota, 1) + "%";
  }

  categoria.itens.forEach(item => renderItemRow(item));
}

/* ============================================================
   RENDER — uma linha de item (dropdown, resultado, toggle)
============================================================ */
function renderItemRow(item) {
  const estado = STATE[item.id];
  const row = document.getElementById("row-" + item.id);
  if (!row) return;

  row.classList.toggle("row-disabled", !estado.considerado);

  const select = document.getElementById("select-" + item.id);
  select.disabled = !estado.considerado;
  select.value = estado.bandaIndex === null || estado.bandaIndex === undefined ? "" : String(estado.bandaIndex);

  const resultadoEl = document.getElementById("resultado-" + item.id);
  if (!estado.considerado) {
    resultadoEl.innerHTML = `<span class="resultado-tag tag-muted">Desconsiderado</span>`;
  } else if (estado.bandaIndex === null || estado.bandaIndex === undefined) {
    resultadoEl.innerHTML = `<span class="resultado-tag tag-pending">Pendente</span>`;
  } else {
    const banda = item.bandas[estado.bandaIndex];
    const resultado = item.peso * banda.valor;
    const isGood = banda.valor >= 1;
    resultadoEl.innerHTML = `<span class="resultado-tag ${isGood ? "tag-good" : banda.valor > 0 ? "tag-warn" : "tag-bad"}">${formatDecimal(resultado, 2).replace(/,00$/, "")}%</span>`;
  }
}

/* ============================================================
   RENDER — monta o HTML de todas as categorias (uma vez)
============================================================ */
function montarCategorias() {
  const container = document.getElementById("categoriasContainer");
  container.innerHTML = "";

  CATEGORIAS.forEach(categoria => {
    const panel = document.createElement("div");
    panel.className = "panel categoria-panel";
    panel.innerHTML = `
      <div class="panel-header">
        <div>
          <h2>${categoria.nome}</h2>
          <p>${categoria.itens.length} ${categoria.itens.length === 1 ? "item" : "itens"} nesta categoria</p>
        </div>
        <span class="panel-tag"><i class="fa-solid fa-percent"></i> Nota: <span id="catNota-${categoria.id}">—</span></span>
      </div>

      <table class="sla-table">
        <thead>
          <tr>
            <th class="col-item">Item</th>
            <th class="col-pontuacao">Critério de Pontuação</th>
            <th class="col-peso">Peso</th>
            <th class="col-avaliacao">Avaliação</th>
            <th class="col-resultado">Resultado</th>
            <th class="col-considerar">Considerar</th>
          </tr>
        </thead>
        <tbody id="tbody-${categoria.id}"></tbody>
      </table>
    `;
    container.appendChild(panel);

    const tbody = panel.querySelector(`#tbody-${categoria.id}`);
    categoria.itens.forEach(item => {
      const tr = document.createElement("tr");
      tr.id = "row-" + item.id;
      tr.className = "sla-row";

      const opcoes = item.bandas
        .map((banda, idx) => `<option value="${idx}">${banda.label} (${formatDecimal(banda.valor, 2).replace(/,00$/, "")})</option>`)
        .join("");

      const criterios = item.bandas
        .map(banda => `
          <div class="criterio-line">
            <span class="criterio-badge ${classeCriterio(banda.valor)}">${formatDecimal(banda.valor, 2).replace(/,00$/, "")}</span>
            <span class="criterio-label">${banda.label}</span>
          </div>
        `)
        .join("");

      tr.innerHTML = `
        <td class="col-item">
          <div class="item-title-row">
            <span class="item-title">${item.titulo}</span>
            <button type="button" class="info-btn" id="info-btn-${item.id}" aria-label="Ver descrição completa">
              <i class="fa-solid fa-circle-info"></i>
            </button>
          </div>
          <div class="item-popover" id="info-popover-${item.id}">${item.texto}</div>
        </td>
        <td class="col-pontuacao"><div class="criterio-list">${criterios}</div></td>
        <td class="col-peso">${item.peso}%</td>
        <td class="col-avaliacao">
          <select id="select-${item.id}" class="avaliacao-select">
            <option value="">Selecione...</option>
            ${opcoes}
          </select>
        </td>
        <td class="col-resultado" id="resultado-${item.id}"></td>
        <td class="col-considerar">
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-${item.id}" ${STATE[item.id].considerado ? "checked" : ""}>
            <span class="toggle-slider"></span>
          </label>
        </td>
      `;
      tbody.appendChild(tr);

      tr.querySelector(`#info-btn-${item.id}`).addEventListener("click", (e) => {
        e.stopPropagation();
        const popover = document.getElementById(`info-popover-${item.id}`);
        const isOpen = popover.classList.contains("open");
        fecharTodosPopovers();
        if (!isOpen) popover.classList.add("open");
      });

      tr.querySelector(`#info-popover-${item.id}`).addEventListener("click", (e) => {
        e.stopPropagation();
      });

      tr.querySelector(`#select-${item.id}`).addEventListener("change", (e) => {
        const val = e.target.value;
        STATE[item.id].bandaIndex = val === "" ? null : Number(val);
        salvarEstado();
        renderItemRow(item);
        renderCategoria(categoriaDoItem(item.id));
        renderResumo();
      });

      tr.querySelector(`#toggle-${item.id}`).addEventListener("change", (e) => {
        STATE[item.id].considerado = e.target.checked;
        salvarEstado();
        renderItemRow(item);
        renderCategoria(categoriaDoItem(item.id));
        renderResumo();
      });
    });
  });
}

function categoriaDoItem(itemId) {
  return CATEGORIAS.find(cat => cat.itens.some(i => i.id === itemId));
}

function classeCriterio(valor) {
  if (valor >= 0.75) return "crit-good";
  if (valor >= 0.5) return "crit-warn";
  return "crit-bad";
}

function fecharTodosPopovers() {
  document.querySelectorAll(".item-popover.open").forEach(p => p.classList.remove("open"));
}

document.addEventListener("click", fecharTodosPopovers);

/* ============================================================
   RESET
============================================================ */
function reiniciarAvaliacao() {
  const confirmado = window.confirm("Isso vai apagar todas as avaliações preenchidas e voltar tudo ao padrão. Deseja continuar?");
  if (!confirmado) return;

  localStorage.removeItem(STORAGE_KEY);
  carregarEstado();
  document.querySelectorAll(".avaliacao-select").forEach(sel => { sel.value = ""; });
  document.querySelectorAll('input[type="checkbox"][id^="toggle-"]').forEach(chk => { chk.checked = true; });
  renderAll();
}

/* ============================================================
   RENDER ALL
============================================================ */
function renderAll() {
  CATEGORIAS.forEach(cat => cat.itens.forEach(item => renderItemRow(item)));
  CATEGORIAS.forEach(cat => renderCategoria(cat));
  renderResumo();
  updateLastUpdated();
}

/* ============================================================
   BOOTSTRAP DESTA ABA
   Não há fetch de planilha — só monta a estrutura e restaura
   o que estiver salvo no navegador.
============================================================ */
async function bootstrap() {
  hideError();
  carregarEstado();
  montarCategorias();
  renderAll();
  showLoading(false);
}

document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.addEventListener("click", reiniciarAvaliacao);
});

/* Registra esta aba no core do dashboard */
Dashboard.registerPage({ bootstrap });
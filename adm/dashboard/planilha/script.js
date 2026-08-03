/* ============================================================
   ABA: PLANILHA (scorecard de SLA)
   Diferente das outras abas: não vem de planilha do Google
   Sheets — é um formulário interativo. Os itens/categorias/pesos
   ficam fixos aqui no código (fácil de expandir depois).

   As respostas (avaliação selecionada + se o item conta na nota)
   ficam salvas no Firebase Realtime Database, por MÊS, com
   sincronização em tempo real: qualquer pessoa com a página
   aberta vê as mudanças de qualquer outra pessoa quase na hora,
   sem precisar dar refresh.

   Estrutura no banco:
     /avaliacoes/{ano}-{mes com 2 dígitos}/{itemId} = { bandaIndex, considerado }
     /meses/{ano}-{mes com 2 dígitos} = { mes, ano }   (índice p/ o dropdown)

   Lógica da nota final: "desconsiderar" um item COMPENSA em vez
   de PUNIR — o peso dele sai tanto do numerador quanto do
   denominador do cálculo, então os itens restantes preenchem
   proporcionalmente os 100%, em vez de a nota cair porque um
   item ficou de fora. O mesmo vale pra um item ainda pendente
   (sem avaliação escolhida): ele fica de fora até ser respondido.

   Depende dos helpers genéricos definidos em /script.js
   (showLoading, showError, hideError, updateLastUpdated,
   formatInt, formatDecimal, Dashboard).
============================================================ */

/* ============================================================
   FIREBASE — configuração e inicialização
   Carregado dinamicamente via import() direto do CDN, sem
   precisar de build/npm — funciona em qualquer site estático.
============================================================ */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBIbJHq5f-cERGURwEzPucdMPdPPP_moCg",
  authDomain: "dashboardsla-bd042.firebaseapp.com",
  databaseURL: "https://dashboardsla-bd042-default-rtdb.firebaseio.com",
  projectId: "dashboardsla-bd042",
  storageBucket: "dashboardsla-bd042.firebasestorage.app",
  messagingSenderId: "660744454939",
  appId: "1:660744454939:web:3a7d75d36d8980c4f509be",
};

const FIREBASE_SDK_VERSION = "10.12.2";

let db = null;
let fb = {}; // funções do SDK (ref, onValue, set, ...) guardadas aqui após o import

async function initFirebase() {
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`);
  const { getDatabase, ref, onValue, set } = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-database.js`);

  const app = initializeApp(FIREBASE_CONFIG);
  db = getDatabase(app);
  fb = { ref, onValue, set };
}

/* ============================================================
   DADOS — categorias e itens do SLA
   Cada item tem um id estável (usado como chave no banco),
   uma lista de "bandas" (as faixas de pontuação) e um peso (%).
============================================================ */
const CATEGORIAS = [
  {
    id: "operacional",
    nome: "Avaliação Operacional",
    itens: [
      {
        id: "op-limpeza-concorrente",
        titulo: "Limpeza Concorrente",
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
        titulo: "Limpeza Terminal",
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
        titulo: "Qtd. Checklists",
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
        titulo: "Nota Checklist",
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
        titulo: "Tempo de Espera",
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
        titulo: "Tempo de Limpeza",
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
        titulo: "Limpeza Sala Cirúrgica",
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
   MESES — nomes em português para exibição
   Por enquanto o dashboard cobre só o ano de 2026: os 12 meses
   já aparecem no seletor, clicáveis. Não existe "criar mês" —
   selecionar um mês só troca onde os dados são lidos/salvos no
   Firebase; o mês passa a "existir" de fato assim que alguém
   preenche a primeira avaliação nele.
============================================================ */
const ANO_FIXO = 2026;

const MESES_NOMES = {
  1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
  5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
  9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
};

function mesesDoAno() {
  return Object.keys(MESES_NOMES)
    .map(n => Number(n))
    .sort((a, b) => a - b)
    .map(mesNum => ({ mesNum, ano: ANO_FIXO }));
}

function mesKey(mesNum, ano) {
  return `${ano}-${String(mesNum).padStart(2, "0")}`;
}

function labelMes(mesNum, ano) {
  return `${MESES_NOMES[mesNum]} / ${ano}`;
}

/* ============================================================
   ESTADO EM MEMÓRIA
============================================================ */
let mesSelecionado = null;   // {mesNum, ano}
let AVALIACOES = {};         // { [itemId]: {bandaIndex, considerado} } do mês atual
let unsubscribeMesAtual = null;

function estadoPadraoItem() {
  return { bandaIndex: null, considerado: true };
}

function avaliacoesPadrao() {
  const obj = {};
  CATEGORIAS.forEach(cat => cat.itens.forEach(item => { obj[item.id] = estadoPadraoItem(); }));
  return obj;
}

/* ============================================================
   FIREBASE — leitura/escrita
============================================================ */
function selecionarMes(mesNum, ano) {
  mesSelecionado = { mesNum, ano };
  const key = mesKey(mesNum, ano);

  // render otimista com os padrões enquanto aguarda o Firebase responder
  AVALIACOES = avaliacoesPadrao();
  atualizarLabelMes();
  renderMonthDropdown();
  renderAll();
  showLoading(true);

  if (unsubscribeMesAtual) {
    unsubscribeMesAtual();
    unsubscribeMesAtual = null;
  }

  unsubscribeMesAtual = fb.onValue(fb.ref(db, "avaliacoes/" + key), (snapshot) => {
    const salvo = snapshot.val() || {};
    const novo = avaliacoesPadrao();
    Object.keys(salvo).forEach(id => {
      if (novo[id]) novo[id] = { ...novo[id], ...salvo[id] };
    });
    AVALIACOES = novo;
    showLoading(false);
    hideError();
    renderAll();
  }, (err) => {
    console.error("Erro ao ler avaliações do mês:", err);
    showLoading(false);
    showError("Não foi possível conectar ao banco de dados compartilhado. Suas alterações não serão salvas até a conexão ser restabelecida.");
  });
}

function salvarItemNoFirebase(itemId) {
  if (!mesSelecionado) return;
  const key = mesKey(mesSelecionado.mesNum, mesSelecionado.ano);
  fb.set(fb.ref(db, `avaliacoes/${key}/${itemId}`), AVALIACOES[itemId])
    .catch(err => {
      console.error("Erro ao salvar:", err);
      showError("Não foi possível salvar sua alteração. Verifique sua conexão e tente novamente.");
    });
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
  const estado = AVALIACOES[item.id];
  if (!estado || !estado.considerado || estado.bandaIndex === null || estado.bandaIndex === undefined) {
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
   RENDER — seletor de mês (topo da página)
============================================================ */
function atualizarLabelMes() {
  const label = document.getElementById("monthLabel");
  if (label && mesSelecionado) {
    label.textContent = labelMes(mesSelecionado.mesNum, mesSelecionado.ano);
  }
}

function renderMonthDropdown() {
  const dropdown = document.getElementById("monthDropdown");
  if (!dropdown) return;
  dropdown.innerHTML = "";

  mesesDoAno().forEach(({ mesNum, ano }) => {
    const isSelected = mesSelecionado && mesSelecionado.mesNum === mesNum && mesSelecionado.ano === ano;
    const li = document.createElement("li");
    li.textContent = labelMes(mesNum, ano);
    if (isSelected) li.classList.add("selected");
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("monthSelect").classList.remove("open");
      if (!isSelected) selecionarMes(mesNum, ano);
    });
    dropdown.appendChild(li);
  });
}

/* ============================================================
   RENDER — resumo geral (topo da página)
============================================================ */
function renderResumo() {
  const itens = todosItens();
  const { nota, pesoConsiderado } = calcularNota(itens);

  const avaliados = itens.filter(item => {
    const e = AVALIACOES[item.id];
    return e && e.considerado && e.bandaIndex !== null && e.bandaIndex !== undefined;
  }).length;

  const desconsiderados = itens.filter(item => AVALIACOES[item.id] && !AVALIACOES[item.id].considerado).length;
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
  if (!list) return;
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
  const estado = AVALIACOES[item.id];
  if (!estado) return;
  const row = document.getElementById("row-" + item.id);
  if (!row) return;

  row.classList.toggle("row-disabled", !estado.considerado);

  const select = document.getElementById("select-" + item.id);
  select.disabled = !estado.considerado;
  select.value = estado.bandaIndex === null || estado.bandaIndex === undefined ? "" : String(estado.bandaIndex);

  const toggle = document.getElementById("toggle-" + item.id);
  if (toggle) toggle.checked = !!estado.considerado;

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
   RENDER — monta o HTML de todas as categorias (uma vez só;
   os valores em si são atualizados por renderItemRow/renderCategoria)
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
            <input type="checkbox" id="toggle-${item.id}" checked>
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
        AVALIACOES[item.id].bandaIndex = val === "" ? null : Number(val);
        salvarItemNoFirebase(item.id);
        renderItemRow(item);
        renderCategoria(categoriaDoItem(item.id));
        renderResumo();
      });

      tr.querySelector(`#toggle-${item.id}`).addEventListener("change", (e) => {
        AVALIACOES[item.id].considerado = e.target.checked;
        salvarItemNoFirebase(item.id);
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
   RESET (zera o mês atual pra todo mundo)
============================================================ */
function reiniciarAvaliacao() {
  if (!mesSelecionado) return;
  const confirmado = window.confirm(
    `Isso vai apagar as avaliações de ${labelMes(mesSelecionado.mesNum, mesSelecionado.ano)} PARA TODOS os que acessam o dashboard, e voltar tudo ao padrão. Deseja continuar?`
  );
  if (!confirmado) return;

  const key = mesKey(mesSelecionado.mesNum, mesSelecionado.ano);
  fb.set(fb.ref(db, "avaliacoes/" + key), null)
    .catch(err => showError("Não foi possível reiniciar: " + err.message));
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
============================================================ */
async function bootstrap() {
  hideError();
  showLoading(true);

  montarCategorias();

  try {
    await initFirebase();
  } catch (err) {
    console.error("Erro ao conectar ao Firebase:", err);
    showLoading(false);
    showError("Não foi possível conectar ao banco de dados compartilhado. Verifique sua conexão e tente novamente.");
    return;
  }

  const hoje = new Date();
  const mesInicial = hoje.getFullYear() === ANO_FIXO ? hoje.getMonth() + 1 : 1;
  selecionarMes(mesInicial, ANO_FIXO);
}

document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.addEventListener("click", reiniciarAvaliacao);
});

/* Registra esta aba no core do dashboard */
Dashboard.registerPage({ bootstrap });
/* ============================================================
   ABA: RESUMO
   "Resumão" com todos os indicadores e o % de meta atingido em
   cada um, para checagem rápida por um gestor/gerente.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, fetchCSV,
   showLoading, showError, hideError, updateLastUpdated,
   initMonthSelectToggle, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fonte de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  resumo: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkWq-lRndRDv1eGmeOB2ykv92FW5ZSyvToMvmKC3gMkYYXWpFGlMjRvtefawFKNLQePzvWxEGSFrCa/pub?gid=0&single=true&output=csv",
};

const MESES_ORDER = {
  "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Marco": 3, "Abril": 4,
  "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
  "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12,
};

// Faixas de atingimento usadas para colorir a lista.
const LIMIAR_ATINGIDO = 100; // % Meta >= 100 -> meta atingida (verde)
const LIMIAR_ATENCAO = 85;   // % Meta >= 85 e < 100 -> quase lá (laranja), abaixo disso -> vermelho

// Ícone por indicador (procura por trecho do nome, case-insensitive).
// Indicadores não mapeados aqui caem no ícone padrão.
const ICONES_INDICADOR = [
  { match: "concorrente", icon: "fa-chart-pie" },
  { match: "programada", icon: "fa-calendar-check" },
  { match: "higieniz", icon: "fa-broom" },
  { match: "ssma", icon: "fa-shield-halved" },
];
const ICONE_PADRAO = "fa-chart-line";

/* ============================================================
   STATE
============================================================ */
const STATE = {
  dados: [],      // [{ano, mes, indicador, percent}]
  selected: null,  // {mes, ano}
  loaded: false,
};

/* ============================================================
   FETCH & MAP
============================================================ */
function parsePercent(raw) {
  if (!raw) return 0;
  const cleaned = String(raw).trim().replace("%", "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function mapResumo(objs) {
  return objs
    .map(o => ({
      ano: (o.Ano || "").trim(),
      mes: (o["Mês"] || o.Mes || "").trim(),
      indicador: (o.Indicador || "").trim(),
      percent: parsePercent(o["%Meta"] || o["% Meta"]),
    }))
    .filter(r => r.mes && r.ano && r.indicador);
}

async function loadData(bustCache) {
  const resumoText = await fetchCSV(SHEET_URLS.resumo, bustCache);
  STATE.dados = mapResumo(csvToObjects(resumoText));
  STATE.loaded = true;
}

/* ============================================================
   MONTH SELECTION
============================================================ */
function getAvailableMonths() {
  const map = new Map();
  STATE.dados.forEach(r => {
    const key = r.mes + "|" + r.ano;
    if (!map.has(key)) map.set(key, { mes: r.mes, ano: r.ano });
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.ano !== b.ano) return Number(b.ano) - Number(a.ano);
    return (MESES_ORDER[b.mes] || 0) - (MESES_ORDER[a.mes] || 0);
  });
}

function renderMonthDropdown() {
  const dropdown = document.getElementById("monthDropdown");
  const months = getAvailableMonths();
  dropdown.innerHTML = "";

  if (!months.length) {
    dropdown.innerHTML = '<li class="dropdown-empty">Nenhum mês encontrado</li>';
    return;
  }

  const stillValid = STATE.selected && months.some(m => m.mes === STATE.selected.mes && m.ano === STATE.selected.ano);
  if (!stillValid) STATE.selected = months[0];

  months.forEach(m => {
    const li = document.createElement("li");
    const isSelected = m.mes === STATE.selected.mes && m.ano === STATE.selected.ano;
    li.textContent = m.mes + " / " + m.ano;
    if (isSelected) li.classList.add("selected");
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      STATE.selected = { mes: m.mes, ano: m.ano };
      document.getElementById("monthSelect").classList.remove("open");
      renderMonthDropdown();
      renderAll();
    });
    dropdown.appendChild(li);
  });

  document.getElementById("monthLabel").textContent = STATE.selected.mes + " / " + STATE.selected.ano;
}

/* ============================================================
   HELPERS
============================================================ */
function nivelDoPercent(percent) {
  if (percent >= LIMIAR_ATINGIDO) return "ok";
  if (percent >= LIMIAR_ATENCAO) return "warn";
  return "bad";
}

function iconeDoIndicador(nome) {
  const nomeLower = nome.toLowerCase();
  const found = ICONES_INDICADOR.find(i => nomeLower.includes(i.match));
  return found ? found.icon : ICONE_PADRAO;
}

/* ============================================================
   RENDER — KPI cards
============================================================ */
function renderKPIs(lista) {
  const total = lista.length;
  const atingidas = lista.filter(i => i.percent >= LIMIAR_ATINGIDO).length;
  const naoAtingidas = total - atingidas;
  const media = total ? lista.reduce((sum, i) => sum + i.percent, 0) / total : 0;

  document.getElementById("kpiTotal").textContent = formatInt(total);
  document.getElementById("kpiAtingidas").textContent = formatInt(atingidas);
  document.getElementById("kpiNaoAtingidas").textContent = formatInt(naoAtingidas);
  document.getElementById("kpiMedia").textContent = media.toFixed(1).replace(".", ",") + "%";

  const atingidasFoot = document.getElementById("kpiAtingidasFoot");
  atingidasFoot.innerHTML = total
    ? `<i class="fa-solid fa-check"></i> ${((atingidas / total) * 100).toFixed(0)}% dos indicadores`
    : "—";

  const naoAtingidasFoot = document.getElementById("kpiNaoAtingidasFoot");
  naoAtingidasFoot.innerHTML = naoAtingidas
    ? '<i class="fa-solid fa-triangle-exclamation"></i> Requer atenção'
    : '<i class="fa-solid fa-check"></i> Tudo em dia';
}

/* ============================================================
   RENDER — Lista de indicadores (do pior para o melhor)
============================================================ */
function renderLista(lista) {
  const container = document.getElementById("resumoList");
  const countEl = document.getElementById("resumoCount");
  container.innerHTML = "";
  countEl.textContent = lista.length;

  if (!lista.length) {
    container.innerHTML = `<div class="resumo-empty">Nenhum indicador registrado para este período.</div>`;
    return;
  }

  const sorted = [...lista].sort((a, b) => a.percent - b.percent);

  sorted.forEach(item => {
    const nivel = nivelDoPercent(item.percent);
    const largura = Math.min(Math.max(item.percent, 0), 100);
    const badgeLabel = nivel === "ok" ? "Atingida" : nivel === "warn" ? "Quase lá" : "Não atingida";
    const badgeIcon = nivel === "ok" ? "fa-check" : nivel === "warn" ? "fa-triangle-exclamation" : "fa-xmark";

    const row = document.createElement("div");
    row.className = "resumo-row";
    row.innerHTML = `
      <div class="resumo-row-icon resumo-icon-${nivel}">
        <i class="fa-solid ${iconeDoIndicador(item.indicador)}"></i>
      </div>
      <div class="resumo-row-main">
        <div class="resumo-row-top">
          <span class="resumo-row-nome">${item.indicador}</span>
          <span class="resumo-row-percent">${item.percent.toFixed(1).replace(".", ",")}%</span>
        </div>
        <div class="resumo-progress">
          <div class="resumo-progress-fill resumo-progress-${nivel}" style="width:${largura}%"></div>
        </div>
      </div>
      <span class="resumo-row-badge badge-${nivel}">
        <i class="fa-solid ${badgeIcon}"></i> ${badgeLabel}
      </span>
    `;
    container.appendChild(row);
  });
}

/* ============================================================
   RENDER ALL (based on current selected month)
============================================================ */
function renderAll() {
  if (!STATE.selected) return;

  const lista = STATE.dados.filter(r => r.mes === STATE.selected.mes && r.ano === STATE.selected.ano);

  renderKPIs(lista);
  renderLista(lista);
  updateLastUpdated();
}

/* ============================================================
   BOOTSTRAP DESTA ABA
============================================================ */
async function bootstrap(bustCache) {
  hideError();
  try {
    await loadData(bustCache);
    showLoading(false);
    renderMonthDropdown();
    renderAll();
  } catch (err) {
    console.error("Erro ao carregar planilha:", err);
    showLoading(false);
    showError("Não foi possível carregar os dados da planilha. Verifique sua conexão e tente novamente.");
  }
}

/* Registra esta aba no core do dashboard */
Dashboard.registerPage({ bootstrap });
/* ============================================================
   ABA: SSMA
   Lógica específica desta aba: fontes de dados, parsing,
   estado e renderização dos indicadores de conformidade
   (PCMSO, PGR, Ficha de EPI) e do indicador de acidentes com
   perfurocortantes.

   Layout em cards empilhados (um indicador por linha), cada um
   reunindo situação, validade/cobertura e vencimento — sem
   necessidade de gauge percentual ou tabela de registros.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, formatSigned,
   fetchCSV, showLoading, showError, hideError, updateLastUpdated,
   initMonthSelectToggle, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fonte de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  indicadores: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSwMzng33Di1k8-BFpiFf-eq1T4QYgvcccmearIrPlfymvtI9K4oQhTM1vdb4wMpuL5I5cLaxqFPzI/pub?gid=0&single=true&output=csv",
};

const MESES_ORDER = {
  "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Marco": 3, "Abril": 4,
  "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
  "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12,
};

// A validade é tratada como "vencendo em breve" dentro desta janela.
const VENCIMENTO_PROXIMO_DIAS = 60;

/* ============================================================
   STATE
============================================================ */
const STATE = {
  indicadores: [], // ver mapIndicadores() para o formato completo
  selected: null,   // {mes, ano}
  loaded: false,
};

/* ============================================================
   FETCH & MAP
============================================================ */
function isConforme(valor) {
  // "Possui atualizado" -> conforme. Qualquer outra coisa
  // ("Vencido", "Pendente", "Não possui", vazio...) -> não conforme.
  return String(valor || "").trim().toLowerCase().startsWith("possui");
}

function parseValidadeMY(raw) {
  // "07/2028" -> {mes: 7, ano: 2028}
  if (!raw) return null;
  const parts = String(raw).trim().split("/");
  if (parts.length !== 2) return null;
  const mes = parseInt(parts[0], 10);
  const ano = parseInt(parts[1], 10);
  if (!mes || !ano) return null;
  return { mes, ano };
}

function getValidadeInfo(raw, now = new Date()) {
  const parsed = parseValidadeMY(raw);
  if (!parsed) {
    return { level: "unknown", diasLabel: "Sem data de validade informada" };
  }
  // Último dia do mês de validade.
  const expiry = new Date(parsed.ano, parsed.mes, 0);
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  let level = "ok";
  let diasLabel;
  if (diffDays < 0) {
    level = "bad";
    diasLabel = `Venceu há ${formatInt(Math.abs(diffDays))} dia(s)`;
  } else if (diffDays <= VENCIMENTO_PROXIMO_DIAS) {
    level = "warn";
    diasLabel = `Vence em ${formatInt(diffDays)} dia(s)`;
  } else {
    level = "ok";
    diasLabel = `Válido por mais ${formatInt(diffDays)} dia(s)`;
  }

  return { level, diasLabel };
}

function combineLevel(textOk, validadeLevel) {
  if (!textOk) return "bad";
  if (validadeLevel === "bad") return "bad";
  if (validadeLevel === "warn") return "warn";
  return "ok";
}

function getAcidenteStatus(ind) {
  if (!ind.acidentes || ind.acidentes <= 0) {
    return {
      level: "ok",
      badge: "Sem ocorrência",
      classificacao: "Nenhuma ocorrência no período",
    };
  }

  const punitivo = String(ind.acidentePunitivo || "").trim().toLowerCase() === "punitivo";

  if (punitivo) {
    return { level: "bad", badge: "Punitivo", classificacao: "Punitivo" };
  }

  return { level: "warn", badge: "Não punitivo", classificacao: "Não punitivo" };
}

function mapIndicadores(objs) {
  return objs
    .map(o => ({
      ano: (o.Ano || "").trim(),
      mes: (o.Mes || "").trim(),

      pcmso: (o.PCMSO || "").trim(),
      pcmsoValidade: (o.PCMSOValidade || "").trim(),

      pgr: (o.Validade || "").trim(), // situação do PGR (nome de coluna herdado da planilha)
      pgrValidade: (o.PGRValidade || "").trim(),

      fichaEpi: (o["Ficha de EPI"] || "").trim(),
      colaboradores: parseNumberBR(o.Colaboradores),
      qtdFichasEpi: parseNumberBR(o.QTDfichasEPI),

      acidentes: parseNumberBR(o["Acidentes com perfuro"]),
      acidentePunitivo: (o.AcidentePunitivo || "").trim(),
      descricao: (o["Descrição"] || o.Descricao || "").trim(),
    }))
    .filter(r => r.mes && r.ano);
}

async function loadData(bustCache) {
  const indicadoresText = await fetchCSV(SHEET_URLS.indicadores, bustCache);
  STATE.indicadores = mapIndicadores(csvToObjects(indicadoresText));
  STATE.loaded = true;
}

/* ============================================================
   MONTH SELECTION
============================================================ */
function getAvailableMonths() {
  const map = new Map();
  STATE.indicadores.forEach(r => {
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
   RENDER — Cards de conformidade (PCMSO / PGR)
============================================================ */
function renderValidadeCard(prefix, situacao, validadeRaw) {
  const textOk = isConforme(situacao);
  const validadeInfo = getValidadeInfo(validadeRaw);
  const level = combineLevel(textOk, validadeInfo.level);

  const iconEl = document.getElementById(`card${prefix}Icon`);
  const badgeEl = document.getElementById(`card${prefix}Badge`);
  const situacaoEl = document.getElementById(`card${prefix}Situacao`);
  const validadeEl = document.getElementById(`card${prefix}Validade`);
  const vencimentoEl = document.getElementById(`card${prefix}Vencimento`);

  situacaoEl.textContent = situacao || "Não informado";
  validadeEl.textContent = validadeRaw || "—";
  vencimentoEl.textContent = validadeInfo.diasLabel;

  applyItemLevel(iconEl, badgeEl, level, textOk ? "fa-solid fa-check" : "fa-solid fa-xmark");

  return level;
}

/* ============================================================
   RENDER — Card de Ficha de EPI (cobertura de colaboradores)
============================================================ */
function renderFichaEpiCard(ind) {
  const textOk = isConforme(ind.fichaEpi);
  const colaboradores = ind.colaboradores || 0;
  const qtdFichas = ind.qtdFichasEpi || 0;
  const missing = colaboradores - qtdFichas;
  const coveragePct = colaboradores > 0 ? Math.min((qtdFichas / colaboradores) * 100, 100) : 0;

  let coverageLevel = "ok";
  if (missing > 0) coverageLevel = coveragePct >= 80 ? "warn" : "bad";

  const level = combineLevel(textOk, coverageLevel === "ok" ? "ok" : coverageLevel);

  const iconEl = document.getElementById("cardFichaEpiIcon");
  const badgeEl = document.getElementById("cardFichaEpiBadge");
  document.getElementById("cardFichaEpiSituacao").textContent = ind.fichaEpi || "Não informado";
  document.getElementById("cardFichaEpiCobertura").textContent =
    `${formatInt(qtdFichas)} de ${formatInt(colaboradores)} colaboradores (${coveragePct.toFixed(0)}%)`;

  const progressEl = document.getElementById("cardFichaEpiProgress");
  progressEl.style.width = `${coveragePct}%`;
  progressEl.classList.remove("progress-ok", "progress-warn", "progress-bad");
  progressEl.classList.add(`progress-${level}`);

  applyItemLevel(iconEl, badgeEl, level, textOk ? "fa-solid fa-check" : "fa-solid fa-xmark");

  return level;
}

/* ============================================================
   RENDER — Card de Acidentes com perfurocortante
============================================================ */
function renderAcidentesCard(ind) {
  const acidenteStatus = getAcidenteStatus(ind);
  const iconEl = document.getElementById("cardAcidentesIcon");
  const badgeEl = document.getElementById("cardAcidentesBadge");
  const emptyEl = document.getElementById("ocorrenciaEmpty");
  const descricaoEl = document.getElementById("ocorrenciaDescricao");

  document.getElementById("cardAcidentesQtd").textContent = formatInt(ind.acidentes);
  document.getElementById("cardAcidentesClassificacao").textContent = acidenteStatus.classificacao;

  const iconClass = acidenteStatus.level === "bad"
    ? "fa-solid fa-xmark"
    : acidenteStatus.level === "warn"
      ? "fa-solid fa-triangle-exclamation"
      : "fa-solid fa-check";
  applyItemLevel(iconEl, badgeEl, acidenteStatus.level, iconClass);

  if (!ind.acidentes || ind.acidentes <= 0) {
    emptyEl.style.display = "flex";
    descricaoEl.style.display = "none";
  } else {
    emptyEl.style.display = "none";
    descricaoEl.style.display = "block";
    descricaoEl.textContent = ind.descricao || "Nenhuma descrição informada.";
  }

  return acidenteStatus.level;
}

/* ============================================================
   HELPERS DE ESTILO
============================================================ */
function applyItemLevel(iconEl, badgeEl, level, iconClass) {
  iconEl.classList.remove("ssma-item-icon-ok", "ssma-item-icon-warn", "ssma-item-icon-bad");
  iconEl.classList.add(`ssma-item-icon-${level}`);
  iconEl.querySelector("i").className = iconClass;

  badgeEl.classList.remove("badge-ok", "badge-warn", "badge-bad");
  badgeEl.classList.add(`badge-${level}`);
  badgeEl.textContent = level === "ok" ? "Atingido" : level === "warn" ? "Atenção" : "Não atingido";
}

/* ============================================================
   RENDER ALL (based on current selected month)
============================================================ */
function renderAll() {
  if (!STATE.selected) return;

  const ind = STATE.indicadores.find(r => r.mes === STATE.selected.mes && r.ano === STATE.selected.ano);

  if (!ind) {
    showError("Não há dados de indicadores para o período selecionado.");
    return;
  }

  renderValidadeCard("Pcmso", ind.pcmso, ind.pcmsoValidade);
  renderValidadeCard("Pgr", ind.pgr, ind.pgrValidade);
  renderFichaEpiCard(ind);
  renderAcidentesCard(ind);

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
    console.error("Erro ao carregar planilhas:", err);
    showLoading(false);
    showError("Não foi possível carregar os dados das planilhas. Verifique sua conexão e tente novamente.");
  }
}

/* Registra esta aba no core do dashboard */
Dashboard.registerPage({ bootstrap });
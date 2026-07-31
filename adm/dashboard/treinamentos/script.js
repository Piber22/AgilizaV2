/* ============================================================
   ABA: TREINAMENTOS
   Lógica específica desta aba: fontes de dados, parsing,
   estado e renderização dos KPIs, gauge de desempenho e
   tabela de registros por tema abordado.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, formatSigned,
   fetchCSV, showLoading, showError, hideError, updateLastUpdated,
   initMonthSelectToggle, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fontes de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  indicadores: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWRMstOcYLQNsnJXcw8Z8LdOGH13HNvCN2wnj0Rt5lI3f3Vjs0nGBXKjf9GjqraBiH3xpSpj_--0qG/pub?gid=0&single=true&output=csv",
  registros:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWRMstOcYLQNsnJXcw8Z8LdOGH13HNvCN2wnj0Rt5lI3f3Vjs0nGBXKjf9GjqraBiH3xpSpj_--0qG/pub?gid=1346023112&single=true&output=csv",
};

const MESES_ORDER = {
  "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Marco": 3, "Abril": 4,
  "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
  "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12,
};

/* ============================================================
   STATE
============================================================ */
const STATE = {
  indicadores: [],   // [{ano, mes, meta, atingido, difMeta, temasAbordados}]
  registros: [],      // [{ano, mes, tema, colTreinados}]
  selected: null,     // {mes, ano}
  loaded: false,
};

/* ============================================================
   FETCH & MAP
============================================================ */
function mapIndicadores(objs) {
  return objs
    .map(o => ({
      ano: (o.Ano || "").trim(),
      mes: (o.Mes || "").trim(),
      meta: parseNumberBR(o.Meta),
      atingido: parseNumberBR(o.Atingido),
      difMeta: parseNumberBR(o.DifMeta),
      temasAbordados: parseNumberBR(o["Temas abordados"]),
    }))
    .filter(r => r.mes && r.ano);
}

function mapRegistros(objs) {
  return objs
    .map(o => ({
      ano: (o.Ano || "").trim(),
      mes: (o.Mes || "").trim(),
      tema: (o["Tema abordado"] || "").trim(),
      colTreinados: parseNumberBR(o.ColTreinados),
    }))
    .filter(r => r.tema && r.mes && r.ano);
}

async function loadData(bustCache) {
  const [indicadoresText, registrosText] = await Promise.all([
    fetchCSV(SHEET_URLS.indicadores, bustCache),
    fetchCSV(SHEET_URLS.registros, bustCache),
  ]);

  STATE.indicadores = mapIndicadores(csvToObjects(indicadoresText));
  STATE.registros = mapRegistros(csvToObjects(registrosText));
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
   RENDER — KPI cards
============================================================ */
function renderKPIs(ind) {
  document.getElementById("kpiMeta").textContent = formatInt(ind.meta);
  document.getElementById("kpiAtingido").textContent = formatInt(ind.atingido);
  document.getElementById("kpiTemasAbordados").textContent = formatInt(ind.temasAbordados);

  const percentMeta = ind.meta > 0 ? (ind.atingido / ind.meta) * 100 : 0;
  const isPositive = ind.difMeta >= 0;

  const atingidoFoot = document.getElementById("kpiAtingidoFoot");
  const atingidoIcon = document.getElementById("kpiAtingidoIcon");
  atingidoFoot.innerHTML = `<i class="fa-solid ${isPositive ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i> ${percentMeta.toFixed(1).replace(".", ",")}% da meta`;
  atingidoFoot.classList.toggle("positive", isPositive);
  atingidoFoot.classList.toggle("negative", !isPositive);
  atingidoIcon.classList.toggle("icon-green", isPositive);
  atingidoIcon.classList.toggle("icon-red", !isPositive);

  const diffValueEl = document.getElementById("kpiDiff");
  const diffFootEl = document.getElementById("kpiDiffFoot");
  const diffIconEl = document.getElementById("kpiDiffIcon");

  diffValueEl.textContent = formatSigned(ind.difMeta);
  diffValueEl.classList.toggle("positive-text", isPositive);
  diffValueEl.classList.toggle("negative-text", !isPositive);

  diffFootEl.innerHTML = isPositive
    ? '<i class="fa-solid fa-check"></i> Meta superada'
    : '<i class="fa-solid fa-triangle-exclamation"></i> Abaixo da meta';
  diffFootEl.classList.toggle("positive", isPositive);
  diffFootEl.classList.toggle("negative", !isPositive);

  diffIconEl.querySelector("i").className = isPositive ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation";
  diffIconEl.classList.toggle("icon-green", isPositive);
  diffIconEl.classList.toggle("icon-red", !isPositive);
}

/* ============================================================
   RENDER — Gauge (indicador de desempenho)
   Sem um "total previsto" nesta planilha (só Meta e Atingido),
   então a escala do arco é relativa à própria meta — mesmo
   modelo usado no velocímetro de Quantidade da aba Checklists.
   "Mais é melhor" aqui (colaboradores treinados), então a cor
   segue a lógica padrão: verde quando atinge/supera a meta,
   vermelho quando fica abaixo.
============================================================ */
function renderGauge(ind) {
  const percentReal = ind.meta > 0 ? (ind.atingido / ind.meta) * 100 : 0;
  const isOver = ind.atingido >= ind.meta;
  const SCALE_MAX = Math.max(100, Math.ceil((percentReal + 10) / 10) * 10);

  const fillPath = document.getElementById("gaugeFill");
  const overshootPath = document.getElementById("gaugeOvershoot");
  const metaMarker = document.getElementById("gaugeMetaMarker");
  const resultDot = document.getElementById("gaugeResultDot");
  const percentLabel = document.getElementById("gaugePercent");
  const statusBox = document.getElementById("gaugeStatus");
  const statusText = document.getElementById("gaugeStatusText");

  document.getElementById("gaugeMetaValue").textContent = formatInt(ind.meta);
  document.getElementById("gaugeResultValue").textContent = formatInt(ind.atingido);

  const totalLength = fillPath.getTotalLength();
  const metaLength = totalLength * (100 / SCALE_MAX);
  const realLength = totalLength * (Math.min(percentReal, SCALE_MAX) / SCALE_MAX);

  // Marcador de meta: sempre visível na posição real da meta no arco.
  const metaPoint = fillPath.getPointAtLength(metaLength);
  metaMarker.setAttribute("cx", metaPoint.x);
  metaMarker.setAttribute("cy", metaPoint.y);

  if (isOver) {
    const overshootLength = Math.max(realLength - metaLength, 0);
    fillPath.classList.remove("over-cap");
    fillPath.style.strokeDasharray = `${metaLength} ${totalLength}`;
    overshootPath.style.opacity = "1";
    overshootPath.style.strokeDasharray = `${overshootLength} ${totalLength}`;
    overshootPath.style.strokeDashoffset = `-${metaLength}`;
  } else {
    // Abaixo da meta: vermelho até o atingido; o marcador âmbar acima
    // mostra onde a meta fica. Escondemos o excedente (opacity 0) em
    // vez de zerar só o comprimento, porque um traço de comprimento 0
    // com "linecap: round" ainda desenha um pontinho.
    fillPath.classList.add("over-cap");
    fillPath.style.strokeDasharray = `${realLength} ${totalLength}`;
    overshootPath.style.opacity = "0";
    overshootPath.style.strokeDasharray = `0 ${totalLength}`;
  }

  resultDot.classList.toggle("dot-green", isOver);
  resultDot.classList.toggle("dot-red", !isOver);

  statusBox.classList.toggle("negative", !isOver);
  statusText.textContent = isOver
    ? `Meta superada em ${formatInt(Math.abs(ind.atingido - ind.meta))} colaboradores`
    : `Faltam ${formatInt(Math.abs(ind.meta - ind.atingido))} colaboradores para a meta`;
  statusBox.querySelector("i").className = isOver ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation";

  let start = null;
  const duration = 1200;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = percentReal * eased;
    percentLabel.textContent = current.toFixed(1).replace(".", ",") + "%";
    percentLabel.style.color = isOver ? "var(--green)" : "var(--red)";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   RENDER — Tabela de Registros (Tema, Colaboradores, % do total)
============================================================ */
function renderRegistrosTable(registrosDoMes) {
  const body = document.getElementById("registrosBody");
  const countEl = document.getElementById("registrosCount");
  body.innerHTML = "";
  countEl.textContent = registrosDoMes.length;

  if (!registrosDoMes.length) {
    body.innerHTML = `
      <tr>
        <td colspan="3" class="table-empty">Nenhum treinamento registrado neste período.</td>
      </tr>
    `;
    return;
  }

  const total = registrosDoMes.reduce((acc, r) => acc + r.colTreinados, 0);
  const sorted = [...registrosDoMes].sort((a, b) => b.colTreinados - a.colTreinados);

  sorted.forEach(r => {
    const pct = total > 0 ? (r.colTreinados / total) * 100 : 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-tema">${r.tema}</td>
      <td class="col-colaboradores">${formatInt(r.colTreinados)}</td>
      <td class="col-pct">${pct.toFixed(1).replace(".", ",")}%</td>
    `;
    body.appendChild(tr);
  });
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

  const registrosDoMes = STATE.registros.filter(r => r.mes === STATE.selected.mes && r.ano === STATE.selected.ano);

  renderKPIs(ind);
  renderGauge(ind);
  renderRegistrosTable(registrosDoMes);
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
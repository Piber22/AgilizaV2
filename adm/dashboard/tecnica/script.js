/* ============================================================
   ABA: DOCUMENTAÇÃO TÉCNICA
   Lógica específica desta aba: fontes de dados, parsing,
   estado e renderização dos KPIs, gauge geral, barras por
   categoria e tabela detalhada.

   Só existe uma planilha aqui — cada linha já é uma categoria
   de procedimento operacional com sua Meta e quantos documentos
   estão "Possui atualizado" naquele mês.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, formatSigned,
   fetchCSV, showLoading, showError, hideError, updateLastUpdated,
   initMonthSelectToggle, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fonte de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  indicadores: "https://docs.google.com/spreadsheets/d/e/2PACX-1vToTzDLMbEV8qBQbCiLu3wf815VuksQ1ViX6pKmtM24qgZAgzVmCnzfoeCaINd9n_tyE8aETS5K4HLH/pub?gid=0&single=true&output=csv",
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
  indicadores: [],   // [{ano, mes, categoria, meta, possuiAtualizado}] — 1 linha por categoria/mês
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
      categoria: (o.Categoria || "").trim(),
      meta: parseNumberBR(o.Meta),
      possuiAtualizado: parseNumberBR(o["Possui atualizado"]),
    }))
    .filter(r => r.mes && r.ano && r.categoria);
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
   RENDER — KPI cards (agregados de todas as categorias do mês)
============================================================ */
function renderKPIs(categoriasDoMes) {
  const metaTotal = categoriasDoMes.reduce((acc, c) => acc + c.meta, 0);
  const atualizadoTotal = categoriasDoMes.reduce((acc, c) => acc + c.possuiAtualizado, 0);
  const diff = atualizadoTotal - metaTotal;
  const isPositive = diff >= 0;
  const percentMeta = metaTotal > 0 ? (atualizadoTotal / metaTotal) * 100 : 0;

  document.getElementById("kpiCategorias").textContent = formatInt(categoriasDoMes.length);
  document.getElementById("kpiMetaTotal").textContent = formatInt(metaTotal);
  document.getElementById("kpiAtualizado").textContent = formatInt(atualizadoTotal);

  const atualizadoFoot = document.getElementById("kpiAtualizadoFoot");
  const atualizadoIcon = document.getElementById("kpiAtualizadoIcon");
  atualizadoFoot.innerHTML = `<i class="fa-solid ${isPositive ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i> ${percentMeta.toFixed(1).replace(".", ",")}% da meta`;
  atualizadoFoot.classList.toggle("positive", isPositive);
  atualizadoFoot.classList.toggle("negative", !isPositive);
  atualizadoIcon.classList.toggle("icon-green", isPositive);
  atualizadoIcon.classList.toggle("icon-red", !isPositive);

  const diffValueEl = document.getElementById("kpiDiff");
  const diffFootEl = document.getElementById("kpiDiffFoot");
  const diffIconEl = document.getElementById("kpiDiffIcon");

  diffValueEl.textContent = formatSigned(diff);
  diffValueEl.classList.toggle("positive-text", isPositive);
  diffValueEl.classList.toggle("negative-text", !isPositive);

  diffFootEl.innerHTML = isPositive
    ? '<i class="fa-solid fa-check"></i> Meta atingida'
    : '<i class="fa-solid fa-triangle-exclamation"></i> Abaixo da meta';
  diffFootEl.classList.toggle("positive", isPositive);
  diffFootEl.classList.toggle("negative", !isPositive);

  diffIconEl.querySelector("i").className = isPositive ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation";
  diffIconEl.classList.toggle("icon-green", isPositive);
  diffIconEl.classList.toggle("icon-red", !isPositive);

  return { metaTotal, atualizadoTotal, diff, isPositive, percentMeta };
}

/* ============================================================
   RENDER — Gauge (indicador geral de atualização)
   Sem "total previsto", escala relativa à meta agregada
   (mesmo modelo usado em Treinamentos/Inspeções). "Mais é
   melhor" — mais documentos atualizados é sempre bom.
============================================================ */
function renderGauge(metaTotal, atualizadoTotal) {
  const percentReal = metaTotal > 0 ? (atualizadoTotal / metaTotal) * 100 : 0;
  const isOver = atualizadoTotal >= metaTotal;
  const SCALE_MAX = Math.max(101, Math.ceil((percentReal + 0) / 10) * 10);

  const fillPath = document.getElementById("gaugeFill");
  const overshootPath = document.getElementById("gaugeOvershoot");
  const metaMarker = document.getElementById("gaugeMetaMarker");
  const resultDot = document.getElementById("gaugeResultDot");
  const percentLabel = document.getElementById("gaugePercent");
  const statusBox = document.getElementById("gaugeStatus");
  const statusText = document.getElementById("gaugeStatusText");

  document.getElementById("gaugeMetaValue").textContent = formatInt(metaTotal);
  document.getElementById("gaugeResultValue").textContent = formatInt(atualizadoTotal);

  const totalLength = fillPath.getTotalLength();
  const metaLength = totalLength * (100 / SCALE_MAX);
  const realLength = totalLength * (Math.min(percentReal, SCALE_MAX) / SCALE_MAX);

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
    fillPath.classList.add("over-cap");
    fillPath.style.strokeDasharray = `${realLength} ${totalLength}`;
    overshootPath.style.opacity = "0";
    overshootPath.style.strokeDasharray = `0 ${totalLength}`;
  }

  resultDot.classList.toggle("dot-green", isOver);
  resultDot.classList.toggle("dot-red", !isOver);

  statusBox.classList.toggle("negative", !isOver);
  statusText.textContent = isOver
    ? `Meta atingida — ${formatInt(atualizadoTotal)} de ${formatInt(metaTotal)} documentos`
    : `Faltam ${formatInt(Math.abs(metaTotal - atualizadoTotal))} documentos para a meta`;
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
   RENDER — Barras por categoria (% de atualização)
   Ordenado do menor % pro maior, pra destacar primeiro as
   categorias que precisam de atenção.
============================================================ */
function renderCategoriaBarChart(categoriasDoMes) {
  const container = document.getElementById("categoriaChart");
  document.getElementById("categoriaCount").textContent = categoriasDoMes.length;

  const withPct = categoriasDoMes.map(c => ({
    ...c,
    pct: c.meta > 0 ? (c.possuiAtualizado / c.meta) * 100 : 0,
  })).sort((a, b) => a.pct - b.pct);

  container.innerHTML = "";

  if (!withPct.length) {
    container.innerHTML = `<div class="empty-mini">Nenhuma categoria encontrada neste período.</div>`;
    return;
  }

  withPct.forEach(item => {
    const isComplete = item.pct >= 100;
    const barPct = Math.min(item.pct, 100);
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${item.categoria}</span>
      <div class="bar-track">
        <div class="bar-fill ${isComplete ? "" : "incomplete"}" data-pct="${barPct}"></div>
      </div>
      <span class="bar-value ${isComplete ? "positive-text" : "negative-text"}">${item.pct.toFixed(0)}%</span>
    `;
    container.appendChild(row);
  });

  requestAnimationFrame(() => {
    setTimeout(() => {
      container.querySelectorAll(".bar-fill").forEach(el => { el.style.width = el.dataset.pct + "%"; });
    }, 80);
  });
}

/* ============================================================
   RENDER — Tabela detalhada por categoria
============================================================ */
function renderCategoriaTable(categoriasDoMes) {
  const body = document.getElementById("categoriaBody");
  const countEl = document.getElementById("categoriaTableCount");

  const withPct = categoriasDoMes.map(c => ({
    ...c,
    diff: c.possuiAtualizado - c.meta,
    pct: c.meta > 0 ? (c.possuiAtualizado / c.meta) * 100 : 0,
  })).sort((a, b) => a.pct - b.pct);

  countEl.textContent = withPct.length;
  body.innerHTML = "";

  if (!withPct.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">Nenhuma categoria encontrada neste período.</td>
      </tr>
    `;
    return;
  }

  withPct.forEach(item => {
    const isComplete = item.pct >= 100;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-categoria">${item.categoria}</td>
      <td class="col-num">${formatInt(item.meta)}</td>
      <td class="col-num">${formatInt(item.possuiAtualizado)}</td>
      <td class="col-num ${item.diff >= 0 ? "positive-text" : "negative-text"}">${formatSigned(item.diff)}</td>
      <td class="col-num">${item.pct.toFixed(0)}%</td>
      <td class="col-status">
        <span class="status-badge ${isComplete ? "status-ok" : "status-pending"}">
          ${isComplete ? "Completo" : "Incompleto"}
        </span>
      </td>
    `;
    body.appendChild(tr);
  });
}

/* ============================================================
   RENDER ALL (based on current selected month)
============================================================ */
function renderAll() {
  if (!STATE.selected) return;

  const categoriasDoMes = STATE.indicadores.filter(r => r.mes === STATE.selected.mes && r.ano === STATE.selected.ano);

  if (!categoriasDoMes.length) {
    showError("Não há dados de documentação técnica para o período selecionado.");
    return;
  }

  const { metaTotal, atualizadoTotal } = renderKPIs(categoriasDoMes);
  renderGauge(metaTotal, atualizadoTotal);
  renderCategoriaBarChart(categoriasDoMes);
  renderCategoriaTable(categoriasDoMes);
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
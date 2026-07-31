/* ============================================================
   ABA: INSPEÇÕES OPERACIONAIS
   Lógica específica desta aba: fontes de dados, parsing,
   estado e renderização dos KPIs, gauge de desempenho,
   donut de Com/Sem desvios, barras horizontais por categoria
   de desvio e tabela histórica completa.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, formatSigned,
   fetchCSV, showLoading, showError, hideError, updateLastUpdated,
   initMonthSelectToggle, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fontes de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  indicadores: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ18T6IpjqkaFZmxq0fUS_I3kCBvmnl1DJS_a2IL3ps_5dd3u6xMDlBMfMZ1GH2i4AC6PCoB-5F38eL/pub?gid=2084941821&single=true&output=csv",
  registros:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ18T6IpjqkaFZmxq0fUS_I3kCBvmnl1DJS_a2IL3ps_5dd3u6xMDlBMfMZ1GH2i4AC6PCoB-5F38eL/pub?gid=0&single=true&output=csv",
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
  indicadores: [],   // [{ano, mes, meta, realizado, comDesvios, semDesvios}]
  registros: [],      // [{dia, mes, ano, houveDesvio, categoria}]
  selected: null,     // {mes, ano}
  loaded: false,
};

/* ============================================================
   FETCH & MAP
============================================================ */
function parseDateBR(raw) {
  if (!raw) return null;
  const parts = String(raw).trim().split("/");
  if (parts.length !== 3) return null;
  const dia = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10);
  const ano = parseInt(parts[2], 10);
  if (!dia || !mes || !ano) return null;
  return { dia, mes, ano };
}

function mapIndicadores(objs) {
  return objs
    .map(o => ({
      ano: (o.Ano || "").trim(),
      mes: (o.Mes || "").trim(),
      meta: parseNumberBR(o.Meta),
      realizado: parseNumberBR(o.Realizado),
      comDesvios: parseNumberBR(o.ComDesvios),
      semDesvios: parseNumberBR(o.SemDesvios),
    }))
    .filter(r => r.mes && r.ano);
}

function mapRegistros(objs) {
  return objs
    .map(o => {
      const dataRaw = (o.Data || "").trim();
      const parsed = parseDateBR(dataRaw);
      const houveDesvio = (o.HouveDesvio || "").trim().toLowerCase() === "sim";
      return {
        data: dataRaw,
        dia: parsed ? parsed.dia : null,
        mes: parsed ? parsed.mes : null,
        ano: parsed ? parsed.ano : null,
        houveDesvio,
        categoria: houveDesvio ? (o.DesvioCategoria || "").trim() : "",
        sortKey: parsed ? parsed.ano * 10000 + parsed.mes * 100 + parsed.dia : 0,
      };
    })
    .filter(r => r.dia !== null);
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
  document.getElementById("kpiRealizado").textContent = formatInt(ind.realizado);

  const percentMeta = ind.meta > 0 ? (ind.realizado / ind.meta) * 100 : 0;
  const diff = ind.realizado - ind.meta;
  const isPositive = diff >= 0;

  const realizadoFoot = document.getElementById("kpiRealizadoFoot");
  const realizadoIcon = document.getElementById("kpiRealizadoIcon");
  realizadoFoot.innerHTML = `<i class="fa-solid ${isPositive ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i> ${percentMeta.toFixed(1).replace(".", ",")}% da meta`;
  realizadoFoot.classList.toggle("positive", isPositive);
  realizadoFoot.classList.toggle("negative", !isPositive);
  realizadoIcon.classList.toggle("icon-green", isPositive);
  realizadoIcon.classList.toggle("icon-red", !isPositive);

  const diffValueEl = document.getElementById("kpiDiff");
  const diffFootEl = document.getElementById("kpiDiffFoot");
  const diffIconEl = document.getElementById("kpiDiffIcon");

  diffValueEl.textContent = formatSigned(diff);
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

  const percentDesvios = ind.realizado > 0 ? (ind.comDesvios / ind.realizado) * 100 : 0;
  document.getElementById("kpiPercDesvios").textContent = percentDesvios.toFixed(1).replace(".", ",") + "%";
  document.getElementById("kpiPercDesviosFoot").textContent = `${formatInt(ind.comDesvios)} de ${formatInt(ind.realizado)} inspeções`;
}

/* ============================================================
   RENDER — Gauge (indicador de desempenho)
   Sem "total previsto" nesta planilha, escala relativa à meta
   (mesmo modelo usado em Treinamentos). "Mais é melhor" aqui
   (inspeções realizadas), cor segue a lógica padrão.
============================================================ */
function renderGauge(ind) {
  const percentReal = ind.meta > 0 ? (ind.realizado / ind.meta) * 100 : 0;
  const isOver = ind.realizado >= ind.meta;
  const SCALE_MAX = Math.max(150, Math.ceil((percentReal + 20) / 10) * 10);

  const fillPath = document.getElementById("gaugeFill");
  const overshootPath = document.getElementById("gaugeOvershoot");
  const metaMarker = document.getElementById("gaugeMetaMarker");
  const resultDot = document.getElementById("gaugeResultDot");
  const percentLabel = document.getElementById("gaugePercent");
  const statusBox = document.getElementById("gaugeStatus");
  const statusText = document.getElementById("gaugeStatusText");

  document.getElementById("gaugeMetaValue").textContent = formatInt(ind.meta);
  document.getElementById("gaugeResultValue").textContent = formatInt(ind.realizado);

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
    ? `Meta superada em ${formatInt(Math.abs(ind.realizado - ind.meta))} inspeções`
    : `Faltam ${formatInt(Math.abs(ind.meta - ind.realizado))} inspeções para a meta`;
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
   RENDER — Donut Com Desvios x Sem Desvios
============================================================ */
function renderDesviosDonut(ind) {
  const svg = document.getElementById("donutSvg");
  const legend = document.getElementById("donutLegend");
  const totalEl = document.getElementById("donutTotal");
  svg.innerHTML = "";
  legend.innerHTML = "";

  const total = ind.comDesvios + ind.semDesvios;
  const segments = [
    { label: "Com Desvios", qtd: ind.comDesvios, color: "var(--red)" },
    { label: "Sem Desvios", qtd: ind.semDesvios, color: "var(--green)" },
  ];

  const R = 70, CX = 80, CY = 80;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;

  segments.forEach((seg, i) => {
    const fraction = total > 0 ? seg.qtd / total : 0;
    const dash = fraction * CIRC;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", CX);
    circle.setAttribute("cy", CY);
    circle.setAttribute("r", R);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", seg.color);
    circle.setAttribute("stroke-width", "20");
    circle.setAttribute("stroke-dasharray", `0 ${CIRC}`);
    circle.setAttribute("stroke-dashoffset", -offset);
    circle.style.transition = "stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)";
    circle.style.transitionDelay = (i * 0.1) + "s";
    svg.appendChild(circle);

    requestAnimationFrame(() => {
      setTimeout(() => { circle.setAttribute("stroke-dasharray", `${dash} ${CIRC - dash}`); }, 60);
    });

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="dot" style="background:${seg.color}"></span>
      ${seg.label}
      <strong>${formatInt(seg.qtd)} &middot; ${(fraction * 100).toFixed(1).replace(".", ",")}%</strong>
    `;
    legend.appendChild(li);

    offset += dash;
  });

  totalEl.textContent = formatInt(total);
}

/* ============================================================
   RENDER — Barras horizontais: categoria de desvio x quantidade
============================================================ */
function renderCategoriaBarChart(registrosDoMes) {
  const container = document.getElementById("categoriaChart");
  const emptyState = document.getElementById("categoriaEmpty");
  container.innerHTML = "";

  const comDesvio = registrosDoMes.filter(r => r.houveDesvio && r.categoria);
  const counts = new Map();
  comDesvio.forEach(r => {
    counts.set(r.categoria, (counts.get(r.categoria) || 0) + 1);
  });

  const sorted = Array.from(counts.entries())
    .map(([categoria, qtd]) => ({ categoria, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  document.getElementById("categoriaCount").textContent = sorted.length;

  if (!sorted.length) {
    emptyState.style.display = "flex";
    return;
  }
  emptyState.style.display = "none";

  const maxQtd = sorted[0].qtd;

  sorted.forEach(item => {
    const pct = maxQtd > 0 ? (item.qtd / maxQtd) * 100 : 0;
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${item.categoria}</span>
      <div class="bar-track">
        <div class="bar-fill" data-pct="${pct}"></div>
      </div>
      <span class="bar-value">${formatInt(item.qtd)}</span>
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
   RENDER — Tabela de Registros (Data, Houve Desvio, Categoria)
   Filtrada pelo mês selecionado no topo — cada linha é uma
   inspeção individual da planilha de Registros.
============================================================ */
function renderRegistrosTable(registrosDoMes) {
  const body = document.getElementById("historicoBody");
  const countEl = document.getElementById("historicoCount");
  body.innerHTML = "";
  countEl.textContent = registrosDoMes.length;

  if (!registrosDoMes.length) {
    body.innerHTML = `
      <tr>
        <td colspan="3" class="table-empty">Nenhuma inspeção registrada neste período.</td>
      </tr>
    `;
    return;
  }

  const sorted = [...registrosDoMes].sort((a, b) => a.sortKey - b.sortKey);

  sorted.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-periodo">${r.data}</td>
      <td class="col-desvio">
        <span class="desvio-badge ${r.houveDesvio ? "desvio-sim" : "desvio-nao"}">
          ${r.houveDesvio ? "Sim" : "Não"}
        </span>
      </td>
      <td class="col-categoria">${r.categoria || "—"}</td>
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

  const mesNum = MESES_ORDER[STATE.selected.mes];
  const anoNum = Number(STATE.selected.ano);
  const registrosDoMes = STATE.registros.filter(r => r.mes === mesNum && r.ano === anoNum);

  renderKPIs(ind);
  renderGauge(ind);
  renderDesviosDonut(ind);
  renderCategoriaBarChart(registrosDoMes);
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
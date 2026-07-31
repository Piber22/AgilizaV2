/* ============================================================
   ABA: CONCORRENTES
   Lógica específica desta aba: fontes de dados, parsing,
   estado e renderização dos cards/gráficos/tabela/donut.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, formatSigned,
   fetchCSV, showLoading, showError, hideError, updateLastUpdated,
   Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fontes de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  indicadores: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSebyjFO_uw-N-Nx6nEPmetWc1nVI-sW6prImAqHkgV5qpkK1_e7KUYS3YDoNt_Hj1r_nj5TXHugflY/pub?gid=0&single=true&output=csv",
  setores:     "https://docs.google.com/spreadsheets/d/e/2PACX-1vSebyjFO_uw-N-Nx6nEPmetWc1nVI-sW6prImAqHkgV5qpkK1_e7KUYS3YDoNt_Hj1r_nj5TXHugflY/pub?gid=41637754&single=true&output=csv",
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
  indicadores: [],   // [{ano, mes, totalPrevisto, meta85, atingido, difMeta}]
  setores: [],        // [{setor, realizado, mes, ano}]
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
      totalPrevisto: parseNumberBR(o.TotalPrevisto),
      meta85: parseNumberBR(o.Meta85),
      atingido: parseNumberBR(o.Atingido),
      difMeta: parseNumberBR(o.DifMeta),
    }))
    .filter(r => r.mes && r.ano);
}

function mapSetores(objs) {
  return objs
    .map(o => ({
      setor: (o.Setores || "").trim(),
      realizado: parseNumberBR(o.Realizado),
      mes: (o.Mes || "").trim(),
      ano: (o.Ano || "").trim(),
    }))
    .filter(r => r.setor && r.mes && r.ano);
}

async function loadData(bustCache) {
  const [indicadoresText, setoresText] = await Promise.all([
    fetchCSV(SHEET_URLS.indicadores, bustCache),
    fetchCSV(SHEET_URLS.setores, bustCache),
  ]);

  STATE.indicadores = mapIndicadores(csvToObjects(indicadoresText));
  STATE.setores = mapSetores(csvToObjects(setoresText));
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

  // keep current selection if still available, else default to most recent
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
  document.getElementById("kpiTotalPrevisto").textContent = formatInt(ind.totalPrevisto);
  document.getElementById("kpiMeta").textContent = formatInt(ind.meta85);
  document.getElementById("kpiAtingido").textContent = formatInt(ind.atingido);

  const percentMeta = ind.meta85 > 0 ? (ind.atingido / ind.totalPrevisto) * 100 : 0;
  const diff = ind.difMeta !== 0 ? ind.difMeta : (ind.atingido - ind.meta85);
  const isPositive = diff >= 0;

  // Atingido card foot
  const atingidoFoot = document.getElementById("kpiAtingidoFoot");
  const atingidoIcon = document.getElementById("kpiAtingidoIcon");
  atingidoFoot.innerHTML = `<i class="fa-solid ${isPositive ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i> ${percentMeta.toFixed(1).replace(".", ",")}% do total previsto`;
  atingidoFoot.classList.toggle("positive", isPositive);
  atingidoFoot.classList.toggle("negative", !isPositive);
  atingidoIcon.classList.toggle("icon-green", isPositive);
  atingidoIcon.classList.toggle("icon-red", !isPositive);

  // Diff card
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
}

/* ============================================================
   RENDER — Bar chart
============================================================ */
function renderBarChart(sorted, maxQtd) {
  const container = document.getElementById("barChart");
  container.innerHTML = "";
  document.getElementById("setorCount").textContent = sorted.length;

  sorted.forEach((item, idx) => {
    const pct = maxQtd > 0 ? (item.realizado / maxQtd) * 100 : 0;

    const row = document.createElement("div");
    row.className = "bar-row";
    if (idx === 0) row.classList.add("rank-1");
    if (idx === 1) row.classList.add("rank-2");
    if (idx === 2) row.classList.add("rank-3");

    row.innerHTML = `
      <span class="bar-label">${item.setor}</span>
      <div class="bar-track">
        <div class="bar-fill" data-pct="${pct}"></div>
      </div>
      <span class="bar-value">${formatInt(item.realizado)}</span>
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
   RENDER — Ranking table
============================================================ */
function renderRanking(sorted, totalSetores, maxQtd) {
  const body = document.getElementById("rankingBody");
  body.innerHTML = "";
  document.getElementById("rankingCount").textContent = sorted.length;

  sorted.forEach((item, idx) => {
    const pos = idx + 1;
    const pct = totalSetores > 0 ? (item.realizado / totalSetores) * 100 : 0;
    const barPct = maxQtd > 0 ? (item.realizado / maxQtd) * 100 : 0;

    const tr = document.createElement("tr");
    if (pos === 1) tr.classList.add("rank-1");
    if (pos === 2) tr.classList.add("rank-2");
    if (pos === 3) tr.classList.add("rank-3");

    const posBadge = pos <= 3 ? `<i class="fa-solid fa-medal"></i>` : pos;

    tr.innerHTML = `
      <td><span class="pos-badge">${posBadge}</span></td>
      <td>
        <div class="setor-cell">
          <span class="setor-dot"></span>
          ${item.setor}
        </div>
      </td>
      <td class="col-qtd">${formatInt(item.realizado)}</td>
      <td class="col-pct">${pct.toFixed(1).replace(".", ",")}%</td>
      <td>
        <div class="mini-bar-track">
          <div class="mini-bar-fill" data-pct="${barPct}"></div>
        </div>
      </td>
    `;
    body.appendChild(tr);
  });

  requestAnimationFrame(() => {
    setTimeout(() => {
      body.querySelectorAll(".mini-bar-fill").forEach(el => { el.style.width = el.dataset.pct + "%"; });
    }, 120);
  });
}

/* ============================================================
   RENDER — Gauge (indicador de meta)
============================================================ */
function renderGauge(ind) {
  // O arco inteiro representa 0% a 100% do TOTAL PREVISTO.
  // A meta fica marcada no ponto em que ela cai nessa escala (normalmente 85%),
  // e o verde é tudo que passou da meta, até o atingido — por isso o arco
  // preenchido (laranja + verde) sempre bate com o número exibido abaixo dele.
  const percentAtingidoPrevisto = ind.totalPrevisto > 0 ? (ind.atingido / ind.totalPrevisto) * 100 : 0;
  const percentMetaPrevisto = ind.totalPrevisto > 0 ? (ind.meta85 / ind.totalPrevisto) * 100 : 0;
  const isOver = ind.atingido >= ind.meta85;
  // headroom só pro caso raro de atingido ultrapassar o próprio previsto
  const SCALE_MAX = Math.max(100, Math.ceil((percentAtingidoPrevisto + 10) / 10) * 10);

  const fillPath = document.getElementById("gaugeFill");
  const overshootPath = document.getElementById("gaugeOvershoot");
  const percentLabel = document.getElementById("gaugePercent");
  const statusBox = document.getElementById("gaugeStatus");
  const statusText = document.getElementById("gaugeStatusText");

  document.getElementById("gaugeMetaValue").textContent = formatInt(ind.meta85);
  document.getElementById("gaugeResultValue").textContent = formatInt(ind.atingido);

  const totalLength = fillPath.getTotalLength();
  const metaLength = totalLength * (percentMetaPrevisto / SCALE_MAX);
  const realLength = totalLength * (Math.min(percentAtingidoPrevisto, SCALE_MAX) / SCALE_MAX);

  if (isOver) {
    const overshootLength = Math.max(realLength - metaLength, 0);
    fillPath.classList.remove("over-cap");
    fillPath.style.strokeDasharray = `${metaLength} ${totalLength}`;
    overshootPath.style.strokeDasharray = `${overshootLength} ${totalLength}`;
    overshootPath.style.strokeDashoffset = `-${metaLength}`;
  } else {
    // fill only up to actual result (below meta), colored red as warning
    fillPath.classList.add("over-cap");
    fillPath.style.strokeDasharray = `${realLength} ${totalLength}`;
    overshootPath.style.strokeDasharray = `0 ${totalLength}`;
  }

  statusBox.classList.toggle("negative", !isOver);
  statusText.textContent = isOver
    ? `Meta superada em ${formatInt(Math.abs(ind.atingido - ind.meta85))} atividades`
    : `Faltam ${formatInt(Math.abs(ind.meta85 - ind.atingido))} atividades para a meta`;
  statusBox.querySelector("i").className = isOver ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation";

  let start = null;
  const duration = 1200;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = percentAtingidoPrevisto * eased;
    percentLabel.textContent = current.toFixed(1).replace(".", ",") + "%";
    percentLabel.style.color = isOver ? "var(--green)" : "var(--red)";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   RENDER — Donut (distribuição)
============================================================ */
function renderDonut(sorted, totalSetores) {
  const svg = document.getElementById("donutSvg");
  const legend = document.getElementById("donutLegend");
  const totalEl = document.getElementById("donutTotal");
  svg.innerHTML = "";
  legend.innerHTML = "";

  const topN = 5;
  const top = sorted.slice(0, topN);
  const restQtd = sorted.slice(topN).reduce((acc, s) => acc + s.realizado, 0);

  const segments = [...top.map(s => ({ label: s.setor, qtd: s.realizado }))];
  if (restQtd > 0) segments.push({ label: "Outros", qtd: restQtd });

  const colors = ["#ff8a34", "#2fd490", "#4f9bff", "#f4c452", "#e0975a", "#4b4f60"];

  const R = 70, CX = 80, CY = 80;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;

  segments.forEach((seg, i) => {
    const fraction = totalSetores > 0 ? seg.qtd / totalSetores : 0;
    const dash = fraction * CIRC;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", CX);
    circle.setAttribute("cy", CY);
    circle.setAttribute("r", R);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", colors[i % colors.length]);
    circle.setAttribute("stroke-width", "20");
    circle.setAttribute("stroke-dasharray", `0 ${CIRC}`);
    circle.setAttribute("stroke-dashoffset", -offset);
    circle.style.transition = "stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)";
    circle.style.transitionDelay = (i * 0.08) + "s";
    svg.appendChild(circle);

    requestAnimationFrame(() => {
      setTimeout(() => { circle.setAttribute("stroke-dasharray", `${dash} ${CIRC - dash}`); }, 60);
    });

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="dot" style="background:${colors[i % colors.length]}"></span>
      ${seg.label}
      <strong>${(fraction * 100).toFixed(1).replace(".", ",")}%</strong>
    `;
    legend.appendChild(li);

    offset += dash;
  });

  totalEl.textContent = formatInt(totalSetores);
}

/* ============================================================
   RENDER ALL (based on current selected month)
============================================================ */
function renderAll() {
  if (!STATE.selected) return;

  const ind = STATE.indicadores.find(r => r.mes === STATE.selected.mes && r.ano === STATE.selected.ano);
  const setoresFiltered = STATE.setores.filter(r => r.mes === STATE.selected.mes && r.ano === STATE.selected.ano);

  if (!ind) {
    showError("Não há dados de indicadores para o período selecionado.");
    return;
  }

  const sorted = [...setoresFiltered].sort((a, b) => b.realizado - a.realizado);
  const totalSetores = sorted.reduce((acc, s) => acc + s.realizado, 0);
  const maxQtd = sorted.length ? sorted[0].realizado : 0;

  renderKPIs(ind);
  renderBarChart(sorted, maxQtd);
  renderRanking(sorted, totalSetores, maxQtd);
  renderGauge(ind);
  renderDonut(sorted, totalSetores);
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
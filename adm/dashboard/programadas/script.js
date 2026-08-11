/* ============================================================
   ABA: PROGRAMADAS
   Lógica específica desta aba: fontes de dados, parsing,
   estado e renderização dos KPIs, gauge de realização e tabela de recusas.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, formatSigned,
   fetchCSV, showLoading, showError, hideError, updateLastUpdated,
   initMonthSelectToggle, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fontes de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  indicadores:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vRkJSqequDDCLBNv3cgeGBRM77S-VDsE9QtBvjlTfnWu9pxLl7Pj41PWrXHRm4xh5Qlp9lVavfCPoSw/pub?gid=0&single=true&output=csv",
  naoRealizado:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRkJSqequDDCLBNv3cgeGBRM77S-VDsE9QtBvjlTfnWu9pxLl7Pj41PWrXHRm4xh5Qlp9lVavfCPoSw/pub?gid=926253874&single=true&output=csv",
  recusas:       "https://docs.google.com/spreadsheets/d/e/2PACX-1vRkJSqequDDCLBNv3cgeGBRM77S-VDsE9QtBvjlTfnWu9pxLl7Pj41PWrXHRm4xh5Qlp9lVavfCPoSw/pub?gid=985891084&single=true&output=csv",
};

const MESES_ORDER = {
  "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Marco": 3, "Abril": 4,
  "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
  "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12,
};

/* Limiar: ≥85% do previsto já é considerado bom (âmbar), não vermelho */
const THRESHOLD_BOM = 85;

/* ============================================================
   STATE
============================================================ */
const STATE = {
  indicadores: [],    // [{ano, mes, totalPrevisto, atingido, naoRealizadas, recusas, percRecusas, ...}]
  recusas: [],         // [{data, dia, mes, ano, terminal, lideranca, situacao, execucao, sortKey}]
  naoRealizado: [],    // guardado para uso em próximos passos (ainda não exibido)
  selected: null,      // {mes, ano}
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
      totalPrevisto: parseNumberBR(o.TotalPrevisto),
      meta85: parseNumberBR(o.Meta85),
      atingido: parseNumberBR(o.Atingido),
      difMeta: parseNumberBR(o.DifMeta),
      naoRealizadas: parseNumberBR(o.NaoRealizadas),
      recusas: parseNumberBR(o.Recusas),
      percRecusas: parseNumberBR(o.PercRecusas),
    }))
    .filter(r => r.mes && r.ano);
}

function mapRecusas(objs) {
  return objs
    .map(o => {
      const data = (o.DATA || "").trim();
      const parsed = parseDateBR(data);
      return {
        data,
        dia: parsed ? parsed.dia : null,
        mes: parsed ? parsed.mes : null,
        ano: parsed ? parsed.ano : null,
        terminal: (o.TERMINAL || "").trim(),
        lideranca: (o["Liderança"] || o.Lideranca || "").trim(),
        situacao: (o["Situação"] || o.Situacao || "").trim(),
        execucao: (o["Execução"] || o.Execucao || "").trim(),
        sortKey: parsed ? parsed.ano * 10000 + parsed.mes * 100 + parsed.dia : 0,
      };
    })
    .filter(r => r.data && r.terminal);
}

function mapNaoRealizado(objs) {
  return objs
    .map(o => ({
      id: (o.ID || "").trim(),
      data: (o.DATA || "").trim(),
      terminal: (o.TERMINAL || "").trim(),
      lideranca: (o["Liderança"] || o.Lideranca || "").trim(),
    }))
    .filter(r => r.data && r.terminal);
}

async function loadData(bustCache) {
  const [indicadoresText, naoRealizadoText, recusasText] = await Promise.all([
    fetchCSV(SHEET_URLS.indicadores, bustCache),
    fetchCSV(SHEET_URLS.naoRealizado, bustCache),
    fetchCSV(SHEET_URLS.recusas, bustCache),
  ]);

  STATE.indicadores = mapIndicadores(csvToObjects(indicadoresText));
  STATE.naoRealizado = mapNaoRealizado(csvToObjects(naoRealizadoText));
  STATE.recusas = mapRecusas(csvToObjects(recusasText));
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
   Lógica de status baseada no % do total previsto:
   - < 85%  → vermelho (ruim)
   - ≥ 85% e < 100% → laranja/âmbar (bom)
   - ≥ 100% → verde (excelente)
============================================================ */
function getStatusLevel(percent) {
  if (percent >= 100) return "good";      // verde
  if (percent >= THRESHOLD_BOM) return "ok"; // laranja
  return "bad";                            // vermelho
}

function renderKPIs(ind) {
  document.getElementById("kpiTotalPrevisto").textContent = formatInt(ind.totalPrevisto);
  document.getElementById("kpiAtingido").textContent = formatInt(ind.atingido);

  const percentPrevisto = ind.totalPrevisto > 0 ? (ind.atingido / ind.totalPrevisto) * 100 : 0;
  const diff = ind.atingido - ind.totalPrevisto;
  const level = getStatusLevel(percentPrevisto);

  // Card Atingido
  const atingidoFoot = document.getElementById("kpiAtingidoFoot");
  const atingidoIcon = document.getElementById("kpiAtingidoIcon");
  const trendUp = percentPrevisto >= THRESHOLD_BOM;
  atingidoFoot.innerHTML = `<i class="fa-solid ${trendUp ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i> ${percentPrevisto.toFixed(1).replace(".", ",")}% do previsto`;
  atingidoFoot.classList.toggle("positive", level === "good");
  atingidoFoot.classList.toggle("warning", level === "ok");
  atingidoFoot.classList.toggle("negative", level === "bad");
  atingidoIcon.classList.toggle("icon-green", level === "good");
  atingidoIcon.classList.toggle("icon-orange", level === "ok");
  atingidoIcon.classList.toggle("icon-red", level === "bad");

  // Card % do Previsto
  document.getElementById("kpiPercPrevisto").textContent = percentPrevisto.toFixed(1).replace(".", ",") + "%";
  const percIcon = document.getElementById("kpiPercIcon");
  const percFoot = document.getElementById("kpiPercFoot");
  percIcon.classList.toggle("icon-green", level === "good");
  percIcon.classList.toggle("icon-orange", level === "ok");
  percIcon.classList.toggle("icon-red", level === "bad");
  if (level === "good") {
    percFoot.textContent = "Previsto superado";
    percFoot.className = "kpi-foot positive";
  } else if (level === "ok") {
    percFoot.textContent = "Dentro do aceitável (≥85%)";
    percFoot.className = "kpi-foot warning";
  } else {
    percFoot.textContent = "Abaixo de 85% do previsto";
    percFoot.className = "kpi-foot negative";
  }

  // Card Diferença p/ Previsto
  const diffValueEl = document.getElementById("kpiDiff");
  const diffFootEl = document.getElementById("kpiDiffFoot");
  const diffIconEl = document.getElementById("kpiDiffIcon");

  diffValueEl.textContent = formatSigned(diff);
  diffValueEl.classList.toggle("positive-text", level === "good");
  diffValueEl.classList.toggle("warning-text", level === "ok");
  diffValueEl.classList.toggle("negative-text", level === "bad");

  if (level === "good") {
    diffFootEl.innerHTML = '<i class="fa-solid fa-check"></i> Previsto superado';
    diffIconEl.querySelector("i").className = "fa-solid fa-circle-check";
  } else if (level === "ok") {
    diffFootEl.innerHTML = '<i class="fa-solid fa-circle-minus"></i> Próximo do previsto';
    diffIconEl.querySelector("i").className = "fa-solid fa-circle-minus";
  } else {
    diffFootEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Abaixo do previsto';
    diffIconEl.querySelector("i").className = "fa-solid fa-circle-exclamation";
  }
  diffFootEl.classList.toggle("positive", level === "good");
  diffFootEl.classList.toggle("warning", level === "ok");
  diffFootEl.classList.toggle("negative", level === "bad");
  diffIconEl.classList.toggle("icon-green", level === "good");
  diffIconEl.classList.toggle("icon-orange", level === "ok");
  diffIconEl.classList.toggle("icon-red", level === "bad");

  // Cards adicionais desta aba
  document.getElementById("kpiNaoRealizadas").textContent = formatInt(ind.naoRealizadas);
  document.getElementById("kpiRecusas").textContent = formatInt(ind.recusas);
  document.getElementById("kpiPercRecusas").textContent = ind.percRecusas.toFixed(2).replace(".", ",") + "%";
}

/* ============================================================
   RENDER — Gauge (indicador de realização)
   O arco representa 0–100% (ou mais) do TOTAL PREVISTO.
   Marcador fixo em 85% (limiar "bom").
   Cores:
   - < 85%  → vermelho
   - ≥ 85% e < 100% → laranja (bom)
   - ≥ 100% → verde a partir de 100% (overshoot)
============================================================ */
function renderGauge(ind) {
  const percentAtingidoPrevisto = ind.totalPrevisto > 0 ? (ind.atingido / ind.totalPrevisto) * 100 : 0;
  const level = getStatusLevel(percentAtingidoPrevisto);
  const SCALE_MAX = Math.max(100, Math.ceil((percentAtingidoPrevisto + 10) / 10) * 10);

  const fillPath = document.getElementById("gaugeFill");
  const overshootPath = document.getElementById("gaugeOvershoot");
  const thresholdMarker = document.getElementById("gaugeThresholdMarker");
  const resultDot = document.getElementById("gaugeResultDot");
  const percentLabel = document.getElementById("gaugePercent");
  const statusBox = document.getElementById("gaugeStatus");
  const statusText = document.getElementById("gaugeStatusText");

  document.getElementById("gaugeResultValue").textContent = formatInt(ind.atingido);

  const totalLength = fillPath.getTotalLength();
  const thresholdLength = totalLength * (THRESHOLD_BOM / SCALE_MAX);
  const realLength = totalLength * (Math.min(percentAtingidoPrevisto, SCALE_MAX) / SCALE_MAX);
  const full100Length = totalLength * (100 / SCALE_MAX);

  // Marcador do limiar 85% (sempre visível)
  const thresholdPoint = fillPath.getPointAtLength(thresholdLength);
  thresholdMarker.setAttribute("cx", thresholdPoint.x);
  thresholdMarker.setAttribute("cy", thresholdPoint.y);

  // Reset classes de cor do fill
  fillPath.classList.remove("over-cap", "fill-ok");

  if (level === "good") {
    // ≥100%: laranja até 100%, verde no overshoot
    fillPath.style.strokeDasharray = `${full100Length} ${totalLength}`;
    const overshootLength = Math.max(realLength - full100Length, 0);
    overshootPath.style.opacity = "1";
    overshootPath.style.strokeDasharray = `${overshootLength} ${totalLength}`;
    overshootPath.style.strokeDashoffset = `-${full100Length}`;
  } else if (level === "ok") {
    // 85–99%: laranja até o resultado (sem vermelho)
    fillPath.classList.add("fill-ok");
    fillPath.style.strokeDasharray = `${realLength} ${totalLength}`;
    overshootPath.style.opacity = "0";
    overshootPath.style.strokeDasharray = `0 ${totalLength}`;
  } else {
    // <85%: vermelho até o resultado
    fillPath.classList.add("over-cap");
    fillPath.style.strokeDasharray = `${realLength} ${totalLength}`;
    overshootPath.style.opacity = "0";
    overshootPath.style.strokeDasharray = `0 ${totalLength}`;
  }

  resultDot.classList.toggle("dot-green", level === "good");
  resultDot.classList.toggle("dot-orange", level === "ok");
  resultDot.classList.toggle("dot-red", level === "bad");

  statusBox.classList.toggle("negative", level === "bad");
  statusBox.classList.toggle("warning", level === "ok");
  statusBox.classList.toggle("positive", level === "good");

  if (level === "good") {
    statusText.textContent = `Previsto superado em ${formatInt(Math.abs(ind.atingido - ind.totalPrevisto))} atividades`;
    statusBox.querySelector("i").className = "fa-solid fa-circle-check";
  } else if (level === "ok") {
    statusText.textContent = `Bom resultado: faltam ${formatInt(Math.abs(ind.totalPrevisto - ind.atingido))} para 100% do previsto`;
    statusBox.querySelector("i").className = "fa-solid fa-circle-minus";
  } else {
    statusText.textContent = `Abaixo de 85%: faltam ${formatInt(Math.abs(ind.totalPrevisto - ind.atingido))} atividades para o previsto`;
    statusBox.querySelector("i").className = "fa-solid fa-triangle-exclamation";
  }

  const colorMap = { good: "var(--green)", ok: "var(--orange)", bad: "var(--red)" };

  let start = null;
  const duration = 1200;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = percentAtingidoPrevisto * eased;
    percentLabel.textContent = current.toFixed(1).replace(".", ",") + "%";
    percentLabel.style.color = colorMap[level];
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   RENDER — Tabela de Recusas (Data, Terminal, Liderança)
============================================================ */
function renderRecusasTable(recusasDoMes) {
  const body = document.getElementById("recusasBody");
  const countEl = document.getElementById("recusasCount");
  body.innerHTML = "";
  countEl.textContent = recusasDoMes.length;

  if (!recusasDoMes.length) {
    body.innerHTML = `
      <tr>
        <td colspan="3" class="table-empty">Nenhuma recusa registrada neste período.</td>
      </tr>
    `;
    return;
  }

  const sorted = [...recusasDoMes].sort((a, b) => a.sortKey - b.sortKey);

  sorted.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-data">${r.data}</td>
      <td class="col-terminal">${r.terminal}</td>
      <td class="col-lideranca">${r.lideranca || "—"}</td>
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
  const recusasDoMes = STATE.recusas.filter(r => r.mes === mesNum && r.ano === anoNum);

  renderKPIs(ind);
  renderGauge(ind);
  renderRecusasTable(recusasDoMes);
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

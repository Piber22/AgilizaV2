/* ============================================================
   ABA: HIGIENIZAÇÃO DO BLOCO
   Lógica específica desta aba: fontes de dados, parsing,
   estado e renderização dos KPIs, gauge de meta (tempo médio
   x meta de 35min) e tabela de registros de higienização.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, formatSigned,
   fetchCSV, showLoading, showError, hideError, updateLastUpdated,
   initMonthSelectToggle, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fontes de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  indicadores: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ06zSGXV9UD4XxFzY5ssJaX7cFDFHzyiLwG9W_ojuRX2KJ8S-qv3o6r3qhYCvudlLDjsmVz0E8ZO-R/pub?gid=0&single=true&output=csv",
  registros:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ06zSGXV9UD4XxFzY5ssJaX7cFDFHzyiLwG9W_ojuRX2KJ8S-qv3o6r3qhYCvudlLDjsmVz0E8ZO-R/pub?gid=376108377&single=true&output=csv",
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
  indicadores: [],   // [{ano, mes, meta, tempoMedioRaw, tempoMedioMin, registros}]
  registros: [],      // [{ano, mes, data, inicio, fim, tempoExecucao, sortKey}]
  selected: null,     // {mes, ano}
  loaded: false,
};

/* ============================================================
   FETCH & MAP
============================================================ */
function parseDuration(raw) {
  // "00:10:32" -> minutos (float), ex: 10.5333
  if (!raw) return 0;
  const parts = String(raw).trim().split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [h, m, s] = parts;
  return h * 60 + m + s / 60;
}

function formatDurationShort(raw) {
  if (!raw) return "—";
  const parts = String(raw).trim().split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return raw;
  const [h, m, s] = parts;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function formatMinutesSigned(value) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(1).replace(".", ",")} min`;
}

function parseDateTimeBR(raw) {
  if (!raw) return null;
  const [datePart, timePart] = String(raw).trim().split(" ");
  if (!datePart) return null;
  const dparts = datePart.split("/");
  if (dparts.length !== 3) return null;
  const dia = parseInt(dparts[0], 10);
  const mes = parseInt(dparts[1], 10);
  const ano = parseInt(dparts[2], 10);
  if (!dia || !mes || !ano) return null;
  let hora = 0, min = 0, seg = 0;
  if (timePart) {
    const tparts = timePart.split(":");
    hora = parseInt(tparts[0], 10) || 0;
    min = parseInt(tparts[1], 10) || 0;
    seg = parseInt(tparts[2], 10) || 0;
  }
  return { dia, mes, ano, hora, min, seg };
}

function mapIndicadores(objs) {
  return objs
    .map(o => ({
      ano: (o.Ano || "").trim(),
      mes: (o.Mes || "").trim(),
      meta: parseNumberBR(o.Meta),
      tempoMedioRaw: (o.TempoMedio || "").trim(),
      tempoMedioMin: parseDuration(o.TempoMedio),
      registros: parseNumberBR(o.Registros),
    }))
    .filter(r => r.mes && r.ano);
}

function mapRegistros(objs) {
  return objs
    .map(o => {
      const inicio = (o["Data/Hora de Inicio"] || o["Data/Hora de Início"] || "").trim();
      const fim = (o["Data/Hora de Finalizacao"] || o["Data/Hora de Finalização"] || "").trim();
      const parsedInicio = parseDateTimeBR(inicio);
      return {
        ano: (o.Ano || "").trim(),
        mes: (o.Mes || "").trim(),
        data: (o.Data || "").trim(),
        inicio,
        fim,
        tempoExecucao: (o["Tempo de execução"] || o["Tempo de execucao"] || o.TempoExecucao || "").trim(),
        sortKey: parsedInicio
          ? parsedInicio.ano * 100000000 + parsedInicio.mes * 1000000 + parsedInicio.dia * 10000 + parsedInicio.hora * 100 + parsedInicio.min
          : 0,
      };
    })
    .filter(r => r.inicio && r.fim);
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
  document.getElementById("kpiMeta").textContent = formatInt(ind.meta) + " min";
  document.getElementById("kpiTempoMedio").textContent = formatDurationShort(ind.tempoMedioRaw);
  document.getElementById("kpiRegistros").textContent = formatInt(ind.registros);

  const percentMeta = ind.meta > 0 ? (ind.tempoMedioMin / ind.meta) * 100 : 0;
  const isWithinMeta = ind.tempoMedioMin <= ind.meta;
  const diff = ind.meta - ind.tempoMedioMin; // positivo = dentro da meta (sobra), negativo = acima da meta

  const tempoMedioFoot = document.getElementById("kpiTempoMedioFoot");
  const tempoMedioIcon = document.getElementById("kpiTempoMedioIcon");
  tempoMedioFoot.innerHTML = `<i class="fa-solid ${isWithinMeta ? "fa-arrow-trend-down" : "fa-arrow-trend-up"}"></i> ${percentMeta.toFixed(1).replace(".", ",")}% da meta`;
  tempoMedioFoot.classList.toggle("positive", isWithinMeta);
  tempoMedioFoot.classList.toggle("negative", !isWithinMeta);
  tempoMedioIcon.classList.toggle("icon-green", isWithinMeta);
  tempoMedioIcon.classList.toggle("icon-red", !isWithinMeta);

  const diffValueEl = document.getElementById("kpiDiff");
  const diffFootEl = document.getElementById("kpiDiffFoot");
  const diffIconEl = document.getElementById("kpiDiffIcon");

  diffValueEl.textContent = formatMinutesSigned(diff);
  diffValueEl.classList.toggle("positive-text", isWithinMeta);
  diffValueEl.classList.toggle("negative-text", !isWithinMeta);

  diffFootEl.innerHTML = isWithinMeta
    ? '<i class="fa-solid fa-check"></i> Dentro da meta'
    : '<i class="fa-solid fa-triangle-exclamation"></i> Acima da meta';
  diffFootEl.classList.toggle("positive", isWithinMeta);
  diffFootEl.classList.toggle("negative", !isWithinMeta);

  diffIconEl.querySelector("i").className = isWithinMeta ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation";
  diffIconEl.classList.toggle("icon-green", isWithinMeta);
  diffIconEl.classList.toggle("icon-red", !isWithinMeta);
}

/* ============================================================
   RENDER — Gauge (indicador de tempo)
   O arco inteiro representa 0-100%+ da META (tempo limite).
   Se o tempo médio fica dentro da meta, preenchemos em verde
   apenas até o resultado (sobra de tempo até a meta). Se o
   tempo médio ultrapassa a meta, preenchemos em laranja até a
   meta e acrescentamos um excedente em vermelho até o resultado.
============================================================ */
function renderGauge(ind) {
  const percentTempoMeta = ind.meta > 0 ? (ind.tempoMedioMin / ind.meta) * 100 : 0;
  const isWithinMeta = ind.tempoMedioMin <= ind.meta;
  const SCALE_MAX = Math.max(100, Math.ceil((percentTempoMeta + 10) / 10) * 10);

  const fillPath = document.getElementById("gaugeFill");
  const overshootPath = document.getElementById("gaugeOvershoot");
  const metaMarker = document.getElementById("gaugeMetaMarker");
  const resultDot = document.getElementById("gaugeResultDot");
  const percentLabel = document.getElementById("gaugePercent");
  const statusBox = document.getElementById("gaugeStatus");
  const statusText = document.getElementById("gaugeStatusText");

  document.getElementById("gaugeMetaValue").textContent = formatInt(ind.meta) + " min";
  document.getElementById("gaugeResultValue").textContent = formatDurationShort(ind.tempoMedioRaw);

  const totalLength = fillPath.getTotalLength();
  const metaLength = totalLength * (100 / SCALE_MAX);
  const realLength = totalLength * (Math.min(percentTempoMeta, SCALE_MAX) / SCALE_MAX);

  // Marcador de meta: sempre visível na posição real da meta no arco.
  const metaPoint = fillPath.getPointAtLength(metaLength);
  metaMarker.setAttribute("cx", metaPoint.x);
  metaMarker.setAttribute("cy", metaPoint.y);

  if (!isWithinMeta) {
    // Meta ultrapassada: laranja até a meta, vermelho do excedente até o resultado.
    const overshootLength = Math.max(realLength - metaLength, 0);
    fillPath.classList.remove("good-fill");
    fillPath.style.strokeDasharray = `${metaLength} ${totalLength}`;
    overshootPath.classList.add("overshoot-bad");
    overshootPath.style.opacity = "1";
    overshootPath.style.strokeDasharray = `${overshootLength} ${totalLength}`;
    overshootPath.style.strokeDashoffset = `-${metaLength}`;
  } else {
    // Dentro da meta: verde até o resultado; o marcador âmbar acima
    // mostra onde a meta fica. Escondemos o excedente (opacity 0) em
    // vez de zerar só o comprimento, porque um traço de comprimento 0
    // com "linecap: round" ainda desenha um pontinho.
    fillPath.classList.add("good-fill");
    fillPath.style.strokeDasharray = `${realLength} ${totalLength}`;
    overshootPath.classList.remove("overshoot-bad");
    overshootPath.style.opacity = "0";
    overshootPath.style.strokeDasharray = `0 ${totalLength}`;
  }

  resultDot.classList.toggle("dot-green", isWithinMeta);
  resultDot.classList.toggle("dot-red", !isWithinMeta);

  statusBox.classList.toggle("negative", !isWithinMeta);
  const diffAbsMin = Math.abs(ind.meta - ind.tempoMedioMin);
  statusText.textContent = isWithinMeta
    ? `Dentro da meta — margem de ${diffAbsMin.toFixed(1).replace(".", ",")} min`
    : `Acima da meta em ${diffAbsMin.toFixed(1).replace(".", ",")} min`;
  statusBox.querySelector("i").className = isWithinMeta ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation";

  let start = null;
  const duration = 1200;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = percentTempoMeta * eased;
    percentLabel.textContent = current.toFixed(1).replace(".", ",") + "%";
    percentLabel.style.color = isWithinMeta ? "var(--green)" : "var(--red)";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   RENDER — Tabela de Registros (Início, Término, Tempo de execução)
============================================================ */
function renderRegistrosTable(registrosDoMes) {
  const body = document.getElementById("registrosBody");
  const countEl = document.getElementById("registrosCount");
  body.innerHTML = "";
  countEl.textContent = registrosDoMes.length;

  if (!registrosDoMes.length) {
    body.innerHTML = `
      <tr>
        <td colspan="3" class="table-empty">Nenhum registro de higienização neste período.</td>
      </tr>
    `;
    return;
  }

  const sorted = [...registrosDoMes].sort((a, b) => a.sortKey - b.sortKey);

  sorted.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-inicio">${r.inicio}</td>
      <td class="col-fim">${r.fim}</td>
      <td class="col-tempo">${formatDurationShort(r.tempoExecucao)}</td>
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
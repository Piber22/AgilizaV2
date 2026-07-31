/* ============================================================
   ABA: CHECKLISTS DE QUALIDADE
   Lógica específica desta aba: fontes de dados, parsing,
   estado e renderização dos KPIs, dos dois velocímetros
   (Quantidade e Nota) e do ranking por setor.

   Depende dos helpers genéricos definidos em /script.js
   (parseCSV, csvToObjects, parseNumberBR, formatInt, formatSigned,
   formatDecimal, formatSignedDecimal, fetchCSV, showLoading,
   showError, hideError, updateLastUpdated, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Fontes de dados (Google Sheets publicado em CSV)
============================================================ */
const SHEET_URLS = {
  indicadores: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTlYsAoEAuBMBy3J266hhFV-rqxb4p4WylO7ZC2kmefHizsc2r-XEm1TqmnPNYOAm6tDXIsczw5HkO2/pub?gid=0&single=true&output=csv",
  setores:     "https://docs.google.com/spreadsheets/d/e/2PACX-1vTlYsAoEAuBMBy3J266hhFV-rqxb4p4WylO7ZC2kmefHizsc2r-XEm1TqmnPNYOAm6tDXIsczw5HkO2/pub?gid=383880073&single=true&output=csv",
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
  indicadores: [],   // [{ano, mes, metaQtd, qtdAtingido, difMetaQtd, metaResultado, resultadoAtingido, difMetaResultado}]
  setores: [],        // [{ano, mes, setor, checklists, notaMedia}]
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
      metaQtd: parseNumberBR(o.MetaQTD),
      qtdAtingido: parseNumberBR(o.QTDAtingido),
      difMetaQtd: parseNumberBR(o.DifMetaQTD),
      metaResultado: parseNumberBR(o.MetaResultado),
      resultadoAtingido: parseNumberBR(o.ResultadoAtingido),
      difMetaResultado: parseNumberBR(o.DifMetaResultado),
    }))
    .filter(r => r.mes && r.ano);
}

function mapSetores(objs) {
  return objs
    .map(o => ({
      ano: (o.Ano || "").trim(),
      mes: (o.Mes || "").trim(),
      setor: (o.Setor || "").trim(),
      checklists: parseNumberBR(o.Checklists),
      notaMedia: parseNumberBR(o.NotaMedia),
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
   RENDER — KPI cards (2 grupos: Quantidade e Nota)
============================================================ */
function renderKPIsQuantidade(ind) {
  document.getElementById("kpiMetaQtd").textContent = formatInt(ind.metaQtd);
  document.getElementById("kpiQtdAtingido").textContent = formatInt(ind.qtdAtingido);

  const percentMeta = ind.metaQtd > 0 ? (ind.qtdAtingido / ind.metaQtd) * 100 : 0;
  const isPositive = ind.difMetaQtd >= 0;

  const foot = document.getElementById("kpiQtdAtingidoFoot");
  const icon = document.getElementById("kpiQtdAtingidoIcon");
  foot.innerHTML = `<i class="fa-solid ${isPositive ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i> ${percentMeta.toFixed(1).replace(".", ",")}% da meta`;
  foot.classList.toggle("positive", isPositive);
  foot.classList.toggle("negative", !isPositive);
  icon.classList.toggle("icon-green", isPositive);
  icon.classList.toggle("icon-red", !isPositive);

  const diffValueEl = document.getElementById("kpiDifQtd");
  const diffFootEl = document.getElementById("kpiDifQtdFoot");
  const diffIconEl = document.getElementById("kpiDifQtdIcon");

  diffValueEl.textContent = formatSigned(ind.difMetaQtd);
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

function renderKPIsNota(ind) {
  document.getElementById("kpiMetaNota").textContent = formatDecimal(ind.metaResultado, 1);
  document.getElementById("kpiNotaAtingido").textContent = formatDecimal(ind.resultadoAtingido, 1);

  const percentMeta = ind.metaResultado > 0 ? (ind.resultadoAtingido / ind.metaResultado) * 100 : 0;
  const isPositive = ind.difMetaResultado >= 0;

  const foot = document.getElementById("kpiNotaAtingidoFoot");
  const icon = document.getElementById("kpiNotaAtingidoIcon");
  foot.innerHTML = `<i class="fa-solid ${isPositive ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i> ${percentMeta.toFixed(1).replace(".", ",")}% da meta`;
  foot.classList.toggle("positive", isPositive);
  foot.classList.toggle("negative", !isPositive);
  icon.classList.toggle("icon-green", isPositive);
  icon.classList.toggle("icon-red", !isPositive);

  const diffValueEl = document.getElementById("kpiDifNota");
  const diffFootEl = document.getElementById("kpiDifNotaFoot");
  const diffIconEl = document.getElementById("kpiDifNotaIcon");

  diffValueEl.textContent = formatSignedDecimal(ind.difMetaResultado, 1);
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
   RENDER — Velocímetro genérico
   Reaproveita o mesmo desenho usado em Concorrentes/Programadas,
   com o ajuste já corrigido para o cenário "abaixo da meta"
   (marcador de meta sempre visível + sem ponto fantasma).

   ids: prefixo usado para achar os elementos no DOM
   (ex: "Qtd" -> #gaugeFillQtd, #gaugeOvershootQtd, ...)
   meta / atingido: valores brutos
   scaleMax: null = escala dinâmica relativa à meta (sem "total" natural)
             número = escala fixa (ex: 100 para nota, que é 0-100)
   formatValue: função pra formatar o número central do gauge
============================================================ */
function renderGauge(idPrefix, meta, atingido, scaleMax, formatValue) {
  const isOver = atingido >= meta;

  const fillPath = document.getElementById("gaugeFill" + idPrefix);
  const overshootPath = document.getElementById("gaugeOvershoot" + idPrefix);
  const metaMarker = document.getElementById("gaugeMetaMarker" + idPrefix);
  const resultDot = document.getElementById("gaugeResultDot" + idPrefix);
  const percentLabel = document.getElementById("gaugePercent" + idPrefix);
  const statusBox = document.getElementById("gaugeStatus" + idPrefix);
  const statusText = document.getElementById("gaugeStatusText" + idPrefix);

  document.getElementById("gaugeMetaValue" + idPrefix).textContent = formatValue(meta);
  document.getElementById("gaugeResultValue" + idPrefix).textContent = formatValue(atingido);

  let percentReal, SCALE_MAX, percentMetaOfScale;

  if (scaleMax) {
    // escala fixa (ex: nota, que vai naturalmente de 0 a 100)
    SCALE_MAX = scaleMax;
    percentMetaOfScale = meta > 0 ? (meta / scaleMax) * 100 : 0;
    percentReal = atingido > 0 ? (atingido / scaleMax) * 100 : 0;
  } else {
    // escala relativa à meta (sem um "total" natural, ex: quantidade)
    const percentOfMeta = meta > 0 ? (atingido / meta) * 100 : 0;
    SCALE_MAX = Math.max(150, Math.ceil((percentOfMeta + 20) / 10) * 10);
    percentMetaOfScale = 100;
    percentReal = percentOfMeta;
  }

  const totalLength = fillPath.getTotalLength();
  const metaLength = totalLength * (percentMetaOfScale / SCALE_MAX);
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
    ? `Meta superada`
    : `Abaixo da meta`;
  statusBox.querySelector("i").className = isOver ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation";

  // % relativo à meta, exibido no centro do gauge (mesma leitura nos dois casos)
  const percentDaMeta = meta > 0 ? (atingido / meta) * 100 : 0;

  let start = null;
  const duration = 1200;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = percentDaMeta * eased;
    percentLabel.textContent = current.toFixed(1).replace(".", ",") + "%";
    percentLabel.style.color = isOver ? "var(--green)" : "var(--red)";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   RENDER — Ranking por setor (ordenado por nota, não por qtd)
============================================================ */
function renderRankingSetores(sorted) {
  const body = document.getElementById("rankingBody");
  body.innerHTML = "";
  document.getElementById("rankingCount").textContent = sorted.length;

  if (!sorted.length) {
    body.innerHTML = `
      <tr>
        <td colspan="4" class="table-empty">Nenhum checklist registrado neste período.</td>
      </tr>
    `;
    return;
  }

  sorted.forEach((item, idx) => {
    const pos = idx + 1;
    const tr = document.createElement("tr");
    if (pos === 1) tr.classList.add("rank-1");
    if (pos === 2) tr.classList.add("rank-2");
    if (pos === 3) tr.classList.add("rank-3");

    const posBadge = pos <= 3 ? `<i class="fa-solid fa-medal"></i>` : pos;
    const notaOk = item.notaMedia >= item.metaResultado;

    tr.innerHTML = `
      <td><span class="pos-badge">${posBadge}</span></td>
      <td>
        <div class="setor-cell">
          <span class="setor-dot"></span>
          ${item.setor}
        </div>
      </td>
      <td class="col-qtd">${formatInt(item.checklists)}</td>
      <td class="col-nota">
        <div class="nota-cell">
          <span class="nota-value ${notaOk ? "positive-text" : "negative-text"}">${formatDecimal(item.notaMedia, 1)}</span>
          <div class="mini-bar-track">
            <div class="mini-bar-fill ${notaOk ? "" : "below-meta"}" data-pct="${Math.min(item.notaMedia, 100)}"></div>
          </div>
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
   RENDER ALL (based on current selected month)
============================================================ */
function renderAll() {
  if (!STATE.selected) return;

  const ind = STATE.indicadores.find(r => r.mes === STATE.selected.mes && r.ano === STATE.selected.ano);

  if (!ind) {
    showError("Não há dados de indicadores para o período selecionado.");
    return;
  }

  const setoresDoMes = STATE.setores
    .filter(r => r.mes === STATE.selected.mes && r.ano === STATE.selected.ano && r.checklists > 0)
    .map(r => ({ ...r, metaResultado: ind.metaResultado })) // usado pra colorir a nota no ranking
    .sort((a, b) => b.notaMedia - a.notaMedia);

  renderKPIsQuantidade(ind);
  renderKPIsNota(ind);
  renderGauge("Qtd", ind.metaQtd, ind.qtdAtingido, null, formatInt);
  renderGauge("Nota", ind.metaResultado, ind.resultadoAtingido, 100, (n) => formatDecimal(n, 1));
  renderRankingSetores(setoresDoMes);
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
/* ============================================================
   DASHBOARD CORE — compartilhado por TODAS as abas
   Contém: helpers de parsing/CSV, utilitários de formatação,
   UI genérica (loading/erro, seletor de mês, refresh) e o
   "contrato" que cada aba usa para se registrar.

   Cada aba (ex: concorrentes/script.js) deve chamar:
     Dashboard.registerPage({ bootstrap })
   onde bootstrap(bustCache) carrega os dados e renderiza a aba.
============================================================ */

const Dashboard = {
  page: null, // módulo da aba ativa (definido pelo script.js da aba)

  registerPage(pageModule) {
    this.page = pageModule;
  },
};

/* ============================================================
   HELPERS — parsing CSV & números (reutilizados por qualquer aba
   que consuma planilhas do Google Sheets)
============================================================ */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\r") { /* ignore */ }
      else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += char;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => String(cell).trim() !== ""));
}

function csvToObjects(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i] !== undefined ? String(r[i]).trim() : ""; });
    return obj;
  });
}

function parseNumberBR(raw) {
  if (raw === null || raw === undefined) return 0;
  let s = String(raw).trim();
  if (s === "") return 0;
  s = s.replace(/[^0-9.,-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  } else if (s.includes(".")) {
    const parts = s.split(".");
    if (parts.length > 2 || parts[parts.length - 1].length === 3) {
      s = s.replace(/\./g, "");
    }
  }
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

function formatInt(n) {
  return Math.round(n).toLocaleString("pt-BR");
}

function formatDecimal(n, digits) {
  const d = digits === undefined ? 1 : digits;
  return n.toFixed(d).replace(".", ",");
}

function formatSignedDecimal(n, digits) {
  const d = digits === undefined ? 1 : digits;
  const rounded = Number(n.toFixed(d));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "\u2212" : "";
  return sign + Math.abs(rounded).toFixed(d).replace(".", ",");
}

function formatSigned(n) {
  const rounded = Math.round(n);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "\u2212" : "";
  return sign + Math.abs(rounded).toLocaleString("pt-BR");
}

async function fetchCSV(url, bustCache) {
  const finalUrl = bustCache ? url + (url.includes("?") ? "&" : "?") + "_ts=" + Date.now() : url;
  const res = await fetch(finalUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.text();
}

/* ============================================================
   UI — loading / erro (compartilhado por todas as abas)
============================================================ */
function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  const content = document.getElementById("content");
  if (overlay) overlay.classList.toggle("hidden", !show);
  if (content) content.classList.toggle("hidden", show);
}

function showError(message) {
  const banner = document.getElementById("errorBanner");
  const messageEl = document.getElementById("errorMessage");
  if (!banner) return;
  if (messageEl) messageEl.textContent = message;
  banner.classList.add("visible");
}

function hideError() {
  const banner = document.getElementById("errorBanner");
  if (banner) banner.classList.remove("visible");
}

function updateLastUpdated() {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const el = document.getElementById("lastUpdated");
  if (el) el.textContent = "Última atualização: hoje, " + time;
}

/* ============================================================
   UI — seletor de mês (abre/fecha o dropdown do topbar).
   O CONTEÚDO do dropdown (quais meses existem) é responsabilidade
   de cada aba, que deve popular #monthDropdown/#monthLabel.
============================================================ */
function initMonthSelectToggle() {
  const select = document.getElementById("monthSelect");
  if (!select) return;
  select.addEventListener("click", (e) => {
    select.classList.toggle("open");
    e.stopPropagation();
  });
  document.addEventListener("click", () => select.classList.remove("open"));
}

/* ============================================================
   BOOTSTRAP GERAL — delega o carregamento/renderização para a
   aba ativa (registrada via Dashboard.registerPage)
============================================================ */
async function bootstrapDashboard(bustCache) {
  if (!Dashboard.page || typeof Dashboard.page.bootstrap !== "function") {
    console.error("Nenhuma aba registrada em Dashboard.page. Verifique se o script.js da aba foi carregado.");
    return;
  }
  await Dashboard.page.bootstrap(bustCache);
}

function initRefreshButton() {
  const btn = document.getElementById("refreshBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.classList.add("spinning");
    btn.disabled = true;
    await bootstrapDashboard(true);
    btn.classList.remove("spinning");
    btn.disabled = false;
  });
}

function initRetryButton() {
  const btn = document.getElementById("retryBtn");
  if (!btn) return;
  btn.addEventListener("click", () => bootstrapDashboard(true));
}

document.addEventListener("DOMContentLoaded", () => {
  initMonthSelectToggle();
  initRefreshButton();
  initRetryButton();
  showLoading(true);
  bootstrapDashboard(false);
});
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=876524337&single=true&output=csv";

let activities = [];

/* =========================
   BUSCAR DADOS DO SHEETS
========================= */
async function fetchActivities() {
  try {
    const response = await fetch(CSV_URL);
    const data = await response.text();

    const rows = parseCSV(data);

    // remove cabeçalho
    rows.shift();

    activities = rows
      .filter(row => row.length >= 7 && row[1]) // evita linhas vazias
      .map((cols, index) => ({
        id: cols[0] || index,
        date: formatDate(cols[1]),
        name: cols[2],
        responsavel: cols[3],
        status: cols[4],
        execucao: cols[5],
        mes: cols[9]
      }));

    renderCalendar();

  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  }
}

/* =========================
   PARSER CSV (ROBUSTO)
========================= */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let insideQuotes = false;

  for (let char of text) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(current.trim());
      current = "";
    } else if (char === "\n" && !insideQuotes) {
      row.push(current.trim());
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

/* =========================
   FORMATAR DATA
========================= */
function formatDate(dateStr) {
  if (!dateStr) return null;

  // já está no formato ISO
  if (dateStr.includes("-")) return dateStr;

  const parts = dateStr.split("/");

  if (parts.length !== 3) return null;

  const [day, month, year] = parts;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/* =========================
   IDENTIFICAR TURNO
========================= */
function isDayShift(nome) {
  return ["Giovana", "Graciela"].includes(nome);
}

let hideDone = false;

const toggleBtn = document.getElementById("toggleDone");

toggleBtn.addEventListener("click", () => {
  hideDone = !hideDone;

  toggleBtn.innerText = hideDone
    ? "Mostrar concluídas"
    : "Ocultar concluídas";

  renderCalendar();
});

/* =========================
   INICIAR SISTEMA
========================= */
fetchActivities();
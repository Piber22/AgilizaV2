/* ============================================================
   ABA: EVIDÊNCIAS
   Esta aba não consome nenhuma planilha — é só uma vitrine de
   links para as pastas do Drive onde ficam as evidências de
   cada mês, organizadas por ano.

   Depende dos helpers genéricos definidos em /script.js
   (showLoading, showError, hideError, updateLastUpdated,
   initMonthSelectToggle, Dashboard).
============================================================ */

/* ============================================================
   CONFIG — Links das pastas do Drive
   ------------------------------------------------------------
   Preencha aqui o link de cada pasta. Se um mês ainda não tiver
   pasta, deixe a string vazia ("") que o card aparece desabilitado
   automaticamente. Para adicionar um novo ano, basta duplicar um
   dos blocos abaixo com a chave do ano correspondente.
============================================================ */
const EVIDENCIAS_LINKS = {
  "2026": {
    "Janeiro":   "https://drive.google.com/drive/folders/1SSZTVPNZZP4JqrPyDYxSNxU1sygLWMpJ",
    "Fevereiro": "https://drive.google.com/drive/folders/1U1xXtTI635Db4369DdWjBA06iQ6k0vs4?usp=drive_link",
    "Março":     "https://drive.google.com/drive/folders/1NFl8e6r_PECP956HhNeAosPHh3-9Ms9A?usp=drive_link",
    "Abril":     "https://drive.google.com/drive/folders/19iTpK9FepYh2T4Wvm6XX-5uojVib0vfn?usp=drive_link",
    "Maio":      "https://drive.google.com/drive/folders/1nUUOtsNS0Pr54FmZH7yUl-HNG5qNL6XI?usp=drive_link",
    "Junho":     "https://drive.google.com/drive/folders/1zMaCOR04pCStL3Xid33F84PgIW5aVoVp?usp=drive_link",
    "Julho":     "https://drive.google.com/drive/folders/11KRg4pUu6iGBPNuYe684BLJZ94AP2wr7?usp=drive_link",
    "Agosto":    "https://drive.google.com/drive/folders/179--TKepwALvoTF9GskIio5BSPdjtGEg?usp=drive_link",
    "Setembro":  "https://drive.google.com/drive/folders/1eP0EFVcgk49XSeewNbVt1PVu1oIAYK1c?usp=drive_link",
    "Outubro":   "https://drive.google.com/drive/folders/1AIepwtxFqY2ntRuZonYI81w7oxQVow0Z?usp=drive_link",
    "Novembro":  "https://drive.google.com/drive/folders/1zFmSCQ0SLIJlmszgsmJckjjjNUg5owTy?usp=drive_link",
    "Dezembro":  "https://drive.google.com/drive/folders/1QHHvSHWgzmM7a547gXCNjmL7nUJSuSe0?usp=drive_link",
  },
};

/* Ordem de exibição dos cards (não usar "Marco" duplicado aqui). */
const MESES_LISTA = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ============================================================
   STATE
============================================================ */
const STATE = {
  selectedYear: null,
};

/* ============================================================
   YEAR SELECTION
   (reaproveita o mesmo componente/IDs usados como seletor de
   mês nas outras abas — aqui ele representa o ano)
============================================================ */
function getAvailableYears() {
  return Object.keys(EVIDENCIAS_LINKS).sort((a, b) => Number(b) - Number(a));
}

function renderYearDropdown() {
  const dropdown = document.getElementById("monthDropdown");
  const years = getAvailableYears();
  dropdown.innerHTML = "";

  if (!years.length) {
    dropdown.innerHTML = '<li class="dropdown-empty">Nenhum ano cadastrado</li>';
    return;
  }

  if (!STATE.selectedYear || !years.includes(STATE.selectedYear)) {
    STATE.selectedYear = years[0];
  }

  years.forEach(ano => {
    const li = document.createElement("li");
    li.textContent = ano;
    if (ano === STATE.selectedYear) li.classList.add("selected");
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      STATE.selectedYear = ano;
      document.getElementById("monthSelect").classList.remove("open");
      renderYearDropdown();
      renderAll();
    });
    dropdown.appendChild(li);
  });

  document.getElementById("monthLabel").textContent = STATE.selectedYear;
}

/* ============================================================
   RENDER — Cards de meses
============================================================ */
function renderCards() {
  const grid = document.getElementById("evidenciasGrid");
  const linksDoAno = EVIDENCIAS_LINKS[STATE.selectedYear] || {};
  grid.innerHTML = "";

  MESES_LISTA.forEach(mes => {
    const link = (linksDoAno[mes] || "").trim();
    const disponivel = !!link;

    const card = document.createElement(disponivel ? "a" : "div");
    card.className = "evidencia-card" + (disponivel ? "" : " disabled");

    if (disponivel) {
      card.href = link;
      card.target = "_blank";
      card.rel = "noopener";
    }

    card.innerHTML = `
      <div class="evidencia-icon">
        <i class="fa-solid ${disponivel ? "fa-folder-open" : "fa-folder"}"></i>
      </div>
      <div class="evidencia-info">
        <span class="evidencia-mes">${mes}</span>
        <span class="evidencia-status">
          ${disponivel
            ? '<i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir pasta'
            : "Pasta não disponível"}
        </span>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ============================================================
   RENDER ALL
============================================================ */
function renderAll() {
  if (!STATE.selectedYear) return;
  document.getElementById("evidenciasAno").textContent = STATE.selectedYear;
  renderCards();
  updateLastUpdated();
}

/* ============================================================
   BOOTSTRAP DESTA ABA
   (não há planilha para buscar, então só preparamos a UI)
============================================================ */
async function bootstrap() {
  hideError();
  try {
    showLoading(false);
    renderYearDropdown();
    renderAll();
  } catch (err) {
    console.error("Erro ao preparar a aba de evidências:", err);
    showLoading(false);
    showError("Não foi possível carregar as pastas de evidências.");
  }
}

/* Registra esta aba no core do dashboard */
Dashboard.registerPage({ bootstrap });
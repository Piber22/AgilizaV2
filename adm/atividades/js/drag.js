/* =========================
   CONTROLE GLOBAL
========================= */
let undoStack = null;

const undoBtn = document.getElementById("undoBtn");

let draggedActivityId = null;
let dropDate = null;

/* =========================
   DRAG START
========================= */
document.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("activity")) {
    draggedActivityId = e.target.dataset.id;
  }
});

/* =========================
   DRAG OVER
========================= */
document.addEventListener("dragover", (e) => {
  if (e.target.closest(".day")) {
    e.preventDefault();
  }
});

/* =========================
   DROP (abre modal)
========================= */
document.addEventListener("drop", (e) => {
  const dayEl = e.target.closest(".day");
  if (!dayEl) return;

  dropDate = dayEl.dataset.date;

  preencherModal();
  openModal();
});

/* =========================
   MODAL ELEMENTOS
========================= */
const modal = document.getElementById("turnoModal");
const btnManter = document.getElementById("manterTurno");
const btnInverter = document.getElementById("inverterTurno");
const btnClose = document.getElementById("closeModal");

const modalActivityName = document.getElementById("modalActivityName");
const modalShift = document.getElementById("modalShift");

/* =========================
   ABRIR / FECHAR
========================= */
function openModal() {
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");

  draggedActivityId = null;
  dropDate = null;
}

/* =========================
   PREENCHER MODAL
========================= */
function preencherModal() {
  const activity = activities.find(a => a.id == draggedActivityId);
  if (!activity) return;

  // Nome da atividade
  modalActivityName.textContent = activity.name || "Sem nome";

  // Turno atual
  const isDia = isDayShift(activity.responsavel);

  modalShift.textContent = isDia ? "Dia" : "Noite";

  modalShift.classList.remove("shift-dia", "shift-noite");
  modalShift.classList.add(isDia ? "shift-dia" : "shift-noite");
}

/* =========================
   FECHAR NO X
========================= */
btnClose.addEventListener("click", closeModal);

/* =========================
   AÇÕES DO MODAL
========================= */
btnManter.addEventListener("click", () => {
  atualizarAtividade(false);
  closeModal();
});

btnInverter.addEventListener("click", () => {
  atualizarAtividade(true);
  closeModal();
});

/* =========================
   LÓGICA PRINCIPAL
========================= */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxOHRGBS_TGhmqXQ_QBx4wFaabphoo06ZtMT8dLu39Yn_SwKMAd9lswal9SQf8rSD0GxQ/exec"; // colar a URL do passo 2

function atualizarAtividade(inverter) {
  const activity = activities.find(a => a.id == draggedActivityId);
  if (!activity) return;

     undoStack = {
    id: activity.id,
    date: activity.date,
    responsavel: activity.responsavel
  };

  undoBtn.disabled = false;
  const responsaveis = getResponsaveisByDate(dropDate);
  const eraDia = isDayShift(activity.responsavel);

  let novoResponsavel;
  if (inverter) {
    novoResponsavel = eraDia ? responsaveis.noite[0] : responsaveis.dia[0];
  } else {
    novoResponsavel = eraDia ? responsaveis.dia[0] : responsaveis.noite[0];
  }

  activity.date = dropDate;
  activity.responsavel = novoResponsavel;

  // Atualiza na planilha
  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      id: activity.id,
      newDate: dropDate,   // formato YYYY-MM-DD
      responsavel: novoResponsavel
    })
  })
  .then(r => r.json())
  .then(res => {
    if (!res.success) console.error("Erro ao salvar:", res.error);
  })
  .catch(err => console.error("Falha na requisição:", err));

  renderCalendar();
}
undoBtn.addEventListener("click", () => {
  if (!undoStack) return;

  const activity = activities.find(a => a.id == undoStack.id);
  if (!activity) return;

  activity.date = undoStack.date;
  activity.responsavel = undoStack.responsavel;

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      id: undoStack.id,
      newDate: undoStack.date,
      responsavel: undoStack.responsavel
    })
  });

  undoStack = null;
  undoBtn.disabled = true;
  renderCalendar();
});

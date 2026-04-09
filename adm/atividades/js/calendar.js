const calendarEl = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");

let currentDate = new Date(2026, 2); // março 2026

function getResponsaveisByDate(dateStr) {
  const dayActs = activities.filter(a => a.date === dateStr);

  const dia = new Set();
  const noite = new Set();

  dayActs.forEach(act => {
    if (isDayShift(act.responsavel)) {
      dia.add(act.responsavel);
    } else {
      noite.add(act.responsavel);
    }
  });

  return {
    dia: [...dia],
    noite: [...noite]
  };
}

function renderCalendar() {
  calendarEl.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  monthTitle.innerText = firstDay.toLocaleString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  // 🔥 AJUSTE IMPORTANTE (segunda = 0)
  const startDay = (firstDay.getDay() + 6) % 7;

  /* =========================
     ESPAÇOS INICIAIS (alinhamento)
  ========================= */
  for (let i = 0; i < startDay; i++) {
    const emptyEl = document.createElement("div");
    emptyEl.classList.add("empty");
    calendarEl.appendChild(emptyEl);
  }

  /* =========================
     DIAS DO MÊS
  ========================= */
  for (let day = 1; day <= lastDay.getDate(); day++) {

    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    const dayEl = document.createElement("div");
    dayEl.classList.add("day");
    dayEl.dataset.date = dateStr;

    const responsaveis = getResponsaveisByDate(dateStr);

    /* =========================
       HEADER DO DIA
    ========================= */
    dayEl.innerHTML = `
      <div class="day-header">
        <div class="day-number">${day}</div>
        <div class="day-responsaveis">
          <span class="dia">${responsaveis.dia.join(", ") || "-"}</span>
          <span class="noite">${responsaveis.noite.join(", ") || "-"}</span>
        </div>
      </div>
    `;

    /* =========================
       ATIVIDADES DO DIA
    ========================= */
    const dayActivities = activities
      .filter(a => a.date === dateStr)
      .filter(a => {
        if (!hideDone) return true;
        return !(a.status && a.status.toLowerCase() === "feito");
      })
      .sort((a, b) => {
        const aDay = isDayShift(a.responsavel) ? 0 : 1;
        const bDay = isDayShift(b.responsavel) ? 0 : 1;
        return aDay - bDay;
      });

    /* =========================
       RENDER DAS ATIVIDADES
    ========================= */
    dayActivities.forEach(act => {
      const actEl = document.createElement("div");
      actEl.classList.add("activity");


      // turno
      actEl.classList.add(
        isDayShift(act.responsavel) ? "day-shift" : "night-shift"
      );

      // status (feito)
      if (act.status && act.status.toLowerCase() === "feito") {
        actEl.classList.add("done");
      }

      actEl.draggable = true;
      actEl.dataset.id = act.id;

      actEl.innerText = act.name;

      dayEl.appendChild(actEl);
    });

    calendarEl.appendChild(dayEl);
  }
}



renderCalendar();

document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});
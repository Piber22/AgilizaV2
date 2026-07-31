/* ============================================================
   NAV COMPARTILHADA — fonte única da sidebar
   Usado por TODAS as páginas (uma por aba).

   Como funciona:
   - Cada página (index.html de cada aba) tem:
       <body data-page="chave-da-aba">
       ...
       <ul class="nav-list" id="navList"></ul>
   - Este arquivo lê data-page do <body> e monta o menu aqui,
     marcando como "active" o item cuja "key" bate com data-page.

   Para adicionar uma aba nova no menu:
   - Adicione um item no array NAV_ITEMS abaixo (isso já a
     coloca no menu de TODAS as páginas, sem precisar editar
     nenhum outro HTML).
   - Quando a página daquela aba existir de fato, aponte o
     "href" para ela e dê a ela um <body data-page="a-mesma-key">.
   - Enquanto a aba não estiver pronta, deixe o href apontando
     para "../em-breve/index.html" (página de "em construção"
     compartilhada — NÃO usar "../programadas/", que já é uma
     aba real com dashboard próprio).
============================================================ */

const NAV_ITEMS = [
  { key: "concorrentes", label: "Concorrentes",              icon: "fa-bucket",   href: "../concorrentes/index.html" },
  { key: "programadas",  label: "Programadas",                icon: "fa-calendar-days",    href: "../programadas/index.html" },
  { key: "checklists",   label: "Checklists de qualidade",    icon: "fa-clipboard-check",   href: "../checklists/index.html" },
  { key: "bloco",        label: "Higienização do bloco",      icon: "fa-broom",             href: "../bloco/index.html" },
  { key: "treinamentos", label: "Treinamentos",              icon: "fa-graduation-cap",    href: "../treinamentos/index.html" },
  { key: "inspecoes",    label: "Inspeções operacionais",     icon: "fa-magnifying-glass",  href: "../inspecoes/index.html" },
  { key: "ssma",         label: "SSMA",                       icon: "fa-shield-halved",     href: "../ssma/index.html" },
  { key: "doctecnica",   label: "Documentação técnica",       icon: "fa-file-lines",        href: "../tecnica/index.html" },
  { key: "resumo",       label: "Resumo",                     icon: "fa-clipboard-list",            href: "../resumo/index.html" },
  { key: "evidencias",   label: "Evidências",                 icon: "fa-camera",            href: "../evidencias/index.html" },
  { key: "planilha",     label: "Planilha",                    icon: "fa-table-list",        href: "../planilha/index.html" },
];

function renderSidebarNav() {
  const list = document.getElementById("navList");
  if (!list) return;

  const activeKey = document.body.dataset.page || "";
  list.innerHTML = "";

  NAV_ITEMS.forEach(item => {
    const isActive = item.key === activeKey;

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.href;
    a.className = "nav-item" + (isActive ? " active" : "");
    a.dataset.tooltip = item.label;

    a.innerHTML = `
      <i class="fa-solid ${item.icon}"></i>
      <span>${item.label}</span>
      ${isActive ? '<span class="active-bar"></span>' : ""}
    `;

    li.appendChild(a);
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", renderSidebarNav);
// =============================================
//  SETORES.JS — v3
//  • 4 colunas: Colaboradores(Graciela) | Setores-Graciela | Setores-Alisson | Colaboradores(Alisson)
//  • Cada coluna de setores lista os 12 setores; sem ninguém alocado = VAGA (vermelho)
//  • Arraste ou clique para atribuir — 1 setor por pessoa
//  • Permanente: salvo junto do state principal (Firebase)
// =============================================

import { state, TEAM_CONFIG, firstName, saveState, logAction } from './equipes-core.js';

// ─── CONFIG ──────────────────────────────────
const SETORES_LIST = [
    '5PL', '5GR', 'UTI', '4A', '4B', '3º', '2º', 'BLOCO',
    'MENTAL FEM.', 'MENTAL MASC.', 'T.INT', 'T.ADM', 'ROUPARIA', 'R1', 'R2'
];

// Times exibidos nesta aba, na ordem desejada
const TIMES_EXIBIDOS = ['graciela', 'giovana'];

let setorDrag      = null;
let setorCtxTarget = null;

// ─── RENDER PRINCIPAL ────────────────────────
export function renderSetores() {
    const container = document.getElementById('setores-board');
    if (!container) return;
    mountSetorCtxMenu();
    container.innerHTML = '';

    const [equipeA, equipeB] = TIMES_EXIBIDOS;
    container.appendChild(buildSourceColumn(equipeA));
    container.appendChild(buildTeamSetorColumn(equipeA));
    container.appendChild(buildTeamSetorColumn(equipeB));
    container.appendChild(buildSourceColumn(equipeB));
}

function getMembersOf(teamKey) {
    return (state[teamKey] || []).filter(m =>
        m.tipo === 'colaborador' || m.tipo === 'demissao'
    );
}

function findMember(id) {
    for (const teamKey of TIMES_EXIBIDOS) {
        const m = (state[teamKey] || []).find(mb => mb.id === id);
        if (m) return { member: m, teamKey };
    }
    return null;
}

function setMemberSetor(id, setor) {
    const found = findMember(id);
    if (!found) return;
    found.member.setor = setor;
    saveState();
    logAction('setor_alterado', { nome: found.member.nome, equipe: found.teamKey, setor });
}

// ─── COLUNA DE ORIGEM (colaboradores) ────────
function buildSourceColumn(teamKey) {
    const cfg      = TEAM_CONFIG[teamKey];
    const members  = getMembersOf(teamKey);
    const comSetor = members.filter(m => m.setor).length;

    const col = document.createElement('div');
    col.className    = 'dim-col';
    col.dataset.team = teamKey;

    col.innerHTML = `
        <div class="dim-col-header" style="border-top:3px solid ${cfg.color}">
            <div class="dim-col-header-top">
                <span class="dim-col-name" style="color:${cfg.color}">${cfg.name}</span>
                <span class="dim-col-badge">${comSetor}/${members.length}</span>
            </div>
            <div class="dim-col-sub">Arraste ou clique para definir o setor</div>
        </div>
        <div class="dim-col-body" id="setor-src-${teamKey}"></div>
    `;

    const body = col.querySelector(`#setor-src-${teamKey}`);
    if (members.length === 0) {
        const empty = document.createElement('div');
        empty.className   = 'dim-col-empty';
        empty.textContent = 'Nenhum colaborador nesta equipe';
        body.appendChild(empty);
    } else {
        members.forEach(m => body.appendChild(buildSrcCard(m, teamKey)));
    }

    return col;
}

function buildSrcCard(m, teamKey) {
    const card = document.createElement('div');
    card.className  = `dim-src-card${m.setor ? ' dim-src-alocado' : ''}`;
    card.draggable  = true;
    card.dataset.id = m.id;

    const tag = m.setor ? `<span class="dim-src-tag">${m.setor}</span>` : '';

    card.innerHTML = `
        <span class="dim-src-name" title="${m.nome}">${firstName(m.nome)}</span>
        ${tag}
    `;

    card.addEventListener('dragstart', e => {
        setorDrag = { id: m.id, nome: m.nome, teamKey };
        card.classList.add('dim-dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', m.id);
    });
    card.addEventListener('dragend', () => card.classList.remove('dim-dragging'));
    card.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openSetorCtx(e, { id: m.id, nome: m.nome, teamKey });
    });

    return card;
}

// ─── COLUNA DE SETORES POR EQUIPE ────────────
function buildTeamSetorColumn(teamKey) {
    const cfg      = TEAM_CONFIG[teamKey];
    const members  = getMembersOf(teamKey);
    const cobertos = SETORES_LIST.filter(s => members.some(m => m.setor === s)).length;
    const vagas    = SETORES_LIST.length - cobertos;

    const col = document.createElement('div');
    col.className = 'dim-col setor-team-col';

    col.innerHTML = `
        <div class="dim-col-header" style="border-top:3px solid ${cfg.color}">
            <div class="dim-col-header-top">
                <span class="dim-col-name" style="color:${cfg.color}">Setores — ${cfg.name}</span>
                <span class="dim-col-badge${vagas > 0 ? ' dim-col-badge-warn' : ''}">${cobertos}/${SETORES_LIST.length}</span>
            </div>
            <div class="dim-col-sub">${vagas > 0 ? `${vagas} setor${vagas > 1 ? 'es' : ''} descoberto${vagas > 1 ? 's' : ''}` : 'Todos os setores cobertos'}</div>
        </div>
        <div class="dim-col-body setor-team-body" id="setor-team-${teamKey}"></div>
    `;

    const body = col.querySelector(`#setor-team-${teamKey}`);
    SETORES_LIST.forEach(setor => body.appendChild(buildSetorRow(setor, teamKey, members)));

    return col;
}

function buildSetorRow(setor, teamKey, members) {
    const alocados = members.filter(m => m.setor === setor);
    const ocupado  = alocados.length > 0;

    const row = document.createElement('div');
    row.className     = `setor-row${ocupado ? ' setor-row-ocupado' : ' setor-row-vaga'}`;
    row.dataset.setor = setor;

    const chips = alocados.map(a => `
        <div class="dim-chip" data-id="${a.id}">
            <span class="dim-chip-name" title="${a.nome}">${firstName(a.nome)}</span>
            <button class="dim-chip-remove" data-id="${a.id}" title="Remover do setor">×</button>
        </div>
    `).join('');

    row.innerHTML = `
        <span class="setor-row-label">${setor}</span>
        <div class="setor-row-content" data-setor="${setor}" data-team="${teamKey}">
            ${ocupado ? chips : '<span class="setor-row-vaga-badge">Vaga</span>'}
        </div>
    `;

    const dropZone = row.querySelector('.setor-row-content');
    dropZone.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('setor-row-drop-active'); });
    dropZone.addEventListener('dragleave', e => {
        if (!row.contains(e.relatedTarget)) row.classList.remove('setor-row-drop-active');
    });
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        row.classList.remove('setor-row-drop-active');
        if (!setorDrag) return;
        setMemberSetor(setorDrag.id, setor);
        setorDrag = null;
        renderSetores();
    });

    row.querySelectorAll('.dim-chip-remove').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            setMemberSetor(btn.dataset.id, null);
            renderSetores();
        });
    });

    row.querySelectorAll('.dim-chip').forEach(chip => {
        chip.draggable = true;
        chip.addEventListener('dragstart', e => {
            e.stopPropagation();
            const id    = chip.dataset.id;
            const found = findMember(id);
            setorDrag = { id, nome: found ? found.member.nome : id, teamKey: found ? found.teamKey : null };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', id);
        });
        chip.addEventListener('click', e => {
            e.stopPropagation();
            const found = findMember(chip.dataset.id);
            if (found) openSetorCtx(e, { id: found.member.id, nome: found.member.nome, teamKey: found.teamKey });
        });
    });

    return row;
}

// ─── MENU RÁPIDO (clique) ────────────────────
function mountSetorCtxMenu() {
    if (document.getElementById('setorCtxMenu')) return;
    const menu = document.createElement('div');
    menu.id        = 'setorCtxMenu';
    menu.className = 'dim-ctx-menu';
    menu.style.display = 'none';
    menu.innerHTML = `
        <div class="dim-ctx-header" id="setorCtxHeader">Definir setor</div>
        <div class="dim-ctx-list" id="setorCtxList"></div>
    `;
    // Impede que cliques dentro do menu cheguem ao listener de "fechar ao clicar fora"
    menu.addEventListener('mousedown', e => e.stopPropagation());
    menu.addEventListener('click', e => e.stopPropagation());
    document.body.appendChild(menu);
}

function closeSetorCtx() {
    const menu = document.getElementById('setorCtxMenu');
    if (menu) menu.style.display = 'none';
    setorCtxTarget = null;
}

function openSetorCtx(e, target) {
    const menu = document.getElementById('setorCtxMenu');
    if (!menu) return;

    const found = findMember(target.id);
    if (!found) return;
    const setorAtual = found.member.setor || null;

    setorCtxTarget = target;

    document.getElementById('setorCtxHeader').textContent = `Setor — ${firstName(target.nome)}`;
    const list = document.getElementById('setorCtxList');
    list.innerHTML = '';

    SETORES_LIST.forEach(setor => {
        const isAtivo = setorAtual === setor;
        const btn = document.createElement('button');
        btn.className = `dim-ctx-item${isAtivo ? ' dim-ctx-item-active' : ''}`;
        btn.innerHTML = `
            <span class="dim-ctx-dot${isAtivo ? ' dim-ctx-dot-active' : ''}"></span>
            <span class="dim-ctx-label">${setor}</span>
            ${isAtivo ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        `;
        btn.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            setMemberSetor(target.id, isAtivo ? null : setor);
            closeSetorCtx();
            renderSetores();
        });
        list.appendChild(btn);
    });

    if (setorAtual) {
        const sep = document.createElement('div');
        sep.className   = 'dim-ausente-sep';
        sep.textContent = 'Remover';
        list.appendChild(sep);

        const btnNone = document.createElement('button');
        btnNone.className = 'dim-ctx-item';
        btnNone.innerHTML = `
            <span class="dim-ctx-dot"></span>
            <span class="dim-ctx-label">Sem setor</span>
        `;
        btnNone.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            setMemberSetor(target.id, null);
            closeSetorCtx();
            renderSetores();
        });
        list.appendChild(btnNone);
    }

    const x = e.clientX ?? 0;
    const y = e.clientY ?? 0;
    menu.style.left    = x + 'px';
    menu.style.top     = y + 'px';
    menu.style.display = 'block';
    requestAnimationFrame(() => {
        const r = menu.getBoundingClientRect();
        if (r.right  > window.innerWidth)  menu.style.left = (x - r.width)  + 'px';
        if (r.bottom > window.innerHeight) menu.style.top  = (y - r.height) + 'px';
    });

    // Fecha ao clicar fora — usa 'mousedown' em fase de captura e ignora
    // cliques dentro do menu, sem depender de um setTimeout artificial.
    document.addEventListener('mousedown', onOutsideClick, true);
}

function onOutsideClick(ev) {
    const menu = document.getElementById('setorCtxMenu');
    if (!menu || menu.style.display === 'none') {
        document.removeEventListener('mousedown', onOutsideClick, true);
        return;
    }
    if (menu.contains(ev.target)) return;
    closeSetorCtx();
    document.removeEventListener('mousedown', onOutsideClick, true);
}
// =============================================
//  MANSERV HSANA — GESTÃO DE EQUIPES
// =============================================

// ─── FIREBASE ────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, onSnapshot,
    serverTimestamp, collection, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyCHelcLpwL0m6_YvXSGU2HVLU3dTQH7-is",
    authDomain:        "efetivo-9fc97.firebaseapp.com",
    projectId:         "efetivo-9fc97",
    storageBucket:     "efetivo-9fc97.firebasestorage.app",
    messagingSenderId: "893083830998",
    appId:             "1:893083830998:web:d6bf5f7913ff9590dd5777"
};

const firebaseApp = initializeApp(firebaseConfig);
const db          = getFirestore(firebaseApp);

const STATE_DOC = doc(db, 'hsana', 'equipes_state');
const LOG_COL   = collection(db, 'hsana_log');

// Flag para evitar loop: quando NOS salvamos, ignoramos o proximo snapshot
let _isSavingLocally = false;
let _fbSaveTimer     = null;

function saveStateToFirebase(stateData) {
    clearTimeout(_fbSaveTimer);
    _fbSaveTimer = setTimeout(async () => {
        try {
            _isSavingLocally = true;
            await setDoc(STATE_DOC, { state: stateData, updatedAt: serverTimestamp() });
        } catch (err) {
            console.warn('[Firebase] Erro ao salvar estado:', err);
            _isSavingLocally = false;
        }
    }, 800);
}

async function logAction(action, details = {}) {
    try {
        await addDoc(LOG_COL, { action, ...details, ts: serverTimestamp() });
    } catch (err) {
        console.warn('[Firebase] Erro ao registrar log:', err);
    }
}

async function loadStateFromFirebase() {
    try {
        const snap = await getDoc(STATE_DOC);
        if (snap.exists()) return snap.data().state;
    } catch (err) {
        console.warn('[Firebase] Erro ao carregar estado:', err);
    }
    return null;
}

// Escuta mudancas em tempo real feitas por outros usuarios
function subscribeToFirebase() {
    onSnapshot(STATE_DOC, (snap) => {
        if (_isSavingLocally) {
            _isSavingLocally = false;
            return;
        }
        if (!snap.exists()) return;
        const remoteState = snap.data().state;
        if (!remoteState) return;
        state = remoteState;
        localStorage.setItem('hsana_equipes_v3', JSON.stringify(state));
        render();
    });
}

// ─── CONFIGURAÇÃO DAS EQUIPES ───────────────
const TEAM_CONFIG = {
    graciela:  { name: 'Graciela',  capacity: 15, color: '#e94b22',  defaultHorario: 'dia' },
    giovana:   { name: 'Giovana',   capacity: 15, color: '#a855f7',  defaultHorario: 'dia' },
    jessica:   { name: 'Jessica',   capacity: 7,  color: '#3b82f6',  defaultHorario: 'noite' },
    franciele: { name: 'Franciele', capacity: 7,  color: '#22c55e',  defaultHorario: 'noite' },
    alisson:   { name: 'Alisson',   capacity: 4,  color: '#f97316',  defaultHorario: null },
};

// ─── DADOS INICIAIS ──────────────────────────
function makeInitialData() {
    return {
        graciela: [
            { id: uid(), nome: 'KATIA',      tipo: 'colaborador' },
            { id: uid(), nome: 'CARMEM',     tipo: 'colaborador' },
            { id: uid(), nome: 'LEILA',      tipo: 'colaborador' },
            { id: uid(), nome: 'CRISTINA',   tipo: 'colaborador' },
            { id: uid(), nome: 'RAFAEL',     tipo: 'colaborador' },
            { id: uid(), nome: 'CAROL',      tipo: 'colaborador' },
            { id: uid(), nome: 'ANDREA',     tipo: 'colaborador' },
            { id: uid(), nome: 'SILENE',     tipo: 'colaborador' },
            { id: uid(), nome: 'SUZANA',     tipo: 'colaborador' },
            { id: uid(), nome: 'PATRICIA',   tipo: 'colaborador' },
            { id: uid(), nome: 'DIEGO',      tipo: 'colaborador' },
            { id: uid(), nome: 'CRISTIAN',   tipo: 'colaborador' },
            { id: uid(), nome: 'LUCIANO',    tipo: 'colaborador' },
        ],
        giovana: [
            { id: uid(), nome: 'PAULO ROBERTO', tipo: 'colaborador' },
            { id: uid(), nome: 'LEANDRA',        tipo: 'colaborador' },
            { id: uid(), nome: 'CLAUDIA',        tipo: 'colaborador' },
            { id: uid(), nome: 'MAHANA',         tipo: 'colaborador' },
            { id: uid(), nome: 'MARTA',          tipo: 'colaborador' },
            { id: uid(), nome: 'EVERTON',        tipo: 'colaborador' },
            { id: uid(), nome: 'ROSANGELA',      tipo: 'colaborador' },
            { id: uid(), nome: 'ELCA',           tipo: 'colaborador' },
            { id: uid(), nome: 'PAULO RICARDO',  tipo: 'colaborador' },
            { id: uid(), nome: 'ANDREIA',        tipo: 'colaborador' },
            { id: uid(), nome: 'BEATRIZ',        tipo: 'colaborador' },
            { id: uid(), nome: 'MATEUS',         tipo: 'colaborador' },
            { id: uid(), nome: 'ROSELI',         tipo: 'colaborador' },
            { id: uid(), nome: 'EDUARDO',        tipo: 'colaborador' },
        ],
        jessica: [
            { id: uid(), nome: 'FERNANDO',  tipo: 'colaborador' },
            { id: uid(), nome: 'ANDERSON',  tipo: 'colaborador' },
            { id: uid(), nome: 'FRANCINA',  tipo: 'colaborador' },
            { id: uid(), nome: 'CRISTINA',  tipo: 'colaborador' },
            { id: uid(), nome: 'JESSICA',   tipo: 'colaborador' },
            { id: uid(), nome: 'DEBORA',    tipo: 'colaborador' },
            { id: uid(), nome: 'CESAR',     tipo: 'colaborador' },
        ],
        franciele: [
            { id: uid(), nome: 'IVAN',      tipo: 'colaborador' },
            { id: uid(), nome: 'LUIZ',      tipo: 'colaborador' },
            { id: uid(), nome: 'DJULIUS',   tipo: 'colaborador' },
            { id: uid(), nome: 'LUANA',     tipo: 'colaborador' },
            { id: uid(), nome: 'SIMONE',    tipo: 'colaborador' },
            { id: uid(), nome: 'VALERIA',   tipo: 'colaborador' },
        ],
        alisson: [
            { id: uid(), nome: 'MARISA',    tipo: 'colaborador' },
            { id: uid(), nome: 'ROSANGELA', tipo: 'colaborador' },
        ],
    };
}

// ─── STATE ───────────────────────────────────
let state         = null;
let dragData      = null;
let contextTarget = null;
let activeToast   = null;

// ─── HELPERS ─────────────────────────────────
function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadStateLocal() {
    try {
        const raw = localStorage.getItem('hsana_equipes_v3');
        if (raw) return JSON.parse(raw);
    } catch(e) {}
    return null;
}

function saveState() {
    localStorage.setItem('hsana_equipes_v3', JSON.stringify(state));
    saveStateToFirebase(state);
}

function findColaborador(id) {
    for (const [teamKey, members] of Object.entries(state)) {
        const idx = members.findIndex(m => m.id === id);
        if (idx !== -1) return { teamKey, idx, member: members[idx] };
    }
    return null;
}

function getInitials(nome) {
    const parts = nome.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nome.slice(0, 2).toUpperCase();
}

function getHorarioLabel(member) {
    if (!member.horarioEntrada && !member.horarioSaida) return '';
    const e = member.horarioEntrada || '?';
    const s = member.horarioSaida   || '?';
    return `${e} - ${s}`;
}

// ─── RENDER ──────────────────────────────────
function render() {
    renderBoard();
    renderStats();
}

function renderStats() {
    let total = 0, vagas = 0, candidatos = 0, demissao = 0;
    for (const [teamKey, members] of Object.entries(state)) {
        const cap    = TEAM_CONFIG[teamKey].capacity;
        const colabs = members.filter(m => m.tipo === 'colaborador' || m.tipo === 'demissao').length;
        // Substitutos nao contam como vaga extra
        const cands  = members.filter(m => m.tipo === 'candidato' && !m.substitutoDe).length;
        total      += colabs;
        candidatos += members.filter(m => m.tipo === 'candidato').length;
        demissao   += members.filter(m => m.tipo === 'demissao').length;
        const v = cap - colabs - cands;
        if (v > 0) vagas += v;
    }
    document.getElementById('statTotal').textContent      = total;
    document.getElementById('statVagas').textContent      = vagas;
    document.getElementById('statCandidatos').textContent = candidatos;
    document.getElementById('statDemissao').textContent   = demissao;
}

function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    for (const [teamKey, cfg] of Object.entries(TEAM_CONFIG)) {
        board.appendChild(renderTeamColumn(teamKey, cfg));
    }
}

function renderTeamColumn(teamKey, cfg) {
    const members      = state[teamKey] || [];
    const cap          = cfg.capacity;
    const colabCount   = members.filter(m => m.tipo === 'colaborador' || m.tipo === 'demissao').length;
    const candCount    = members.filter(m => m.tipo === 'candidato' && !m.substitutoDe).length;
    const totalFilled  = colabCount + candCount;
    const vagasAbertas = Math.max(0, cap - totalFilled);
    const pct          = Math.min(100, Math.round((totalFilled / cap) * 100));
    const isFull       = totalFilled >= cap;
    const progressColor = pct >= 100 ? '#22c55e' : pct >= 70 ? cfg.color : '#e94b22';

    const col = document.createElement('div');
    col.className    = 'team-column';
    col.dataset.team = teamKey;

    col.innerHTML = `
        <div class="team-header">
            <div class="team-header-top">
                <span class="team-name">${cfg.name}</span>
                <span class="team-badge ${isFull ? 'badge-ok' : 'badge-warn'}">${totalFilled}/${cap}</span>
            </div>
            <div class="team-progress">
                <div class="team-progress-fill" style="width:${pct}%;background:${progressColor}"></div>
            </div>
            <div class="team-capacity">${vagasAbertas > 0 ? `${vagasAbertas} vaga${vagasAbertas > 1 ? 's' : ''} aberta${vagasAbertas > 1 ? 's' : ''}` : 'Equipe completa'}</div>
        </div>
        <div class="team-body" id="body-${teamKey}"></div>
    `;

    const body = col.querySelector(`#body-${teamKey}`);

    // Renderiza membros. Substitutos ficam embutidos no card do titular.
    const rendered = new Set();
    members.forEach(member => {
        if (rendered.has(member.id)) return;
        if (member.substitutoDe) return; // sera renderizado dentro do titular
        rendered.add(member.id);
        const substituto = members.find(m => m.substitutoDe === member.id) || null;
        body.appendChild(renderCard(member, teamKey, substituto));
        if (substituto) rendered.add(substituto.id);
    });

    for (let i = 0; i < vagasAbertas; i++) {
        const vaga = document.createElement('div');
        vaga.className = 'vaga-slot';
        vaga.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Vaga aberta`;
        vaga.addEventListener('click', () => showAddModal(teamKey));
        body.appendChild(vaga);
    }

    col.addEventListener('dragover',  onDragOver);
    col.addEventListener('dragleave', onDragLeave);
    col.addEventListener('drop',      onDrop);

    return col;
}

function renderCard(member, teamKey, substituto = null) {
    const card = document.createElement('div');

    if (substituto) {
        // Card dividido: titular (esquerda) + substituto (direita)
        card.className   = 'colab-card colab-card-split';
        card.dataset.id  = member.id;
        card.draggable   = true;

        const horT = getHorarioLabel(member);
        const horS = getHorarioLabel(substituto);

        card.innerHTML = `
            <div class="split-half split-left" data-id="${member.id}">
                <div class="colab-avatar">${getInitials(member.nome)}</div>
                <div class="colab-info">
                    <div class="colab-name">${member.nome}</div>
                    <span class="colab-sub" style="color:#873BFF">Saindo</span>
                    ${horT ? `<span class="colab-horario">${horT}</span>` : ''}
                </div>
            </div>
            <div class="split-divider"></div>
            <div class="split-half split-right" data-id="${substituto.id}">
                <div class="colab-avatar colab-avatar-sub">${getInitials(substituto.nome)}</div>
                <div class="colab-info">
                    <div class="colab-name colab-name-sub">${substituto.nome}</div>
                    <span class="colab-sub" style="color:var(--blue)">Entrando</span>
                    ${horS ? `<span class="colab-horario">${horS}</span>` : ''}
                </div>
            </div>
        `;

        card.querySelector('.split-left').addEventListener('click', e => {
            e.stopPropagation();
            showContextMenu(e, member.id, teamKey);
        });
        card.querySelector('.split-right').addEventListener('click', e => {
            e.stopPropagation();
            showContextMenu(e, substituto.id, teamKey);
        });
        card.addEventListener('dragstart', e => onDragStart(e, member.id, teamKey));
        card.addEventListener('dragend',   onDragEnd);

    } else {
        card.className  = `colab-card tipo-${member.tipo}`;
        card.dataset.id = member.id;
        card.draggable  = true;

        let subText = '';
        if (member.tipo === 'candidato') subText = '<span class="colab-sub">Candidato</span>';
        if (member.tipo === 'demissao')  subText = '<span class="colab-sub" style="color:#873BFF">Futura Demissao</span>';

        const horLabel  = getHorarioLabel(member);
        const horarioEl = horLabel ? `<span class="colab-horario">${horLabel}</span>` : '';

        card.innerHTML = `
            <div class="colab-avatar">${getInitials(member.nome)}</div>
            <div class="colab-info">
                <div class="colab-name">${member.nome}</div>
                ${subText}
            </div>
            ${horarioEl}
        `;

        card.addEventListener('dragstart', e => onDragStart(e, member.id, teamKey));
        card.addEventListener('dragend',   onDragEnd);
        card.addEventListener('click', e => {
            e.stopPropagation();
            showContextMenu(e, member.id, teamKey);
        });
    }

    return card;
}

// ─── DRAG AND DROP ───────────────────────────
function onDragStart(e, id, fromTeam) {
    dragData = { id, fromTeam };
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const col = e.currentTarget.closest('.team-column');
    if (col) col.classList.add('drag-over');
}

function onDragLeave(e) {
    const col = e.currentTarget.closest('.team-column');
    if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
}

function onDrop(e) {
    e.preventDefault();
    const col = e.currentTarget.closest('.team-column');
    if (col) col.classList.remove('drag-over');
    if (!dragData) return;
    const toTeam = col.dataset.team;
    if (!toTeam || toTeam === dragData.fromTeam) return;
    moveColaborador(dragData.id, dragData.fromTeam, toTeam);
    dragData = null;
}

function moveColaborador(id, fromTeam, toTeam) {
    const fromArr = state[fromTeam];
    const idx     = fromArr.findIndex(m => m.id === id);
    if (idx === -1) return;
    const member = { ...fromArr[idx] };
    fromArr.splice(idx, 1);
    state[toTeam].push(member);
    saveState();
    render();
    showToast(`${member.nome} movido para equipe ${TEAM_CONFIG[toTeam].name}`, 'success');
    logAction('colaborador_movido', { nome: member.nome, de: fromTeam, para: toTeam });
}

// ─── CONTEXT MENU ────────────────────────────
function showContextMenu(e, id, teamKey) {
    const found = findColaborador(id);
    if (!found) return;
    contextTarget = { id, teamKey };

    const member    = found.member;
    const jaTemSub  = state[teamKey].some(m => m.substitutoDe === id);
    const isSubst   = !!member.substitutoDe;

    document.getElementById('ctxHeader').textContent = member.nome;

    // Efetivar (candidato normal, sem ser substituto)
    document.getElementById('ctxEfetivar').style.display =
        (member.tipo === 'candidato' && !isSubst) ? 'flex' : 'none';

    // Alterar horario
    document.getElementById('ctxEditHorario').style.display = 'flex';

    // Marcar/remover demissao
    const demBtn = document.getElementById('ctxDemissao');
    if (member.tipo === 'candidato') {
        demBtn.style.display = 'none';
    } else if (member.tipo === 'demissao') {
        demBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Remover futura demissao`;
        demBtn.style.display = 'flex';
    } else {
        demBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Marcar futura demissao`;
        demBtn.style.display = 'flex';
    }

    // Adicionar substituto
    document.getElementById('ctxAddSubstituto').style.display =
        ((member.tipo === 'colaborador' || member.tipo === 'demissao') && !jaTemSub) ? 'flex' : 'none';

    // Confirmar entrada (substituto)
    document.getElementById('ctxConfirmarEntrada').style.display = isSubst ? 'flex' : 'none';

    // Mover (nao para substitutos)
    document.getElementById('ctxMove').style.display = isSubst ? 'none' : 'flex';

    // Ocultar opcoes legadas
    document.getElementById('ctxLinkDemissao').style.display = 'none';

    const menu = document.getElementById('contextMenu');
    positionMenu(menu, e.clientX, e.clientY);
    menu.style.display = 'block';
    closeMenusOnOutside();
}

function positionMenu(menu, x, y) {
    menu.style.left    = x + 'px';
    menu.style.top     = y + 'px';
    menu.style.display = 'block';
    requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        if (rect.right  > window.innerWidth)  menu.style.left = (x - rect.width)  + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top  = (y - rect.height) + 'px';
    });
}

function closeAllMenus() {
    ['contextMenu','moveMenu','horarioMenu','linkMenu'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function closeMenusOnOutside() {
    setTimeout(() => {
        document.addEventListener('click', closeAllMenus, { once: true });
    }, 10);
}

// ─── CONTEXT: Mover ──────────────────────────
document.getElementById('ctxMove').addEventListener('click', e => {
    e.stopPropagation();
    if (!contextTarget) return;
    const menu = document.getElementById('moveMenu');
    const opts = document.getElementById('moveOptions');
    opts.innerHTML = '';
    for (const [key, cfg] of Object.entries(TEAM_CONFIG)) {
        if (key === contextTarget.teamKey) continue;
        const btn = document.createElement('button');
        btn.className   = 'ctx-btn';
        btn.textContent = cfg.name;
        btn.addEventListener('click', () => {
            moveColaborador(contextTarget.id, contextTarget.teamKey, key);
            closeAllMenus();
        });
        opts.appendChild(btn);
    }
    const ctxRect = document.getElementById('contextMenu').getBoundingClientRect();
    positionMenu(menu, ctxRect.right + 4, ctxRect.top);
    closeMenusOnOutside();
});

// ─── CONTEXT: Alterar horario ─────────────────
document.getElementById('ctxEditHorario').addEventListener('click', e => {
    e.stopPropagation();
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    closeAllMenus();
    showHorarioModal(found.member, found.teamKey);
});

function showHorarioModal(member, teamKey) {
    document.getElementById('modalTitle').textContent = 'Horario — ' + member.nome;
    document.getElementById('modalBody').innerHTML = `
        <div class="form-row">
            <div class="form-group" style="flex:1">
                <label class="form-label">Entrada</label>
                <input type="time" class="form-input" id="horEntrada" value="${member.horarioEntrada || ''}">
            </div>
            <div class="form-group" style="flex:1">
                <label class="form-label">Saida</label>
                <input type="time" class="form-input" id="horSaida" value="${member.horarioSaida || ''}">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" id="modalConfirmBtn">Salvar</button>
        </div>
    `;
    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('horEntrada').focus();
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        member.horarioEntrada = document.getElementById('horEntrada').value || null;
        member.horarioSaida   = document.getElementById('horSaida').value   || null;
        saveState();
        render();
        closeModal();
        showToast('Horario de ' + member.nome + ' atualizado', 'success');
        logAction('horario_alterado', { nome: member.nome, equipe: teamKey,
            entrada: member.horarioEntrada, saida: member.horarioSaida });
    });
}

// ─── CONTEXT: Demissao ────────────────────────
document.getElementById('ctxDemissao').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    if (found.member.tipo === 'demissao') {
        found.member.tipo = 'colaborador';
        showToast(found.member.nome + ' removido de futuras demissoes', 'success');
        logAction('demissao_removida', { nome: found.member.nome, equipe: found.teamKey });
    } else {
        found.member.tipo = 'demissao';
        showToast(found.member.nome + ' marcado como futura demissao', 'success');
        logAction('demissao_marcada', { nome: found.member.nome, equipe: found.teamKey });
    }
    closeAllMenus();
    saveState();
    render();
});

// ─── CONTEXT: Adicionar substituto ───────────
document.getElementById('ctxAddSubstituto').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    closeAllMenus();
    showAddSubstitutoModal(found.member, contextTarget.teamKey);
});

function showAddSubstitutoModal(titular, teamKey) {
    document.getElementById('modalTitle').textContent = 'Substituto para ' + titular.nome;
    document.getElementById('modalBody').innerHTML = `
        <div class="form-group">
            <label class="form-label">Nome do substituto</label>
            <input type="text" class="form-input" id="subNome" placeholder="Ex: JOAO SILVA" style="text-transform:uppercase">
        </div>
        <div class="form-row">
            <div class="form-group" style="flex:1">
                <label class="form-label">Entrada</label>
                <input type="time" class="form-input" id="subEntrada">
            </div>
            <div class="form-group" style="flex:1">
                <label class="form-label">Saida</label>
                <input type="time" class="form-input" id="subSaida">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" id="modalConfirmBtn">Adicionar</button>
        </div>
    `;
    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('subNome').focus();

    const confirm = () => {
        const nome    = document.getElementById('subNome').value.trim().toUpperCase();
        const entrada = document.getElementById('subEntrada').value;
        const saida   = document.getElementById('subSaida').value;
        if (!nome) {
            document.getElementById('subNome').style.borderColor = 'var(--red)';
            return;
        }
        // Marca titular como demissao automaticamente
        if (titular.tipo === 'colaborador') titular.tipo = 'demissao';

        const substituto = {
            id:             uid(),
            nome,
            tipo:           'candidato',
            substitutoDe:   titular.id,
            horarioEntrada: entrada || null,
            horarioSaida:   saida   || null,
        };
        state[teamKey].push(substituto);
        saveState();
        render();
        closeModal();
        showToast(nome + ' adicionado como substituto de ' + titular.nome, 'success');
        logAction('substituto_adicionado', { substituto: nome, titular: titular.nome, equipe: teamKey });
    };

    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', confirm);
    document.getElementById('subNome').addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); });
}

// ─── CONTEXT: Confirmar entrada do substituto ─
document.getElementById('ctxConfirmarEntrada').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found || !found.member.substitutoDe) return;

    const substituto   = found.member;
    const titularFound = findColaborador(substituto.substitutoDe);

    closeAllMenus();
    showConfirmModal(
        'Confirmar entrada de <span class="confirm-name">' + substituto.nome +
        '</span> e remover <span class="confirm-name">' +
        (titularFound ? titularFound.member.nome : 'titular') + '</span>?',
        () => {
            if (titularFound) {
                state[titularFound.teamKey].splice(titularFound.idx, 1);
            }
            delete substituto.substitutoDe;
            substituto.tipo = 'colaborador';
            saveState();
            render();
            showToast(substituto.nome + ' efetivado com sucesso!', 'success');
            logAction('substituto_efetivado', { nome: substituto.nome, equipe: found.teamKey });
        }
    );
});

// ─── CONTEXT: Efetivar candidato normal ──────
document.getElementById('ctxEfetivar').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    found.member.tipo = 'colaborador';
    closeAllMenus();
    saveState();
    render();
    showToast(found.member.nome + ' efetivado com sucesso!', 'success');
    logAction('candidato_efetivado', { nome: found.member.nome, equipe: found.teamKey });
});

// ─── CONTEXT: Link demissao (legado, oculto) ──
document.getElementById('ctxLinkDemissao').addEventListener('click', e => { e.stopPropagation(); });

// ─── CONTEXT: Remover ────────────────────────
document.getElementById('ctxRemove').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;

    const isSubst = !!found.member.substitutoDe;
    const msg = isSubst
        ? 'Remover <span class="confirm-name">' + found.member.nome + '</span> (desistencia da vaga)?'
        : 'Remover <span class="confirm-name">' + found.member.nome + '</span> da equipe ' + TEAM_CONFIG[contextTarget.teamKey].name + '?';

    showConfirmModal(msg, () => {
        // Se era substituto, reverte o titular para colaborador
        if (isSubst) {
            const titFound = findColaborador(found.member.substitutoDe);
            if (titFound && titFound.member.tipo === 'demissao') {
                titFound.member.tipo = 'colaborador';
            }
        }
        // Se era titular, remove o substituto junto
        const teamMembers = state[found.teamKey];
        const subIdx = teamMembers.findIndex(m => m.substitutoDe === found.member.id);
        if (subIdx !== -1) teamMembers.splice(subIdx, 1);

        // Re-busca o indice pois o array pode ter mudado
        const freshIdx = state[found.teamKey].findIndex(m => m.id === found.member.id);
        if (freshIdx !== -1) state[found.teamKey].splice(freshIdx, 1);

        saveState();
        render();
        showToast(found.member.nome + ' removido', 'success');
        logAction('colaborador_removido', { nome: found.member.nome, equipe: found.teamKey, tipo: found.member.tipo });
    });
    closeAllMenus();
});

// ─── MODAL ADD CANDIDATO ─────────────────────
document.getElementById('btnAddColaborador').addEventListener('click', () => showAddModal());

function showAddModal(preselectedTeam = null) {
    document.getElementById('modalTitle').textContent = 'Adicionar Candidato';

    const teamOptions = Object.entries(TEAM_CONFIG)
        .map(([k, v]) => `<option value="${k}" ${k === preselectedTeam ? 'selected' : ''}>${v.name}</option>`)
        .join('');

    document.getElementById('modalBody').innerHTML = `
        <div class="form-group">
            <label class="form-label">Nome completo</label>
            <input type="text" class="form-input" id="addNome" placeholder="Ex: MARIA SILVA" style="text-transform:uppercase">
        </div>
        <div class="form-group">
            <label class="form-label">Equipe</label>
            <select class="form-select" id="addEquipe">${teamOptions}</select>
        </div>
        <div class="form-row">
            <div class="form-group" style="flex:1">
                <label class="form-label">Entrada</label>
                <input type="time" class="form-input" id="addEntrada">
            </div>
            <div class="form-group" style="flex:1">
                <label class="form-label">Saida</label>
                <input type="time" class="form-input" id="addSaida">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" id="modalConfirmBtn">Adicionar</button>
        </div>
    `;

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('addNome').focus();
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', confirmAdd);
    document.getElementById('addNome').addEventListener('keydown', e => { if (e.key === 'Enter') confirmAdd(); });
}

function confirmAdd() {
    const nome    = document.getElementById('addNome').value.trim().toUpperCase();
    const equipe  = document.getElementById('addEquipe').value;
    const entrada = document.getElementById('addEntrada').value;
    const saida   = document.getElementById('addSaida').value;

    if (!nome) {
        document.getElementById('addNome').style.borderColor = 'var(--red)';
        return;
    }

    const member = {
        id:             uid(),
        nome,
        tipo:           'candidato',
        horarioEntrada: entrada || null,
        horarioSaida:   saida   || null,
    };

    state[equipe].push(member);
    saveState();
    render();
    closeModal();
    showToast('Candidato ' + nome + ' adicionado a equipe ' + TEAM_CONFIG[equipe].name, 'success');
    logAction('candidato_adicionado', { nome, equipe, entrada: entrada || null, saida: saida || null });
}

// ─── MODAIS GENERICOS ────────────────────────
function showConfirmModal(message, onConfirm) {
    document.getElementById('modalTitle').textContent = 'Confirmar acao';
    document.getElementById('modalBody').innerHTML = `
        <p class="confirm-message">${message}</p>
        <p class="confirm-message" style="font-size:11px;color:var(--text3);margin-top:6px">Esta acao nao pode ser desfeita.</p>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" style="background:var(--red)" id="modalConfirmBtn">Confirmar</button>
        </div>
    `;
    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', () => { closeModal(); onConfirm(); });
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ─── RESET ───────────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
    showConfirmModal('Resetar todos os dados para o estado inicial?', () => {
        localStorage.removeItem('hsana_equipes_v3');
        state = makeInitialData();
        saveState();
        render();
        showToast('Dados resetados', 'success');
        logAction('dados_resetados', {});
    });
});

// ─── TOAST ───────────────────────────────────
function showToast(message, type = 'success') {
    if (activeToast) { activeToast.remove(); activeToast = null; }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const icon = type === 'success'
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e94b22" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    toast.innerHTML = icon + message;
    document.body.appendChild(toast);
    activeToast = toast;
    setTimeout(() => {
        toast.style.opacity    = '0';
        toast.style.transform  = 'translateY(10px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => { toast.remove(); activeToast = null; }, 300);
    }, 3000);
}

// ─── INIT ────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAllMenus(); closeModal(); }
});

async function initApp() {
    let loaded = await loadStateFromFirebase();
    if (!loaded) loaded = loadStateLocal();
    state = loaded || makeInitialData();
    localStorage.setItem('hsana_equipes_v3', JSON.stringify(state));
    render();
    subscribeToFirebase(); // ativa escuta em tempo real apos o primeiro render
}

initApp();
// =============================================
//  EQUIPES-UI.JS — Menus · Modais · Toast · Init
// =============================================

import {
    TEAM_CONFIG, state, setState, saveState, makeInitialData,
    loadStateFromFirebase, loadStateLocal, subscribeToFirebase,
    findColaborador, uid, logAction
} from './equipes-core.js';
import { render, moveColaborador } from './equipes-render.js';

// ─── ESTADO DA UI ────────────────────────────
let contextTarget = null;
let activeToast   = null;

// ─── TOAST ───────────────────────────────────
export function showToast(message, type = 'success') {
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

// ─── MODAIS ──────────────────────────────────
export function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}

function openModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML    = bodyHTML;
    document.getElementById('modalOverlay').classList.add('open');
}

export function showConfirmModal(message, onConfirm) {
    openModal('Confirmar ação', `
        <p class="confirm-message">${message}</p>
        <p class="confirm-message" style="font-size:11px;color:var(--text3);margin-top:6px">Esta ação não pode ser desfeita.</p>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" style="background:var(--red)" id="modalConfirmBtn">Confirmar</button>
        </div>
    `);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', () => { closeModal(); onConfirm(); });
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ─── MODAL: Adicionar candidato ──────────────
export function showAddModal(preselectedTeam = null) {
    const teamOptions = Object.entries(TEAM_CONFIG)
        .map(([k, v]) => `<option value="${k}" ${k === preselectedTeam ? 'selected' : ''}>${v.name}</option>`)
        .join('');

    openModal('Adicionar Candidato', `
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
                <label class="form-label">Saída</label>
                <input type="time" class="form-input" id="addSaida">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" id="modalConfirmBtn">Adicionar</button>
        </div>
    `);
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
    if (!nome) { document.getElementById('addNome').style.borderColor = 'var(--red)'; return; }

    state[equipe].push({ id: uid(), nome, tipo: 'candidato',
        horarioEntrada: entrada || null, horarioSaida: saida || null });
    saveState(); render(); closeModal();
    showToast(`Candidato ${nome} adicionado à equipe ${TEAM_CONFIG[equipe].name}`, 'success');
    logAction('candidato_adicionado', { nome, equipe, entrada: entrada || null, saida: saida || null });
}

// ─── MODAL: Alterar horário ───────────────────
function showHorarioModal(member, teamKey) {
    openModal(`Horário — ${member.nome}`, `
        <div class="form-row">
            <div class="form-group" style="flex:1">
                <label class="form-label">Entrada</label>
                <input type="time" class="form-input" id="horEntrada" value="${member.horarioEntrada || ''}">
            </div>
            <div class="form-group" style="flex:1">
                <label class="form-label">Saída</label>
                <input type="time" class="form-input" id="horSaida" value="${member.horarioSaida || ''}">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" id="modalConfirmBtn">Salvar</button>
        </div>
    `);
    document.getElementById('horEntrada').focus();
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        member.horarioEntrada = document.getElementById('horEntrada').value || null;
        member.horarioSaida   = document.getElementById('horSaida').value   || null;
        saveState(); render(); closeModal();
        showToast(`Horário de ${member.nome} atualizado`, 'success');
        logAction('horario_alterado', { nome: member.nome, equipe: teamKey,
            entrada: member.horarioEntrada, saida: member.horarioSaida });
    });
}

// ─── MODAL: Renomear ─────────────────────────
function showRenomearModal(member, teamKey) {
    openModal(`Renomear`, `
        <div class="form-group">
            <label class="form-label">Nome atual: <strong>${member.nome}</strong></label>
            <input type="text" class="form-input" id="renomearInput"
                value="${member.nome}" style="text-transform:uppercase;margin-top:8px">
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" id="modalConfirmBtn">Salvar</button>
        </div>
    `);
    const input = document.getElementById('renomearInput');
    input.focus();
    input.select();
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    const confirm = () => {
        const novoNome = input.value.trim().toUpperCase();
        if (!novoNome) { input.style.borderColor = 'var(--red)'; return; }
        const nomeAntigo = member.nome;
        member.nome = novoNome;
        saveState(); render(); closeModal();
        showToast(`Renomeado: ${nomeAntigo} → ${novoNome}`, 'success');
        logAction('colaborador_renomeado', { nomeAntigo, nomeNovo: novoNome, equipe: teamKey });
    };
    document.getElementById('modalConfirmBtn').addEventListener('click', confirm);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); });
}

// ─── MODAL: Adicionar substituto ─────────────
function showAddSubstitutoModal(titular, teamKey) {
    openModal(`Substituto para ${titular.nome}`, `
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
                <label class="form-label">Saída</label>
                <input type="time" class="form-input" id="subSaida">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" id="modalConfirmBtn">Adicionar</button>
        </div>
    `);
    document.getElementById('subNome').focus();
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);

    const confirm = () => {
        const nome    = document.getElementById('subNome').value.trim().toUpperCase();
        const entrada = document.getElementById('subEntrada').value;
        const saida   = document.getElementById('subSaida').value;
        if (!nome) { document.getElementById('subNome').style.borderColor = 'var(--red)'; return; }
        if (titular.tipo === 'colaborador') titular.tipo = 'demissao';
        state[teamKey].push({ id: uid(), nome, tipo: 'candidato', substitutoDe: titular.id,
            horarioEntrada: entrada || null, horarioSaida: saida || null });
        saveState(); render(); closeModal();
        showToast(`${nome} adicionado como substituto de ${titular.nome}`, 'success');
        logAction('substituto_adicionado', { substituto: nome, titular: titular.nome, equipe: teamKey });
    };
    document.getElementById('modalConfirmBtn').addEventListener('click', confirm);
    document.getElementById('subNome').addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); });
}

// ─── CONTEXT MENU ────────────────────────────
export function showContextMenu(e, id, teamKey) {
    const found = findColaborador(id);
    if (!found) return;
    contextTarget = { id, teamKey };

    const member   = found.member;
    const jaTemSub = state[teamKey].some(m => m.substitutoDe === id);
    const isSubst  = !!member.substitutoDe;

    // Nome completo no cabeçalho
    document.getElementById('ctxHeader').textContent = member.nome;

    document.getElementById('ctxEfetivar').style.display =
        (member.tipo === 'candidato' && !isSubst) ? 'flex' : 'none';

    document.getElementById('ctxEditHorario').style.display = 'flex';
    document.getElementById('ctxRenomear').style.display    = 'flex';

    const demBtn = document.getElementById('ctxDemissao');
    if (member.tipo === 'candidato') {
        demBtn.style.display = 'none';
    } else if (member.tipo === 'demissao') {
        demBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Remover futura demissão`;
        demBtn.style.display = 'flex';
    } else {
        demBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Marcar futura demissão`;
        demBtn.style.display = 'flex';
    }

    document.getElementById('ctxAddSubstituto').style.display =
        ((member.tipo === 'colaborador' || member.tipo === 'demissao') && !jaTemSub) ? 'flex' : 'none';

    document.getElementById('ctxConfirmarEntrada').style.display = isSubst ? 'flex' : 'none';
    document.getElementById('ctxMove').style.display = isSubst ? 'none' : 'flex';
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

export function closeAllMenus() {
    ['contextMenu','moveMenu','horarioMenu','linkMenu'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function closeMenusOnOutside() {
    setTimeout(() => {
        document.addEventListener('click', closeAllMenus, { once: true });
    }, 10);
}

// ─── LISTENERS DO CONTEXT MENU ───────────────

// Mover
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

// Alterar horário
document.getElementById('ctxEditHorario').addEventListener('click', e => {
    e.stopPropagation();
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    closeAllMenus();
    showHorarioModal(found.member, found.teamKey);
});

// Renomear
document.getElementById('ctxRenomear').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    closeAllMenus();
    showRenomearModal(found.member, found.teamKey);
});

// Marcar/remover demissão
document.getElementById('ctxDemissao').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    if (found.member.tipo === 'demissao') {
        found.member.tipo = 'colaborador';
        showToast(`${found.member.nome} removido de futuras demissões`, 'success');
        logAction('demissao_removida', { nome: found.member.nome, equipe: found.teamKey });
    } else {
        found.member.tipo = 'demissao';
        showToast(`${found.member.nome} marcado como futura demissão`, 'success');
        logAction('demissao_marcada', { nome: found.member.nome, equipe: found.teamKey });
    }
    closeAllMenus(); saveState(); render();
});

// Adicionar substituto
document.getElementById('ctxAddSubstituto').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    closeAllMenus();
    showAddSubstitutoModal(found.member, contextTarget.teamKey);
});

// Confirmar entrada do substituto
document.getElementById('ctxConfirmarEntrada').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found || !found.member.substitutoDe) return;
    const substituto   = found.member;
    const titularFound = findColaborador(substituto.substitutoDe);
    closeAllMenus();
    showConfirmModal(
        `Confirmar entrada de <span class="confirm-name">${substituto.nome}</span> e remover <span class="confirm-name">${titularFound ? titularFound.member.nome : 'titular'}</span>?`,
        () => {
            if (titularFound) state[titularFound.teamKey].splice(titularFound.idx, 1);
            delete substituto.substitutoDe;
            substituto.tipo = 'colaborador';
            saveState(); render();
            showToast(`${substituto.nome} efetivado com sucesso! 🎉`, 'success');
            logAction('substituto_efetivado', { nome: substituto.nome, equipe: found.teamKey });
        }
    );
});

// Efetivar candidato normal
document.getElementById('ctxEfetivar').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    found.member.tipo = 'colaborador';
    closeAllMenus(); saveState(); render();
    showToast(`${found.member.nome} efetivado com sucesso! 🎉`, 'success');
    logAction('candidato_efetivado', { nome: found.member.nome, equipe: found.teamKey });
});

// Legado (oculto)
document.getElementById('ctxLinkDemissao').addEventListener('click', e => e.stopPropagation());

// Remover
document.getElementById('ctxRemove').addEventListener('click', () => {
    if (!contextTarget) return;
    const found = findColaborador(contextTarget.id);
    if (!found) return;
    const isSubst = !!found.member.substitutoDe;
    const msg = isSubst
        ? `Remover <span class="confirm-name">${found.member.nome}</span> (desistência da vaga)?`
        : `Remover <span class="confirm-name">${found.member.nome}</span> da equipe ${TEAM_CONFIG[contextTarget.teamKey].name}?`;
    showConfirmModal(msg, () => {
        if (isSubst) {
            const titFound = findColaborador(found.member.substitutoDe);
            if (titFound && titFound.member.tipo === 'demissao') titFound.member.tipo = 'colaborador';
        }
        const teamArr = state[found.teamKey];
        const subIdx  = teamArr.findIndex(m => m.substitutoDe === found.member.id);
        if (subIdx !== -1) teamArr.splice(subIdx, 1);
        const freshIdx = state[found.teamKey].findIndex(m => m.id === found.member.id);
        if (freshIdx !== -1) state[found.teamKey].splice(freshIdx, 1);
        saveState(); render();
        showToast(`${found.member.nome} removido`, 'success');
        logAction('colaborador_removido', { nome: found.member.nome, equipe: found.teamKey, tipo: found.member.tipo });
    });
    closeAllMenus();
});

// ─── BOTÕES DO HEADER ────────────────────────
document.getElementById('btnAddColaborador').addEventListener('click', () => showAddModal());

document.getElementById('btnReset').addEventListener('click', () => {
    showConfirmModal('Resetar todos os dados para o estado inicial?', () => {
        localStorage.removeItem('hsana_equipes_v3');
        setState(makeInitialData());
        saveState(); render();
        showToast('Dados resetados', 'success');
        logAction('dados_resetados', {});
    });
});

// ─── TECLADO ─────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAllMenus(); closeModal(); }
});

// ─── INIT ────────────────────────────────────
async function initApp() {
    let loaded = await loadStateFromFirebase();
    if (!loaded) loaded = loadStateLocal();
    const base = loaded || makeInitialData();
    // Garante que novas colunas existam mesmo em states antigos
    if (!base.liderancas)     base.liderancas     = [];
    if (!base.administrativo) base.administrativo = [];
    if (!base.afastados)      base.afastados      = [];
    setState(base);
    localStorage.setItem('hsana_equipes_v3', JSON.stringify(state));
    render();
    subscribeToFirebase(remoteState => {
        if (!remoteState.liderancas)     remoteState.liderancas     = [];
        if (!remoteState.administrativo) remoteState.administrativo = [];
        if (!remoteState.afastados)      remoteState.afastados      = [];
        setState(remoteState);
        localStorage.setItem('hsana_equipes_v3', JSON.stringify(state));
        render();
    });
}

initApp();
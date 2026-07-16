// =============================================
//  FERIAS.JS — v2
//  • Coluna 1: colaboradores de férias agora (Nome | Início | Término)
//  • Coluna 2: próximos meses — clique para expandir e programar férias
//  • Datas sempre visíveis e editáveis inline
//  • Persistente: salvo junto do state principal (Firebase)
// =============================================

import { state, TEAM_CONFIG, firstName, saveState, logAction, uid } from './equipes-core.js';
import { closeModal, showToast } from './equipes-ui.js';

const MESES_A_EXIBIR = 12;

// Estado apenas de UI (não persiste) — quais meses estão expandidos
let mesesExpandidos = new Set();

// ─── RENDER PRINCIPAL ────────────────────────
export function renderFerias() {
    const container = document.getElementById('ferias-board');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(buildAtuaisColumn());
    container.appendChild(buildProximasColumn());
}

// ─── HELPERS GERAIS ──────────────────────────
function getTodosColaboradores() {
    const lista = [];
    Object.keys(TEAM_CONFIG).forEach(teamKey => {
        (state[teamKey] || []).forEach(m => {
            if (m.tipo === 'colaborador' || m.tipo === 'demissao') lista.push({ ...m, teamKey });
        });
    });
    lista.sort((a, b) => a.nome.localeCompare(b.nome));
    return lista;
}

function getTodosDeFerias() {
    const lista = [];
    Object.keys(TEAM_CONFIG).forEach(teamKey => {
        (state[teamKey] || []).forEach(m => {
            if (m.ferias) lista.push({ ...m, teamKey });
        });
    });
    lista.sort((a, b) => a.nome.localeCompare(b.nome));
    return lista;
}

function findMemberAnyTeam(id) {
    for (const teamKey of Object.keys(TEAM_CONFIG)) {
        const m = (state[teamKey] || []).find(mb => mb.id === id);
        if (m) return { member: m, teamKey };
    }
    return null;
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── COLUNA: DE FÉRIAS AGORA ──────────────────
function buildAtuaisColumn() {
    const membros = getTodosDeFerias();

    const col = document.createElement('div');
    col.className = 'ferias-col';
    col.innerHTML = `
        <div class="ferias-col-header">
            <div class="ferias-col-header-top">
                <span class="ferias-col-name">De férias agora</span>
                <span class="ferias-col-badge">${membros.length}</span>
            </div>
            <div class="ferias-col-sub">Preencha as datas de início e término</div>
        </div>
        <div class="ferias-col-body" id="ferias-atuais-body"></div>
    `;

    const body = col.querySelector('#ferias-atuais-body');

    if (membros.length === 0) {
        const empty = document.createElement('div');
        empty.className   = 'ferias-empty';
        empty.textContent = 'Nenhum colaborador de férias no momento';
        body.appendChild(empty);
        return col;
    }

    const head = document.createElement('div');
    head.className = 'ferias-row ferias-row-head';
    head.innerHTML = `
        <span class="ferias-cell ferias-cell-nome">Colaborador</span>
        <span class="ferias-cell ferias-cell-data">Início</span>
        <span class="ferias-cell ferias-cell-data">Término</span>
        <span class="ferias-cell ferias-cell-acao"></span>
    `;
    body.appendChild(head);

    membros.forEach(m => body.appendChild(buildFeriasRow(m)));

    return col;
}

function buildFeriasRow(m) {
    const cfg = TEAM_CONFIG[m.teamKey] || {};
    const row = document.createElement('div');
    row.className  = 'ferias-row';
    row.dataset.id = m.id;

    row.innerHTML = `
        <span class="ferias-cell ferias-cell-nome">
            <span class="ferias-team-dot" style="background:${cfg.color || '#888'}"></span>
            <span class="ferias-nome" title="${m.nome}">${firstName(m.nome)}</span>
        </span>
        <span class="ferias-cell ferias-cell-data">
            <input type="date" class="ferias-date-input" data-id="${m.id}" data-field="feriasInicio" value="${m.feriasInicio || ''}">
        </span>
        <span class="ferias-cell ferias-cell-data">
            <input type="date" class="ferias-date-input" data-id="${m.id}" data-field="feriasFim" value="${m.feriasFim || ''}">
        </span>
        <span class="ferias-cell ferias-cell-acao">
            <button class="ferias-retornar-btn" data-id="${m.id}" title="Marcar retorno de férias">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
        </span>
    `;

    row.querySelectorAll('.ferias-date-input').forEach(input => {
        input.addEventListener('change', () => {
            const found = findMemberAnyTeam(input.dataset.id);
            if (!found) return;
            const campo = input.dataset.field;
            found.member[campo] = input.value || null;
            saveState();
            logAction('ferias_data_atualizada', {
                nome: found.member.nome, equipe: found.teamKey,
                campo, valor: input.value || null,
            });
        });
    });

    row.querySelector('.ferias-retornar-btn').addEventListener('click', () => {
        const found = findMemberAnyTeam(m.id);
        if (!found) return;
        found.member.ferias = false;
        saveState();
        renderFerias();
        logAction('ferias_removidas', { nome: found.member.nome, equipe: found.teamKey });
    });

    return row;
}

// ─── COLUNA: PRÓXIMAS FÉRIAS ──────────────────
function getProgramacoes() {
    return state.feriasProgramadas || [];
}

function ensureProgramacoesArray() {
    if (!state.feriasProgramadas) state.feriasProgramadas = [];
    return state.feriasProgramadas;
}

function getMesKey(dataStr) {
    if (!dataStr) return null;
    return dataStr.slice(0, 7); // YYYY-MM
}

function buildMesesFuturos(qtd = MESES_A_EXIBIR) {
    const hoje = new Date();
    const meses = [];
    for (let i = 0; i < qtd; i++) {
        const d     = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
        const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = capitalize(d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
        meses.push({ key, label });
    }
    return meses;
}

function buildProximasColumn() {
    const col   = document.createElement('div');
    col.className = 'ferias-col';
    const meses = buildMesesFuturos();
    const progs = getProgramacoes();

    col.innerHTML = `
        <div class="ferias-col-header">
            <div class="ferias-col-header-top">
                <span class="ferias-col-name">Próximas férias</span>
                <span class="ferias-col-badge">${progs.length}</span>
            </div>
            <div class="ferias-col-sub">Clique no mês para ver ou programar</div>
        </div>
        <div class="ferias-col-body" id="ferias-proximas-body"></div>
    `;

    const body = col.querySelector('#ferias-proximas-body');
    meses.forEach(mes => body.appendChild(buildMesBloco(mes, progs)));

    return col;
}

function buildMesBloco(mes, progs) {
    const itens      = progs
        .filter(p => getMesKey(p.dataInicio) === mes.key)
        .sort((a, b) => (a.dataInicio || '').localeCompare(b.dataInicio || ''));
    const expandido  = mesesExpandidos.has(mes.key);

    const bloco = document.createElement('div');
    bloco.className   = `ferias-mes-bloco${expandido ? ' ferias-mes-expandido' : ''}`;
    bloco.dataset.mes = mes.key;

    bloco.innerHTML = `
        <button class="ferias-mes-header" type="button">
            <svg class="ferias-mes-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            <span class="ferias-mes-label">${mes.label}</span>
            <span class="ferias-mes-badge${itens.length > 0 ? ' ferias-mes-badge-ativo' : ''}">${itens.length}</span>
        </button>
        <div class="ferias-mes-content"></div>
    `;

    bloco.querySelector('.ferias-mes-header').addEventListener('click', () => {
        if (mesesExpandidos.has(mes.key)) mesesExpandidos.delete(mes.key);
        else mesesExpandidos.add(mes.key);
        renderFerias();
    });

    const content = bloco.querySelector('.ferias-mes-content');
    if (!expandido) {
        content.style.display = 'none';
    } else {
        if (itens.length === 0) {
            const empty = document.createElement('div');
            empty.className   = 'ferias-empty ferias-empty-mes';
            empty.textContent = 'Nenhuma férias programada para este mês';
            content.appendChild(empty);
        } else {
            itens.forEach(p => content.appendChild(buildProgramacaoRow(p)));
        }

        const addBtn = document.createElement('button');
        addBtn.className = 'ferias-programar-btn';
        addBtn.type       = 'button';
        addBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Programar férias
        `;
        addBtn.addEventListener('click', () => openProgramarModal(mes));
        content.appendChild(addBtn);
    }

    return bloco;
}

function buildProgramacaoRow(p) {
    const found        = findMemberAnyTeam(p.memberId);
    const cfg           = TEAM_CONFIG[p.teamKey] || {};
    const nomeExibido   = found ? found.member.nome : (p.nome || 'Colaborador removido');

    const row = document.createElement('div');
    row.className  = 'ferias-row ferias-prog-row';
    row.dataset.id = p.id;

    row.innerHTML = `
        <span class="ferias-cell ferias-cell-nome">
            <span class="ferias-team-dot" style="background:${cfg.color || '#888'}"></span>
            <span class="ferias-nome" title="${nomeExibido}">${firstName(nomeExibido)}</span>
        </span>
        <span class="ferias-cell ferias-cell-data">
            <input type="date" class="ferias-date-input" data-id="${p.id}" data-field="dataInicio" value="${p.dataInicio || ''}">
        </span>
        <span class="ferias-cell ferias-cell-data">
            <input type="date" class="ferias-date-input" data-id="${p.id}" data-field="dataFim" value="${p.dataFim || ''}">
        </span>
        <span class="ferias-cell ferias-cell-acao">
            <button class="ferias-retornar-btn ferias-prog-remove" data-id="${p.id}" title="Remover programação">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </span>
    `;

    row.querySelectorAll('.ferias-date-input').forEach(input => {
        input.addEventListener('change', () => {
            const arr   = ensureProgramacoesArray();
            const entry = arr.find(e => e.id === p.id);
            if (!entry) return;
            entry[input.dataset.field] = input.value || null;
            saveState();
            renderFerias();
            logAction('ferias_programada_atualizada', {
                nome: nomeExibido, campo: input.dataset.field, valor: input.value || null,
            });
        });
    });

    row.querySelector('.ferias-prog-remove').addEventListener('click', () => {
        const arr = ensureProgramacoesArray();
        const idx = arr.findIndex(e => e.id === p.id);
        if (idx !== -1) arr.splice(idx, 1);
        saveState();
        renderFerias();
        showToast(`Programação de ${firstName(nomeExibido)} removida`, 'success');
        logAction('ferias_programada_removida', { nome: nomeExibido });
    });

    return row;
}

// ─── MODAL: PROGRAMAR FÉRIAS ──────────────────
function openProgramarModal(mes) {
    const colaboradores  = getTodosColaboradores();
    const datalistOptions = colaboradores.map(c => `<option value="${c.nome}"></option>`).join('');

    const defaultInicio = `${mes.key}-01`;

    document.getElementById('modalTitle').textContent = `Programar férias — ${mes.label}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="form-group">
            <label class="form-label">Colaborador</label>
            <input type="text" class="form-input" id="progColaborador" list="progColaboradorList"
                placeholder="Digite o nome do colaborador" autocomplete="off">
            <datalist id="progColaboradorList">${datalistOptions}</datalist>
        </div>
        <div class="form-row">
            <div class="form-group" style="flex:1">
                <label class="form-label">Início</label>
                <input type="date" class="form-input" id="progInicio" value="${defaultInicio}">
            </div>
            <div class="form-group" style="flex:1">
                <label class="form-label">Término</label>
                <input type="date" class="form-input" id="progFim">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" id="modalCancelBtn">Cancelar</button>
            <button class="btn-modal-primary" id="modalConfirmBtn">Programar</button>
        </div>
    `;
    document.getElementById('modalOverlay').classList.add('open');

    const inputColaborador = document.getElementById('progColaborador');
    inputColaborador.focus();
    inputColaborador.addEventListener('input', () => { inputColaborador.style.borderColor = ''; });
    inputColaborador.addEventListener('keydown', e => { if (e.key === 'Enter') confirmProgramar(mes, colaboradores); });

    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', () => confirmProgramar(mes, colaboradores));
}

function confirmProgramar(mes, colaboradores) {
    const input = document.getElementById('progColaborador');
    const typed = input.value.trim();
    const match = colaboradores.find(c => c.nome.trim().toUpperCase() === typed.toUpperCase());

    if (!typed || !match) {
        input.style.borderColor = 'var(--red)';
        return;
    }

    const dataInicio = document.getElementById('progInicio').value || null;
    const dataFim     = document.getElementById('progFim').value || null;

    const arr = ensureProgramacoesArray();
    arr.push({ id: uid(), memberId: match.id, teamKey: match.teamKey, nome: match.nome, dataInicio, dataFim });
    saveState();
    closeModal();

    mesesExpandidos.add(getMesKey(dataInicio) || mes.key);
    renderFerias();
    showToast(`Férias de ${firstName(match.nome)} programadas`, 'success');
    logAction('ferias_programada_criada', { nome: match.nome, teamKey: match.teamKey, dataInicio, dataFim });
}
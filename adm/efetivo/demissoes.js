// =============================================
//  DEMISSOES.JS — v1
//  • Lista colaboradores marcados como "futura demissão" (tipo === 'demissao')
//  • Nome | Previsão de desligamento | Motivo | Status
//  • Campos sempre visíveis e editáveis inline
//  • Persistente: salvo junto do state principal (Firebase)
// =============================================

import { state, TEAM_CONFIG, firstName, saveState, logAction } from './equipes-core.js';

const STATUS_OPTIONS = [
    { value: 'previsto',     label: 'Previsto no radar' },
    { value: 'deliberacao',  label: 'Em deliberação' },
    { value: 'aprovado',     label: 'Aprovado' },
    { value: 'reprovado',    label: 'Reprovado' },
];

// ─── RENDER PRINCIPAL ────────────────────────
export function renderDemissoes() {
    const container = document.getElementById('demissoes-board');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(buildColuna());
}

// ─── HELPERS ─────────────────────────────────
function getTodosDemissao() {
    const lista = [];
    Object.keys(TEAM_CONFIG).forEach(teamKey => {
        (state[teamKey] || []).forEach(m => {
            if (m.tipo === 'demissao') lista.push({ ...m, teamKey });
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

function escapeAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ─── COLUNA ──────────────────────────────────
function buildColuna() {
    const membros = getTodosDemissao();

    const col = document.createElement('div');
    col.className = 'dem-col';
    col.innerHTML = `
        <div class="dem-col-header">
            <div class="dem-col-header-top">
                <span class="dem-col-name">Futuras demissões</span>
                <span class="dem-col-badge">${membros.length}</span>
            </div>
            <div class="dem-col-sub">Preencha previsão, motivo e status</div>
        </div>
        <div class="dem-col-body" id="dem-body"></div>
    `;

    const body = col.querySelector('#dem-body');

    if (membros.length === 0) {
        const empty = document.createElement('div');
        empty.className   = 'dem-empty';
        empty.textContent = 'Nenhum colaborador marcado como futura demissão';
        body.appendChild(empty);
        return col;
    }

    const head = document.createElement('div');
    head.className = 'dem-row dem-row-head';
    head.innerHTML = `
        <span class="dem-cell dem-cell-nome">Colaborador</span>
        <span class="dem-cell">Previsão</span>
        <span class="dem-cell">Motivo</span>
        <span class="dem-cell">Status</span>
        <span class="dem-cell dem-cell-acao"></span>
    `;
    body.appendChild(head);

    membros.forEach(m => body.appendChild(buildRow(m)));

    return col;
}

function buildRow(m) {
    const cfg    = TEAM_CONFIG[m.teamKey] || {};
    const status = m.demissaoStatus || 'previsto';

    const row = document.createElement('div');
    row.className  = 'dem-row';
    row.dataset.id = m.id;

    const statusOptionsHtml = STATUS_OPTIONS.map(opt =>
        `<option value="${opt.value}" ${opt.value === status ? 'selected' : ''}>${opt.label}</option>`
    ).join('');

    row.innerHTML = `
        <span class="dem-cell dem-cell-nome">
            <span class="dem-team-dot" style="background:${cfg.color || '#888'}"></span>
            <span class="dem-nome" title="${m.nome}">${firstName(m.nome)}</span>
        </span>
        <span class="dem-cell">
            <input type="date" class="dem-date-input" data-id="${m.id}" data-field="demissaoData" value="${m.demissaoData || ''}">
        </span>
        <span class="dem-cell">
            <input type="text" class="dem-motivo-input" data-id="${m.id}" data-field="demissaoMotivo"
                placeholder="Motivo" value="${m.demissaoMotivo ? escapeAttr(m.demissaoMotivo) : ''}">
        </span>
        <span class="dem-cell">
            <select class="dem-status-select dem-status-${status}" data-id="${m.id}">
                ${statusOptionsHtml}
            </select>
        </span>
        <span class="dem-cell dem-cell-acao">
            <button class="dem-remover-btn" data-id="${m.id}" title="Remover de futura demissão">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
        </span>
    `;

    row.querySelectorAll('.dem-date-input, .dem-motivo-input').forEach(input => {
        input.addEventListener('change', () => {
            const found = findMemberAnyTeam(input.dataset.id);
            if (!found) return;
            const campo = input.dataset.field;
            found.member[campo] = input.value || null;
            saveState();
            logAction('demissao_dados_atualizados', {
                nome: found.member.nome, equipe: found.teamKey,
                campo, valor: input.value || null,
            });
        });
    });

    const select = row.querySelector('.dem-status-select');
    select.addEventListener('change', () => {
        const found = findMemberAnyTeam(select.dataset.id);
        if (!found) return;
        found.member.demissaoStatus = select.value;
        saveState();
        select.className = `dem-status-select dem-status-${select.value}`;
        logAction('demissao_status_atualizado', {
            nome: found.member.nome, equipe: found.teamKey, status: select.value,
        });
    });

    row.querySelector('.dem-remover-btn').addEventListener('click', () => {
        const found = findMemberAnyTeam(m.id);
        if (!found) return;
        found.member.tipo = 'colaborador';
        saveState();
        renderDemissoes();
        logAction('demissao_removida', { nome: found.member.nome, equipe: found.teamKey });
    });

    return row;
}
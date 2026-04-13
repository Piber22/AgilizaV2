// =============================================
//  EQUIPES-RENDER.JS — Board · Cards · Drag
// =============================================

import { TEAM_CONFIG, state, saveState, findColaborador, firstName, getHorarioLabel } from './equipes-core.js';
import { showAddModal } from './equipes-ui.js';

// ─── RENDER PRINCIPAL ────────────────────────
export function render() {
    renderBoard();
    renderStats();
}

export function renderStats() {
    let total = 0, ativos = 0, vagas = 0, candidatos = 0, demissao = 0;
    for (const [teamKey, members] of Object.entries(state)) {
        const cfg      = TEAM_CONFIG[teamKey];
        if (!cfg) continue;
        const cap      = cfg.capacity;
        const isNoLimit = cfg.noLimit; // afastados

        const colabs   = members.filter(m => m.tipo === 'colaborador' || m.tipo === 'demissao').length;
        const cands    = members.filter(m => m.tipo === 'candidato' && !m.substitutoDe).length;
        const totalFilled = colabs + cands;

        // Total = todos os colaboradores (inclusive afastados e lideranças)
        total += colabs;

        // Ativos = colaboradores efetivados exceto afastados
        // "demissao" é apenas flag visual — a pessoa ainda está ativa
        if (teamKey !== 'afastados') {
            ativos += members.filter(m => m.tipo === 'colaborador' || m.tipo === 'demissao').length;
        }

        candidatos += members.filter(m => m.tipo === 'candidato').length;
        demissao   += members.filter(m => m.tipo === 'demissao').length;

        // Vagas abertas: todas as equipes com capacidade definida (exceto afastados)
        if (!isNoLimit) {
            const v = cap - totalFilled;
            if (v > 0) vagas += v;
        }
    }
    document.getElementById('statTotal').textContent      = total;
    document.getElementById('statAtivos').textContent     = ativos;
    document.getElementById('statVagas').textContent      = vagas;
    document.getElementById('statCandidatos').textContent = candidatos;
    document.getElementById('statDemissao').textContent   = demissao;
}

export function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    // ── Linha principal: equipes operacionais ──
    const mainTeams   = ['graciela', 'giovana', 'jessica', 'franciele', 'alisson'];
    const specialTeams = ['liderancas', 'administrativo', 'afastados'];

    const rowMain = document.createElement('div');
    rowMain.className = 'board-row-main';
    mainTeams.forEach(key => {
        const cfg = TEAM_CONFIG[key];
        if (cfg) rowMain.appendChild(renderTeamColumn(key, cfg));
    });
    board.appendChild(rowMain);

    // ── Separador ──
    const label = document.createElement('div');
    label.className   = 'board-section-label';
    label.textContent = 'Outras categorias';
    board.appendChild(label);

    // ── Linha especial ──
    const rowSpecial = document.createElement('div');
    rowSpecial.className = 'board-row-special';
    specialTeams.forEach(key => {
        const cfg = TEAM_CONFIG[key];
        if (cfg) rowSpecial.appendChild(renderTeamColumn(key, cfg));
    });
    board.appendChild(rowSpecial);
}

export function renderTeamColumn(teamKey, cfg) {
    const members      = state[teamKey] || [];
    const cap          = cfg.capacity;
    const isNoLimit    = cfg.noLimit; // afastados — sem capacidade máxima
    const colabCount   = members.filter(m => m.tipo === 'colaborador' || m.tipo === 'demissao').length;
    const candCount    = members.filter(m => m.tipo === 'candidato' && !m.substitutoDe).length;
    const totalFilled  = colabCount + candCount;
    const vagasAbertas = isNoLimit ? 0 : Math.max(0, cap - totalFilled);
    const pct          = isNoLimit ? 0 : Math.min(100, Math.round((totalFilled / cap) * 100));
    const isFull       = isNoLimit ? true : totalFilled >= cap;
    const progressColor = pct >= 100 ? '#22c55e' : pct >= 70 ? cfg.color : '#e94b22';

    const col = document.createElement('div');
    col.className    = 'team-column';
    col.dataset.team = teamKey;

    col.innerHTML = `
        <div class="team-header">
            <div class="team-header-top">
                <span class="team-name" style="color:${cfg.color}">${cfg.name}</span>
                <div style="display:flex;align-items:center;gap:6px">
                    <button class="btn-sort" data-team="${teamKey}" title="Ordenar A–Z">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
                    </button>
                    <span class="team-badge ${isNoLimit ? '' : (isFull ? 'badge-ok' : 'badge-warn')}">${isNoLimit ? totalFilled : `${totalFilled}/${cap}`}</span>
                </div>
            </div>
            <div class="team-progress">
                <div class="team-progress-fill" style="width:${isNoLimit ? 0 : pct}%;background:${progressColor}"></div>
            </div>
            <div class="team-capacity">${isNoLimit ? `${totalFilled} ${totalFilled === 1 ? 'pessoa' : 'pessoas'}` : vagasAbertas > 0 ? `${vagasAbertas} vaga${vagasAbertas > 1 ? 's' : ''} aberta${vagasAbertas > 1 ? 's' : ''}` : 'Equipe completa'}</div>
        </div>
        <div class="team-body" id="body-${teamKey}"></div>
    `;

    const body = col.querySelector(`#body-${teamKey}`);

    // Renderiza membros. Substitutos ficam embutidos no card do titular.
    const rendered = new Set();
    members.forEach(member => {
        if (rendered.has(member.id) || member.substitutoDe) return;
        rendered.add(member.id);
        const substituto = members.find(m => m.substitutoDe === member.id) || null;
        const card = renderCard(member, teamKey, substituto);
        body.appendChild(card);
        if (substituto) rendered.add(substituto.id);
    });

    // Vagas abertas
    for (let i = 0; i < vagasAbertas; i++) {
        const vaga = document.createElement('div');
        vaga.className = 'vaga-slot';
        vaga.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Vaga aberta`;
        vaga.addEventListener('click', () => showAddModal(teamKey));
        body.appendChild(vaga);
    }

    // Botão ordenar A-Z
    col.querySelector('.btn-sort').addEventListener('click', e => {
        e.stopPropagation();
        sortTeamAlpha(teamKey);
    });

    // Drag entre equipes (drop na coluna)
    col.addEventListener('dragover',  onDragOver);
    col.addEventListener('dragleave', onDragLeave);
    col.addEventListener('drop',      onDrop);

    return col;
}

// ─── CARD ────────────────────────────────────
export function renderCard(member, teamKey, substituto = null) {
    const card = document.createElement('div');

    if (substituto) {
        card.className   = 'colab-card colab-card-split';
        card.dataset.id  = member.id;
        card.draggable   = true;

        const horT = getHorarioLabel(member);
        const horS = getHorarioLabel(substituto);

        card.innerHTML = `
            <div class="split-half split-left" data-id="${member.id}">
                <div class="colab-info">
                    <div class="colab-name" title="${member.nome}">${firstName(member.nome)}</div>
                    <span class="colab-sub" style="color:#873BFF">Saindo</span>
                    ${horT ? `<span class="colab-horario">${horT}</span>` : ''}
                </div>
            </div>
            <div class="split-divider"></div>
            <div class="split-half split-right" data-id="${substituto.id}">
                <div class="colab-info">
                    <div class="colab-name colab-name-sub" title="${substituto.nome}">${firstName(substituto.nome)}</div>
                    <span class="colab-sub" style="color:var(--blue)">Entrando</span>
                    ${horS ? `<span class="colab-horario">${horS}</span>` : ''}
                </div>
            </div>
        `;

        card.querySelector('.split-left').addEventListener('click', e => {
            e.stopPropagation();
            import('./equipes-ui.js').then(m => m.showContextMenu(e, member.id, teamKey));
        });
        card.querySelector('.split-right').addEventListener('click', e => {
            e.stopPropagation();
            import('./equipes-ui.js').then(m => m.showContextMenu(e, substituto.id, teamKey));
        });
        card.addEventListener('dragstart', e => onDragStart(e, member.id, teamKey));
        card.addEventListener('dragend',   onDragEnd);

    } else {
        card.className  = `colab-card tipo-${member.tipo}`;
        card.dataset.id = member.id;
        card.draggable  = true;

        let subText = '';
        if (member.tipo === 'candidato') subText = '<span class="colab-sub">Candidato</span>';
        if (member.tipo === 'demissao')  subText = '<span class="colab-sub" style="color:#873BFF">Futura Demissão</span>';

        const horLabel  = getHorarioLabel(member);
        const horarioEl = horLabel ? `<span class="colab-horario">${horLabel}</span>` : '';

        card.innerHTML = `
            <div class="colab-info">
                <div class="colab-name" title="${member.nome}">${firstName(member.nome)}</div>
                ${subText}
            </div>
            ${horarioEl}
        `;

        card.addEventListener('dragstart', e => onDragStart(e, member.id, teamKey));
        card.addEventListener('dragend',   onDragEnd);
        card.addEventListener('click', e => {
            e.stopPropagation();
            import('./equipes-ui.js').then(m => m.showContextMenu(e, member.id, teamKey));
        });
    }

    return card;
}

// ─── DRAG AND DROP ───────────────────────────
// dragData agora guarda: id, fromTeam, fromIndex (posição no array), e se é reordenação interna
let dragData = null;

function onDragStart(e, id, fromTeam) {
    const members  = state[fromTeam];
    // Índice real no array (excluindo substitutos pois ficam embutidos)
    const fromIndex = members.findIndex(m => m.id === id);
    dragData = { id, fromTeam, fromIndex };
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id); // necessário para Firefox
}

function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drag-over, .drop-above, .drop-below')
        .forEach(el => el.classList.remove('drag-over', 'drop-above', 'drop-below'));
    // Remove placeholder se existir
    document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
}

function onDragOver(e) {
    e.preventDefault();
    const col = e.currentTarget.closest('.team-column');
    if (!col) return;

    const toTeam = col.dataset.team;

    if (dragData && toTeam === dragData.fromTeam) {
        // Reordenação interna: mostra indicador de posição
        col.classList.remove('drag-over');
        const body    = col.querySelector('.team-body');
        const cards   = [...body.querySelectorAll('.colab-card:not(.dragging)')];
        const overCard = cards.find(c => {
            const r = c.getBoundingClientRect();
            return e.clientY >= r.top && e.clientY <= r.bottom;
        });
        cards.forEach(c => c.classList.remove('drop-above', 'drop-below'));
        if (overCard) {
            const r   = overCard.getBoundingClientRect();
            const mid = r.top + r.height / 2;
            overCard.classList.add(e.clientY < mid ? 'drop-above' : 'drop-below');
        }
    } else {
        // Mover para outra equipe
        col.classList.add('drag-over');
    }

    e.dataTransfer.dropEffect = 'move';
}

function onDragLeave(e) {
    const col = e.currentTarget.closest('.team-column');
    if (col && !col.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
        col.querySelectorAll('.drop-above, .drop-below')
           .forEach(el => el.classList.remove('drop-above', 'drop-below'));
    }
}

function onDrop(e) {
    e.preventDefault();
    const col = e.currentTarget.closest('.team-column');
    if (!col) return;
    col.classList.remove('drag-over');
    if (!dragData) return;

    const toTeam = col.dataset.team;

    if (toTeam === dragData.fromTeam) {
        // ── Reordenação interna ──
        const body    = col.querySelector('.team-body');
        const cards   = [...body.querySelectorAll('.colab-card:not(.dragging)')];
        let insertBefore = null;

        for (const c of cards) {
            const r   = c.getBoundingClientRect();
            const mid = r.top + r.height / 2;
            if (e.clientY < mid) { insertBefore = c; break; }
        }

        // Descobrir o id do card sobre o qual estamos
        const targetId = insertBefore ? insertBefore.dataset.id : null;

        reorderMember(dragData.id, dragData.fromTeam, targetId);
    } else {
        // ── Mover para outra equipe ──
        moveColaborador(dragData.id, dragData.fromTeam, toTeam);
    }

    col.querySelectorAll('.drop-above, .drop-below')
       .forEach(el => el.classList.remove('drop-above', 'drop-below'));
    dragData = null;
}

// ─── REORDENAR dentro da mesma equipe ────────
function reorderMember(id, teamKey, beforeId) {
    const arr = state[teamKey];
    const fromIdx = arr.findIndex(m => m.id === id);
    if (fromIdx === -1) return;

    const [member] = arr.splice(fromIdx, 1);

    if (!beforeId) {
        // Soltar no fim
        arr.push(member);
    } else {
        const toIdx = arr.findIndex(m => m.id === beforeId);
        if (toIdx === -1) arr.push(member);
        else arr.splice(toIdx, 0, member);
    }

    saveState();
    // Importação dinâmica para evitar circularidade
    import('./equipes-render.js').then(m => m.render());
}

// ─── MOVER para outra equipe ─────────────────
export function moveColaborador(id, fromTeam, toTeam) {
    const fromArr = state[fromTeam];
    const idx     = fromArr.findIndex(m => m.id === id);
    if (idx === -1) return;
    const member = { ...fromArr[idx] };
    fromArr.splice(idx, 1);
    state[toTeam].push(member);
    saveState();
    import('./equipes-render.js').then(m => m.render());
    import('./equipes-core.js').then(core => {
        import('./equipes-ui.js').then(ui => ui.showToast(`${member.nome} movido para ${TEAM_CONFIG[toTeam].name}`, 'success'));
        core.logAction('colaborador_movido', { nome: member.nome, de: fromTeam, para: toTeam });
    });
}

// ─── ORDENAR A-Z ─────────────────────────────
function sortTeamAlpha(teamKey) {
    state[teamKey].sort((a, b) => a.nome.localeCompare(b.nome));
    saveState();
    import('./equipes-render.js').then(m => m.render());
}
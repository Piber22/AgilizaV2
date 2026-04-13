// =============================================
//  DIMENSIONAMENTO.JS  — v3
//  • Firebase: 1 doc por data (hsana_dim/YYYY-MM-DD)
//  • Abre sempre em branco para hoje
//  • Seletor de data para carregar histórico
//  • Salva automaticamente (debounce 800ms)
//  • onSnapshot para sync em tempo real
// =============================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state, TEAM_CONFIG, firstName } from './equipes-core.js';

// ─── FIREBASE ────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyCHelcLpwL0m6_YvXSGU2HVLU3dTQH7-is",
    authDomain:        "efetivo-9fc97.firebaseapp.com",
    projectId:         "efetivo-9fc97",
    storageBucket:     "efetivo-9fc97.firebasestorage.app",
    messagingSenderId: "893083830998",
    appId:             "1:893083830998:web:d6bf5f7913ff9590dd5777"
};

// Reusa app já inicializado pelo equipes-core.js
const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db          = getFirestore(firebaseApp);

// ─── CONFIG ──────────────────────────────────
const SETORES = [
    '5º Andar — Prolongados',
    '5º Andar — Giro Rápido',
    '5º Andar — UTI',
    '4º Andar — Lado A',
    '4º Andar — Lado B',
    '3º Andar',
    '2º Andar / Bloco',
    'Saúde Mental — Feminina',
    'Saúde Mental — Masculina',
    'Térreo — Internação e ADM',
    'Rouparia',
    'Resíduos / Área Suja',
];

// ─── STATE ───────────────────────────────────
let equipeEscolhida = 'giovana';

// dimState: { [setor]: [{id, nome, sourceTeam}] }
let dimState = {};
SETORES.forEach(s => { dimState[s] = []; });

// ausentes: { [teamKey]: [id, ...] }  (arrays para serializar no Firebase)
let ausentes = { giovana: [], graciela: [], alisson: [] };

let dimDrag      = null;
let dimCtxTarget = null;

// Data selecionada
let selectedDate = todayStr();

// Controle de sync em tempo real
let _unsubscribeDim = null;
let _isSavingDim    = false;
let _saveTimer      = null;

// ─── HELPERS DATA ────────────────────────────
function todayStr() {
    return new Date().toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).split('/').reverse().join('-'); // YYYY-MM-DD
}

function dateDocId(dateStr) {
    return dateStr; // YYYY-MM-DD como ID
}

function getDimDoc(dateStr) {
    return doc(db, 'hsana_dim', dateDocId(dateStr));
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000)
        .toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
        .split('/').reverse().join('-');
    if (dateStr === today) return `Hoje — ${d}/${m}/${y}`;
    if (dateStr === yesterday) return `Ontem — ${d}/${m}/${y}`;
    return `${d}/${m}/${y}`;
}

// ─── SERIALIZAÇÃO ────────────────────────────
function serializeDimState() {
    // Converte Sets para arrays antes de salvar
    const serializedAusentes = {};
    for (const [k, v] of Object.entries(ausentes)) {
        serializedAusentes[k] = Array.isArray(v) ? v : [...v];
    }
    return {
        dimState:       dimState,
        ausentes:       serializedAusentes,
        equipeEscolhida,
        updatedAt:      serverTimestamp(),
    };
}

function deserializeDimState(data) {
    if (!data) return;
    // Restaura dimState
    if (data.dimState) {
        dimState = {};
        SETORES.forEach(s => { dimState[s] = data.dimState[s] || []; });
    }
    // Restaura ausentes como arrays
    if (data.ausentes) {
        ausentes = {};
        for (const [k, v] of Object.entries(data.ausentes)) {
            ausentes[k] = Array.isArray(v) ? v : [];
        }
        // Garante chaves de todos os times
        ['giovana','graciela','alisson'].forEach(k => {
            if (!ausentes[k]) ausentes[k] = [];
        });
    }
    if (data.equipeEscolhida) equipeEscolhida = data.equipeEscolhida;
}

// ─── FIREBASE SAVE / LOAD ────────────────────
function saveDim() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
        try {
            _isSavingDim = true;
            await setDoc(getDimDoc(selectedDate), serializeDimState());
            updateSaveStatus('saved');
        } catch (err) {
            console.warn('[Dim] Erro ao salvar:', err);
            _isSavingDim = false;
            updateSaveStatus('error');
        }
    }, 800);
    updateSaveStatus('saving');
}

async function loadDim(dateStr) {
    try {
        const snap = await getDoc(getDimDoc(dateStr));
        if (snap.exists()) {
            deserializeDimState(snap.data());
            return true;
        }
    } catch (err) {
        console.warn('[Dim] Erro ao carregar:', err);
    }
    return false;
}

function subscribeDim(dateStr) {
    if (_unsubscribeDim) { _unsubscribeDim(); _unsubscribeDim = null; }
    _unsubscribeDim = onSnapshot(getDimDoc(dateStr), snap => {
        if (_isSavingDim) { _isSavingDim = false; return; }
        if (!snap.exists()) return;
        deserializeDimState(snap.data());
        renderDimensionamento();
    });
}

function updateSaveStatus(status) {
    const el = document.getElementById('dimSaveStatus');
    if (!el) return;
    if (status === 'saving') {
        el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dim-spin"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> Salvando...`;
        el.style.color = 'var(--text3)';
    } else if (status === 'saved') {
        el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Salvo`;
        el.style.color = 'var(--green)';
    } else if (status === 'error') {
        el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Erro ao salvar`;
        el.style.color = 'var(--red)';
    }
}

// ─── INIT PÚBLICA ────────────────────────────
export async function initDimensionamento() {
    mountCtxMenu();
    // Sempre inicia em branco com a data de hoje
    selectedDate = todayStr();
    resetLocalState();
    updateDatePicker();
    renderDimensionamento();
    // Subscreve em tempo real para hoje (não carrega dados anteriores)
    subscribeDim(selectedDate);
}

function resetLocalState() {
    dimState = {};
    SETORES.forEach(s => { dimState[s] = []; });
    ausentes = { giovana: [], graciela: [], alisson: [] };
}

// ─── RESET PÚBLICO ───────────────────────────
export function clearDimState() {
    resetLocalState();
    saveDim();
    renderDimensionamento();
}

// ─── RENDER PRINCIPAL ────────────────────────
export function renderDimensionamento() {
    const container = document.getElementById('dim-board');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(buildSourceColumn(equipeEscolhida));
    container.appendChild(buildSourceColumn('alisson'));
    container.appendChild(buildSetoresColumn());
}

// ─── DATA PICKER ─────────────────────────────
function updateDatePicker() {
    const input = document.getElementById('dimDatePicker');
    if (input) input.value = selectedDate;
    const label = document.getElementById('dimDateLabel');
    if (label) label.textContent = formatDateDisplay(selectedDate);
    const isToday = selectedDate === todayStr();
    const readBadge = document.getElementById('dimReadOnlyBadge');
    if (readBadge) readBadge.style.display = isToday ? 'none' : 'flex';
}

export function initDatePicker() {
    const input = document.getElementById('dimDatePicker');
    if (!input) return;
    input.value = selectedDate;
    input.max   = todayStr();

    input.addEventListener('change', async () => {
        const newDate = input.value;
        if (!newDate) return;

        // Unsubscribe do dia anterior
        if (_unsubscribeDim) { _unsubscribeDim(); _unsubscribeDim = null; }

        selectedDate = newDate;
        resetLocalState();
        updateDatePicker();
        renderDimensionamento(); // mostra em branco enquanto carrega

        const found = await loadDim(newDate);
        if (found) {
            renderDimensionamento();
        }

        // Só faz subscribe em tempo real se for hoje
        if (newDate === todayStr()) {
            subscribeDim(newDate);
        }
    });
}

// ─── COLUNA FONTE ────────────────────────────
function getMembersOf(teamKey) {
    return (state[teamKey] || []).filter(m =>
        m.tipo === 'colaborador' || m.tipo === 'demissao'
    );
}

function getAlocadosSet(teamKey) {
    const ids = new Set();
    Object.values(dimState).forEach(lista =>
        lista.forEach(a => { if (a.sourceTeam === teamKey) ids.add(a.id); })
    );
    return ids;
}

function isAusente(teamKey, id) {
    return (ausentes[teamKey] || []).includes(id);
}

function totalAlocados() {
    return Object.values(dimState).reduce((acc, l) => acc + l.length, 0);
}

function buildSourceColumn(teamKey) {
    const cfg          = TEAM_CONFIG[teamKey];
    const members      = getMembersOf(teamKey);
    const alocados     = getAlocadosSet(teamKey);
    const ausenteLst   = members.filter(m => isAusente(teamKey, m.id));
    const presentes    = members.filter(m => !isAusente(teamKey, m.id));
    const alocCount    = [...alocados].filter(id => !isAusente(teamKey, id)).length;
    const isToggleable = teamKey === 'giovana' || teamKey === 'graciela';
    const outra        = teamKey === 'giovana' ? 'graciela' : 'giovana';
    const outraCfg     = TEAM_CONFIG[outra];
    const isReadOnly   = selectedDate !== todayStr();

    const col = document.createElement('div');
    col.className    = 'dim-col';
    col.dataset.team = teamKey;

    col.innerHTML = `
        <div class="dim-col-header" style="border-top:3px solid ${cfg.color}">
            <div class="dim-col-header-top">
                <span class="dim-col-name" style="color:${cfg.color}">${cfg.name}</span>
                <div style="display:flex;align-items:center;gap:6px">
                    ${isToggleable && !isReadOnly ? `<button class="dim-toggle-btn" id="dimToggleBtn">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
                        ${outraCfg.name}
                    </button>` : ''}
                    <span class="dim-col-badge">${alocCount}/${presentes.length}</span>
                </div>
            </div>
            <div class="dim-col-sub">
                ${presentes.length - alocCount} disponíve${presentes.length - alocCount !== 1 ? 'is' : 'l'}
                ${ausenteLst.length > 0 ? `· <span style="color:var(--red)">${ausenteLst.length} ausente${ausenteLst.length > 1 ? 's' : ''}</span>` : ''}
            </div>
        </div>
        <div class="dim-col-body" id="dim-src-${teamKey}"></div>
    `;

    const body = col.querySelector(`#dim-src-${teamKey}`);
    presentes.forEach(m => body.appendChild(buildSrcCard(m, teamKey, alocados.has(m.id), false, isReadOnly)));

    if (ausenteLst.length > 0) {
        const sep = document.createElement('div');
        sep.className   = 'dim-ausente-sep';
        sep.textContent = 'Ausentes';
        body.appendChild(sep);
        ausenteLst.forEach(m => body.appendChild(buildSrcCard(m, teamKey, false, true, isReadOnly)));
    }

    col.querySelector('#dimToggleBtn')?.addEventListener('click', () => {
        equipeEscolhida = equipeEscolhida === 'giovana' ? 'graciela' : 'giovana';
        saveDim();
        renderDimensionamento();
    });

    return col;
}

function buildSrcCard(m, teamKey, isAlocado, isAus, isReadOnly) {
    const card = document.createElement('div');
    card.className  = `dim-src-card${isAlocado ? ' dim-src-alocado' : ''}${isAus ? ' dim-src-ausente' : ''}`;
    card.draggable  = !isAus && !isReadOnly;
    card.dataset.id = m.id;

    const setoresDestino = SETORES.filter(s => dimState[s].some(a => a.id === m.id));
    const setorTag = setoresDestino.length > 0
        ? `<span class="dim-src-tag">${setoresDestino.length} setor${setoresDestino.length > 1 ? 'es' : ''}</span>`
        : '';

    card.innerHTML = `
        <span class="dim-src-name" title="${m.nome}">${firstName(m.nome)}</span>
        ${setorTag}
        ${!isReadOnly ? `<button class="dim-ausente-btn${isAus ? ' dim-ausente-ativo' : ''}" data-id="${m.id}" data-team="${teamKey}" title="${isAus ? 'Marcar presente' : 'Marcar ausente'}">
            ${isAus
                ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
                : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
            }
        </button>` : ''}
    `;

    if (!isAus && !isReadOnly) {
        card.addEventListener('dragstart', e => {
            dimDrag = { id: m.id, nome: m.nome, sourceTeam: teamKey };
            card.classList.add('dim-dragging');
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', m.id);
        });
        card.addEventListener('dragend', () => card.classList.remove('dim-dragging'));
        card.addEventListener('click', e => {
            if (e.target.closest('.dim-ausente-btn')) return;
            e.stopPropagation();
            openDimCtx(e, { id: m.id, nome: m.nome, sourceTeam: teamKey });
        });
    }

    card.querySelector('.dim-ausente-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        const id   = e.currentTarget.dataset.id;
        const team = e.currentTarget.dataset.team;
        if (!ausentes[team]) ausentes[team] = [];
        const idx = ausentes[team].indexOf(id);
        if (idx !== -1) {
            ausentes[team].splice(idx, 1);
        } else {
            ausentes[team].push(id);
            SETORES.forEach(s => { dimState[s] = dimState[s].filter(a => a.id !== id); });
        }
        saveDim();
        renderDimensionamento();
    });

    return card;
}

// ─── COLUNA SETORES ──────────────────────────
function buildSetoresColumn() {
    const col = document.createElement('div');
    col.className = 'dim-col dim-col-setores';
    const isReadOnly = selectedDate !== todayStr();
    const total = totalAlocados();

    col.innerHTML = `
        <div class="dim-col-header" style="border-top:3px solid var(--text3)">
            <div class="dim-col-header-top">
                <span class="dim-col-name">Setores</span>
                <span class="dim-col-badge">${total} alocaç${total !== 1 ? 'ões' : 'ão'}</span>
            </div>
            <div class="dim-col-sub">${isReadOnly ? 'Visualização somente leitura' : 'Arraste ou clique no colaborador para alocar'}</div>
        </div>
        <div class="dim-col-body" id="dim-setores-body"></div>
    `;

    const body = col.querySelector('#dim-setores-body');
    const grid = document.createElement('div');
    grid.className = 'dim-setores-grid';

    SETORES.forEach(setor => {
        const alocados = dimState[setor] || [];
        const ocupado  = alocados.length > 0;

        const bloco = document.createElement('div');
        bloco.className     = `dim-setor-bloco${ocupado ? ' dim-setor-ocupado' : ''}`;
        bloco.dataset.setor = setor;

        const chips = alocados.map(a => `
            <div class="dim-chip" data-id="${a.id}" data-setor="${setor}" data-team="${a.sourceTeam}">
                <span class="dim-chip-dot" style="background:${TEAM_CONFIG[a.sourceTeam]?.color || '#888'}"></span>
                <span class="dim-chip-name" title="${a.nome}">${firstName(a.nome)}</span>
                ${!isReadOnly ? `<button class="dim-chip-remove" data-id="${a.id}" data-setor="${setor}">×</button>` : ''}
            </div>
        `).join('');

        bloco.innerHTML = `
            <div class="dim-setor-label">${setor}</div>
            <div class="dim-setor-drop" data-setor="${setor}">
                ${chips}
                ${!ocupado && !isReadOnly ? '<span class="dim-setor-hint">Solte aqui</span>' : ''}
            </div>
        `;

        if (!isReadOnly) {
            const dropZone = bloco.querySelector('.dim-setor-drop');
            dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dim-drop-active'); });
            dropZone.addEventListener('dragleave', e => {
                if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('dim-drop-active');
            });
            dropZone.addEventListener('drop', e => {
                e.preventDefault();
                dropZone.classList.remove('dim-drop-active');
                if (!dimDrag) return;
                if (!dimState[setor].some(a => a.id === dimDrag.id)) {
                    dimState[setor].push({ id: dimDrag.id, nome: dimDrag.nome, sourceTeam: dimDrag.sourceTeam });
                    saveDim();
                }
                dimDrag = null;
                renderDimensionamento();
            });

            bloco.querySelectorAll('.dim-chip-remove').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    dimState[btn.dataset.setor] = dimState[btn.dataset.setor].filter(a => a.id !== btn.dataset.id);
                    saveDim();
                    renderDimensionamento();
                });
            });

            bloco.querySelectorAll('.dim-chip').forEach(chip => {
                chip.draggable = true;
                chip.addEventListener('dragstart', e => {
                    e.stopPropagation();
                    const id = chip.dataset.id, s = chip.dataset.setor, team = chip.dataset.team;
                    const nome = dimState[s]?.find(a => a.id === id)?.nome || id;
                    dimState[s] = (dimState[s] || []).filter(a => a.id !== id);
                    dimDrag = { id, nome, sourceTeam: team, fromSetor: s };
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', id);
                    setTimeout(() => renderDimensionamento(), 0);
                });
            });
        }

        grid.appendChild(bloco);
    });

    body.appendChild(grid);
    return col;
}

// ─── MENU RÁPIDO ─────────────────────────────
function mountCtxMenu() {
    if (document.getElementById('dimCtxMenu')) return;
    const menu = document.createElement('div');
    menu.id        = 'dimCtxMenu';
    menu.className = 'dim-ctx-menu';
    menu.style.display = 'none';
    menu.innerHTML = `
        <div class="dim-ctx-header" id="dimCtxHeader">Alocar em setor</div>
        <div class="dim-ctx-list" id="dimCtxList"></div>
    `;
    menu.addEventListener('click', e => e.stopPropagation());
    document.body.appendChild(menu);
}

function openDimCtx(e, target) {
    if (selectedDate !== todayStr()) return; // só edita hoje
    dimCtxTarget = target;
    const menu = document.getElementById('dimCtxMenu');
    if (!menu) return;

    document.getElementById('dimCtxHeader').textContent = `Setores — ${firstName(target.nome)}`;
    const list = document.getElementById('dimCtxList');
    list.innerHTML = '';

    SETORES.forEach(setor => {
        const jaEsta = dimState[setor].some(a => a.id === target.id);
        const btn = document.createElement('button');
        btn.className = `dim-ctx-item${jaEsta ? ' dim-ctx-item-active' : ''}`;
        btn.innerHTML = `
            <span class="dim-ctx-dot${jaEsta ? ' dim-ctx-dot-active' : ''}"></span>
            <span class="dim-ctx-label">${setor}</span>
            ${jaEsta ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        `;
        btn.addEventListener('click', ev => {
            ev.stopPropagation();
            if (jaEsta) {
                dimState[setor] = dimState[setor].filter(a => a.id !== target.id);
            } else {
                dimState[setor].push({ id: target.id, nome: target.nome, sourceTeam: target.sourceTeam });
            }
            saveDim();
            renderDimensionamento();
            // Reabre no mesmo ponto
            const mx = parseFloat(menu.style.left), my = parseFloat(menu.style.top);
            openDimCtx({ clientX: mx, clientY: my }, target);
        });
        list.appendChild(btn);
    });

    const x = e.clientX ?? parseFloat(menu.style.left);
    const y = e.clientY ?? parseFloat(menu.style.top);
    menu.style.left    = x + 'px';
    menu.style.top     = y + 'px';
    menu.style.display = 'block';
    requestAnimationFrame(() => {
        const r = menu.getBoundingClientRect();
        if (r.right  > window.innerWidth)  menu.style.left = (x - r.width)  + 'px';
        if (r.bottom > window.innerHeight) menu.style.top  = (y - r.height) + 'px';
    });

    setTimeout(() => {
        document.addEventListener('click', () => { menu.style.display = 'none'; dimCtxTarget = null; }, { once: true });
    }, 10);
}
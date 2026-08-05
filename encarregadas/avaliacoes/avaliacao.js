/**
 * Avaliação de Colaboradores
 * Mobile-first · Login · localStorage · Envio Apps Script (no-cors)
 */

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRSh8lY7Bi6J2k9WDrXwsiWlhtQovmB2635ypiisC1WVhDZiH0xDGHUDGA2NKE1oRTRtr_urteVE_LZ/pub?gid=270663064&single=true&output=csv';

/**
 * URL do Web App do Google Apps Script (deploy como "Qualquer pessoa").
 * Cole aqui a URL gerada após publicar o script (termina com /exec).
 * Exemplo: https://script.google.com/macros/s/AKfycb.../exec
 */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnyKZCbwC6mWhWmIQ9FdbzyJArVb7tQSp9W6CQ_BXw-Mi0TZhttVe1K0FdclSC41FQ/exec'; // <-- COLE A URL DO WEB APP AQUI

const CRITERIOS = ['ASSIDUIDADE', 'OPERACIONAL', 'COMPORTAMENTAL'];
const OPCOES = [
    { valor: 'RUIM', label: 'Ruim' },
    { valor: 'RAZOAVEL', label: 'Razoável' },
    { valor: 'BOM', label: 'Bom' },
    { valor: 'OTIMO', label: 'Ótimo' }
];

const SENHAS = {
    BIANCA:   '032864',
    ALISSON:  '062229',
    GRACIELA: '037120',
    JESSICA:  '049971',
    LUCIANE:  '064336',
    DAIANE:   '062074',
    CAROLYNE: '064635',
    ADRISSON: '056367'
};

/** Senha coringa – funciona para qualquer responsável */
const SENHA_CORINGA = 'piber';

const MAPA_EQUIPES = {
    BIANCA:   ['ADM', 'LIDERANCA'],
    ALISSON:  ['ALISSON', '6X1 DIA'],
    GRACIELA: ['GRACIELA', '6X1 DIA'],
    JESSICA:  ['JESSICA', '6X1 NOITE'],
    LUCIANE:  ['LUCIANE', '6X1 NOITE'],
    DAIANE:   ['ALISSON', 'GRACIELA', 'JESSICA', 'LUCIANE', 'LIDERANCA', '6X1 DIA', '6X1 NOITE'],
    CAROLYNE: ['ALISSON', 'GRACIELA', 'JESSICA', 'LUCIANE', 'LIDERANCA', '6X1 DIA', '6X1 NOITE'],
    ADRISSON: ['ALISSON', 'GRACIELA', 'JESSICA', 'LUCIANE', 'LIDERANCA', '6X1 DIA', '6X1 NOITE']
};

const SESSION_KEY = 'avaliacao_responsavel';
const STORAGE_PREFIX = 'avaliacoes_'; // + nome do responsável

// Estado em memória (espelha o localStorage do responsável logado)
let avaliacoes = {};
let todosAtivos = [];
let colaboradores = [];
let responsavelLogado = null;
// Mapa RE → dados do colaborador (para montar o payload)
let mapaColaboradores = {};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', onLoginSubmit);
    document.getElementById('btn-sair').addEventListener('click', fazerLogout);

    if (!APPS_SCRIPT_URL) {
        console.warn('[Apps Script] APPS_SCRIPT_URL está vazia. Preencha a URL do Web App em avaliacao.js para habilitar o envio.');
    }

    const salvo = sessionStorage.getItem(SESSION_KEY);
    if (salvo && SENHAS[salvo]) {
        entrarComo(salvo);
    }
});

// ===== LOGIN =====
function onLoginSubmit(e) {
    e.preventDefault();

    const usuario = (document.getElementById('login-usuario').value || '').trim().toUpperCase();
    const senha = (document.getElementById('login-senha').value || '').trim();

    if (!usuario || !SENHAS[usuario]) {
        mostrarErroLogin('Selecione um responsável.');
        return;
    }

    if (senha !== SENHAS[usuario] && senha !== SENHA_CORINGA) {
        mostrarErroLogin('Usuário ou senha incorretos.');
        document.getElementById('login-senha').value = '';
        document.getElementById('login-senha').focus();
        return;
    }

    document.getElementById('login-erro').hidden = true;
    sessionStorage.setItem(SESSION_KEY, usuario);
    entrarComo(usuario);
}

function mostrarErroLogin(msg) {
    const erroEl = document.getElementById('login-erro');
    erroEl.textContent = msg;
    erroEl.hidden = false;
}

function entrarComo(usuario) {
    responsavelLogado = usuario;
    carregarAvaliacoesLocais();

    document.getElementById('login-overlay').hidden = true;
    document.getElementById('app').hidden = false;
    document.getElementById('responsavel-exibicao').value = usuario;

    carregarColaboradores();
}

function fazerLogout() {
    // Garante que o estado atual está salvo antes de sair
    salvarAvaliacoesLocais();

    sessionStorage.removeItem(SESSION_KEY);
    responsavelLogado = null;
    colaboradores = [];
    avaliacoes = {};
    mapaColaboradores = {};

    document.getElementById('app').hidden = true;
    document.getElementById('login-overlay').hidden = false;
    document.getElementById('login-form').reset();
    document.getElementById('login-erro').hidden = true;
    document.getElementById('lista').innerHTML = '';
    document.getElementById('total-colaboradores').textContent = '--';
    document.getElementById('total-avaliados').textContent = '0';
}

// ===== LOCAL STORAGE =====
function storageKey() {
    return STORAGE_PREFIX + (responsavelLogado || 'anon');
}

function carregarAvaliacoesLocais() {
    try {
        const raw = localStorage.getItem(storageKey());
        avaliacoes = raw ? JSON.parse(raw) : {};
        console.log('[localStorage] Avaliações carregadas para', responsavelLogado, '→', Object.keys(avaliacoes).length, 'colaborador(es)');
    } catch (err) {
        console.error('[localStorage] Erro ao carregar:', err);
        avaliacoes = {};
    }
}

function salvarAvaliacoesLocais() {
    if (!responsavelLogado) return;
    try {
        localStorage.setItem(storageKey(), JSON.stringify(avaliacoes));
        console.log('[localStorage] Salvo para', responsavelLogado, '→', Object.keys(avaliacoes).length, 'colaborador(es)');
    } catch (err) {
        console.error('[localStorage] Erro ao salvar:', err);
    }
}

// ===== DADOS DO SHEETS (CSV) =====
function carregarColaboradores() {
    const loading = document.getElementById('loading');
    const lista = document.getElementById('lista');

    loading.style.display = 'block';
    lista.innerHTML = '';

    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            loading.style.display = 'none';

            if (!results.data || results.data.length === 0) {
                lista.innerHTML = '<div class="empty-state">Nenhum colaborador encontrado.</div>';
                return;
            }

            todosAtivos = results.data.filter(row => {
                const situacao = (row['SITUAÇÃO'] || row['SITUACAO'] || '').trim();
                return situacao.toLowerCase() === 'ativo';
            });

            todosAtivos.sort((a, b) => {
                const nomeA = (a['FUNCIONÁRIO'] || a['FUNCIONARIO'] || '').toUpperCase();
                const nomeB = (b['FUNCIONÁRIO'] || b['FUNCIONARIO'] || '').toUpperCase();
                return nomeA.localeCompare(nomeB, 'pt-BR');
            });

            // Mapa RE → dados para o envio
            mapaColaboradores = {};
            todosAtivos.forEach(row => {
                const re = (row['RE'] || '').trim();
                if (re) {
                    mapaColaboradores[re] = {
                        re,
                        nome: (row['FUNCIONÁRIO'] || row['FUNCIONARIO'] || '').trim(),
                        equipe: (row['EQUIPE'] || '').trim()
                    };
                }
            });

            aplicarFiltro();
        },
        error: (err) => {
            loading.style.display = 'none';
            lista.innerHTML = `<div class="empty-state">Erro ao carregar dados.<br><small>${err.message || ''}</small></div>`;
            console.error('[CSV] Erro PapaParse:', err);
        }
    });
}

function normalizarEquipe(valor) {
    return (valor || '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function aplicarFiltro() {
    if (!responsavelLogado || !MAPA_EQUIPES[responsavelLogado]) {
        colaboradores = [];
        document.getElementById('total-colaboradores').textContent = '0';
        renderLista();
        return;
    }

    const equipesPermitidas = MAPA_EQUIPES[responsavelLogado].map(e => normalizarEquipe(e));

    colaboradores = todosAtivos.filter(row => {
        const equipe = normalizarEquipe(row['EQUIPE']);
        return equipesPermitidas.includes(equipe);
    });

    document.getElementById('total-colaboradores').textContent = colaboradores.length;
    renderLista();
}

// ===== RENDER =====
function renderLista() {
    const lista = document.getElementById('lista');
    lista.innerHTML = '';

    if (colaboradores.length === 0) {
        lista.innerHTML = '<div class="empty-state">Nenhum colaborador ativo encontrado para este responsável.</div>';
        return;
    }

    colaboradores.forEach(colab => {
        const re = (colab['RE'] || '').trim();
        const nome = (colab['FUNCIONÁRIO'] || colab['FUNCIONARIO'] || '—').trim();
        const equipe = (colab['EQUIPE'] || '—').trim();
        const funcao = (colab['FUNÇAO'] || colab['FUNCAO'] || colab['FUNÇÃO'] || '').trim();

        const card = document.createElement('div');
        card.className = 'colaborador-card';
        card.dataset.re = re;

        const av = avaliacoes[re];
        if (av && (av.ASSIDUIDADE || av.OPERACIONAL || av.COMPORTAMENTAL)) {
            card.classList.add('avaliado');
        }
        if (av && av.enviado) {
            card.classList.add('enviado');
        }

        const header = document.createElement('div');
        header.className = 'colaborador-header';
        header.innerHTML = `
            <div class="colaborador-nome">${escapeHtml(nome)}</div>
            <div class="colaborador-meta">
                <span>RE: ${escapeHtml(re)}</span>
                <span>${escapeHtml(equipe)}</span>
                ${funcao ? `<span>${escapeHtml(funcao)}</span>` : ''}
                ${av && av.enviado ? '<span class="badge-enviado">Enviado</span>' : ''}
            </div>
        `;
        card.appendChild(header);

        const criteriosGrid = document.createElement('div');
        criteriosGrid.className = 'criterios-grid';

        CRITERIOS.forEach(criterio => {
            const bloco = document.createElement('div');
            bloco.className = 'criterio-bloco';

            const titulo = document.createElement('div');
            titulo.className = 'criterio-titulo';
            titulo.textContent = criterio;
            bloco.appendChild(titulo);

            const botoes = document.createElement('div');
            botoes.className = 'botoes-avaliacao';

            OPCOES.forEach(op => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-avaliacao';
                btn.dataset.valor = op.valor;
                btn.dataset.criterio = criterio;
                btn.dataset.re = re;
                btn.textContent = op.label;

                if (av && av[criterio] === op.valor) {
                    btn.classList.add('selected');
                }

                btn.addEventListener('click', () => selecionarAvaliacao(btn));
                botoes.appendChild(btn);
            });

            bloco.appendChild(botoes);
            criteriosGrid.appendChild(bloco);
        });

        card.appendChild(criteriosGrid);
        lista.appendChild(card);
    });

    atualizarContadorAvaliados();
}

function selecionarAvaliacao(btn) {
    const re = btn.dataset.re;
    const criterio = btn.dataset.criterio;
    const valor = btn.dataset.valor;

    if (!avaliacoes[re]) {
        avaliacoes[re] = {};
    }

    // Toggle
    if (avaliacoes[re][criterio] === valor) {
        delete avaliacoes[re][criterio];
        // Se removeu um critério, marca como não enviado (precisará reenviar quando completar de novo)
        avaliacoes[re].enviado = false;
        if (!avaliacoes[re].ASSIDUIDADE && !avaliacoes[re].OPERACIONAL && !avaliacoes[re].COMPORTAMENTAL) {
            delete avaliacoes[re];
        }
    } else {
        avaliacoes[re][criterio] = valor;
        // Qualquer alteração após envio → permite reenvio
        avaliacoes[re].enviado = false;
    }

    // Atualiza visual dos botões deste critério
    const card = btn.closest('.colaborador-card');
    const botoesDoCriterio = card.querySelectorAll(`.btn-avaliacao[data-criterio="${criterio}"]`);

    botoesDoCriterio.forEach(b => {
        b.classList.remove('selected');
        if (avaliacoes[re] && avaliacoes[re][criterio] === b.dataset.valor) {
            b.classList.add('selected');
        }
    });

    // Estado do card
    if (avaliacoes[re] && (avaliacoes[re].ASSIDUIDADE || avaliacoes[re].OPERACIONAL || avaliacoes[re].COMPORTAMENTAL)) {
        card.classList.add('avaliado');
    } else {
        card.classList.remove('avaliado');
        card.classList.remove('enviado');
    }

    // Remove badge se não estiver mais enviado
    const badge = card.querySelector('.badge-enviado');
    if (badge && (!avaliacoes[re] || !avaliacoes[re].enviado)) {
        badge.remove();
    }

    // Persiste localmente a cada clique
    salvarAvaliacoesLocais();
    atualizarContadorAvaliados();

    // Se os 3 critérios estão preenchidos → envia para o Sheets
    if (
        avaliacoes[re] &&
        avaliacoes[re].ASSIDUIDADE &&
        avaliacoes[re].OPERACIONAL &&
        avaliacoes[re].COMPORTAMENTAL &&
        !avaliacoes[re].enviado
    ) {
        enviarParaSheets(re);
    }
}

function atualizarContadorAvaliados() {
    let completos = 0;
    Object.keys(avaliacoes).forEach(re => {
        const a = avaliacoes[re];
        if (a && a.ASSIDUIDADE && a.OPERACIONAL && a.COMPORTAMENTAL) {
            completos++;
        }
    });
    document.getElementById('total-avaliados').textContent = completos;
}

// ===== ENVIO APPS SCRIPT (no-cors) =====
function formatarDataHora(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const d = pad(date.getDate());
    const m = pad(date.getMonth() + 1);
    const y = date.getFullYear();
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return {
        data: `${d}/${m}/${y}`,
        hora: `${h}:${min}:${s}`
    };
}

function enviarParaSheets(re) {
    const av = avaliacoes[re];
    if (!av) {
        console.warn('[Apps Script] Sem avaliação para RE', re);
        return;
    }

    const colab = mapaColaboradores[re] || { re, nome: '', equipe: '' };

    const { data, hora } = formatarDataHora(new Date());

    const payload = {
        data: data,
        hora: hora,
        re: colab.re || re,
        funcionario: colab.nome || '',
        equipe: colab.equipe || '',
        avaliador: responsavelLogado || '',
        assiduidade: av.ASSIDUIDADE || '',
        operacional: av.OPERACIONAL || '',
        comportamental: av.COMPORTAMENTAL || ''
    };

    console.log('[Apps Script] Preparando envio:', payload);

    if (!APPS_SCRIPT_URL) {
        console.warn('[Apps Script] URL não configurada. Avaliação salva só no localStorage. Configure APPS_SCRIPT_URL.');
        // Mesmo sem URL, marca como "enviado" localmente? Não – deixa false para tentar de novo depois
        return;
    }

    // no-cors: não conseguimos ler a resposta; só disparamos e logamos
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
    })
        .then(() => {
            // Com no-cors a promise resolve com status 0 / opaque – consideramos "enviado"
            console.log('[Apps Script] Request disparado (no-cors). Não é possível confirmar o status HTTP.');
            if (avaliacoes[re]) {
                avaliacoes[re].enviado = true;
                salvarAvaliacoesLocais();

                const card = document.querySelector(`.colaborador-card[data-re="${re}"]`);
                if (card) {
                    card.classList.add('enviado');
                    const meta = card.querySelector('.colaborador-meta');
                    if (meta && !meta.querySelector('.badge-enviado')) {
                        const span = document.createElement('span');
                        span.className = 'badge-enviado';
                        span.textContent = 'Enviado';
                        meta.appendChild(span);
                    }
                }
            }
        })
        .catch((err) => {
            console.error('[Apps Script] Falha no fetch:', err);
            console.error('[Apps Script] Payload que falhou:', payload);
        });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
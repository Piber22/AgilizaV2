// =============================
// CONFIGURAÇÕES — ALTERE AQUI
// =============================

// URL do Google Apps Script (Web App) — usada para leitura (GET) e escrita (POST)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzA0aHkspzcPy4vpsJM5LaGDo0n4UbsMjmKiJHZbEkNj3J94pfOmdHxd2FjACIAzcH5/exec";


// =============================
// ESTADO GLOBAL
// =============================
let contadorBlocos = 1;
let dadosMTR = [];
let dadosHistorico = [];


// =============================
// NAVEGAÇÃO ENTRE MENUS
// =============================
function mudarMenu(index, btnEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(`menu-${index}`).classList.add('active');
    btnEl.classList.add('active');

    if (index === 1) carregarParaEntrega();
    if (index === 2) carregarHistorico();
}


// =============================
// MENU 1 — ADICIONAR BLOCO MTR
// =============================
function adicionarBlocoMTR() {
    contadorBlocos++;
    const container = document.getElementById('mtrBlocksContainer');

    const bloco = document.createElement('div');
    bloco.className = 'mtr-block';
    bloco.dataset.index = contadorBlocos;

    bloco.innerHTML = `
        <div class="mtr-block-header">
            <span class="mtr-block-title">MTR #${contadorBlocos}</span>
            <button class="btn-remove-mtr" onclick="removerBloco(this)">✕ Remover</button>
        </div>
        <label>Data de Emissão:
            <input type="date" class="campo-data">
        </label>
        <label>Código da MTR:
            <input type="text" class="campo-codigo" maxlength="10" placeholder="10 dígitos">
        </label>
        <div class="field-error codigo-error" style="display:none;">⚠ O código deve ter exatamente 10 dígitos.</div>
        <label>Tipo:
            <select class="campo-tipo">
                <option value="">Selecione:</option>
                <option value="Infectante/Perfuro">Infectante/Perfuro</option>
                <option value="Químico">Químico</option>
                <option value="Papelão">Papelão</option>
                <option value="Plástico">Plástico</option>
            </select>
        </label>
    `;

    container.appendChild(bloco);

    bloco.querySelector('.campo-codigo').addEventListener('input', function () {
        validarCampoCodigoVisual(this);
    });
}

function removerBloco(btn) {
    const bloco = btn.closest('.mtr-block');
    const todos = document.querySelectorAll('.mtr-block');
    if (todos.length <= 1) {
        mostrarToast('Deve haver ao menos uma MTR.', 'error');
        return;
    }
    bloco.remove();
}


// =============================
// VALIDAÇÃO DE CÓDIGO
// =============================
function validarCampoCodigoVisual(input) {
    const bloco = input.closest('.mtr-block');
    const erroEl = bloco.querySelector('.codigo-error');
    const val = input.value.replace(/\D/g, '');
    input.value = val;

    if (val.length > 0 && val.length !== 10) {
        input.classList.add('error-field');
        erroEl.style.display = 'block';
    } else {
        input.classList.remove('error-field');
        erroEl.style.display = 'none';
    }
}

document.querySelector('.campo-codigo').addEventListener('input', function () {
    validarCampoCodigoVisual(this);
});


// =============================
// MENU 1 — SALVAR MTRs
// =============================
async function salvarMTRs() {
    const blocos = document.querySelectorAll('.mtr-block');
    let registros = [];
    let valido = true;

    blocos.forEach((bloco, i) => {
        if (!valido) return;

        const dataInput = bloco.querySelector('.campo-data').value;
        const codigo = bloco.querySelector('.campo-codigo').value.trim();
        const tipo = bloco.querySelector('.campo-tipo').value;
        const erroEl = bloco.querySelector('.codigo-error');

        if (!dataInput || !codigo || !tipo) {
            valido = false;
            mostrarToast(`Preencha todos os campos da MTR #${i + 1}.`, 'error');
            return;
        }

        if (codigo.length !== 10) {
            valido = false;
            bloco.querySelector('.campo-codigo').classList.add('error-field');
            erroEl.style.display = 'block';
            mostrarToast(`Código da MTR #${i + 1} deve ter exatamente 10 dígitos.`, 'error');
            return;
        }

        registros.push({
            acao: 'entrada',
            dataEmissao: converterDataParaBR(dataInput), // já salva em DD/MM/YYYY
            codigo: codigo,
            tipo: tipo,
            dataEntrega: '',
            status: 'Em Posse'
        });
    });

    if (!valido || registros.length === 0) return;

    mostrarToast('Salvando...', '');

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registros)
        });

        mostrarToast(`${registros.length} MTR(s) registrada(s) com sucesso!`, 'success');
        resetarMenu1();
    } catch (err) {
        console.error(err);
        mostrarToast('Erro ao salvar. Verifique a conexão.', 'error');
    }
}

function resetarMenu1() {
    const container = document.getElementById('mtrBlocksContainer');
    container.innerHTML = `
        <div class="mtr-block" data-index="1">
            <div class="mtr-block-header">
                <span class="mtr-block-title">MTR #1</span>
            </div>
            <label>Data de Emissão:
                <input type="date" class="campo-data">
            </label>
            <label>Código da MTR:
                <input type="text" class="campo-codigo" maxlength="10" placeholder="10 dígitos">
            </label>
            <div class="field-error codigo-error" style="display:none;">⚠ O código deve ter exatamente 10 dígitos.</div>
            <label>Tipo:
                <select class="campo-tipo">
                    <option value="">Selecione:</option>
                    <option value="Infectante/Perfuro">Infectante/Perfuro</option>
                    <option value="Químico">Químico</option>
                    <option value="Papelão">Papelão</option>
                    <option value="Plástico">Plástico</option>
                </select>
            </label>
        </div>
    `;
    contadorBlocos = 1;
    document.querySelector('.campo-codigo').addEventListener('input', function () {
        validarCampoCodigoVisual(this);
    });
}


// =============================
// MENU 2 — CARREGAR MTRs EM POSSE
// =============================
async function carregarParaEntrega() {
    const lista = document.getElementById('mtrEntregaList');
    lista.innerHTML = '<p class="msg-loading">Carregando MTRs em posse...</p>';

    try {
        const data = await buscarDadosDoAppScript();
        dadosMTR = data;

        const emPosse = data.filter(r => r.status === 'Em Posse');

        if (emPosse.length === 0) {
            lista.innerHTML = '<p class="msg-empty">✅ Nenhuma MTR pendente de entrega.</p>';
            return;
        }

        lista.innerHTML = '';
        emPosse.forEach(mtr => {
            const item = criarItemMTR(mtr);
            lista.appendChild(item);
        });

    } catch (err) {
        console.error(err);
        lista.innerHTML = '<p class="msg-empty" style="color:#ff6b6b;">Erro ao carregar dados. Verifique a conexão.</p>';
    }
}

function criarItemMTR(mtr) {
    const div = document.createElement('div');
    div.className = 'mtr-item';
    div.dataset.codigo = mtr.codigo;
    div.dataset.row = mtr.row || '';

    const tipoClass = tipoParaClasse(mtr.tipo);

    div.innerHTML = `
        <input type="checkbox" value="${mtr.codigo}">
        <div class="mtr-item-info">
            <span class="mtr-item-code">${mtr.codigo}</span>
            <span class="mtr-item-meta">Emissão: ${mtr.dataEmissao || '—'}</span>
        </div>
        <span class="mtr-type-tag ${tipoClass}">${mtr.tipo}</span>
    `;

    div.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
            const cb = div.querySelector('input[type="checkbox"]');
            cb.checked = !cb.checked;
        }
        div.classList.toggle('selected', div.querySelector('input[type="checkbox"]').checked);
    });

    div.querySelector('input').addEventListener('change', function () {
        div.classList.toggle('selected', this.checked);
    });

    return div;
}

function tipoParaClasse(tipo) {
    const map = {
        'Infectante/Perfuro': 'infectante',
        'Químico': 'quimico',
        'Papelão': 'papelao',
        'Plástico': 'plastico'
    };
    return map[tipo] || '';
}

function desmarcarTodos() {
    document.querySelectorAll('#mtrEntregaList .mtr-item').forEach(item => {
        item.querySelector('input[type="checkbox"]').checked = false;
        item.classList.remove('selected');
    });
}


// =============================
// MENU 2 — MODAL DE CONFIRMAÇÃO
// =============================
function abrirModalEntrega() {
    const selecionados = Array.from(document.querySelectorAll('#mtrEntregaList .mtr-item'))
        .filter(item => item.querySelector('input[type="checkbox"]').checked);

    if (selecionados.length === 0) {
        mostrarToast('Selecione ao menos uma MTR.', 'error');
        return;
    }

    const listaEl = document.getElementById('modalLista');
    listaEl.innerHTML = selecionados.map(item => {
        const codigo = item.dataset.codigo;
        const tipo = item.querySelector('.mtr-type-tag').textContent;
        return `<div class="modal-list-item">
            <strong>${codigo}</strong><span>${tipo}</span>
        </div>`;
    }).join('');

    document.getElementById('modalOverlay').classList.add('show');
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('show');
}

async function confirmarEntrega() {
    fecharModal();

    const selecionados = Array.from(document.querySelectorAll('#mtrEntregaList .mtr-item'))
        .filter(item => item.querySelector('input[type="checkbox"]').checked);

    const hoje = converterDataParaBR(new Date().toISOString().split('T')[0]);

    const atualizacoes = selecionados.map(item => ({
        acao: 'entrega',
        codigo: item.dataset.codigo,
        row: item.dataset.row,
        dataEntrega: hoje,
        status: 'Entregue'
    }));

    mostrarToast('Atualizando...', '');

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(atualizacoes)
        });

        mostrarToast(`${selecionados.length} MTR(s) marcadas como entregues!`, 'success');

        // Remove visualmente da lista imediatamente
        selecionados.forEach(item => item.remove());

        const lista = document.getElementById('mtrEntregaList');
        if (!lista.querySelector('.mtr-item')) {
            lista.innerHTML = '<p class="msg-empty">✅ Nenhuma MTR pendente de entrega.</p>';
        }

    } catch (err) {
        console.error(err);
        mostrarToast('Erro ao atualizar. Verifique a conexão.', 'error');
    }
}


// =============================
// MENU 3 — HISTÓRICO
// =============================
async function carregarHistorico() {
    const tbody = document.querySelector('#tabelaHistorico tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="msg-loading">Carregando...</td></tr>';

    try {
        const data = await buscarDadosDoAppScript();
        dadosHistorico = data;
        exibirHistorico(dadosHistorico);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5" class="msg-loading" style="color:#ff6b6b;">Erro ao carregar dados.</td></tr>';
    }
}

function exibirHistorico(dados) {
    const tbody = document.querySelector('#tabelaHistorico tbody');

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="msg-empty">Nenhum registro encontrado.</td></tr>';
        return;
    }

    const invertidos = [...dados].reverse();

    tbody.innerHTML = invertidos.map(mtr => {
        const statusClass = mtr.status === 'Entregue' ? 'badge-entregue' : 'badge-posse';
        return `
            <tr>
                <td><strong>${mtr.codigo}</strong></td>
                <td>${mtr.tipo}</td>
                <td>${mtr.dataEmissao || '—'}</td>
                <td>${mtr.dataEntrega || '—'}</td>
                <td><span class="badge ${statusClass}">${mtr.status}</span></td>
            </tr>
        `;
    }).join('');
}

function filtrarHistorico() {
    const filtroCodigo = document.getElementById('filtroHistCodigo').value.toLowerCase();
    const filtroTipo = document.getElementById('filtroHistTipo').value;
    const filtroStatus = document.getElementById('filtroHistStatus').value;

    const filtrados = dadosHistorico.filter(mtr => {
        const matchCodigo = !filtroCodigo || mtr.codigo.toLowerCase().includes(filtroCodigo);
        const matchTipo = !filtroTipo || mtr.tipo === filtroTipo;
        const matchStatus = !filtroStatus || mtr.status === filtroStatus;
        return matchCodigo && matchTipo && matchStatus;
    });

    exibirHistorico(filtrados);
}


// =============================
// LEITURA DIRETA VIA APPS SCRIPT (GET)
// Sem cache — dados sempre atualizados
// =============================
async function buscarDadosDoAppScript() {
    const url = `${WEB_APP_URL}?acao=listar&t=${Date.now()}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const json = await response.json();

    // json.dados é array de arrays: [[codigo, tipo, dataEmissao, dataEntrega, status], ...]
    // índice 0 = cabeçalho, começa do 1
    const resultado = [];
    for (let i = 1; i < json.dados.length; i++) {
        const row = json.dados[i];
        if (!row[0]) continue; // ignora linhas vazias

        resultado.push({
            codigo:      String(row[0]).trim(),
            tipo:        String(row[1]).trim(),
            dataEmissao: String(row[2]).trim(),
            dataEntrega: row[3] ? String(row[3]).trim() : '',
            status:      String(row[4]).trim(),
            row:         i + 1 // número real da linha na planilha
        });
    }

    return resultado;
}


// =============================
// UTILITÁRIOS
// =============================

// Converte YYYY-MM-DD → DD/MM/YYYY
function converterDataParaBR(dataISO) {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataISO;
}

function mostrarToast(mensagem, tipo) {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}
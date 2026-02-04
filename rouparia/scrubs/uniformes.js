// =============================
// CONFIGURAÇÕES
// =============================
const sheetCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuKBJbLlblPErMtxcvB9FTwl3ev05N2IU42a_7PIdFzA4L4wFX-ViML99QG7Xq-WYGSzl-7Ibh2W4W/pub?output=csv";
const webAppUrl = "https://script.google.com/macros/s/AKfycbxB3ODp6qwtqCVW83tKzH2oiRFGRoXpBA48hzJNwVCMdfjOxM7yugP3lTgueFu7cglr/exec";

let funcionarios = [];
let funcionariosSelecionados = [];
let tipoOperacao = ''; // 'entrega' ou 'devolucao'
let tamanhosEscolhidos = {}; // { nomeFuncionario: tamanho }
let assinaturasColetadas = []; // Array de assinaturas em base64
let indiceAssinaturaAtual = 0;

// Cache de tamanhos buscados do histórico
let tamanhosHistorico = {};

let canvas;
let ctx;
let desenhando = false;
let posX = 0;
let posY = 0;

// =============================
// FUNÇÃO AUXILIAR: Encurtar Nome
// =============================
function encurtarNome(nomeCompleto) {
    const partes = nomeCompleto.trim().split(' ');

    if (partes.length === 1) {
        return partes[0];
    }

    if (partes.length === 2) {
        return `${partes[0]} ${partes[1].charAt(0)}.`;
    }

    // 3 ou mais partes: Primeiro nome + inicial do último
    return `${partes[0]} ${partes[partes.length - 1].charAt(0)}.`;
}

// =============================
// BUSCAR TAMANHOS DO HISTÓRICO
// =============================
async function buscarTamanhosHistorico(nomesFuncionarios) {
    const promises = nomesFuncionarios.map(async (nome) => {
        try {
            const url = `${webAppUrl}?funcionario=${encodeURIComponent(nome)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'success' && data.tamanho) {
                tamanhosHistorico[nome] = data.tamanho;
            }
        } catch (error) {
            console.error(`Erro ao buscar tamanho para ${nome}:`, error);
        }
    });

    await Promise.all(promises);
}

// =============================
// 1) CARREGAR FUNCIONÁRIOS
// =============================
async function carregarFuncionarios() {
    try {
        const response = await fetch(sheetCSVUrl);
        const csvText = await response.text();

        const linhas = csvText.split("\n").map(l => l.trim()).filter(l => l);

        // Remove cabeçalho e processa nomes
        funcionarios = linhas.slice(1)
            .map(linha => {
                // Remove aspas se houver
                const nome = linha.replace(/^"|"$/g, '').trim();
                return nome;
            })
            .filter(nome => nome)
            .sort((a, b) => a.localeCompare(b, 'pt-BR'));

        renderizarFuncionarios();
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        document.getElementById('funcionariosContainer').innerHTML =
            '<p style="text-align:center; color:#ff4444;">Erro ao carregar funcionários. Verifique a conexão.</p>';
    }
}

// =============================
// 2) RENDERIZAR LISTA
// =============================
function renderizarFuncionarios(filtro = '') {
    const container = document.getElementById('funcionariosContainer');
    container.innerHTML = '';

    const funcionariosFiltrados = funcionarios.filter(nome =>
        nome.toLowerCase().includes(filtro.toLowerCase())
    );

    if (funcionariosFiltrados.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777;">Nenhum funcionário encontrado.</p>';
        return;
    }

    funcionariosFiltrados.forEach(nome => {
        const item = document.createElement('div');
        item.className = 'funcionario-item';
        if (funcionariosSelecionados.includes(nome)) {
            item.classList.add('selecionado');
        }

        item.innerHTML = `
            <div class="funcionario-info">
                <div class="checkbox-custom"></div>
                <span class="funcionario-nome">${nome}</span>
            </div>
            <div class="funcionario-acoes">
                <button class="btn-acao btn-entrega" data-nome="${nome}" data-tipo="entrega" title="Entregar Uniforme">
                    📦
                </button>
                <button class="btn-acao btn-devolucao" data-nome="${nome}" data-tipo="devolucao" title="Receber Devolução">
                    ✅
                </button>
            </div>
        `;

        // Click na área do nome/checkbox para seleção
        const infoArea = item.querySelector('.funcionario-info');
        infoArea.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSelecao(nome);
        });

        // Click nos botões de ação
        const btnEntrega = item.querySelector('.btn-entrega');
        const btnDevolucao = item.querySelector('.btn-devolucao');

        btnEntrega.addEventListener('click', (e) => {
            e.stopPropagation();
            iniciarOperacao([nome], 'entrega');
        });

        btnDevolucao.addEventListener('click', (e) => {
            e.stopPropagation();
            iniciarOperacao([nome], 'devolucao');
        });

        container.appendChild(item);
    });
}

// =============================
// 3) SELEÇÃO MÚLTIPLA
// =============================
function toggleSelecao(nome) {
    const index = funcionariosSelecionados.indexOf(nome);

    if (index > -1) {
        funcionariosSelecionados.splice(index, 1);
    } else {
        funcionariosSelecionados.push(nome);
    }

    atualizarInterfaceSelecao();
}

function atualizarInterfaceSelecao() {
    const contador = funcionariosSelecionados.length;
    const btnLimpar = document.getElementById('limparSelecaoBtn');
    const acoesMultiplas = document.getElementById('acoesMultiplas');
    const contadorSelecao = document.getElementById('contadorSelecao');
    const contadorEntrega = document.getElementById('contadorEntrega');
    const contadorDevolucao = document.getElementById('contadorDevolucao');

    if (contador > 0) {
        btnLimpar.style.display = 'block';
        acoesMultiplas.style.display = 'flex';
        contadorSelecao.textContent = contador;
        contadorEntrega.textContent = contador;
        contadorDevolucao.textContent = contador;
    } else {
        btnLimpar.style.display = 'none';
        acoesMultiplas.style.display = 'none';
    }

    renderizarFuncionarios(document.getElementById('buscaInput').value);
}

// =============================
// 4) INICIAR OPERAÇÃO
// =============================
async function iniciarOperacao(nomes, tipo) {
    tipoOperacao = tipo;
    funcionariosSelecionados = [...nomes];
    tamanhosEscolhidos = {};
    assinaturasColetadas = [];
    indiceAssinaturaAtual = 0;

    if (tipo === 'entrega') {
        abrirModalTamanho();
    } else {
        // Para devolução, buscar tamanhos do histórico primeiro
        mostrarLoading();
        await buscarTamanhosHistorico(nomes);
        esconderLoading();

        // Vai direto para assinatura
        abrirModalAssinatura();
    }
}

// =============================
// 5) MODAL DE TAMANHO
// =============================
function abrirModalTamanho() {
    const modal = document.getElementById('modalTamanho');
    const container = document.getElementById('listaTamanhosContainer');
    const btnAvancar = document.getElementById('avancarAssinaturaBtn');

    container.innerHTML = '';

    if (funcionariosSelecionados.length === 1) {
        document.getElementById('nomeFuncionarioTamanho').textContent = funcionariosSelecionados[0];
    } else {
        document.getElementById('nomeFuncionarioTamanho').textContent =
            `${funcionariosSelecionados.length} funcionários selecionados`;
    }

    // Criar seleção de tamanho para cada funcionário
    funcionariosSelecionados.forEach(nome => {
        const item = document.createElement('div');
        item.className = 'tamanho-item';

        const nomeExibicao = encurtarNome(nome);

        item.innerHTML = `
            <div class="tamanho-item-nome" title="${nome}">${nomeExibicao}</div>
            <div class="tamanho-buttons">
                <button class="btn-tamanho" data-nome="${nome}" data-tamanho="P">P</button>
                <button class="btn-tamanho" data-nome="${nome}" data-tamanho="M">M</button>
                <button class="btn-tamanho" data-nome="${nome}" data-tamanho="G">G</button>
                <button class="btn-tamanho" data-nome="${nome}" data-tamanho="GG">GG</button>
                <button class="btn-tamanho" data-nome="${nome}" data-tamanho="EG">EG</button>
            </div>
        `;

        // Adicionar listeners aos botões
        item.querySelectorAll('.btn-tamanho').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nome = e.target.dataset.nome;
                const tamanho = e.target.dataset.tamanho;

                // Remove seleção anterior deste funcionário
                item.querySelectorAll('.btn-tamanho').forEach(b => b.classList.remove('selecionado'));

                // Adiciona nova seleção
                e.target.classList.add('selecionado');
                tamanhosEscolhidos[nome] = tamanho;

                // Verifica se todos os tamanhos foram selecionados
                verificarTamanhosCompletos();
            });
        });

        container.appendChild(item);
    });

    btnAvancar.disabled = true;
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function verificarTamanhosCompletos() {
    const btnAvancar = document.getElementById('avancarAssinaturaBtn');
    const todosSelecionados = funcionariosSelecionados.every(nome => tamanhosEscolhidos[nome]);
    btnAvancar.disabled = !todosSelecionados;
}

function fecharModalTamanho() {
    document.getElementById('modalTamanho').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// =============================
// 6) MODAL DE ASSINATURA
// =============================
function abrirModalAssinatura() {
    const modal = document.getElementById('modalAssinatura');
    canvas = document.getElementById('canvasAssinatura');
    ctx = canvas.getContext('2d');

    // Configurar dimensões do canvas
    const containerWidth = canvas.parentElement.offsetWidth - 20;
    canvas.width = containerWidth;
    canvas.height = 200;

    configurarCanvas();
    atualizarInfoAssinaturaMultipla();

    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function atualizarInfoAssinaturaMultipla() {
    const nomeAtual = funcionariosSelecionados[indiceAssinaturaAtual];
    const infoElement = document.getElementById('infoAssinatura');
    const progressoDiv = document.getElementById('progressoAssinaturas');

    if (funcionariosSelecionados.length === 1) {
        infoElement.textContent = `Por favor, ${nomeAtual}, assine abaixo.`;
        progressoDiv.style.display = 'none';
    } else {
        infoElement.textContent = `Por favor, ${nomeAtual}, assine abaixo.`;
        progressoDiv.style.display = 'block';
        document.getElementById('assinaturaAtual').textContent = indiceAssinaturaAtual + 1;
        document.getElementById('assinaturaTotal').textContent = funcionariosSelecionados.length;
    }
}

function configurarCanvas() {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Mouse events
    canvas.addEventListener('mousedown', iniciarDesenho);
    canvas.addEventListener('mousemove', desenhar);
    canvas.addEventListener('mouseup', pararDesenho);
    canvas.addEventListener('mouseout', pararDesenho);

    // Touch events
    canvas.addEventListener('touchstart', iniciarDesenhoTouch);
    canvas.addEventListener('touchmove', desenharTouch);
    canvas.addEventListener('touchend', pararDesenho);
}

function iniciarDesenho(e) {
    desenhando = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    posX = (e.clientX - rect.left) * scaleX;
    posY = (e.clientY - rect.top) * scaleY;
}

function desenhar(e) {
    if (!desenhando) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(posX, posY);
    ctx.lineTo(x, y);
    ctx.stroke();

    posX = x;
    posY = y;
}

function iniciarDesenhoTouch(e) {
    e.preventDefault();
    desenhando = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    posX = (touch.clientX - rect.left) * scaleX;
    posY = (touch.clientY - rect.top) * scaleY;
}

function desenharTouch(e) {
    e.preventDefault();
    if (!desenhando) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(posX, posY);
    ctx.lineTo(x, y);
    ctx.stroke();

    posX = x;
    posY = y;
}

function pararDesenho() {
    desenhando = false;
}

function limparAssinatura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function fecharModalAssinatura() {
    document.getElementById('modalAssinatura').style.display = 'none';
    document.body.classList.remove('modal-open');
    limparAssinatura();
}

// =============================
// 7) CONFIRMAR ASSINATURA
// =============================
async function confirmarAssinatura() {
    // Verificar se há assinatura
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let temDesenho = false;

    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] !== 0) { // Alpha channel
            temDesenho = true;
            break;
        }
    }

    if (!temDesenho) {
        alert('Por favor, colete a assinatura antes de confirmar.');
        return;
    }

    // Salvar assinatura
    const assinaturaBase64 = canvas.toDataURL('image/png');
    assinaturasColetadas.push(assinaturaBase64);

    // Verificar se precisa de mais assinaturas
    if (indiceAssinaturaAtual < funcionariosSelecionados.length - 1) {
        indiceAssinaturaAtual++;
        limparAssinatura();
        atualizarInfoAssinaturaMultipla();
    } else {
        // Todas as assinaturas coletadas, enviar dados
        fecharModalAssinatura();
        await enviarDados();
    }
}

// =============================
// 8) ENVIAR DADOS
// =============================
async function enviarDados() {
    mostrarLoading();

    try {
        const agora = new Date();
        const data = agora.toLocaleDateString('pt-BR');
        const horario = agora.toLocaleTimeString('pt-BR');

        const registros = funcionariosSelecionados.map((nome, index) => {
            let tamanho = '';

            if (tipoOperacao === 'entrega') {
                // Para entrega, usa o tamanho escolhido no modal
                tamanho = tamanhosEscolhidos[nome];
            } else {
                // Para devolução, usa o tamanho do histórico (se existir)
                tamanho = tamanhosHistorico[nome] || '';
            }

            return {
                data: data,
                horario: horario,
                funcionario: nome,
                tipo: tipoOperacao,
                tamanho: tamanho,
                assinatura: assinaturasColetadas[index]
            };
        });

        // Enviar ao Google Apps Script
        const response = await fetch(webAppUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registros)
        });

        esconderLoading();

        // Resetar tudo
        resetarSistema();

    } catch (error) {
        esconderLoading();
        console.error('Erro ao enviar dados:', error);
        alert('❌ Erro ao registrar. Por favor, tente novamente.');
    }
}

// =============================
// 9) FUNÇÕES AUXILIARES
// =============================
function resetarSistema() {
    funcionariosSelecionados = [];
    tamanhosEscolhidos = {};
    tamanhosHistorico = {};
    assinaturasColetadas = [];
    indiceAssinaturaAtual = 0;
    tipoOperacao = '';

    atualizarInterfaceSelecao();
}

function mostrarLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function esconderLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// =============================
// 10) EVENT LISTENERS
// =============================
document.addEventListener('DOMContentLoaded', () => {
    // Carregar funcionários
    carregarFuncionarios();

    // Busca
    document.getElementById('buscaInput').addEventListener('input', (e) => {
        renderizarFuncionarios(e.target.value);
    });

    // Limpar seleção
    document.getElementById('limparSelecaoBtn').addEventListener('click', () => {
        funcionariosSelecionados = [];
        atualizarInterfaceSelecao();
    });

    // Ações múltiplas
    document.getElementById('entregaMultiplaBtn').addEventListener('click', () => {
        if (funcionariosSelecionados.length > 0) {
            iniciarOperacao(funcionariosSelecionados, 'entrega');
        }
    });

    document.getElementById('devolucaoMultiplaBtn').addEventListener('click', () => {
        if (funcionariosSelecionados.length > 0) {
            iniciarOperacao(funcionariosSelecionados, 'devolucao');
        }
    });

    // Modal de tamanho
    document.getElementById('cancelarTamanhoBtn').addEventListener('click', () => {
        fecharModalTamanho();
        resetarSistema();
    });

    document.getElementById('avancarAssinaturaBtn').addEventListener('click', () => {
        fecharModalTamanho();
        abrirModalAssinatura();
    });

    // Modal de assinatura
    document.getElementById('limparAssinaturaBtn').addEventListener('click', limparAssinatura);

    document.getElementById('cancelarAssinaturaBtn').addEventListener('click', () => {
        fecharModalAssinatura();
        resetarSistema();
    });

    document.getElementById('confirmarAssinaturaBtn').addEventListener('click', confirmarAssinatura);
});
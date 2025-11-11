// assinatura.js - Versão final compatível com integração PDF

// === VARIÁVEIS GLOBAIS (acessíveis por outros arquivos) ===
let canvas;
let ctx;
let desenhando = false;
let assinaturaVazia = true;
let assinaturaDataURL = null;

// === EXPORTAR VARIÁVEIS PARA O WINDOW (para uso em checklist.js) ===
window.assinaturaVazia = true;
window.assinaturaDataURL = null;

// === FUNÇÃO: ABRIR MODAL DE ASSINATURA ===
function abrirModalAssinatura() {
    const avaliador = document.getElementById('avaliador').value.trim();
    if (!avaliador) {
        alert('Por favor, insira o nome do avaliador.');
        return false;
    }

    // Verificar se todas as questões foram respondidas
    let todasRespondidas = true;
    questoes.forEach((questao, index) => {
        const respostaSelecionada = document.querySelector(`input[name="questao${index}"]:checked`);
        if (!respostaSelecionada) {
            todasRespondidas = false;
        }
    });

    if (!todasRespondidas) {
        alert('Por favor, responda todas as questões antes de finalizar.');
        return false;
    }

    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'modalAssinatura';
    modal.className = 'modal-assinatura';
    modal.innerHTML = `
        <div class="modal-content-assinatura">
            <h2>Assinatura Digital</h2>
            <p>Por favor, assine abaixo para confirmar a avaliação:</p>
            <div class="canvas-container">
                <canvas id="canvasAssinatura" width="500" height="200"></canvas>
            </div>
            <div class="modal-buttons">
                <button class="btn-limpar" onclick="limparAssinatura()">Limpar</button>
                <button class="btn-cancelar" onclick="fecharModalAssinatura()">Cancelar</button>
                <button class="btn-confirmar" onclick="confirmarAssinatura()">Confirmar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Inicializar canvas
    inicializarCanvas();

    // Resetar estado
    assinaturaVazia = true;
    window.assinaturaVazia = true;

    return false;
}

// === FUNÇÃO: INICIALIZAR CANVAS ===
function inicializarCanvas() {
    canvas = document.getElementById('canvasAssinatura');
    ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#E94B22';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    canvas.addEventListener('mousedown', iniciarDesenho);
    canvas.addEventListener('mousemove', desenhar);
    canvas.addEventListener('mouseup', pararDesenho);
    canvas.addEventListener('mouseleave', pararDesenho);

    canvas.addEventListener('touchstart', iniciarDesenhoTouch);
    canvas.addEventListener('touchmove', desenharTouch);
    canvas.addEventListener('touchend', pararDesenho);
}

// === DESENHO - MOUSE ===
function iniciarDesenho(e) {
    desenhando = true;
    assinaturaVazia = false;
    window.assinaturaVazia = false;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function desenhar(e) {
    if (!desenhando) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

function pararDesenho() {
    desenhando = false;
}

// === DESENHO - TOUCH ===
function iniciarDesenhoTouch(e) {
    e.preventDefault();
    desenhando = true;
    assinaturaVazia = false;
    window.assinaturaVazia = false;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
}

function desenharTouch(e) {
    e.preventDefault();
    if (!desenhando) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
}

// === LIMPAR ASSINATURA ===
function limparAssinatura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    assinaturaVazia = true;
    window.assinaturaVazia = true;
}

// === FECHAR MODAL ===
function fecharModalAssinatura() {
    const modal = document.getElementById('modalAssinatura');
    if (modal) {
        modal.remove();
    }
}

// === CONFIRMAR ASSINATURA (versão base - será sobrescrita) ===
function confirmarAssinatura() {
    if (assinaturaVazia) {
        alert('Por favor, faça sua assinatura antes de confirmar.');
        return;
    }

    // Salvar assinatura
    assinaturaDataURL = canvas.toDataURL('image/png');
    window.assinaturaDataURL = assinaturaDataURL;

    // Fechar modal
    fecharModalAssinatura();

    // === AQUI O checklist.js VAI SOBRESCREVER ===
    // Por padrão, só calcula nota (comportamento antigo)
    if (typeof window.finalizarComPDF === 'function') {
        window.finalizarComPDF();
    } else {
        calcularNota();
    }
}

// === EXPORTAR TODAS AS FUNÇÕES PARA O WINDOW ===
window.abrirModalAssinatura = abrirModalAssinatura;
window.inicializarCanvas = inicializarCanvas;
window.limparAssinatura = limparAssinatura;
window.fecharModalAssinatura = fecharModalAssinatura;
window.confirmarAssinatura = confirmarAssinatura; // será sobrescrito
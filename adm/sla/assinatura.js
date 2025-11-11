// Variáveis globais para assinatura
let canvas;
let ctx;
let desenhando = false;
let assinaturaVazia = true;
let assinaturaDataURL = null;

// Função para abrir modal de assinatura
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
                <button class="btn-limpar" onclick="limparAssinatura()">🗑️ Limpar</button>
                <button class="btn-cancelar" onclick="fecharModalAssinatura()">❌ Cancelar</button>
                <button class="btn-confirmar" onclick="confirmarAssinatura()">✓ Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Inicializar canvas
    inicializarCanvas();

    return false;
}

// Função para inicializar o canvas
function inicializarCanvas() {
    canvas = document.getElementById('canvasAssinatura');
    ctx = canvas.getContext('2d');

    // Configurar estilo do canvas
    ctx.strokeStyle = '#E94B22';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Eventos de mouse
    canvas.addEventListener('mousedown', iniciarDesenho);
    canvas.addEventListener('mousemove', desenhar);
    canvas.addEventListener('mouseup', pararDesenho);
    canvas.addEventListener('mouseleave', pararDesenho);

    // Eventos de touch (mobile)
    canvas.addEventListener('touchstart', iniciarDesenhoTouch);
    canvas.addEventListener('touchmove', desenharTouch);
    canvas.addEventListener('touchend', pararDesenho);
}

// Funções de desenho - Mouse
function iniciarDesenho(e) {
    desenhando = true;
    assinaturaVazia = false;
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

// Funções de desenho - Touch
function iniciarDesenhoTouch(e) {
    e.preventDefault();
    desenhando = true;
    assinaturaVazia = false;
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

// Função para limpar assinatura
function limparAssinatura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    assinaturaVazia = true;
}

// Função para fechar modal
function fecharModalAssinatura() {
    const modal = document.getElementById('modalAssinatura');
    if (modal) {
        modal.remove();
    }
}

// Função para confirmar assinatura
function confirmarAssinatura() {
    if (assinaturaVazia) {
        alert('Por favor, faça sua assinatura antes de confirmar.');
        return;
    }

    // Salvar assinatura como imagem
    assinaturaDataURL = canvas.toDataURL('image/png');

    // Fechar modal
    fecharModalAssinatura();

    // Prosseguir com o cálculo da nota
    calcularNota();
}

// Função para exibir assinatura no resultado
function exibirAssinatura() {
    if (assinaturaDataURL) {
        const assinaturaDiv = document.getElementById('assinaturaContainer');
        if (assinaturaDiv) {
            assinaturaDiv.innerHTML = `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #5b5b5b;">
                    <h3 style="text-align: center; margin-bottom: 10px;">Assinatura Digital</h3>
                    <div style="text-align: center;">
                        <img src="${assinaturaDataURL}" alt="Assinatura" style="max-width: 100%; border: 2px solid #5b5b5b; border-radius: 8px; background-color: white; padding: 10px;">
                    </div>
                </div>
            `;
        }
    }
}
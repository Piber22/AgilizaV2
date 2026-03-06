// ============================================================
//  REGISTRO DE ATIVIDADES — atividades.js
//  Manserv - Equipe HSANA
// ============================================================

// ============================================================
//  ⏱️  CONFIGURAÇÃO DOS LIMITES DE TEMPO (em segundos)
//  Altere aqui para ajustar as zonas de cor do cronômetro
// ============================================================
const LIMITE_VERDE        = 60 * 60;   // 0 a 60 min  → verde
const LIMITE_VERDE_AMARELO = 65 * 60;  // 60 a 65 min → verde-amarelado
const LIMITE_AMARELO      = 70 * 60;   // 65 a 70 min → amarelo
// Acima de LIMITE_AMARELO → vermelho (sem constante extra necessária)

// ============================================================
//  ⚙️  CONFIGURAÇÃO DO CÍRCULO SVG
//  O raio (r=95) determina a circunferência total
//  Circunferência = 2 * π * r
// ============================================================
const RAIO_CIRCULO = 95;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO_CIRCULO; // ≈ 596.9

// ============================================================
//  ⏱️  CONFIGURAÇÃO DA DURAÇÃO MÁXIMA DO CÍRCULO (em segundos)
//  Define quando o círculo estará 100% preenchido
//  Padrão: 70 minutos (após esse ponto, o círculo permanece cheio)
// ============================================================
const DURACAO_MAXIMA_CIRCULO = LIMITE_AMARELO; // 70 minutos

// ============================================================
//  ESTADO DA APLICAÇÃO
// ============================================================
let timerInterval = null;       // Intervalo do setInterval
let segundosDecorridos = 0;     // Contador de segundos
let atividadeAtiva = false;     // Controla se a atividade está rodando
let desenhando = false;         // Controla o desenho da assinatura
let assinaturaVazia = true;     // Verifica se a assinatura foi feita

// Dados do registro atual
let dadosRegistro = {
    higienista: '',
    quarto: '',
    leito: '',
    inicio: null,
    fim: null,
    duracao: ''
};

// ============================================================
//  ELEMENTOS DO DOM
// ============================================================
const btnIniciar           = document.getElementById('btnIniciar');
const btnFinalizar         = document.getElementById('btnFinalizar');
const secaoCronometro      = document.getElementById('secaoCronometro');
const displayCronometro    = document.getElementById('displayCronometro');
const circuloProgresso     = document.getElementById('circuloProgresso');

const modalFinalizacao     = document.getElementById('modalFinalizacao');
const modalSucesso         = document.getElementById('modalSucesso');
const canvasAssinatura     = document.getElementById('canvasAssinatura');
const ctxAssinatura        = canvasAssinatura.getContext('2d');

const btnLimparAssinatura  = document.getElementById('limparAssinaturaBtn');
const btnCancelarFinalizar = document.getElementById('cancelarFinalizacaoBtn');
const btnConfirmarFinalizar= document.getElementById('confirmarFinalizacaoBtn');
const btnNovaAtividade     = document.getElementById('novaAtividadeBtn');

// ============================================================
//  INICIALIZAÇÃO DO SVG
//  Configura a circunferência do círculo de progresso
// ============================================================
function inicializarCirculo() {
    circuloProgresso.style.strokeDasharray  = `${CIRCUNFERENCIA}`;
    circuloProgresso.style.strokeDashoffset = `${CIRCUNFERENCIA}`; // começa vazio
}

// ============================================================
//  LÓGICA DO CRONÔMETRO
// ============================================================

// Formata segundos em HH:MM:SS
function formatarTempo(segundos) {
    const h = String(Math.floor(segundos / 3600)).padStart(2, '0');
    const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
    const s = String(segundos % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// Determina a zona de cor com base nos segundos
// ⚠️ PARA ALTERAR AS CORES: modifique as constantes no topo do arquivo
function determinarZonaCor(segundos) {
    if (segundos <= LIMITE_VERDE) {
        return 'verde';           // 🟢 0 – 60 min
    } else if (segundos <= LIMITE_VERDE_AMARELO) {
        return 'verde-amarelo';   // 🟡 60 – 65 min
    } else if (segundos <= LIMITE_AMARELO) {
        return 'amarelo';         // 🟠 65 – 70 min
    } else {
        return 'vermelho';        // 🔴 > 70 min
    }
}

// Atualiza as classes de cor no display e no círculo
function atualizarCores(zona) {
    const classesDisplay = [
        'cronometro-verde',
        'cronometro-verde-amarelo',
        'cronometro-amarelo',
        'cronometro-vermelho'
    ];
    const classesCirculo = [
        'circulo-verde',
        'circulo-verde-amarelo',
        'circulo-amarelo',
        'circulo-vermelho'
    ];

    // Remove todas as classes de cor
    displayCronometro.classList.remove(...classesDisplay);
    circuloProgresso.classList.remove(...classesCirculo);

    // Aplica a classe da zona atual
    displayCronometro.classList.add(`cronometro-${zona}`);
    circuloProgresso.classList.add(`circulo-${zona}`);
}

// Atualiza o progresso do círculo SVG
function atualizarCirculo(segundos) {
    // Calcula a fração preenchida (limita a 100%)
    const fracao = Math.min(segundos / DURACAO_MAXIMA_CIRCULO, 1);
    // Quanto MENOS dashoffset, MAIS o círculo está preenchido
    const offset = CIRCUNFERENCIA * (1 - fracao);
    circuloProgresso.style.strokeDashoffset = offset;
}

// Tick do cronômetro — chamado a cada segundo
function tick() {
    segundosDecorridos++;

    // Atualiza o display
    displayCronometro.textContent = formatarTempo(segundosDecorridos);

    // Determina a zona e aplica as cores
    const zona = determinarZonaCor(segundosDecorridos);
    atualizarCores(zona);

    // Atualiza o progresso visual do círculo
    atualizarCirculo(segundosDecorridos);
}

// ============================================================
//  BOTÃO: INICIAR ATIVIDADE
// ============================================================
btnIniciar.addEventListener('click', function () {
    const higienista = document.getElementById('nomeHigienista').value.trim();
    const quarto     = document.getElementById('selectQuarto').value;
    const leito      = document.getElementById('selectLeito').value;

    // Validação básica
    if (!higienista) {
        alert('Por favor, informe o nome do higienista.');
        document.getElementById('nomeHigienista').focus();
        return;
    }
    if (!quarto) {
        alert('Por favor, selecione o quarto.');
        return;
    }
    if (!leito) {
        alert('Por favor, selecione o leito.');
        return;
    }

    // Salva os dados do registro
    dadosRegistro.higienista = higienista;
    dadosRegistro.quarto     = quarto;
    dadosRegistro.leito      = leito;
    dadosRegistro.inicio     = new Date();

    // Altera o botão para estado "em execução"
    btnIniciar.textContent = '⏳ Atividade em execução';
    btnIniciar.classList.add('em-execucao');
    btnIniciar.disabled = true;

    // Bloqueia os campos do formulário
    document.getElementById('nomeHigienista').disabled = true;
    document.getElementById('selectQuarto').disabled   = true;
    document.getElementById('selectLeito').disabled    = true;

    // Reseta e exibe o cronômetro
    segundosDecorridos = 0;
    displayCronometro.textContent = '00:00:00';
    inicializarCirculo();
    atualizarCores('verde');
    secaoCronometro.style.display = 'block';

    // Inicia o timer
    atividadeAtiva = true;
    timerInterval = setInterval(tick, 1000);
});

// ============================================================
//  BOTÃO: FINALIZAR ATIVIDADE
// ============================================================
btnFinalizar.addEventListener('click', function () {
    if (!atividadeAtiva) return;

    // Para o timer
    clearInterval(timerInterval);
    atividadeAtiva = false;

    // Registra o horário de fim e duração
    dadosRegistro.fim     = new Date();
    dadosRegistro.duracao = formatarTempo(segundosDecorridos);

    // Prepara o modal de finalização
    document.getElementById('infoFinalizacao').textContent =
        `Quarto ${dadosRegistro.quarto} – Leito ${dadosRegistro.leito} | Tempo: ${dadosRegistro.duracao}`;

    abrirModal(modalFinalizacao);
    redimensionarCanvas();
    limparCanvas();
});

// ============================================================
//  MODAL DE FINALIZAÇÃO: ASSINATURA
// ============================================================

// Redimensiona o canvas para o tamanho exibido
function redimensionarCanvas() {
    const rect = canvasAssinatura.getBoundingClientRect();
    canvasAssinatura.width  = rect.width;
    canvasAssinatura.height = rect.height;
    ctxAssinatura.strokeStyle = '#111';
    ctxAssinatura.lineWidth   = 2.5;
    ctxAssinatura.lineCap     = 'round';
    ctxAssinatura.lineJoin    = 'round';
    assinaturaVazia = true;
}

function limparCanvas() {
    ctxAssinatura.clearRect(0, 0, canvasAssinatura.width, canvasAssinatura.height);
    assinaturaVazia = true;
}

function obterPosicao(e) {
    const rect = canvasAssinatura.getBoundingClientRect();
    if (e.touches) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Eventos de desenho (mouse)
canvasAssinatura.addEventListener('mousedown', function (e) {
    desenhando = true;
    const pos = obterPosicao(e);
    ctxAssinatura.beginPath();
    ctxAssinatura.moveTo(pos.x, pos.y);
});

canvasAssinatura.addEventListener('mousemove', function (e) {
    if (!desenhando) return;
    const pos = obterPosicao(e);
    ctxAssinatura.lineTo(pos.x, pos.y);
    ctxAssinatura.stroke();
    assinaturaVazia = false;
});

canvasAssinatura.addEventListener('mouseup',    () => { desenhando = false; });
canvasAssinatura.addEventListener('mouseleave', () => { desenhando = false; });

// Eventos de desenho (touch)
canvasAssinatura.addEventListener('touchstart', function (e) {
    e.preventDefault();
    desenhando = true;
    const pos = obterPosicao(e);
    ctxAssinatura.beginPath();
    ctxAssinatura.moveTo(pos.x, pos.y);
}, { passive: false });

canvasAssinatura.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (!desenhando) return;
    const pos = obterPosicao(e);
    ctxAssinatura.lineTo(pos.x, pos.y);
    ctxAssinatura.stroke();
    assinaturaVazia = false;
}, { passive: false });

canvasAssinatura.addEventListener('touchend', () => { desenhando = false; });

// Botão limpar assinatura
btnLimparAssinatura.addEventListener('click', limparCanvas);

// Botão cancelar modal (retoma o timer)
btnCancelarFinalizar.addEventListener('click', function () {
    fecharModal(modalFinalizacao);
    // Retoma o timer de onde parou
    atividadeAtiva = true;
    timerInterval = setInterval(tick, 1000);
});

// Botão confirmar finalização
btnConfirmarFinalizar.addEventListener('click', function () {
    const nomeResponsavel = document.getElementById('nomeResponsavel').value.trim();

    if (!nomeResponsavel) {
        alert('Por favor, informe o nome do responsável.');
        document.getElementById('nomeResponsavel').focus();
        return;
    }

    if (assinaturaVazia) {
        alert('Por favor, insira a assinatura do responsável.');
        return;
    }

    // Captura a assinatura como imagem base64
    const assinaturaBase64 = canvasAssinatura.toDataURL('image/png');

    // Monta o objeto final do registro
    const registroFinal = {
        higienista:    dadosRegistro.higienista,
        quarto:        dadosRegistro.quarto,
        leito:         dadosRegistro.leito,
        inicio:        dadosRegistro.inicio.toLocaleString('pt-BR'),
        fim:           dadosRegistro.fim.toLocaleString('pt-BR'),
        duracao:       dadosRegistro.duracao,
        responsavel:   nomeResponsavel,
        assinatura:    assinaturaBase64,
        // Zona final de cor (indica se ficou dentro ou fora do prazo)
        status:        determinarZonaCor(segundosDecorridos)
    };

    console.log('📋 Registro finalizado:', registroFinal);
    // 👆 AQUI: futuramente enviar registroFinal para o Google Sheets

    fecharModal(modalFinalizacao);

    // Exibe modal de sucesso
    document.getElementById('mensagemSucesso').innerHTML =
        `<strong>${dadosRegistro.higienista}</strong><br>` +
        `Quarto ${dadosRegistro.quarto} – Leito ${dadosRegistro.leito}<br>` +
        `Tempo total: <strong>${dadosRegistro.duracao}</strong>`;

    abrirModal(modalSucesso);
});

// ============================================================
//  BOTÃO: NOVA ATIVIDADE (reinicia tudo)
// ============================================================
btnNovaAtividade.addEventListener('click', function () {
    fecharModal(modalSucesso);
    resetarInterface();
});

// ============================================================
//  FUNÇÕES UTILITÁRIAS
// ============================================================

function abrirModal(modal) {
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function fecharModal(modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function resetarInterface() {
    // Reseta estado
    clearInterval(timerInterval);
    timerInterval = null;
    segundosDecorridos = 0;
    atividadeAtiva = false;
    assinaturaVazia = true;

    dadosRegistro = {
        higienista: '',
        quarto: '',
        leito: '',
        inicio: null,
        fim: null,
        duracao: ''
    };

    // Reseta formulário
    document.getElementById('nomeHigienista').value    = '';
    document.getElementById('selectQuarto').value      = '';
    document.getElementById('selectLeito').value       = '';
    document.getElementById('nomeResponsavel').value   = '';
    document.getElementById('nomeHigienista').disabled = false;
    document.getElementById('selectQuarto').disabled   = false;
    document.getElementById('selectLeito').disabled    = false;

    // Reseta botão iniciar
    btnIniciar.textContent = '▶ Iniciar Atividade';
    btnIniciar.classList.remove('em-execucao');
    btnIniciar.disabled = false;

    // Oculta cronômetro
    secaoCronometro.style.display = 'none';

    // Reseta display
    displayCronometro.textContent = '00:00:00';
    displayCronometro.className   = 'cronometro-tempo';
    inicializarCirculo();
    atualizarCores('verde');
}

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
inicializarCirculo();
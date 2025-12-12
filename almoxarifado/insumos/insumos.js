console.log("✅ Recebimento.js carregado!");

// URL do seu Apps Script (ALTERE PARA A SUA URL SE NECESSÁRIO)
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbwWfpXxY9wflJmC3aq5NRyO8TrcicmxuYUDP9Io-iEU1EtOSXzXq0Apnijm_o-WZkr3xQ/exec';

// Variável global para armazenar os dados
let dadosRecebimento = null;

// Função para mostrar feedback
function mostrarFeedback(mensagem, tipo) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = mensagem;
    feedback.className = `feedback ${tipo}`;
    feedback.style.display = 'block';

    setTimeout(() => {
        feedback.style.display = 'none';
    }, 5000);
}

// Função para formatar data com horário atual
function formatarDataComHorario(dataInput) {
    if (!dataInput) return '';

    const parts = dataInput.split('-');
    const dataFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;

    // Capturar horário atual
    const agora = new Date();
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const horarioStr = `${hora}:${minuto}`;

    return `${dataFormatada} - ${horarioStr}`;
}

// Função para formatar validade (mês/ano)
function formatarValidade(validadeInput) {
    if (!validadeInput) return '';
    const parts = validadeInput.split('-');
    return `${parts[1]}/${parts[0]}`; // MM/YYYY
}

// Função para enviar dados para planilha
async function enviarParaPlanilha(dados) {
    try {
        console.log("📤 Enviando para planilha:", dados);

        const resposta = await fetch(URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        console.log("✅ Requisição enviada! Verifique a planilha em alguns segundos.");
        return true;

    } catch (erro) {
        console.error("❌ Erro ao enviar:", erro);
        return false;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Preencher data atual automaticamente
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    document.getElementById('data').value = `${ano}-${mes}-${dia}`;

    // Botão de envio
    document.getElementById('enviarBtn').addEventListener('click', async function() {
        // Capturar valores dos campos
        const data = document.getElementById('data').value;
        const validade = document.getElementById('validade').value;
        const local = document.getElementById('local').value.trim();
        const entreguePor = document.getElementById('entreguePor').value.trim();
        const recebidoPor = document.getElementById('recebidoPor').value;
        const tipoInsumo = document.getElementById('tipoInsumo').value;

        // Validar campos obrigatórios
        if (!data || !validade || !local || !entreguePor || !recebidoPor) {
            mostrarFeedback('⚠️ Por favor, preencha todos os campos!', 'error');
            return;
        }

        // Preparar dados
        dadosRecebimento = {
            dataHora: formatarDataComHorario(data),
            validade: formatarValidade(validade),
            local: local,
            entreguePor: entreguePor,
            recebidoPor: recebidoPor,
            tipoInsumo: tipoInsumo
        };

        console.log("📋 Dados preparados:", dadosRecebimento);

        // Enviar para planilha
        //mostrarFeedback('📤 Enviando dados...', 'success');
        const sucesso = await enviarParaPlanilha(dadosRecebimento);

        if (sucesso) {
            mostrarFeedback('Enviado', 'success');

            // Limpar formulário após 2 segundos
            setTimeout(() => {
                document.getElementById('dataHora').value = `${ano}-${mes}-${dia}`;
                document.getElementById('validade').value = '';
                document.getElementById('local').value = '';
                document.getElementById('entreguePor').value = '';
                document.getElementById('recebidoPor').value = '';
                document.getElementById('tipoInsumo').value = '';
            }, 2000);
        } else {
            mostrarFeedback('❌ Erro ao enviar dados. Tente novamente.', 'error');
        }
    });
});
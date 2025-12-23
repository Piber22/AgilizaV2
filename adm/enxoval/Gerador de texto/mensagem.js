/**
 * mensagem.js
 * Gerador automático de mensagem de enxoval
 */

// URL do CSV publicado
const URL_CSV_SHEETS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAKvNyRlIrJWLPN5tjaDUFvMhC5_abfdGHvQNcFU9CPcPWwv6Wp9AcsImz1-_8E5enZP0miDfOdR_G/pub?output=csv";

// Elementos DOM
const dataSelecionada = document.getElementById('dataSelecionada');
const btnCopiar = document.getElementById('btnCopiar');
const resultadoArea = document.getElementById('resultadoArea');
const mensagemGerada = document.getElementById('mensagemGerada');
const statusMsg = document.getElementById('statusMsg');

// Dados carregados
let todosOsDados = [];

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // Definir data padrão como hoje
    const hoje = new Date();
    dataSelecionada.value = hoje.toISOString().split('T')[0];

    // Carregar dados
    carregarDados();

    // Evento de mudança de data
    dataSelecionada.addEventListener('change', gerarMensagem);

    // Evento de copiar
    btnCopiar.addEventListener('click', copiarMensagem);
});

/**
 * Parse CSV manual
 */
function parseCSVManual(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
        if (values.length < headers.length) continue;
        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx]);
        data.push(row);
    }
    return data;
}

/**
 * Carrega dados do Google Sheets
 */
async function carregarDados() {
    try {
        mostrarStatus('Carregando dados...', 'info');

        const response = await fetch(URL_CSV_SHEETS, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const text = await response.text();
        todosOsDados = parseCSVManual(text);

        console.log(`${todosOsDados.length} registros carregados`);
        mostrarStatus('Dados carregados com sucesso!', 'sucesso');

        setTimeout(() => {
            statusMsg.innerHTML = '';
            // Gerar mensagem automaticamente para a data padrão
            gerarMensagem();
        }, 1500);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        mostrarStatus('Erro ao carregar dados. Verifique a conexão.', 'erro');
    }
}

/**
 * Converte data de dd/mm/yyyy para objeto Date
 */
function converterDataParaObj(dataStr) {
    if (!dataStr || dataStr.length < 10) return null;
    const partes = dataStr.split('/');
    if (partes.length !== 3) return null;
    const [dia, mes, ano] = partes;
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
}

/**
 * Converte Date para dd/mm/yyyy
 */
function formatarData(date) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

/**
 * Gera a mensagem com base na data selecionada
 */
function gerarMensagem() {
    if (!dataSelecionada.value) {
        mostrarStatus('Por favor, selecione uma data.', 'erro');
        resultadoArea.style.display = 'none';
        return;
    }

    if (todosOsDados.length === 0) {
        mostrarStatus('Dados ainda não foram carregados. Aguarde...', 'erro');
        resultadoArea.style.display = 'none';
        return;
    }

    // Converter data selecionada para formato dd/mm/yyyy
    const dataSel = new Date(dataSelecionada.value + 'T00:00:00');
    const dataFormatada = formatarData(dataSel);

    console.log("Buscando dados para:", dataFormatada);

    // Filtrar registros da data selecionada
    const registrosDoDia = todosOsDados.filter(registro => {
        return registro['Data Coleta'] === dataFormatada;
    });

    if (registrosDoDia.length === 0) {
        mostrarStatus('Nenhum registro encontrado para esta data.', 'erro');
        resultadoArea.style.display = 'none';
        return;
    }

    // Somar quantidades do dia
    let mopsSujo = 0;
    let mopsLimpo = 0;
    let panosSujo = 0;
    let panosLimpo = 0;

    registrosDoDia.forEach(registro => {
        mopsSujo += parseInt(registro['Mops Sujos']) || 0;
        mopsLimpo += parseInt(registro['Mops Limpos']) || 0;
        panosSujo += parseInt(registro['Panos Sujos']) || 0;
        panosLimpo += parseInt(registro['Panos Limpos']) || 0;
    });

    // Gerar mensagem
    const mensagem = `Registro ${dataFormatada}:
Mops sujos: ${mopsSujo} / Mops limpos: ${mopsLimpo}
Panos sujos: ${panosSujo} / Panos limpos: ${panosLimpo}`;

    mensagemGerada.textContent = mensagem;
    resultadoArea.style.display = 'block';
    statusMsg.innerHTML = '';

    console.log("Mensagem gerada com sucesso");
}

/**
 * Copia a mensagem para a área de transferência
 */
async function copiarMensagem() {
    const texto = mensagemGerada.textContent;

    try {
        await navigator.clipboard.writeText(texto);
        btnCopiar.textContent = '✓ Copiado!';
        btnCopiar.classList.add('copiado');

        setTimeout(() => {
            btnCopiar.textContent = '📋 Copiar Mensagem';
            btnCopiar.classList.remove('copiado');
        }, 2000);
    } catch (err) {
        console.error('Erro ao copiar:', err);
        mostrarStatus('Erro ao copiar. Tente selecionar e copiar manualmente.', 'erro');
    }
}

/**
 * Mostra mensagem de status
 */
function mostrarStatus(mensagem, tipo) {
    statusMsg.innerHTML = `<div class="status ${tipo}">${mensagem}</div>`;
}
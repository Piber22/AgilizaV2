/**
 * sheets-api.js
 * Comunicação com Google Sheets para carregar dados de enxoval
 */

console.log("Módulo sheets-api.js carregado");

// URL do CSV publicado do Google Sheets
// IMPORTANTE: Substitua pela URL correta da sua planilha publicada
const URL_CSV_SHEETS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAKvNyRlIrJWLPN5tjaDUFvMhC5_abfdGHvQNcFU9CPcPWwv6Wp9AcsImz1-_8E5enZP0miDfOdR_G/pub?output=csv";

/**
 * Parse CSV manual
 * @param {string} text - Texto CSV
 * @returns {Array} Array de objetos
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
 * Função para buscar dados do Google Sheets
 * @returns {Promise<Array>} Array com os dados da planilha
 */
async function buscarDadosSheets() {
    try {
        console.log("Buscando dados do Google Sheets...");
        console.log("URL:", URL_CSV_SHEETS);

        const response = await fetch(URL_CSV_SHEETS, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        const text = await response.text();
        console.log("CSV recebido, tamanho:", text.length, "caracteres");

        const dados = parseCSVManual(text);

        console.log(`${dados.length} registros carregados do Sheets`);

        if (dados.length > 0) {
            console.log("Exemplo de registro:", dados[0]);
            console.log("Colunas disponíveis:", Object.keys(dados[0]));
        }

        return dados;

    } catch (error) {
        console.error("Erro detalhado ao buscar dados do Sheets:", error);
        console.error("Tipo do erro:", error.name);
        console.error("Mensagem:", error.message);
        throw error;
    }
}

/**
 * Converte data de dd/mm/yyyy para objeto Date
 * @param {string} dataStr - Data em formato dd/mm/yyyy
 * @returns {Date|null} Objeto Date ou null se inválido
 */
function converterDataParaObj(dataStr) {
    if (!dataStr || dataStr.length < 10) {
        return null;
    }

    const partes = dataStr.split('/');
    if (partes.length !== 3) {
        return null;
    }

    const [dia, mes, ano] = partes;
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
}

/**
 * Filtra dados por intervalo de datas
 * @param {Array} dados - Array de registros
 * @param {Date} dataInicial - Data inicial do filtro
 * @param {Date} dataFinal - Data final do filtro
 * @returns {Array} Dados filtrados
 */
function filtrarPorData(dados, dataInicial, dataFinal) {
    if (!dataInicial && !dataFinal) {
        return dados;
    }

    return dados.filter(registro => {
        const dataRegistro = converterDataParaObj(registro['Data Coleta']);

        if (!dataRegistro) {
            return false;
        }

        if (dataInicial && dataRegistro < dataInicial) {
            return false;
        }

        if (dataFinal && dataRegistro > dataFinal) {
            return false;
        }

        return true;
    });
}

/**
 * Converte URL do Google Drive para formato de visualização direta
 * @param {string} url - URL do Google Drive
 * @returns {string} URL convertida para visualização
 */
function converterURLDrive(url) {
    if (!url || url === 'Sem foto') {
        return null;
    }

    // Extrair o ID do arquivo da URL
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        const fileId = match[1];
        // Retorna URL de visualização direta
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    return null;
}
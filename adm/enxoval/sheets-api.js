/**
 * sheets-api.js
 * Comunicação com Google Sheets para carregar dados de enxoval
 */

console.log("Módulo sheets-api.js carregado");

// URL do CSV publicado do Google Sheets
// IMPORTANTE: Adicione o GID da aba específica se necessário
const URL_CSV_SHEETS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAKvNyRlIrJWLPN5tjaDUFvMhC5_abfdGHvQNcFU9CPcPWwv6Wp9AcsImz1-_8E5enZP0miDfOdR_G/pub?output=csv";

/**
 * Parse CSV manual (mesmo método do sheet.js que funciona)
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
 * Função para buscar dados do Google Sheets usando fetch
 * Mesmo método do sheet.js que funciona
 * @returns {Promise<Array>} Array com os dados da planilha
 */
async function buscarDadosSheets() {
    try {
        console.log("Buscando dados do Google Sheets...");

        const response = await fetch(URL_CSV_SHEETS);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const text = await response.text();
        const dados = parseCSVManual(text);

        console.log(`${dados.length} registros carregados do Sheets`);

        if (dados.length > 0) {
            console.log("Exemplo de registro:", dados[0]);
            console.log("Colunas disponíveis:", Object.keys(dados[0]));
        }

        return dados;

    } catch (error) {
        console.error("Erro ao buscar dados do Sheets:", error);
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
        const dataRegistro = converterDataParaObj(registro.DATA);

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
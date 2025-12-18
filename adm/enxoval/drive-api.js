/**
 * drive-api.js
 * Comunicação com Google Drive via Apps Script
 */

console.log("Módulo drive-api.js carregado");

// URL do Google Apps Script implantado
// IMPORTANTE: Substitua pela URL do seu Apps Script após a implantação
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyTFev7oxjYVApJY5ZI-BxQ_pgS-A_7hgdxJ5lb8u3XVW0qKAEeH0fp5CZTkx0qgQ8S/exec';

// Cache de imagens em memória
let cacheImagens = new Map();
let cacheCarregado = false;

/**
 * Constrói o nome do arquivo baseado nos parâmetros
 * Padrão: TIPO_DD-MM-YYYY_SITUACAO
 *
 * @param {string} tipo - "MOPS" ou "PANOS"
 * @param {string} data - Data no formato dd/mm/yyyy
 * @param {string} situacao - "Sujo" ou "Limpo"
 * @returns {string} Nome do arquivo esperado
 */
function construirNomeArquivo(tipo, data, situacao) {
    // Converte data de dd/mm/yyyy para dd-mm-yyyy
    const dataFormatada = data.replace(/\//g, '-');

    // Padroniza a situação (primeira letra maiúscula)
    const situacaoFormatada = situacao.toUpperCase();

    // Constrói o nome do arquivo
    return `${tipo}_${dataFormatada}_${situacaoFormatada}`;
}

/**
 * Carrega todas as imagens da pasta do Drive e armazena em cache
 * @returns {Promise<boolean>} True se carregou com sucesso
 */
async function carregarCacheImagens() {
    if (cacheCarregado) {
        return true;
    }

    try {
        console.log("Carregando cache de imagens do Drive...");

        const response = await fetch(`${GAS_API_URL}?action=list`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.imagens) {
            // Armazena no cache usando o nome do arquivo como chave
            data.imagens.forEach(img => {
                // Remove a extensão para facilitar a busca
                const nomeSemExtensao = img.nome.replace(/\.[^/.]+$/, '');
                cacheImagens.set(nomeSemExtensao.toLowerCase(), img.viewUrl);

                // Também armazena com o nome completo
                cacheImagens.set(img.nome.toLowerCase(), img.viewUrl);
            });

            cacheCarregado = true;
            console.log(`Cache carregado: ${data.imagens.length} imagens`);
            return true;
        }

        return false;

    } catch (error) {
        console.error("Erro ao carregar cache de imagens:", error);
        return false;
    }
}

/**
 * Obtém URL da imagem (primeiro tenta do cache, depois busca na API)
 * @param {string} tipo - "MOPS" ou "PANOS"
 * @param {string} data - Data no formato dd/mm/yyyy
 * @param {string} situacao - "Sujo" ou "Limpo"
 * @returns {Promise<string>} URL da imagem ou string vazia
 */
async function obterURLImagem(tipo, data, situacao) {
    // Garante que o cache está carregado
    if (!cacheCarregado) {
        await carregarCacheImagens();
    }

    // Constrói o nome do arquivo esperado
    const nomeArquivo = construirNomeArquivo(tipo, data, situacao);

    console.log(`Buscando imagem: ${nomeArquivo}`);

    // Busca no cache (case-insensitive)
    const urlCache = cacheImagens.get(nomeArquivo.toLowerCase());

    if (urlCache) {
        console.log(`✓ Imagem encontrada no cache: ${nomeArquivo}`);
        return urlCache;
    }

    // Se não encontrou no cache, tenta buscar diretamente na API
    try {
        const response = await fetch(`${GAS_API_URL}?action=url&nome=${encodeURIComponent(nomeArquivo)}`);

        if (!response.ok) {
            console.warn(`✗ Imagem não encontrada: ${nomeArquivo}`);
            return '';
        }

        const data = await response.json();

        if (data.success && data.url) {
            console.log(`✓ Imagem encontrada na API: ${nomeArquivo}`);
            // Adiciona ao cache para próximas buscas
            cacheImagens.set(nomeArquivo.toLowerCase(), data.url);
            return data.url;
        }

    } catch (error) {
        console.error(`Erro ao buscar imagem ${nomeArquivo}:`, error);
    }

    console.warn(`✗ Imagem não encontrada: ${nomeArquivo}`);
    return '';
}

/**
 * Lista todas as imagens disponíveis (útil para debug)
 * @returns {Promise<Array>} Array com informações das imagens
 */
async function listarTodasImagens() {
    try {
        const response = await fetch(`${GAS_API_URL}?action=list`);
        const data = await response.json();

        if (data.success) {
            console.log("Imagens disponíveis:", data.imagens);
            return data.imagens;
        }

        return [];

    } catch (error) {
        console.error("Erro ao listar imagens:", error);
        return [];
    }
}

/**
 * Recarrega o cache de imagens (útil após adicionar novas imagens)
 * @returns {Promise<boolean>} True se recarregou com sucesso
 */
async function recarregarCache() {
    cacheCarregado = false;
    cacheImagens.clear();
    return await carregarCacheImagens();
}

// Carrega o cache automaticamente quando a página inicia
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        carregarCacheImagens();
    });
}

// Expõe funções úteis para debug no console
window.debugDrive = {
    listarImagens: listarTodasImagens,
    recarregarCache: recarregarCache,
    verCache: () => {
        console.log('Cache atual:', Array.from(cacheImagens.entries()));
    }
};
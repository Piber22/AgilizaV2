console.log("✅ Script de envio para Google Drive carregado!");

// URL do seu Apps Script (você precisará criar um novo script no Google Apps Script)
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbyt82Bf9fp0Rs91i85Aox7-n-AAerdz-Vps04_MmKGSL-4QQLVl2udh68vy4HUiB9RcLQ/exec';

// ID da pasta do Google Drive
const FOLDER_ID = '1tgGS1R9A7AUYM7Vxo0eYmtU_Vo7S3Rcv';

/**
 * Função para converter File para Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remover o prefixo "data:image/jpeg;base64," ou similar
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Função para enviar fotos para o Google Drive
 * @param {Object} dados - Dados do registro (data, mops, panos, etc)
 * @param {File} fotoSujo - Arquivo da foto do enxoval sujo (pode ser null)
 * @param {File} fotoLimpo - Arquivo da foto do enxoval limpo (pode ser null)
 */
async function enviarParaDrive(dados, fotoSujo, fotoLimpo) {
    try {
        console.log("📤 Enviando dados para o Google Drive...");

        const fotos = [];

        // Converter foto sujo para Base64 (se existir)
        if (fotoSujo) {
            const fotoSujoBase64 = await fileToBase64(fotoSujo);
            const nomeArquivoSujo = `MP_SUJO_${dados.data.replace(/\//g, '-')}.jpg`;

            fotos.push({
                nome: nomeArquivoSujo,
                conteudo: fotoSujoBase64,
                mimeType: fotoSujo.type
            });

            console.log("📷 Foto sujo:", nomeArquivoSujo);
        } else {
            console.log("⚠️ Sem foto do enxoval sujo");
        }

        // Converter foto limpo para Base64 (se existir)
        if (fotoLimpo) {
            const fotoLimpoBase64 = await fileToBase64(fotoLimpo);
            const nomeArquivoLimpo = `MP_LIMPO_${dados.data.replace(/\//g, '-')}.jpg`;

            fotos.push({
                nome: nomeArquivoLimpo,
                conteudo: fotoLimpoBase64,
                mimeType: fotoLimpo.type
            });

            console.log("📷 Foto limpo:", nomeArquivoLimpo);
        } else {
            console.log("⚠️ Sem foto do enxoval limpo");
        }

        // Preparar payload
        const payload = {
            folderId: FOLDER_ID,
            fotos: fotos,
            dados: dados
        };

        // Enviar para o Apps Script
        const resposta = await fetch(URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log("✅ Dados enviados para o Google Drive!");
        return true;

    } catch (erro) {
        console.error("❌ Erro ao enviar para o Drive:", erro);
        return false;
    }
}
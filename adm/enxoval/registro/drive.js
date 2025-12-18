console.log("✅ Script de envio para Google Drive carregado!");

// URL do seu Apps Script (você precisará criar um novo script no Google Apps Script)
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbwKu-uG9M9rWKgzzH_twKMqFso6YIy0GwjS_5AvHNtHhYS1IObBeKK20NoXgYlimr2YpA/exec';

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
 * @param {File} fotoSujo - Arquivo da foto do enxoval sujo
 * @param {File} fotoLimpo - Arquivo da foto do enxoval limpo
 */
async function enviarParaDrive(dados, fotoSujo, fotoLimpo) {
    try {
        console.log("📤 Enviando fotos para o Google Drive...");

        // Converter fotos para Base64
        const fotoSujoBase64 = await fileToBase64(fotoSujo);
        const fotoLimpoBase64 = await fileToBase64(fotoLimpo);

        // Preparar nomes dos arquivos
        const nomeArquivoSujo = `MP_SUJO_${dados.data.replace(/\//g, '-')}.jpg`;
        const nomeArquivoLimpo = `MP_LIMPO_${dados.data.replace(/\//g, '-')}.jpg`;

        console.log("📁 Nomes dos arquivos:");
        console.log("   Sujo:", nomeArquivoSujo);
        console.log("   Limpo:", nomeArquivoLimpo);

        // Preparar payload
        const payload = {
            folderId: FOLDER_ID,
            fotos: [
                {
                    nome: nomeArquivoSujo,
                    conteudo: fotoSujoBase64,
                    mimeType: fotoSujo.type
                },
                {
                    nome: nomeArquivoLimpo,
                    conteudo: fotoLimpoBase64,
                    mimeType: fotoLimpo.type
                }
            ],
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

        console.log("✅ Fotos enviadas para o Google Drive!");
        return true;

    } catch (erro) {
        console.error("❌ Erro ao enviar para o Drive:", erro);
        return false;
    }
}

/*
========================================
INSTRUÇÕES PARA CONFIGURAR O APPS SCRIPT
========================================

1. Acesse: https://script.google.com/
2. Crie um novo projeto
3. Cole o código abaixo:

function doPost(e) {
  try {
    // Parse dos dados recebidos
    var dados = JSON.parse(e.postData.contents);

    // ID da pasta (você já forneceu)
    var folderId = dados.folderId;
    var folder = DriveApp.getFolderById(folderId);

    // Processar cada foto
    var resultados = [];

    dados.fotos.forEach(function(foto) {
      // Decodificar Base64
      var blob = Utilities.newBlob(
        Utilities.base64Decode(foto.conteudo),
        foto.mimeType,
        foto.nome
      );

      // Verificar se arquivo já existe e deletá-lo
      var arquivosExistentes = folder.getFilesByName(foto.nome);
      while (arquivosExistentes.hasNext()) {
        arquivosExistentes.next().setTrashed(true);
      }

      // Criar novo arquivo
      var arquivo = folder.createFile(blob);

      resultados.push({
        nome: foto.nome,
        id: arquivo.getId(),
        url: arquivo.getUrl()
      });
    });

    // Retornar sucesso
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'sucesso',
        arquivos: resultados,
        dados: dados.dados
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'erro',
        mensagem: erro.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

4. Clique em "Implantar" > "Nova implantação"
5. Selecione "Aplicativo da Web"
6. Configure:
   - Executar como: Sua conta
   - Quem tem acesso: Qualquer pessoa
7. Clique em "Implantar"
8. Copie a URL do Web App
9. Cole a URL no início deste arquivo na variável URL_APPS_SCRIPT

IMPORTANTE: Você precisará autorizar o script a acessar seu Google Drive na primeira vez.
*/
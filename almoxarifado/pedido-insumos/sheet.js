// sheet.js
console.log("✅ Script de envio para planilha carregado!");

// URL do seu Apps Script
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbys0IfPC0Z5Pn10UQuy0VIhxhkUAd5eI1yURA9NX3OVU4GJtY2RXNvlsP8ZTkP9CIey/exec';

// Função para enviar dados para a planilha
async function enviarParaPlanilha(dados) {
    try {
        console.log("📤 Enviando para planilha:", dados);

        const resposta = await fetch(URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors', // ← ADICIONE ESTA LINHA
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        // Com no-cors, não conseguimos ler a resposta, mas os dados são enviados
        console.log("✅ Dados enviados! Verifique a planilha.");
        return true;

    } catch (erro) {
        console.error("❌ Erro:", erro);
        return false;
    }
}

// Interceptar o botão copiar para também enviar
document.addEventListener('DOMContentLoaded', function() {
    const btnCopiar = document.getElementById("copiarBtn");

    if (btnCopiar) {
        btnCopiar.addEventListener("click", async function() {
            // Aguardar um pouco para não interferir na cópia
            setTimeout(async () => {
                if (typeof dadosRecebimento !== 'undefined' && dadosRecebimento.data) {
                    await enviarParaPlanilha(dadosRecebimento);
                }
            }, 500);
        });
    }
});
console.log("✅ Script de envio de efetivo carregado!");

// URL do seu Apps Script
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbyhTsgQhQVQbjqQci8q4rykBsMDDGAR9FHuCYD2ly93kh3LR18aZ4z3RXi8vkmc9ZZRZw/exec';

// Função para enviar dados para a planilha
async function enviarParaPlanilhaEfetivo(dadosFormatados) {
    try {
        console.log("📤 Enviando efetivo para planilha:", dadosFormatados);

        await fetch(URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors', // Mantém para evitar bloqueio CORS
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ registros: dadosFormatados })
        });

        console.log("✅ Dados enviados! Verifique a planilha.");
        return true;

    } catch (erro) {
        console.error("❌ Erro:", erro);
        return false;
    }
}

// Enviar automaticamente ao clicar em “Copiar”
document.addEventListener('DOMContentLoaded', function() {
    const btnCopiar = document.getElementById("copiarBtn");

    if (btnCopiar) {
        btnCopiar.addEventListener("click", async function() {
            setTimeout(async () => {
                const texto = document.getElementById("resultado").value.trim();
                if (!texto) {
                    console.warn("⚠️ Nenhum texto encontrado para enviar.");
                    return;
                }

                // Converte texto em estrutura tabular (função do auxiliar.js)
                const dadosFormatados = textoParaTabelaEfetivo(texto);

                if (dadosFormatados.length > 0) {
                    await enviarParaPlanilhaEfetivo(dadosFormatados);
                } else {
                    console.warn("⚠️ Nenhum registro válido encontrado no texto.");
                }
            }, 500);
        });
    }
});

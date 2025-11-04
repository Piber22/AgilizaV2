console.log("✅ Script de envio para planilha carregado!");

// URL do seu Apps Script
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbydRuNf1BUjtk4QCN0jtvw8j4qT0JepVbRPNyNUx628Z41fSqTqv9lZeUlItHCIjEh1/exec';

// Função para enviar dados para a planilha
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

        // Com no-cors, não conseguimos ler a resposta, mas os dados são enviados
        console.log("✅ Requisição enviada! Verifique a planilha em alguns segundos.");
        return true;

    } catch (erro) {
        console.error("❌ Erro ao enviar:", erro);
        alert("Erro ao enviar para planilha. Verifique o console.");
        return false;
    }
}

// Interceptar o botão copiar para também enviar
document.addEventListener('DOMContentLoaded', function() {
    const btnCopiar = document.getElementById("copiarBtn");

    if (btnCopiar) {
        btnCopiar.addEventListener("click", async function() {
            console.log("🔍 Verificando dados para envio...");

            // Aguardar um pouco para não interferir na cópia
            setTimeout(async () => {
                // Acessar a variável global dadosRecebidos
                if (typeof dadosRecebidos !== 'undefined' && dadosRecebidos !== null && dadosRecebidos.data) {
                    console.log("✅ Dados encontrados, enviando...");
                    await enviarParaPlanilha(dadosRecebidos);
                } else {
                    console.warn("⚠️ Nenhum dado para enviar. Gere a mensagem primeiro!");
                }
            }, 500);
        });
    }
});
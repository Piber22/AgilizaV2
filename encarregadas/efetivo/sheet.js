console.log("✅ Script de envio de efetivo carregado!");

// URL do seu Apps Script
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbyhTsgQhQVQbjqQci8q4rykBsMDDGAR9FHuCYD2ly93kh3LR18aZ4z3RXi8vkmc9ZZRZw/exec';

// Função para enviar dados para a planilha
async function enviarParaPlanilhaEfetivo(dadosFormatados) {
    try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📤 INICIANDO ENVIO PARA PLANILHA");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        console.log("📊 Total de registros:", dadosFormatados.length);

        // Verifica o primeiro registro em detalhes
        if (dadosFormatados.length > 0) {
            console.log("🔍 ANÁLISE DO PRIMEIRO REGISTRO:");
            const primeiro = dadosFormatados[0];
            console.log("  📅 Data:", primeiro.data, "| Tipo:", typeof primeiro.data);
            console.log("  🕐 Horário:", primeiro.horario, "| Tipo:", typeof primeiro.horario);
            console.log("  👥 Equipe:", primeiro.equipe, "| Tipo:", typeof primeiro.equipe);
            console.log("  📋 Categoria:", primeiro.categoria, "| Tipo:", typeof primeiro.categoria);
            console.log("  👤 Colaborador:", primeiro.colaborador, "| Tipo:", typeof primeiro.colaborador);
        }

        // Prepara o payload
        const payload = { registros: dadosFormatados };
        const payloadString = JSON.stringify(payload);

        console.log("📦 Payload completo (JSON):");
        console.log(payloadString);

        console.log("📏 Tamanho do payload:", payloadString.length, "caracteres");

        // Verifica se o horário está presente no JSON
        const temHorario = payloadString.includes('"horario"');
        console.log("🔍 Campo 'horario' presente no JSON?", temHorario ? "✅ SIM" : "❌ NÃO");

        if (temHorario) {
            const matchHorario = payloadString.match(/"horario":"([^"]+)"/);
            if (matchHorario) {
                console.log("🕐 Valor do horário no JSON:", matchHorario[1]);
            }
        }

        console.log("🚀 Enviando requisição para:", URL_APPS_SCRIPT);

        await fetch(URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: payloadString
        });

        console.log("✅ Requisição enviada com sucesso!");
        console.log("⏳ Aguarde alguns segundos e verifique a planilha.");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return true;

    } catch (erro) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ ERRO AO ENVIAR:");
        console.error(erro);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        return false;
    }
}

// Enviar automaticamente ao clicar em "Copiar"
document.addEventListener('DOMContentLoaded', function() {
    const btnCopiar = document.getElementById("copiarBtn");

    if (btnCopiar) {
        btnCopiar.addEventListener("click", async function() {
            console.log("🖱️ Botão 'Copiar' clicado!");

            setTimeout(async () => {
                const texto = document.getElementById("resultado").value.trim();

                if (!texto) {
                    console.warn("⚠️ Nenhum texto encontrado no textarea.");
                    return;
                }

                console.log("📝 Texto capturado do textarea (primeiros 100 caracteres):");
                console.log(texto.substring(0, 100) + "...");

                // Converte texto em estrutura tabular (função do auxiliar.js)
                console.log("🔄 Chamando textoParaTabelaEfetivo...");
                const dadosFormatados = textoParaTabelaEfetivo(texto);

                if (dadosFormatados.length > 0) {
                    console.log("✅ Dados formatados com sucesso!");
                    await enviarParaPlanilhaEfetivo(dadosFormatados);
                } else {
                    console.warn("⚠️ Nenhum registro válido encontrado no texto.");
                }
            }, 500);
        });
    } else {
        console.error("❌ Botão 'copiarBtn' não encontrado no DOM!");
    }
});
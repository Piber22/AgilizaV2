console.log("✅ Script de envio de efetivo carregado!");

// URL do seu Apps Script
//const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbyhTsgQhQVQbjqQci8q4rykBsMDDGAR9FHuCYD2ly93kh3LR18aZ4z3RXi8vkmc9ZZRZw/exec';

// Função para enviar dados para a planilha
async function enviarParaPlanilhaEfetivo(dadosFormatados) {
    try {
        // dd/mm/yyyy -> yyyy-mm-dd (coluna do tipo date)
        const linhas = dadosFormatados.map(r => {
            const [d, m, a] = r.data.split("/");
            return {
                data: `${a}-${m}-${d}`,
                horario: r.horario,
                equipe: r.equipe,
                categoria: r.categoria,
                colaborador: r.colaborador
            };
        });

        const { error } = await sb
            .from("efetivo_registros")
            .upsert(linhas, { onConflict: "data,equipe,colaborador" });

        if (error) throw error;

        console.log(`✅ ${linhas.length} registros salvos no Supabase`);
        return true;
    } catch (erro) {
        console.error("❌ Erro ao salvar no Supabase:", erro);
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

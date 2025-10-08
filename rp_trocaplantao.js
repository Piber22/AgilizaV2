console.log("✅ Script carregado!");
// Variável global para armazenar os dados
let dadosRecebimento = {};

// Função para gerar a mensagem
document.getElementById("gerarBtn").addEventListener("click", function() {
    // Data
    let dataInput = document.getElementById("dataRecebimento").value;
    let dataStr;
    if (dataInput) {
        const parts = dataInput.split("-");
        dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
        const data = new Date();
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        dataStr = `${dia}/${mes}/${ano}`;
    }

    // Responsável
    const responsavel = document.getElementById("responsavel").value || "DEIVID";

    // Enxoval
    const lencolCarrinho = parseInt(document.getElementById("lencolCarrinho").value || 0);
    const lencolPrateleira = parseInt(document.getElementById("lencolPrateleira").value || 0);
    const camisolaQtd = parseInt(document.getElementById("camisolaQtd").value || 0);
    const cobertorQtd = parseInt(document.getElementById("cobertorQtd").value || 0);
    const fronhaQtd = parseInt(document.getElementById("fronhaQtd").value || 0);

    // Montar mensagem
    let msg = `👕 ROUPARIA ${responsavel.toUpperCase()} 👕\n📋 Passagem de plantão: ${dataStr}\n\n`;
    msg += `📌 Lençóis no carrinho: ${lencolCarrinho}\n`;
    msg += `📌 Lençóis na prateleira: ${lencolPrateleira}\n`;
    msg += `📌 Camisola: ${camisolaQtd}\n`;
    msg += `📌 Cobertor: ${cobertorQtd}\n`;
    msg += `📌 Fronha: ${fronhaQtd}`;

    // Exibir mensagem
    document.getElementById("resultado").value = msg;

    // Armazenar dados
    dadosRecebimento = {
        data: dataStr,
        responsavel,
        lencolCarrinho,
        lencolPrateleira,
        camisolaQtd,
        cobertorQtd,
        fronhaQtd
    };
});

// Botão copiar
document.getElementById("copiarBtn").addEventListener("click", function() {
    const textarea = document.getElementById("resultado");
    if (textarea.value.trim() === "") {
        alert("Não há mensagem para copiar!");
        return;
    }
    navigator.clipboard.writeText(textarea.value)
        .then(() => alert("Mensagem copiada com sucesso! ✅"))
        .catch(err => {
            console.error("Erro ao copiar: ", err);
            alert("Não foi possível copiar a mensagem.");
        });
});

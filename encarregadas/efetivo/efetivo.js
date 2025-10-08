console.log("✅ Efetivo.js carregado!");

// Elementos do DOM
const selectResponsavel = document.getElementById("responsavel");
const colaboradoresSection = document.getElementById("Colaboradores");

// URL da planilha CSV publicada no Google Drive
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_yv1A_ct69W6MfQyZgYOmXchjyl_YGRCfcSLraUJYFL5LdaUHwWTbcm7zU6obsgnG2LJFiUZ62lgf/pub?gid=0&single=true&output=csv";

// Objeto para armazenar os colaboradores por equipe
let equipes = {};

// Função para carregar os nomes da planilha
async function carregarNomes() {
    try {
        const response = await fetch(urlCSV);
        if (!response.ok) {
            console.error("Erro na requisição:", response.status, response.statusText);
            return;
        }

        const data = await response.text();
        console.log("✅ Dados recebidos da planilha:");
        console.log(data); // Debug: imprime todo o CSV recebido

        const linhas = data.split("\n");

        linhas.forEach((linha, index) => {
            if (index === 0) return; // Pula o cabeçalho
            const [colaborador, equipe] = linha.split(",");
            if (!colaborador || !equipe) return;

            if (!equipes[equipe]) equipes[equipe] = [];
            equipes[equipe].push(colaborador.trim());
        });

        console.log("✅ Estrutura de equipes:", equipes); // Debug: imprime objeto de equipes
    } catch (err) {
        console.error("Erro ao carregar nomes do Google Drive:", err);
    }
}

// Atualiza a seção de colaboradores quando um responsável é selecionado
selectResponsavel.addEventListener("change", function() {
    const selecionado = selectResponsavel.value;
    const lista = equipes[selecionado] || [];

    colaboradoresSection.innerHTML = "";

    if (lista.length > 0) {
        const h2 = document.createElement("h2");
        h2.textContent = "Colaboradores da equipe";
        colaboradoresSection.appendChild(h2);

        lista.forEach(nome => {
            const label = document.createElement("label");
            label.textContent = nome;
            colaboradoresSection.appendChild(label);
        });
    }
});

// Gera a mensagem final
document.getElementById("gerarBtn").addEventListener("click", function() {
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

    const responsavel = selectResponsavel.value || "";
    const listaColaboradores = equipes[responsavel] || [];
    let colaboradoresStr = listaColaboradores.join(", ");

    let msg = `📋 EFETIVO ${responsavel.toUpperCase()} 📋\nData: ${dataStr}\n\n`;
    msg += `👥 Colaboradores: ${colaboradoresStr}`;

    document.getElementById("resultado").value = msg;
});

// Copia a mensagem para a área de transferência
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

// Carrega os nomes ao abrir a página
window.addEventListener("DOMContentLoaded", carregarNomes);

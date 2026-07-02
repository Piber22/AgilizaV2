// ==========================
// Configuração dos setores
// ==========================
const setores = [
    { id: "pl5", nome: "5° PL" },
    { id: "gr5", nome: "5° GR" },
    { id: "uti", nome: "UTI" },
    { id: "quartoA", nome: "4° A" },
    { id: "quartoB", nome: "4° B" },
    { id: "terceiroAndar", nome: "3° andar" },
    { id: "segundoAndar", nome: "2° andar" },
    { id: "saudeMentalF", nome: "Saúde Mental Feminina" },
    { id: "saudeMentalM", nome: "Saúde Mental Masculina" },
    { id: "rouparia", nome: "Scrubs - Rouparia" },
    { id: "cobertoresRenova", nome: "Cobertores - Renova" }
];

// Guarda o horário de início (capturado ao preencher o responsável)
let horaInicio = "";

// ==========================
// Utilitários
// ==========================
function horaAtual() {
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2, "0");
    const m = String(agora.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
}

function dataAtual() {
    const hoje = new Date();
    const d = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const a = hoje.getFullYear();
    return `${d}/${mes}/${a}`;
}

function formatarPeso(valor) {
    return valor.toFixed(2).replace(".", ",");
}

// ==========================
// Construção dinâmica dos setores
// ==========================
function criarLinhaHamper(setorId, numero) {
    const row = document.createElement("div");
    row.className = "hamper-row";

    const label = document.createElement("label");
    label.innerHTML = `${numero}º Hamper – `;

    const input = document.createElement("input");
    input.type = "number";
    input.className = "pesoHamper";
    input.min = "0";
    input.step = "0.01";
    input.placeholder = "kg";

    label.appendChild(input);
    row.appendChild(label);

    // Botão remover (só faz sentido a partir do 2º hamper em diante)
    if (numero > 1) {
        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.className = "remove-hamper";
        btnRemover.innerHTML = "&times;";
        btnRemover.addEventListener("click", () => {
            row.remove();
            renumerarHampers(setorId);
        });
        row.appendChild(btnRemover);
    }

    return row;
}

function renumerarHampers(setorId) {
    const container = document.getElementById(`hampers-${setorId}`);
    const linhas = container.querySelectorAll(".hamper-row label");
    linhas.forEach((label, index) => {
        // Mantém o input, só troca o texto antes dele
        const input = label.querySelector("input");
        label.innerHTML = `${index + 1}º Hamper – `;
        label.appendChild(input);
    });
}

function criarSetor(setor) {
    const section = document.createElement("section");
    section.className = "setor";
    section.dataset.setor = setor.id;

    const titulo = document.createElement("h2");
    titulo.textContent = setor.nome;
    section.appendChild(titulo);

    const hampers = document.createElement("div");
    hampers.className = "hampers";
    hampers.id = `hampers-${setor.id}`;
    hampers.appendChild(criarLinhaHamper(setor.id, 1));
    section.appendChild(hampers);

    const btnAdicionar = document.createElement("button");
    btnAdicionar.type = "button";
    btnAdicionar.className = "add-hamper login-option";
    btnAdicionar.textContent = "+ Adicionar Hamper";
    btnAdicionar.addEventListener("click", () => {
        const qtdAtual = hampers.querySelectorAll(".hamper-row").length;
        hampers.appendChild(criarLinhaHamper(setor.id, qtdAtual + 1));
    });
    section.appendChild(btnAdicionar);

    return section;
}

function montarSetores() {
    const container = document.getElementById("setoresContainer");
    setores.forEach(setor => {
        container.appendChild(criarSetor(setor));
    });
}

// ==========================
// Cálculo de pesos
// ==========================
function pesoTotalSetor(setorId) {
    const container = document.getElementById(`hampers-${setorId}`);
    const inputs = container.querySelectorAll(".pesoHamper");
    let total = 0;
    inputs.forEach(input => {
        const valor = parseFloat(input.value);
        if (!isNaN(valor)) total += valor;
    });
    return total;
}

// ==========================
// Captura automática do "Início"
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    montarSetores();

    const responsavelInput = document.getElementById("responsavel");
    responsavelInput.addEventListener("input", () => {
        if (responsavelInput.value.trim() !== "" && horaInicio === "") {
            horaInicio = horaAtual();
        }
    });

    // ==========================
    // Botão Salvar Mensagem
    // ==========================
    document.getElementById("salvarBtn").addEventListener("click", () => {
        const responsavel = responsavelInput.value.trim() || "";
        const dataStr = dataAtual();
        const horaFim = horaAtual();

        // Caso o responsável tenha sido preenchido sem disparar o evento 'input'
        // (ex: autofill), garante que o início não fique vazio.
        if (horaInicio === "" && responsavel !== "") {
            horaInicio = horaFim;
        }

        let pesoGeral = 0;
        let linhasSetores = "";

        setores.forEach(setor => {
            const total = pesoTotalSetor(setor.id);
            pesoGeral += total;
            linhasSetores += `*${setor.nome}* - ${formatarPeso(total)} KG’s\n`;
        });

        let msg = `*PESAGEM ENXOVAL SUJO*\n`;
        msg += `Responsável: ${responsavel}\n`;
        msg += `Data: ${dataStr}\n`;
        msg += `Início: ${horaInicio || "-"}\n`;
        msg += `Fim: ${horaFim}\n\n`;
        msg += linhasSetores;
        msg += `\n*Peso total: ${formatarPeso(pesoGeral)} KG’s*`;

        document.getElementById("resultado").value = msg;
    });

    // ==========================
    // Botão Copiar Mensagem
    // ==========================
    document.getElementById("copiarBtn").addEventListener("click", () => {
        const textarea = document.getElementById("resultado");
        if (textarea.value.trim() === "") {
            alert("Não há mensagem para copiar! Clique em \"Salvar Mensagem\" primeiro.");
            return;
        }

        navigator.clipboard.writeText(textarea.value)
            .then(() => {
                alert("Mensagem copiada com sucesso! ✅");
            })
            .catch(err => {
                console.error("Erro ao copiar: ", err);
                alert("Não foi possível copiar a mensagem.");
            });
    });
});
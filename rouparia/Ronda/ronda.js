// Variável global para armazenar os dados que serão enviados
let dadosRonda = {};

// 🕒 Controle de horários
let inicioTime = null; // capturado ao começar a preencher o responsável

// 🧩 Ordem e configuração dos itens (iguais para todos os setores)
const itemsOrder = ["lencois", "camisolas", "fronhas", "moveis"];

const itemsConfig = {
    lencois:   { label: "Lençóis",   recolhidoWord: "recolhidos" },
    camisolas: { label: "Camisolas", recolhidoWord: "recolhidas" },
    fronhas:   { label: "Fronhas",   recolhidoWord: "recolhidos" },
    moveis:    { label: "Móveis",    recolhidoWord: "recolhidos" }
};

// 🏥 Setores da ronda (todos com os mesmos 4 itens)
const setores = [
    { id: "pl5",    nome: "5° PL" },
    { id: "gr5",    nome: "5° GR" },
    { id: "uti",    nome: "UTI" },
    { id: "a4",     nome: "4° A" },
    { id: "b4",     nome: "4° B" },
    { id: "andar3", nome: "3° andar" },
    { id: "andar2", nome: "2° andar" },
    { id: "smf",    nome: "Saúde Mental Feminina" },
    { id: "smm",    nome: "Saúde Mental Masculina" }
];

// 🏗️ Monta dinamicamente os campos de cada setor (grade 2 colunas)
function renderSetores() {
    const container = document.getElementById("setoresContainer");

    setores.forEach(setor => {
        const section = document.createElement("section");
        section.classList.add("setor");
        section.id = `setor-${setor.id}`;

        const titulo = document.createElement("h2");
        titulo.textContent = setor.nome;
        section.appendChild(titulo);

        const grid = document.createElement("div");
        grid.classList.add("items-grid");

        itemsOrder.forEach(itemKey => {
            const cfg = itemsConfig[itemKey];

            const block = document.createElement("div");
            block.classList.add("item-block");

            const h3 = document.createElement("h3");
            h3.textContent = cfg.label;
            block.appendChild(h3);

            const row = document.createElement("div");
            row.classList.add("item-row");

            const qtdLabel = document.createElement("label");
            qtdLabel.textContent = "Quantidade:";
            const qtdInput = document.createElement("input");
            qtdInput.type = "number";
            qtdInput.min = "0";
            qtdInput.id = `${setor.id}_${itemKey}_qtd`;
            qtdLabel.appendChild(qtdInput);
            row.appendChild(qtdLabel);

            const recLabel = document.createElement("label");
            recLabel.textContent = "Recolhidos:";
            const recInput = document.createElement("input");
            recInput.type = "number";
            recInput.min = "0";
            recInput.id = `${setor.id}_${itemKey}_recolhidos`;
            recLabel.appendChild(recInput);
            row.appendChild(recLabel);

            block.appendChild(row);
            grid.appendChild(block);
        });

        section.appendChild(grid);
        container.appendChild(section);
    });
}

renderSetores();

// 📅 Data automática (capturada ao carregar a página)
function formatarData(d) {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatarHora(d) {
    const hora = String(d.getHours()).padStart(2, '0');
    const minuto = String(d.getMinutes()).padStart(2, '0');
    return `${hora}:${minuto}`;
}

const dataStr = formatarData(new Date());
document.getElementById("dataDisplay").textContent = dataStr;

// 🟢 Início: capturado assim que o responsável começa a ser preenchido
const responsavelInput = document.getElementById("responsavel");
responsavelInput.addEventListener("input", function () {
    if (!inicioTime && responsavelInput.value.trim() !== "") {
        inicioTime = new Date();
        document.getElementById("inicioDisplay").textContent = formatarHora(inicioTime);
    }
});

// 🔢 Lê valor numérico de um campo, retornando 0 se vazio
function lerNumero(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return parseInt(el.value || 0, 10) || 0;
}

// 🧾 Monta o bloco de texto de um setor. Se todas as quantidades forem 0,
// exibe automaticamente "Sem enxoval no setor."
function montarBlocoSetor(setor) {
    let bloco = `*${setor.nome}*\n`;

    const valores = itemsOrder.map(itemKey => ({
        itemKey,
        qtd: lerNumero(`${setor.id}_${itemKey}_qtd`),
        recolhidos: lerNumero(`${setor.id}_${itemKey}_recolhidos`)
    }));

    const totalQtd = valores.reduce((acc, v) => acc + v.qtd, 0);

    if (totalQtd === 0) {
        bloco += `Sem enxoval no setor.\n`;
        return bloco;
    }

    valores.forEach(v => {
        const cfg = itemsConfig[v.itemKey];
        bloco += `${cfg.label}: ${v.qtd} / ${cfg.recolhidoWord}: ${v.recolhidos}\n`;
    });

    return bloco;
}

// ➕ Calcula o resumo somando todos os setores
function calcularResumo() {
    const totais = {};
    itemsOrder.forEach(itemKey => totais[itemKey] = { qtd: 0, rec: 0 });

    setores.forEach(setor => {
        itemsOrder.forEach(itemKey => {
            totais[itemKey].qtd += lerNumero(`${setor.id}_${itemKey}_qtd`);
            totais[itemKey].rec += lerNumero(`${setor.id}_${itemKey}_recolhidos`);
        });
    });

    return totais;
}

// 💾 Botão "Salvar Mensagem"
document.getElementById("salvarBtn").addEventListener("click", function () {

    // Se o responsável não disparou o "Início" ainda, marca agora como fallback
    if (!inicioTime) {
        inicioTime = new Date();
        document.getElementById("inicioDisplay").textContent = formatarHora(inicioTime);
    }

    // 🏁 Fim: capturado no momento de salvar
    const fimTime = new Date();
    const fimStr = formatarHora(fimTime);
    const inicioStr = formatarHora(inicioTime);

    const responsavel = responsavelInput.value || "";

    // 🧾 Cabeçalho
    let msg = `*RONDA DE INSPEÇÃO ROUPARIAS*\n\n`;
    msg += `Responsável: ${responsavel}\n`;
    msg += `Data: ${dataStr}\n`;
    msg += `Início: ${inicioStr}\n`;
    msg += `Fim: ${fimStr}\n\n`;

    // 🏥 Setores
    setores.forEach(setor => {
        msg += montarBlocoSetor(setor);
        msg += `\n`;
    });

    // ➕ Resumo
    const totais = calcularResumo();
    msg += `*RESUMO*:\n`;
    msg += `Lençóis: ${totais.lencois.qtd} / recolhidos: ${totais.lencois.rec}\n`;
    msg += `Móveis: ${totais.moveis.qtd} / recolhidos: ${totais.moveis.rec}\n`;
    msg += `Fronhas: ${totais.fronhas.qtd} / recolhidos: ${totais.fronhas.rec}\n`;
    msg += `Camisolas: ${totais.camisolas.qtd} / recolhidas: ${totais.camisolas.rec}\n\n`;

    // ✅ Conclusão
    const conclusaoValor = document.getElementById("conclusaoSelect").value;
    const suficiente = conclusaoValor === "sim";
    msg += `*CONCLUSÃO* ${suficiente ? "✅" : "❌"}\n\n`;
    msg += suficiente
        ? `*Teremos enxoval suficiente para a entrega noturna*`
        : `*Não teremos enxoval suficiente para a entrega noturna*`;

    document.getElementById("resultado").value = msg;

    // 🧠 Armazenar dados para envio (sheet.js)
    dadosRonda = {
        data: dataStr,
        inicio: inicioStr,
        fim: fimStr,
        responsavel,
        totais,
        conclusao: suficiente ? "Suficiente" : "Insuficiente"
    };
});

// Botão copiar
document.getElementById("copiarBtn").addEventListener("click", function () {
    const textarea = document.getElementById("resultado");
    if (textarea.value.trim() === "") {
        alert("Não há mensagem para copiar! Clique em 'Salvar Mensagem' primeiro.");
        return;
    }

    navigator.clipboard.writeText(textarea.value)
        .then(() => {
            // Enviar dados para sheet.js, se disponível
            if (typeof enviarParaSheets === "function") {
                enviarParaSheets(dadosRonda);
            }

            // Extrai o código do convite do link (SUBSTITUA pelo código do seu grupo)
            const inviteCode = "KtBcu6Xn4PtIEXwtC9ThgR";

            // Tenta abrir no app do WhatsApp
            const whatsappAppURL = `whatsapp://chat?code=${inviteCode}`;
            window.location.href = whatsappAppURL;
        })
        .catch(err => {
            console.error("Erro ao copiar: ", err);
            alert("Não foi possível copiar a mensagem.");
        });
});
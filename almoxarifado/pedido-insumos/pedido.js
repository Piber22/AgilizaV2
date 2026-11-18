console.log("✅ Script carregado!");

// Variável global para armazenar os dados
let dadosRecebimento = {};

// 🔹 Lista de itens (id do input no HTML, nome na mensagem e código)
// Para adicionar/remover um item, basta mexer aqui (e no HTML).
const listaItens = [
    { id: "ph",               nome: "Papel higiênico",         codigo: "61777" },
    { id: "pt",               nome: "Papel toalha",            codigo: "58543" },
    { id: "toalha",           nome: "Toalha branca",           codigo: "64151" },
    { id: "perfexV",          nome: "Perfex verde",            codigo: "74692" },
    { id: "perfexA",          nome: "Perfex azul",             codigo: "74693" },

    { id: "alcool",           nome: "Álcool em gel",           codigo: "51390" },
    { id: "sabonete",         nome: "Sabonete",                codigo: "40133" },
    { id: "sabonetebac",      nome: "Sabonete bactericida",    codigo: "46784" },
    { id: "gojo",             nome: "Gojo",                    codigo: "62967" },

    { id: "sacopicotado",     nome: "Saco picotado",           codigo: "58452" },
    { id: "sacohamper",       nome: "Saco Hamper",             codigo: "57723" },

    { id: "sp100",            nome: "Saco Preto 100 Litros",   codigo: "55521" },
    { id: "sv100",            nome: "Saco Verde 100 Litros",   codigo: "46737" },
    { id: "sb100",            nome: "Saco Branco 100 Litros",  codigo: "55510" },
    { id: "sp60",             nome: "Saco Preto 60 Litros",    codigo: "55522" },
    { id: "sv60",             nome: "Saco Verde 60 Litros",    codigo: "58645" },
    { id: "sb50",             nome: "Saco Branco 50 Litros",   codigo: "56322" },
    { id: "sl50",             nome: "Saco Laranja 50 Litros",  codigo: "58599" },
    { id: "sp20",             nome: "Saco Preto 20 Litros",    codigo: "58520" },
    { id: "sv20",             nome: "Saco Verde 20 Litros",    codigo: "58519" },

    { id: "cv",               nome: "Cartela de validade",     codigo: "58691" },
    { id: "cl",               nome: "Controle de limpeza",     codigo: "52961" },
    { id: "adesivo",          nome: "Adesivo",                 codigo: "60084" },

    { id: "canetaazul",       nome: "Caneta azul comum",       codigo: "43248" },
    { id: "canetatecido",     nome: "Caneta para tecido",      codigo: "58548" },
    { id: "canetapermanente", nome: "Caneta permanente",       codigo: "43259" },
    { id: "cordaobranco",     nome: "Cordão branco",           codigo: "58154" },

    { id: "fibrabranca",      nome: "Fibra branca",            codigo: "74691" },
    { id: "fibraverde",       nome: "Fibra verde",             codigo: "74690" },

    { id: "multibac",         nome: "Multibac BP",             codigo: "73635" },
    { id: "clorado",          nome: "Detergente clorado",      codigo: "74696" },
    { id: "hospneutro",       nome: "Hospneutro",              codigo: "74697" }
];

// Lê o valor de um input de forma segura (não quebra se o id não existir)
function lerQuantidade(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`⚠️ Input com id "${id}" não encontrado no HTML`);
        return 0;
    }
    return parseInt(el.value) || 0;
}

// Função para gerar a mensagem
document.getElementById("gerarBtn").addEventListener("click", function () {
    // 🔹 Captura automática da data e hora
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const dataStr = `${dia}/${mes}/${ano}`;
    const horarioStr = `${hora}:${minuto}`;

    // Responsável
    const responsavel = document.getElementById("responsavel").value || "";

    // Lê as quantidades de todos os itens
    const itens = listaItens.map(item => ({
        ...item,
        valor: lerQuantidade(item.id)
    }));

    // 🔹 Montar mensagem
    let msg = `📦 PEDIDO DE INSUMOS - ${responsavel.toUpperCase()} 📦\n`;
    msg += `📅 Data: ${dataStr} - ${horarioStr}\n\n`;
    msg += `Código | Produto | Qtde\n`;

    // Adiciona somente os itens com valor maior que 0
    itens.forEach(item => {
        if (item.valor > 0) {
            msg += `${item.codigo} | ${item.nome} | ${item.valor}\n`;
        }
    });

    // Exibir mensagem
    document.getElementById("resultado").value = msg;

    // Armazenar dados (mesmas chaves de antes: ph, pt, toalha, ... + novos)
    dadosRecebimento = {
        data: dataStr,
        horario: horarioStr,
        responsavel
    };
    itens.forEach(item => {
        dadosRecebimento[item.id] = item.valor;
    });

    console.log("Dados armazenados:", dadosRecebimento);
});

// Botão copiar e abrir WhatsApp
document.getElementById("copiarBtn").addEventListener("click", function () {
    const textarea = document.getElementById("resultado");
    if (textarea.value.trim() === "") {
        alert("Não há mensagem para copiar!");
        return;
    }

    navigator.clipboard.writeText(textarea.value)
        .then(() => {
            console.log("📋 Mensagem copiada para área de transferência");

            // Número do contato (formato internacional)
            const phoneNumber = "555192673825"; //piber
            //const phoneNumber = "555195832564"; //daiane

            // URL para abrir conversa no app do WhatsApp
            const whatsappAppURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(textarea.value)}`;
            window.location.href = whatsappAppURL;

            console.log("📱 Abrindo conversa com o contato no WhatsApp");
        })
        .catch(err => {
            console.error("Erro ao copiar: ", err);
            alert("Não foi possível copiar a mensagem.");
        });
});

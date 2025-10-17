console.log("✅ Script carregado!");
// Variável global para armazenar os dados
let dadosRecebimento = {};

// Função para gerar a mensagem
document.getElementById("gerarBtn").addEventListener("click", function() {
    // 🔹 Captura automática da data e hora
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const dataStr = `${dia}/${mes}/${ano}`;
    const horarioStr = `${hora}:${minuto}`;

    // 🔹 Exibe a data atual automaticamente na tela
    //document.getElementById("dataRecebimento").textContent = dataStr;

    // Responsável
    const responsavel = document.getElementById("responsavel").value || "";

    // Inputs dos produtos
    const ph = parseInt(document.getElementById("ph").value || 0);
    const pt = parseInt(document.getElementById("pt").value || 0);
    const toalha = parseInt(document.getElementById("toalha").value || 0);
    const alcool = parseInt(document.getElementById("alcool").value || 0);
    const sabonete = parseInt(document.getElementById("sabonete").value || 0);
    const sabonetebac = parseInt(document.getElementById("sabonetebac").value || 0);
    const gojo = parseInt(document.getElementById("gojo").value || 0);
    const sacopicotado = parseInt(document.getElementById("sacopicotado").value || 0);
    const sacohamper = parseInt(document.getElementById("sacohamper").value || 0);
    const sp100 = parseInt(document.getElementById("sp100").value || 0);
    const sv100 = parseInt(document.getElementById("sv100").value || 0);
    const sb100 = parseInt(document.getElementById("sb100").value || 0);
    const sl100 = parseInt(document.getElementById("sl100").value || 0);
    const sp60 = parseInt(document.getElementById("sp60").value || 0);
    const sv60 = parseInt(document.getElementById("sv60").value || 0);
    const sb50 = parseInt(document.getElementById("sb50").value || 0);
    const sp20 = parseInt(document.getElementById("sp20").value || 0);
    const sv20 = parseInt(document.getElementById("sv20").value || 0);
    const cv = parseInt(document.getElementById("cv").value || 0);
    const cl = parseInt(document.getElementById("cl").value || 0);
    const adesivo = parseInt(document.getElementById("adesivo").value || 0);
    const canetatecido = parseInt(document.getElementById("canetatecido").value || 0);
    const canetapermanente = parseInt(document.getElementById("canetapermanente").value || 0);

    // Lista de itens com código
    const itens = [
        { nome: "Papel higiênico", valor: ph, codigo: "10001" },
        { nome: "Papel toalha", valor: pt, codigo: "10002" },
        { nome: "Toalha multiuso", valor: toalha, codigo: "10003" },
        { nome: "Álcool em gel", valor: alcool, codigo: "10004" },
        { nome: "Sabonete", valor: sabonete, codigo: "10005" },
        { nome: "Sabonete bactericida", valor: sabonetebac, codigo: "10006" },
        { nome: "Gojo", valor: gojo, codigo: "10007" },
        { nome: "Saco picotado", valor: sacopicotado, codigo: "10008" },
        { nome: "Saco Hamper", valor: sacohamper, codigo: "10009" },
        { nome: "Saco Preto 100 Litros", valor: sp100, codigo: "10010" },
        { nome: "Saco Verde 100 Litros", valor: sv100, codigo: "10011" },
        { nome: "Saco Branco 100 Litros", valor: sb100, codigo: "10012" },
        { nome: "Saco Laranja 100 Litros", valor: sl100, codigo: "10013" },
        { nome: "Saco Preto 60 Litros", valor: sp60, codigo: "10014" },
        { nome: "Saco Verde 60 Litros", valor: sv60, codigo: "10015" },
        { nome: "Saco Branco 50 Litros", valor: sb50, codigo: "10016" },
        { nome: "Saco Preto 20 Litros", valor: sp20, codigo: "10017" },
        { nome: "Saco Verde 20 Litros", valor: sv20, codigo: "10018" },
        { nome: "Cartela de validade", valor: cv, codigo: "10019" },
        { nome: "Controle de limpeza", valor: cl, codigo: "10020" },
        { nome: "Adesivo", valor: adesivo, codigo: "10021" },
        { nome: "Caneta para tecido", valor: canetatecido, codigo: "10022" },
        { nome: "Caneta permanente", valor: canetapermanente, codigo: "10023" }
    ];

    // 🔹 Montar mensagem (agora com data e horário automáticos)
    let msg = `📦 PEDIDO DE INSUMOS - ${responsavel.toUpperCase()} 📦\n`;
    msg += `📅 Data: ${dataStr} - ${horarioStr}\n\n`;
    msg += `Código | Produto | Qtde\n`;

    // Adiciona somente os itens com valor maior que 0
    itens.forEach(item => {
        if (item.valor > 0) {
            msg += `${item.codigo.padEnd(1)} | ${item.nome.padEnd(1)} | ${item.valor}\n`;
        }
    });

    // Exibir mensagem
    document.getElementById("resultado").value = msg;

    // Armazenar dados
    dadosRecebimento = {
        data: dataStr,
        horario: horarioStr,
        responsavel,
        ph, pt, toalha, alcool, sabonete, sabonetebac, gojo,
        sacopicotado, sacohamper, sp100, sv100, sb100, sl100,
        sp60, sv60, sb50, sp20, sv20, cv, cl, adesivo,
        canetatecido, canetapermanente
    };

    // Para verificar (opcional)
    console.log("Dados armazenados:", dadosRecebimento);
});

// Botão copiar e abrir WhatsApp
document.getElementById("copiarBtn").addEventListener("click", function() {
    const textarea = document.getElementById("resultado");
    if (textarea.value.trim() === "") {
        alert("Não há mensagem para copiar!");
        return;
    }
    navigator.clipboard.writeText(textarea.value)
        .then(() => {
            console.log("📋 Mensagem copiada para área de transferência");

            // Código do grupo do WhatsApp (substitua se necessário)
            const inviteCode = "KtBcu6Xn4PtIEXwtC9ThgR";

            // Tenta abrir o app do WhatsApp
            const whatsappAppURL = `whatsapp://chat?code=${inviteCode}`;
            window.location.href = whatsappAppURL;

            // Fallback para navegador
            setTimeout(() => {
                const whatsappWebURL = `https://chat.whatsapp.com/${inviteCode}`;
                window.open(whatsappWebURL, '_blank');
            }, 2000);

            console.log("📱 Abrindo grupo do WhatsApp");
        })
        .catch(err => {
            console.error("Erro ao copiar: ", err);
            alert("Não foi possível copiar a mensagem.");
        });
});

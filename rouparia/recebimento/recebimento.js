// Variável global para armazenar os dados que serão enviados
let dadosRecebimento = {};

// Valores mínimos para validação
const valoresMinimos = {
    lencol: 350,
    camisola: 140,
    cobertor: 100,
    fronha: 140,
    campoG: 15,
    jalecoP: 10,
    jalecoM: 10,
    jalecoG: 10,
    jalecoGG: 10,
    jalecoEG: 10,
    calcaP: 10,
    calcaM: 10,
    calcaG: 10,
    calcaGG: 10,
    calcaEG: 10
};

// Função para validar e retornar indicador
function validar(valor, minimo) {
    return valor >= minimo ? '🟢' : '🟡';
}

// Função para gerar a mensagem
document.getElementById("gerarBtn").addEventListener("click", function() {

    // 📅 Data automática
    const dataAtual = new Date();
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();
    const dataStr = `${dia}/${mes}/${ano}`;

    // 🕒 Horário automático
    const agora = new Date();
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const horarioStr = `${hora}:${minuto}`;

    // 👤 Responsável
    const responsavel = document.getElementById("responsavel").value || "";

    // 👕 Enxoval
    const lencolQtd = parseInt(document.getElementById("lencolQtd").value || 0);
    const lencolPeso = parseFloat(document.getElementById("lencolPeso").value || 0).toFixed(2);

    const camisolaQtd = parseInt(document.getElementById("camisolaQtd").value || 0);
    const camisolaPeso = parseFloat(document.getElementById("camisolaPeso").value || 0).toFixed(2);

    const cobertorQtd = parseInt(document.getElementById("cobertorQtd").value || 0);
    const cobertorPeso = parseFloat(document.getElementById("cobertorPeso").value || 0).toFixed(2);

    const fronhaQtd = parseInt(document.getElementById("fronhaQtd").value || 0);
    const fronhaPeso = parseFloat(document.getElementById("fronhaPeso").value || 0).toFixed(2);

    const campoGQtd = parseInt(document.getElementById("campoGQtd").value || 0);
    const campoGPeso = parseFloat(document.getElementById("campoGPeso").value || 0).toFixed(2);

    // 🩺 Scrubs
    const jaleco = {
        P: parseInt(document.getElementById("jalecoP").value || 0),
        M: parseInt(document.getElementById("jalecoM").value || 0),
        G: parseInt(document.getElementById("jalecoG").value || 0),
        GG: parseInt(document.getElementById("jalecoGG").value || 0),
        EG: parseInt(document.getElementById("jalecoEG").value || 0),
        Peso: parseFloat(document.getElementById("jalecoPeso").value || 0).toFixed(2)
    };

    const calca = {
        P: parseInt(document.getElementById("calcaP").value || 0),
        M: parseInt(document.getElementById("calcaM").value || 0),
        G: parseInt(document.getElementById("calcaG").value || 0),
        GG: parseInt(document.getElementById("calcaGG").value || 0),
        EG: parseInt(document.getElementById("calcaEG").value || 0),
        Peso: parseFloat(document.getElementById("calcaPeso").value || 0).toFixed(2)
    };

    // ⚖️ Peso total
    const pesoTotal = (
        parseFloat(lencolPeso) +
        parseFloat(camisolaPeso) +
        parseFloat(cobertorPeso) +
        parseFloat(fronhaPeso) +
        parseFloat(campoGPeso) +
        parseFloat(jaleco.Peso) +
        parseFloat(calca.Peso)
    ).toFixed(2);

    // 🧾 Montar mensagem
    let msg = `👕 ROUPARIA ${responsavel.toUpperCase()} 👕\n📋 Enxoval recebido ${dataStr} às ${horarioStr}\n`;
    msg += `📌 Lençol ${lencolQtd} ${validar(lencolQtd, valoresMinimos.lencol)} (peso ${lencolPeso})\n`;
    msg += `📌 Camisola ${camisolaQtd} ${validar(camisolaQtd, valoresMinimos.camisola)} (peso ${camisolaPeso})\n`;
    msg += `📌 Cobertor ${cobertorQtd} ${validar(cobertorQtd, valoresMinimos.cobertor)} (peso ${cobertorPeso})\n`;
    msg += `📌 Fronha ${fronhaQtd} ${validar(fronhaQtd, valoresMinimos.fronha)} (peso ${fronhaPeso})\n`;
    msg += `📌 Campo G ${campoGQtd} ${validar(campoGQtd, valoresMinimos.campoG)} (peso ${campoGPeso})\n\n`;
    msg += `📋 ROUPA AZUL\n🥼 JALECO\n`;
    msg += `🥼 P ${jaleco.P} ${validar(jaleco.P, valoresMinimos.jalecoP)}\n`;
    msg += `🥼 M ${jaleco.M} ${validar(jaleco.M, valoresMinimos.jalecoM)}\n`;
    msg += `🥼 G ${jaleco.G} ${validar(jaleco.G, valoresMinimos.jalecoG)}\n`;
    msg += `🥼 GG ${jaleco.GG} ${validar(jaleco.GG, valoresMinimos.jalecoGG)}\n`;
    msg += `🥼 EG ${jaleco.EG} ${validar(jaleco.EG, valoresMinimos.jalecoEG)}\n`;
    msg += `🧮 Peso: ${jaleco.Peso}\n\n`;
    msg += `👖 CALÇA\n`;
    msg += `👖 P ${calca.P} ${validar(calca.P, valoresMinimos.calcaP)}\n`;
    msg += `👖 M ${calca.M} ${validar(calca.M, valoresMinimos.calcaM)}\n`;
    msg += `👖 G ${calca.G} ${validar(calca.G, valoresMinimos.calcaG)}\n`;
    msg += `👖 GG ${calca.GG} ${validar(calca.GG, valoresMinimos.calcaGG)}\n`;
    msg += `👖 EG ${calca.EG} ${validar(calca.EG, valoresMinimos.calcaEG)}\n`;
    msg += `🧮 Peso: ${calca.Peso}\n\n`;
    msg += `⚖️ PESO TOTAL: ${pesoTotal}`;

    document.getElementById("resultado").value = msg;

    // 🧠 Armazenar dados
    dadosRecebimento = {
        data: dataStr,
        horario: horarioStr,
        responsavel,
        lencolQtd,
        lencolQtdStatus: validar(lencolQtd, valoresMinimos.lencol),
        lencolPeso,
        camisolaQtd,
        camisolaQtdStatus: validar(camisolaQtd, valoresMinimos.camisola),
        camisolaPeso,
        cobertorQtd,
        cobertorQtdStatus: validar(cobertorQtd, valoresMinimos.cobertor),
        cobertorPeso,
        fronhaQtd,
        fronhaQtdStatus: validar(fronhaQtd, valoresMinimos.fronha),
        fronhaPeso,
        campoGQtd,                                     // <-- novo
        campoGQtdStatus: validar(campoGQtd, valoresMinimos.campoG), // <-- novo
        campoGPeso,
        jalecoP: jaleco.P,
        jalecoPStatus: validar(jaleco.P, valoresMinimos.jalecoP),
        jalecoM: jaleco.M,
        jalecoMStatus: validar(jaleco.M, valoresMinimos.jalecoM),
        jalecoG: jaleco.G,
        jalecoGStatus: validar(jaleco.G, valoresMinimos.jalecoG),
        jalecoGG: jaleco.GG,
        jalecoGGStatus: validar(jaleco.GG, valoresMinimos.jalecoGG),
        jalecoEG: jaleco.EG,
        jalecoEGStatus: validar(jaleco.EG, valoresMinimos.jalecoEG),
        jalecoPeso: jaleco.Peso,
        calcaP: calca.P,
        calcaPStatus: validar(calca.P, valoresMinimos.calcaP),
        calcaM: calca.M,
        calcaMStatus: validar(calca.M, valoresMinimos.calcaM),
        calcaG: calca.G,
        calcaGStatus: validar(calca.G, valoresMinimos.calcaG),
        calcaGG: calca.GG,
        calcaGGStatus: validar(calca.GG, valoresMinimos.calcaGG),
        calcaEG: calca.EG,
        calcaEGStatus: validar(calca.EG, valoresMinimos.calcaEG),
        calcaPeso: calca.Peso,
        pesoTotal
    };
});

// Botão copiar
document.getElementById("copiarBtn").addEventListener("click", function() {
    const textarea = document.getElementById("resultado");
    if (textarea.value.trim() === "") {
        alert("Não há mensagem para copiar!");
        return;
    }

    // Copiar mensagem
    navigator.clipboard.writeText(textarea.value)
        .then(() => {
            //alert("Mensagem copiada com sucesso! ✅");

            // Enviar dados para envio.js
            if (typeof enviarParaSheets === "function") {
                enviarParaSheets(dadosRecebimento);
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

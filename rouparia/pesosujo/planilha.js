// ==========================================================
// planilha.js
// Responsável por coletar os dados gerados na tela de
// Pesagem Enxoval Sujo e enviá-los para uma planilha do
// Google Sheets, através de um Web App do Google Apps Script.
//
// Este arquivo depende das variáveis e funções já existentes
// em pesagem.js (setoresGerais, setorCobertores, horaInicio,
// pesoTotalSetor, formatarPeso, dataAtual, horaAtual), então
// ele deve ser carregado DEPOIS de pesagem.js no HTML.
// ==========================================================

// Cole aqui a URL do seu Web App (Apps Script), terminando em /exec
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbycE29pVPmSopH-kWAAdkzs80w3QZ5yM7v61GlB4MTiYmVt25zHZ7sGobFcI50uYEIRQQ/exec";

// ==========================================================
// Monta o objeto com os dados que serão enviados à planilha.
// As chaves usadas aqui viram o cabeçalho da planilha na
// primeira vez que uma linha é enviada.
// ==========================================================
function montarDadosParaPlanilha() {
    const responsavel = document.getElementById("responsavel").value.trim() || "";
    const dataStr = dataAtual();
    const horaFim = horaAtual();

    const dados = {
        "Data": dataStr,
        "Responsável": responsavel,
        "Início": horaInicio || "-",
        "Fim": horaFim
    };

    let pesoGeral = 0;

    // Setores gerais (lençóis, camisolas, fronhas, scrubs)
    setoresGerais.forEach(setor => {
        const total = pesoTotalSetor(setor.id);
        pesoGeral += total;
        dados[setor.nome] = formatarPeso(total);
    });

    // Panos e Mops
    const qtdPanos = parseInt(document.getElementById("qtdPanos").value) || 0;
    const pesoPanos = parseFloat(document.getElementById("pesoPanos").value) || 0;
    const qtdMops = parseInt(document.getElementById("qtdMops").value) || 0;
    const pesoMops = parseFloat(document.getElementById("pesoMops").value) || 0;
    pesoGeral += pesoPanos + pesoMops;

    dados["Qtd Panos"] = qtdPanos;
    dados["Peso Panos"] = formatarPeso(pesoPanos);
    dados["Qtd Mops"] = qtdMops;
    dados["Peso Mops"] = formatarPeso(pesoMops);

    // Total geral (ZION)
    dados["Peso Total ZION"] = formatarPeso(pesoGeral);

    // Cobertores (peso separado)
    const pesoCobertores = pesoTotalSetor(setorCobertores.id);
    dados[setorCobertores.nome] = formatarPeso(pesoCobertores);

    return dados;
}

// ==========================================================
// Envia os dados para o Web App do Google Apps Script
// ==========================================================
async function enviarParaPlanilha(dados) {
    console.log("[planilha.js] Dados que serão enviados:", dados);

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("COLE_AQUI")) {
        console.warn("[planilha.js] URL do Google Apps Script não configurada.");
        alert("A URL da planilha ainda não foi configurada em planilha.js.");
        return;
    }

    // Envia como GET, com os dados na própria URL. Isso evita um problema
    // conhecido do Apps Script: o endpoint /exec responde com um
    // redirecionamento (302), e quando o navegador segue esse
    // redirecionamento numa requisição POST, ele converte o método para
    // GET e descarta o body — fazendo o doPost nunca receber os dados.
    // Com GET essa conversão não acontece, então o envio é confiável.
    const url = `${GOOGLE_SCRIPT_URL}?dados=${encodeURIComponent(JSON.stringify(dados))}`;
    console.log("[planilha.js] Enviando GET para:", url);

    try {
        // mode: "no-cors" é necessário porque o Apps Script não retorna os
        // cabeçalhos de CORS que o navegador exige para ler a resposta.
        // Com no-cors, a resposta vem "opaca": não dá pra checar o status
        // real (ok/erro) devolvido pelo doGet do Apps Script — só sabemos
        // se a requisição foi enviada sem erro de rede/conexão.
        await fetch(url, {
            method: "GET",
            mode: "no-cors"
        });

        console.log("[planilha.js] fetch concluído sem erro de rede (resposta opaca, não dá pra confirmar o que o Apps Script fez).");
        alert("Dados enviados para a planilha! ✅\n(confira na planilha se a linha foi realmente gravada)");
    } catch (erro) {
        console.error("[planilha.js] Erro ao enviar dados para a planilha: ", erro);
        alert("Não foi possível enviar os dados para a planilha. Verifique sua conexão.");
    }
}

// ==========================================================
// Liga o envio ao clique do botão "Salvar Mensagem"
// (não interfere na geração da mensagem já feita por pesagem.js)
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
    const salvarBtn = document.getElementById("salvarBtn");

    salvarBtn.addEventListener("click", () => {
        const dados = montarDadosParaPlanilha();
        enviarParaPlanilha(dados);
    });
});
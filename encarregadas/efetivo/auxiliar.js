console.log("✅ auxiliar.js carregado (modo formatação apenas)!");

// Função que converte o texto em estrutura tabular
function textoParaTabelaEfetivo(textoBruto) {
    const linhas = textoBruto.split("\n").map(l => l.trim()).filter(l => l !== "");
    const registros = [];
    let categoriaAtual = null;
    let dataAtual = "";
    let equipe = "";

    // Extrair nome da equipe (ex: “EFETIVO GRACIELA”)
    const matchEquipe = textoBruto.match(/EFETIVO\s+([A-ZÇÃÉÊÍÓÕÚ]+)/i);
    if (matchEquipe) equipe = matchEquipe[1].trim();

    // Extrair data (ex: 17/10/2025)
    const matchData = textoBruto.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (matchData) dataAtual = matchData[1];

    // Percorre cada linha e define a categoria atual
    linhas.forEach(linha => {
        if (linha.startsWith("🟢")) categoriaAtual = "PRESENTE";
        else if (linha.startsWith("🟡")) categoriaAtual = "ATRASO / SAÍDA ANT.";
        else if (linha.startsWith("🔴")) categoriaAtual = "FALTA / ATESTADO";
        else if (linha.startsWith("🔵")) categoriaAtual = "FÉRIAS";
        else if (/🔍|📆/.test(linha)) return; // ignora cabeçalho
        else if (categoriaAtual) {
            registros.push({
                data: dataAtual,
                equipe: equipe,
                categoria: categoriaAtual,
                colaborador: linha
            });
        }
    });

    console.log("📊 Dados formatados:", registros);
    return registros;
}

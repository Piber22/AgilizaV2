console.log("✅ auxiliar.js carregado (modo formatação apenas)!");

// Função que converte o texto em estrutura tabular
function textoParaTabelaEfetivo(textoBruto) {
    const linhas = textoBruto.split("\n").map(l => l.trim()).filter(l => l !== "");
    const registros = [];
    let categoriaAtual = null;
    let dataAtual = "";
    let equipe = "";

    // Extrair nome da equipe (ex: "EFETIVO GRACIELA")
    const matchEquipe = textoBruto.match(/EFETIVO\s+([A-ZÇÃÉÊÍÓÕÚ]+)/i);
    if (matchEquipe) {
        equipe = matchEquipe[1].trim();
        console.log("👥 Equipe detectada:", equipe);
    }

    // Extrair data (ex: 17/10/2025)
    const matchData = textoBruto.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (matchData) {
        dataAtual = matchData[1];
        console.log("📅 Data detectada:", dataAtual);
    }

    // Gerar horário atual
    const now = new Date();
    const horarioAtual = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    console.log("🕐 Horário gerado:", horarioAtual);

    // Percorre cada linha e define a categoria atual
    linhas.forEach(linha => {
        if (linha.startsWith("🟢")) {
            categoriaAtual = "PRESENTE";
            console.log("✅ Categoria: PRESENTE");
        }
        else if (linha.startsWith("🟡")) {
            categoriaAtual = "ATRASO / SAÍDA ANT.";
            console.log("⚠️ Categoria: ATRASO / SAÍDA ANT.");
        }
        else if (linha.startsWith("🔴")) {
            categoriaAtual = "FALTA / ATESTADO";
            console.log("❌ Categoria: FALTA / ATESTADO");
        }
        else if (linha.startsWith("🔵")) {
            categoriaAtual = "FÉRIAS";
            console.log("🏖️ Categoria: FÉRIAS");
        }
        else if (/🔍|📆/.test(linha)) {
            return; // ignora cabeçalho
        }
        else if (categoriaAtual) {
            const registro = {
                data: dataAtual,
                horario: horarioAtual,
                equipe: equipe,
                categoria: categoriaAtual,
                colaborador: linha
            };
            registros.push(registro);
            console.log("📝 Registro adicionado:", registro);
        }
    });

    console.log("📊 Total de registros formatados:", registros.length);
    console.log("📦 Estrutura completa dos dados:", JSON.stringify(registros, null, 2));

    // ⚠️ VERIFICAÇÃO CRÍTICA DO HORÁRIO
    if (registros.length > 0) {
        const primeiroRegistro = registros[0];
        console.log("🔍 VERIFICANDO HORÁRIO NO PRIMEIRO REGISTRO:");
        console.log("  - Campo 'horario' existe?", 'horario' in primeiroRegistro);
        console.log("  - Valor do campo 'horario':", primeiroRegistro.horario);
        console.log("  - Tipo do campo 'horario':", typeof primeiroRegistro.horario);
    }

    return registros;
}

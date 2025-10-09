console.log("✅ Efetivo.js carregado!");

// Elementos do DOM
const selectResponsavel = document.getElementById("responsavel");
const colaboradoresSection = document.getElementById("Colaboradores");

// URL da planilha CSV publicada no Google Drive
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_yv1A_ct69W6MfQyZgYOmXchjyl_YGRCfcSLraUJYFL5LdaUHwWTbcm7zU6obsgnG2LJFiUZ62lgf/pub?gid=0&single=true&output=csv";

// Objeto para armazenar os colaboradores por equipe
let equipes = {};

// Função auxiliar para fazer parse de CSV (lida com vírgulas dentro de aspas)
function parseCSV(text) {
    const lines = [];
    const rows = text.split(/\r?\n/);

    for (let row of rows) {
        if (!row.trim()) continue; // Ignora linhas vazias

        const cols = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                cols.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        cols.push(current.trim());
        lines.push(cols);
    }

    return lines;
}

// Função para carregar os nomes da planilha
async function carregarNomes() {
    try {
        console.log("🔄 Carregando dados da planilha...");

        const response = await fetch(urlCSV);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.text();
        console.log("✅ Dados recebidos da planilha");
        console.log("Primeiros 200 caracteres:", data.substring(0, 200));

        const linhas = parseCSV(data);
        console.log(`📊 Total de linhas processadas: ${linhas.length}`);

        // Processa as linhas (pula o cabeçalho)
        for (let i = 1; i < linhas.length; i++) {
            const linha = linhas[i];

            // Verifica se tem pelo menos 2 colunas
            if (linha.length < 2) {
                console.warn(`⚠️ Linha ${i} ignorada (colunas insuficientes):`, linha);
                continue;
            }

            const colaborador = linha[0].trim();
            const equipeOriginal = linha[1].trim();

            // Ignora linhas com dados vazios
            if (!colaborador || !equipeOriginal) {
                console.warn(`⚠️ Linha ${i} ignorada (dados vazios):`, linha);
                continue;
            }

            // Normaliza o nome da equipe (primeira letra maiúscula, resto minúscula)
            // GRACIELA -> Graciela
            const equipe = equipeOriginal.charAt(0).toUpperCase() + equipeOriginal.slice(1).toLowerCase();

            // Adiciona o colaborador à equipe
            if (!equipes[equipe]) {
                equipes[equipe] = [];
            }
            equipes[equipe].push(colaborador);

            console.log(`✅ Adicionado: ${colaborador} → ${equipe}`);
        }

        // Ordena os colaboradores de cada equipe em ordem alfabética
        for (let equipe in equipes) {
            equipes[equipe].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        }

        console.log("✅ Estrutura final de equipes:", equipes);
        console.log(`📋 Total de equipes carregadas: ${Object.keys(equipes).length}`);

        // Verifica se carregou dados
        if (Object.keys(equipes).length === 0) {
            console.error("❌ ERRO: Nenhuma equipe foi carregada!");
            alert("⚠️ Não foi possível carregar os dados da planilha. Verifique o console para mais detalhes.");
        } else {
            console.log("🎉 Dados carregados com sucesso!");
        }

    } catch (err) {
        console.error("❌ Erro ao carregar dados:", err);
        alert("Erro ao carregar a planilha. Verifique se ela está publicada corretamente e tente novamente.");
    }
}

// Atualiza a seção de colaboradores quando um responsável é selecionado
selectResponsavel.addEventListener("change", function() {
    const selecionado = selectResponsavel.value;
    console.log(`👤 Responsável selecionado: ${selecionado}`);

    const lista = equipes[selecionado] || [];
    console.log(`📋 Colaboradores encontrados: ${lista.length}`);

    colaboradoresSection.innerHTML = "";

    if (lista.length > 0) {
        const h2 = document.createElement("h2");
        h2.textContent = "Colaboradores da equipe";
        colaboradoresSection.appendChild(h2);

        // Adiciona legenda
        const legenda = document.createElement("div");
        legenda.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 15px 0; padding: 12px; background: #2a2a2a; border-radius: 8px; font-size: 14px;";

        const legendaItens = [
            { emoji: '🟩', texto: 'Presente', cor: '#4CAF50' },
            { emoji: '🟨', texto: 'Atraso / Saída antecipada', cor: '#FFC107' },
            { emoji: '🟥', texto: 'Falta', cor: '#F44336' },
            { emoji: '🟦', texto: 'Férias', cor: '#2196F3' }
        ];

        legendaItens.forEach(({ emoji, texto, cor }) => {
            const item = document.createElement("div");
            item.style.cssText = "display: flex; align-items: center; gap: 6px;";
            item.innerHTML = `<span>${emoji}</span><span style="color: ${cor};">${texto}</span>`;
            legenda.appendChild(item);
        });

        colaboradoresSection.appendChild(legenda);

        // Ordena a lista antes de exibir
        const listaOrdenada = [...lista].sort((a, b) => a.localeCompare(b, 'pt-BR'));

        listaOrdenada.forEach((nome, index) => {
            const div = document.createElement("div");
            div.className = "colaborador-item";
            div.style.cssText = "display: flex; align-items: center; gap: 10px; margin: 10px 0; padding: 6px 12px; background: #201f20; border: 2px solid #5B5B5C; border-radius: 8px;";

            const label = document.createElement("span");
            label.textContent = nome;
            label.style.cssText = "flex: 1; font-weight: 500;";
            div.appendChild(label);

            // Container para os checkboxes
            const checkboxContainer = document.createElement("div");
            checkboxContainer.style.cssText = "display: flex; gap: 16px; align-items: center;";

            // Cores dos checkboxes - ADICIONADO AZUL
            const cores = [
                { cor: '#4CAF50', valor: 'verde', label: 'Presente' },
                { cor: '#FFC107', valor: 'amarelo', label: 'Atraso/Saída' },
                { cor: '#F44336', valor: 'vermelho', label: 'Falta/Atestado' },
                { cor: '#2196F3', valor: 'azul', label: 'Férias' }
            ];

            cores.forEach(({ cor, valor, label: corLabel }) => {
                const radioLabel = document.createElement("label");
                radioLabel.className = "checkbox-label";
                radioLabel.title = corLabel; // Tooltip ao passar o mouse

                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = `colaborador_${selecionado}_${index}`; // Nome único por colaborador
                radio.value = valor;
                radio.className = "radio-status";
                radio.setAttribute("data-colaborador", nome);
                radio.style.cssText = "display: none;"; // Esconde o radio padrão

                const checkboxVisual = document.createElement("span");
                checkboxVisual.style.cssText = `
                    width: 24px;
                    height: 24px;
                    border: 2px solid ${cor};
                    border-radius: 4px;
                    display: inline-block;
                    position: relative;
                    transition: all 0.2s;
                `;

                // Atualiza visual quando selecionado
                radio.addEventListener("change", function() {
                    // Remove a marcação de todos os checkboxes deste colaborador
                    const todosCheckboxes = radioLabel.parentElement.querySelectorAll("span[data-checkbox]");
                    todosCheckboxes.forEach(cb => {
                        cb.style.backgroundColor = "transparent";
                        cb.innerHTML = "";
                    });

                    // Marca o selecionado
                    if (this.checked) {
                        checkboxVisual.style.backgroundColor = cor;
                        checkboxVisual.innerHTML = '<span style="color: white; font-size: 16px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">✓</span>';
                    }
                });

                checkboxVisual.setAttribute("data-checkbox", "true");
                radioLabel.appendChild(radio);
                radioLabel.appendChild(checkboxVisual);
                checkboxContainer.appendChild(radioLabel);
            });

            div.appendChild(checkboxContainer);
            colaboradoresSection.appendChild(div);
        });
    } else {
        const aviso = document.createElement("p");
        aviso.textContent = "Nenhum colaborador encontrado para esta equipe.";
        aviso.style.color = "#999";
        colaboradoresSection.appendChild(aviso);
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

    if (!responsavel) {
        alert("⚠️ Por favor, selecione um responsável!");
        return;
    }

    // Coleta todos os status marcados
    const todosRadios = document.querySelectorAll('.radio-status:checked');

    // Agrupa colaboradores por status
    const presentes = [];
    const atrasos = [];
    const faltas = [];
    const ferias = [];

    todosRadios.forEach(radio => {
        const nomeColaborador = radio.getAttribute('data-colaborador');
        const status = radio.value;

        switch(status) {
            case 'verde':
                presentes.push(nomeColaborador);
                break;
            case 'amarelo':
                atrasos.push(nomeColaborador);
                break;
            case 'vermelho':
                faltas.push(nomeColaborador);
                break;
            case 'azul':
                ferias.push(nomeColaborador);
                break;
        }
    });

    // Ordena cada grupo alfabeticamente
    presentes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    atrasos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    faltas.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    ferias.sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Monta a mensagem
    let msg = `🔍 EFETIVO ${responsavel.toUpperCase()} 🔍\n`;
    msg += `📆 ${dataStr} 📆\n\n`;

    // Adiciona presentes
    if (presentes.length > 0) {
        msg += `🟢 PRESENTES 🟢\n`;
        presentes.forEach(nome => {
            msg += `${nome}\n`;
        });
        msg += '\n';
    }

    // Adiciona atrasos/saídas antecipadas
    if (atrasos.length > 0) {
        msg += `🟡 ATRASO / SAÍDA ANTECIPADA 🟡\n`;
        atrasos.forEach(nome => {
            msg += `${nome}\n`;
        });
        msg += '\n';
    }

    // Adiciona faltas/atestados
    if (faltas.length > 0) {
        msg += `🔴 FALTAS / ATESTADO 🔴\n`;
        faltas.forEach(nome => {
            msg += `${nome}\n`;
        });
        msg += '\n';
    }

    // Adiciona férias
    if (ferias.length > 0) {
        msg += `🔵 FÉRIAS 🔵\n`;
        ferias.forEach(nome => {
            msg += `${nome}\n`;
        });
    }

    document.getElementById("resultado").value = msg;
    console.log("✅ Mensagem gerada com sucesso!");
});

// Copia a mensagem para a área de transferência
document.getElementById("copiarBtn").addEventListener("click", function() {
    const textarea = document.getElementById("resultado");
    if (textarea.value.trim() === "") {
        alert("Não há mensagem para copiar!");
        return;
    }
    navigator.clipboard.writeText(textarea.value)
        .then(() => {
            alert("Mensagem copiada com sucesso! ✅");
            console.log("📋 Mensagem copiada para área de transferência");
        })
        .catch(err => {
            console.error("❌ Erro ao copiar: ", err);
            alert("Não foi possível copiar a mensagem.");
        });
});

// Carrega os nomes ao abrir a página
window.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Iniciando carregamento de dados...");
    carregarNomes();
});
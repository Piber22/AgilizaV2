console.log("✅ Efetivo.js carregado!");

// Elementos do DOM
const selectResponsavel = document.getElementById("responsavel");
const colaboradoresSection = document.getElementById("Colaboradores");


// Objeto para armazenar os colaboradores por equipe
let equipes = {};

async function carregarNomes() {
    try {
        console.log("🔄 Carregando colaboradores do Supabase...");

        const { data, error } = await sb
            .from("colaboradores")
            .select("nome, equipe")
            .eq("ativo", true)
            .order("nome");

        if (error) throw error;

        equipes = {};
        data.forEach(({ nome, equipe: equipeOriginal }) => {
            const equipe = equipeOriginal.trim().charAt(0).toUpperCase() +
                           equipeOriginal.trim().slice(1).toLowerCase();
            (equipes[equipe] ||= []).push(nome.trim());
        });

        for (const equipe in equipes) {
            equipes[equipe].sort((a, b) => a.localeCompare(b, "pt-BR"));
        }

        if (Object.keys(equipes).length === 0) {
            alert("⚠️ Nenhum colaborador encontrado no banco.");
        }
        console.log("✅ Equipes carregadas:", equipes);

    } catch (err) {
        console.error("❌ Erro ao carregar dados:", err);
        alert("Erro ao carregar colaboradores. Tente novamente.");
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
            { emoji: '🟦', texto: 'Folga', cor: '#2196F3' }
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

            const nomeSpan = document.createElement("span");
            nomeSpan.textContent = nome;
            nomeSpan.style.cssText = "flex: 1; font-weight: 500; line-height: 24px;";
            div.appendChild(nomeSpan);

            // Container para os checkboxes
            const checkboxContainer = document.createElement("div");
            checkboxContainer.style.cssText = "display: flex; gap: 16px; align-items: center; height: 24px;";

            // Cores dos checkboxes - ADICIONADO AZUL
            const cores = [
                { cor: '#4CAF50', valor: 'verde', label: 'Presente' },
                { cor: '#FFC107', valor: 'amarelo', label: 'Atraso/Saída' },
                { cor: '#F44336', valor: 'vermelho', label: 'Falta/Atestado' },
                { cor: '#2196F3', valor: 'azul', label: 'Férias' }
            ];

            cores.forEach(({ cor, valor, label: corLabel }) => {
                const radioWrapper = document.createElement("div");
                radioWrapper.style.cssText = "display: inline-flex; align-items: center; cursor: pointer;";
                radioWrapper.title = corLabel; // Tooltip ao passar o mouse

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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                `;

                // Atualiza visual quando selecionado
                radio.addEventListener("change", function() {
                    // Remove a marcação de todos os checkboxes deste colaborador
                    const todosCheckboxes = radioWrapper.parentElement.querySelectorAll("span[data-checkbox]");
                    todosCheckboxes.forEach(cb => {
                        cb.style.backgroundColor = "transparent";
                        cb.innerHTML = "";
                    });

                    // Marca o selecionado
                    if (this.checked) {
                        checkboxVisual.style.backgroundColor = cor;
                        checkboxVisual.textContent = '✓';
                        checkboxVisual.style.color = 'white';
                        checkboxVisual.style.fontSize = '16px';
                        checkboxVisual.style.fontWeight = 'bold';
                    }
                });

                // Permite clicar no visual para marcar
                checkboxVisual.addEventListener("click", () => {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                });

                checkboxVisual.setAttribute("data-checkbox", "true");
                radioWrapper.appendChild(radio);
                radioWrapper.appendChild(checkboxVisual);
                checkboxContainer.appendChild(radioWrapper);
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
        msg += `🟡 ATRASO / SAÍDA ANT. 🟡\n`;
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
        msg += `🔵 FOLGA 🔵\n`;
        ferias.forEach(nome => {
            msg += `${nome}\n`;
        });
    }

    document.getElementById("resultado").value = msg;
    console.log("✅ Mensagem gerada com sucesso!");
});

// Copia a mensagem para a área de transferência e abre o WhatsApp
document.getElementById("copiarBtn").addEventListener("click", function() {
    const textarea = document.getElementById("resultado");
    if (textarea.value.trim() === "") {
        alert("Não há mensagem para copiar!");
        return;
    }
    navigator.clipboard.writeText(textarea.value)
        .then(() => {
            //alert("Mensagem copiada com sucesso! ✅\nAbrindo WhatsApp...");
            console.log("📋 Mensagem copiada para área de transferência");

            // Extrai o código do convite do link
            const inviteCode = "LCDNWAvU4NwFDPpvDkSI5a";

            // Tenta abrir no app do WhatsApp
            const whatsappAppURL = `whatsapp://chat?code=${inviteCode}`;
            window.location.href = whatsappAppURL;

            console.log("📱 Abrindo grupo do WhatsApp");
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

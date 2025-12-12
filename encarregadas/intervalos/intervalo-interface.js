console.log("✅ intervalo-interface.js carregado!");

// Elementos do DOM
const selectResponsavel = document.getElementById("responsavel");
const colaboradoresSection = document.getElementById("Colaboradores");

// Atualiza a seção de colaboradores quando um responsável é selecionado
selectResponsavel.addEventListener("change", function() {
    const selecionado = selectResponsavel.value;
    console.log(`👤 Responsável selecionado: ${selecionado}`);

    // 'equipes' é carregado em intervalo-carregar.js
    const lista = equipes[selecionado] || [];
    console.log(`📋 Colaboradores encontrados: ${lista.length}`);

    colaboradoresSection.innerHTML = "";

    if (lista.length > 0) {
        const h2 = document.createElement("h2");
        h2.textContent = "Controle de Intervalos";
        colaboradoresSection.appendChild(h2);

        // --- ATUALIZAÇÃO DA LEGENDA ---
        const legenda = document.createElement("div");
        legenda.className = "legenda-intervalo";

        const legendaItens = [
            { texto: '12:00', cor: '#4CAF50' }, // Verde
            { texto: '13:00', cor: '#2196F3' }, // Azul
            { texto: 'Falta', cor: '#F44336' }  // Vermelho (NOVO)
        ];

        legendaItens.forEach(({ texto, cor }) => {
            const item = document.createElement("div");
            item.className = "legenda-item";

            const corDiv = document.createElement("div");
            corDiv.className = "legenda-cor";
            corDiv.style.backgroundColor = cor;

            const textoSpan = document.createElement("span");
            textoSpan.textContent = texto;

            item.appendChild(corDiv);
            item.appendChild(textoSpan);
            legenda.appendChild(item);
        });

        colaboradoresSection.appendChild(legenda);

        // Ordena a lista antes de exibir
        const listaOrdenada = [...lista].sort((a, b) => a.localeCompare(b, 'pt-BR'));

        listaOrdenada.forEach((nome) => {
            const div = document.createElement("div");
            div.className = "colaborador-item";

            // Nome do colaborador
            const nomeSpan = document.createElement("span");
            nomeSpan.className = "colaborador-nome";
            nomeSpan.textContent = nome;
            div.appendChild(nomeSpan);

            // Container dos intervalos
            const intervaloContainer = document.createElement("div");
            intervaloContainer.className = "intervalo-container";

            // Intervalo 12:00 (Verde)
            const intervalo12 = criarCheckboxIntervalo(nome, '12:00', 'verde');
            intervaloContainer.appendChild(intervalo12);

            // Intervalo 13:00 (Azul)
            const intervalo13 = criarCheckboxIntervalo(nome, '13:00', 'azul');
            intervaloContainer.appendChild(intervalo13);

            // --- NOVA COLUNA: Falta (Vermelho) ---
            const intervaloFalta = criarCheckboxIntervalo(nome, 'Falta', 'vermelho');
            intervaloContainer.appendChild(intervaloFalta);

            div.appendChild(intervaloContainer);
            colaboradoresSection.appendChild(div);
        });
    } else {
        const aviso = document.createElement("p");
        aviso.textContent = "Nenhum colaborador encontrado para esta equipe.";
        aviso.style.color = "#999";
        colaboradoresSection.appendChild(aviso);
    }
});

// Função para criar checkbox de intervalo
function criarCheckboxIntervalo(nomeColaborador, horario, cor, label = "") {
    const group = document.createElement("div");
    group.className = "intervalo-group";

    if (label) {
        const labelElement = document.createElement("div");
        labelElement.className = "intervalo-label";
        labelElement.textContent = label;
        group.appendChild(labelElement);
    }

    const wrapper = document.createElement("div");
    wrapper.className = "checkbox-wrapper";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox-intervalo";
    checkbox.setAttribute("data-colaborador", nomeColaborador);
    checkbox.setAttribute("data-horario", horario);
    checkbox.style.display = "none";

    const checkboxVisual = document.createElement("span");
    checkboxVisual.className = `checkbox-visual ${cor}`;

    // Evento de mudança no checkbox
    checkbox.addEventListener("change", function() {
        // --- LÓGICA DE EXCLUSIVIDADE ---
        if (this.checked) {
            // Se este foi marcado, desmarcar os outros DO MESMO COLABORADOR
            const container = group.parentElement; // intervalo-container
            const irmaos = container.querySelectorAll('.checkbox-intervalo');

            irmaos.forEach(outroCheckbox => {
                if (outroCheckbox !== this && outroCheckbox.checked) {
                    outroCheckbox.checked = false;
                    // Dispara o evento change manualmente para atualizar o visual do outro
                    outroCheckbox.dispatchEvent(new Event('change'));
                }
            });

            checkboxVisual.classList.add("checked");
            checkboxVisual.textContent = '✓';
        } else {
            checkboxVisual.classList.remove("checked");
            checkboxVisual.textContent = '';
        }
    });

    // Permite clicar no visual para marcar
    checkboxVisual.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
    });

    wrapper.appendChild(checkbox);
    wrapper.appendChild(checkboxVisual);
    group.appendChild(wrapper);

    return group;
}
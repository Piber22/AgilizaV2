// Função que cria os inputs da ferramenta OPAI
function criarCamposOPAI(formsSection) {
    formsSection.innerHTML = ""; // limpa

    const setores = ["Estoques", "Recebimento", "Expedição"];
    const tipos = ["Normal", "Prioritário", "Emergencial"];
    const status = ["Pendente", "Em andamento", "Concluído"];

    criarSelect(formsSection, "Setor", setores);
    criarSelect(formsSection, "Tipo", tipos);
    criarSelect(formsSection, "Status", status);
}

// Mesma função auxiliar usada em todos os scripts
function criarSelect(container, labelText, opcoes) {
    const label = document.createElement("label");
    label.innerHTML = `<span>${labelText}:</span>`;
    const select = document.createElement("select");
    select.innerHTML = `<option value="" disabled selected>Selecione...</option>` +
        opcoes.map(o => `<option value="${o}">${o}</option>`).join("");
    label.appendChild(select);
    container.appendChild(label);
}

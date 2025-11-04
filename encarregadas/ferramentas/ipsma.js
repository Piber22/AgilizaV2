// Função que cria os inputs da ferramenta IPSMA
function criarCamposIPSMA(formsSection) {
    formsSection.innerHTML = ""; // limpa

    const departamentos = ["Administração", "Manutenção", "TI"];
    const urgencias = ["Imediata", "Dentro do dia", "Sem urgência"];
    const responsaveis = ["Graciela", "Giovana", "Jéssica"];

    criarSelect(formsSection, "Departamento", departamentos);
    criarSelect(formsSection, "Urgência", urgencias);
    criarSelect(formsSection, "Responsável", responsaveis);
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

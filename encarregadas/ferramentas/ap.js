function criarCamposAP(container) {
  // Limpa qualquer conteúdo anterior
  container.innerHTML = "";

  // ===== Campo 1: Data =====
  const labelData = document.createElement("label");
  labelData.textContent = "Data:";
  const inputData = document.createElement("input");
  inputData.type = "date";
  inputData.id = "data-ap";
  inputData.name = "data-ap";
  inputData.required = true;
  labelData.appendChild(inputData);

  // ===== Campo 2: Setor (CAIXA DE TEXTO) =====
  const labelSetor = document.createElement("label");
  labelSetor.textContent = "Setor da ocorrência:";
  const inputSetor = document.createElement("input");
  inputSetor.type = "text";
  inputSetor.id = "setor-ap";
  inputSetor.name = "setor-ap";
  inputSetor.placeholder = "Descreva o setor...";
  labelSetor.appendChild(inputSetor);

  // ===== Campo 3: Tipo de desvio =====
  const labelTipo = document.createElement("label");
  labelTipo.textContent = "Tipo de desvio:";
  const selectTipo = document.createElement("select");
  selectTipo.id = "tipo-ap";
  selectTipo.name = "tipo-ap";

  const placeholder = document.createElement("option");
  placeholder.textContent = "Desvio";
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  selectTipo.appendChild(placeholder);

  const opcoes = ["ÁREA", "EQUIPAMENTO/MÁQUINA", "COMPORTAMENTO", "PROCEDIMENTOS", "FERRAMENTA"];
  opcoes.forEach(opcao => {
    const option = document.createElement("option");
    option.value = opcao;
    option.textContent = opcao;
    selectTipo.appendChild(option);
  });

  labelTipo.appendChild(selectTipo);

  // ===== Campo 4: Subtipo (dinâmico) =====
  const divSubtipo = document.createElement("div");
  divSubtipo.id = "subtipo-container";

  // === Evento para gerar o campo 4 baseado no tipo escolhido ===
  selectTipo.addEventListener("change", () => {
    divSubtipo.innerHTML = ""; // limpa o campo anterior

    const labelSubtipo = document.createElement("label");
    labelSubtipo.textContent = "Subtipo:";

    const selectSubtipo = document.createElement("select");
    selectSubtipo.id = "subtipo-ap";
    selectSubtipo.name = "subtipo-ap";

    const placeholderSub = document.createElement("option");
    placeholderSub.textContent = "Selecione uma opção";
    placeholderSub.value = "";
    placeholderSub.disabled = true;
    placeholderSub.selected = true;
    selectSubtipo.appendChild(placeholderSub);

    // Define as opções de acordo com o tipo selecionado
    let opcoesSub = [];
    switch (selectTipo.value) {
      case "ÁREA":
        opcoesSub = [" Equipamento obstruído", "Saída de emergência obstruído", "Piso desnivelado/ escorregadio"
        , "Local desorganizado/ sujo", "Risco de poluição ambiental", "Instalação com rachadura",
         "Instalação com infiltração", "Armazenamento inadequado de resíduos "];
        break;
      case "EQUIPAMENTO/MÁQUINA":
        opcoesSub = ["Falta de proteção na máquina", "Botoeira/ sensor danificados", "Partes móveis/ cortantes desprotegidas"
        , "Estrutura sem contenção de vazamento", "Equipamento/máquina sem manutenção", "Checklist não preenchido"
        , "Extintores sem inspeção", "Equipamento/máquina. com excesso de sujeira"];
        break;
      case "COMPORTAMENTO":
        opcoesSub = ["Uso incorreto de EPIs", "Atraso", "Falta de atenção"];
        break;
      case "PROCEDIMENTOS":
        opcoesSub = ["Etapa pulada", "Documentação incompleta", "Erro de sequência"];
        break;
      case "FERRAMENTA":
        opcoesSub = ["Quebrada", "Ausente", "Inadequada"];
        break;
    }

    // Adiciona opções no subtipo
    opcoesSub.forEach(op => {
      const option = document.createElement("option");
      option.value = op;
      option.textContent = op;
      selectSubtipo.appendChild(option);
    });

    labelSubtipo.appendChild(selectSubtipo);
    divSubtipo.appendChild(labelSubtipo);
  });

  // === Adiciona todos os campos na section ===
  container.appendChild(labelData);
  container.appendChild(labelSetor);
  container.appendChild(labelTipo);
  container.appendChild(divSubtipo);
}

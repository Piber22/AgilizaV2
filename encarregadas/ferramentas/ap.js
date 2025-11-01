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

  const opcoes = ["Área", "Equipamento/Máquina", "Comportamento", "Procedimentos", "Ferramenta"];
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
      case "Área":
        opcoesSub = [" Equipamento obstruído", "Saída de emergência obstruído", "Piso desnivelado/ escorregadio"
        , "Local desorganizado/ sujo", "Risco de poluição ambiental", "Instalação com rachadura",
         "Instalação com infiltração", "Armazenamento inadequado de resíduos "];
        break;
      case "Equipamento/Máquina":
        opcoesSub = ["Falta de proteção na máquina", "Botoeira/ sensor danificados", "Partes móveis/ cortantes desprotegidas"
        , "Estrutura sem contenção de vazamento", "Equipamento/máquina sem manutenção", "Checklist não preenchido"
        , "Extintores sem inspeção", "Equipamento/máquina. com excesso de sujeira"];
        break;
      case "Comportamento":
        opcoesSub = ["Uso indevido de celular", "Comportamento inseguro ", "Uso incorreto de ferramentas", "APR e PT preenchidos incorretamente",
        "Não praticado direção segura", "Ausência/ mau uso do EPI", "Postura inadequada", "Crenças de Segurança não seguidas"];
        break;
      case "Procedimentos":
        opcoesSub = ["Inexistentes", "Existentes e não seguidos ", "Não contempla todos os riscos", "Não execução/ inadequado de LIBRA"];
        break;
      case "Ferramenta":
        opcoesSub = ["Falha no isolamento elétrico ", "Ferramenta com avaria/ improvisada", "Ferramentas com excesso de sujeira", "Transporte inadequado"];
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

  // ===== Campo 5: Criticidade =====
  const labelCriticidade = document.createElement("label");
  labelCriticidade.textContent = "Criticidade:";
  const selectCriticidade = document.createElement("select");
  selectCriticidade.id = "criticidade-ap";
  selectCriticidade.name = "criticidade-ap";
  selectCriticidade.required = true;

  const placeholderCrit = document.createElement("option");
  placeholderCrit.textContent = "Selecione a criticidade";
  placeholderCrit.value = "";
  placeholderCrit.disabled = true;
  placeholderCrit.selected = true;
  selectCriticidade.appendChild(placeholderCrit);

  ["Baixo", "Moderado", "Crítico"].forEach(opcao => {
    const option = document.createElement("option");
    option.value = opcao;
    option.textContent = opcao;
    selectCriticidade.appendChild(option);
  });

  labelCriticidade.appendChild(selectCriticidade);
  container.appendChild(labelCriticidade);

// ===== Campo 6: Ação imediata tomada =====
const labelAcao = document.createElement("label");
labelAcao.textContent = "Ação imediata tomada:";

const selectAcao = document.createElement("select");
selectAcao.id = "acao-ap";
selectAcao.name = "acao-ap";
selectAcao.required = true;

// Placeholder
const placeholderAcao = document.createElement("option");
placeholderAcao.textContent = "Selecione a ação tomada";
placeholderAcao.value = "";
placeholderAcao.disabled = true;
placeholderAcao.selected = true;
selectAcao.appendChild(placeholderAcao);

// Opções
[
  "Paralisação da atividade",
  "Notificação do superior imediato ou cipeiro/representante",
  "Orientação da equipe ou colega de trabalho",
  "Acionamento da brigada de emergência",
  "Evacuação da área",
  "Adoção de medidas de contenção",
  "Sinalização e/ou isolamento da área"
].forEach(opcao => {
  const option = document.createElement("option");
  option.value = opcao;
  option.textContent = opcao;
  selectAcao.appendChild(option);
});

labelAcao.appendChild(selectAcao);
container.appendChild(labelAcao);


  // === Adiciona todos os campos na section ===
  container.appendChild(labelData);
  container.appendChild(labelSetor);
  container.appendChild(labelTipo);
  container.appendChild(divSubtipo);
  container.appendChild(labelCriticidade);
  container.appendChild(labelAcao);
}

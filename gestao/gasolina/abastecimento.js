// ================================================================
// ABASTECIMENTO.JS — Registro de Abastecimento
// ================================================================

// ================================================================
// IMPORTANTE: Substitua a URL abaixo pela URL do seu Google Apps Script
// (Implante como aplicativo da Web > Qualquer pessoa > Executar como eu)
// ================================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3DQnjair1ft3m3mB-vDL1MISGagRnXGTCmlp-FGbaheRdpkbSc8WhiM-S_Iu1GUwQsg/exec";

// ================================================================
// LOADING MANAGER (módulo compartilhado adaptado)
// ================================================================
const LoadingManager = {
  loadingElement: null,
  activeButton: null,

  show: function(button, mensagem = "Enviando...") {
    if (button) {
      this.activeButton = button;
      button.disabled = true;
      button.style.opacity = "0.6";
      button.style.cursor = "not-allowed";
    }

    if (!this.loadingElement) {
      this.loadingElement = document.createElement("div");
      this.loadingElement.id = "loading-overlay";
      this.loadingElement.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">${mensagem}</p>
        </div>
      `;
      document.body.appendChild(this.loadingElement);
    } else {
      const textElement = this.loadingElement.querySelector(".loading-text");
      if (textElement) textElement.textContent = mensagem;
      // Restaura o spinner caso tenha sido alterado
      this.loadingElement.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">${mensagem}</p>
        </div>
      `;
    }

    this.loadingElement.style.display = "flex";
  },

  hideWithSuccess: function(mensagemSucesso = "Salvo com sucesso!", callback) {
    if (this.loadingElement) {
      this.loadingElement.innerHTML = `
        <div class="loading-content">
          <div class="success-icon">✓</div>
          <p class="loading-text">${mensagemSucesso}</p>
        </div>
      `;

      setTimeout(() => {
        this.hide();
        if (callback) callback();
      }, 1500);
    }
  },

  hideWithError: function(mensagemErro = "Erro ao enviar. Tente novamente.") {
    if (this.loadingElement) {
      this.loadingElement.innerHTML = `
        <div class="loading-content">
          <div class="error-icon">✕</div>
          <p class="loading-text" style="color: #ff6b6b;">${mensagemErro}</p>
        </div>
      `;

      if (this.activeButton) {
        this.activeButton.disabled = false;
        this.activeButton.style.opacity = "1";
        this.activeButton.style.cursor = "pointer";
      }

      setTimeout(() => {
        this.hide();
      }, 2000);
    }
  },

  hide: function() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
    }

    if (this.activeButton) {
      this.activeButton.disabled = false;
      this.activeButton.style.opacity = "1";
      this.activeButton.style.cursor = "pointer";
      this.activeButton = null;
    }
  }
};

// ================================================================
// LÓGICA PRINCIPAL
// ================================================================
document.addEventListener("DOMContentLoaded", function () {
  const btnSalvar = document.getElementById("btn-salvar");
  const inputResponsavel = document.getElementById("responsavel");
  const selectMaquina = document.getElementById("maquina");
  const inputLitros = document.getElementById("litros");
  const inputValor = document.getElementById("valor");

  btnSalvar.addEventListener("click", function () {
    // Validação básica
    const responsavel = inputResponsavel.value.trim();
    const maquina = selectMaquina.value;
    const litros = parseFloat(inputLitros.value);
    const valor = parseFloat(inputValor.value);

    if (!responsavel) {
      alert("Preencha o campo Responsável.");
      inputResponsavel.focus();
      return;
    }
    if (!maquina) {
      alert("Selecione a Máquina.");
      selectMaquina.focus();
      return;
    }
    if (isNaN(litros) || litros <= 0) {
      alert("Informe uma quantidade válida de litros.");
      inputLitros.focus();
      return;
    }
    if (isNaN(valor) || valor < 0) {
      alert("Informe um valor válido.");
      inputValor.focus();
      return;
    }

    // Dados de data/hora
    const agora = new Date();
    const data = agora.toLocaleDateString("pt-BR"); // dd/mm/yyyy
    const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();

    // ID único simples (timestamp + random)
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

    // Cálculo valor por litro
    const valorLitro = (valor / litros).toFixed(2);

    // Payload completo (incluindo Responsável para referência)
    const payload = {
      DATA: data,
      HORA: hora,
      MES: mes,
      ANO: ano,
      ID: id,
      NOMEPLACA: maquina,
      LITROS: litros,
      VALOR: valor,
      "VALOR/LITRO": parseFloat(valorLitro),
      RESPONSAVEL: responsavel // enviado também, caso queira incluir na planilha
    };

    // Exibe loading
    LoadingManager.show(btnSalvar, "Enviando dados...");

    // Envio via no-cors (obrigatório conforme solicitado)
    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(payload)
    })
      .then(() => {
        // Com no-cors não conseguimos ler a resposta, então assumimos sucesso
        // se não houve erro de rede
        LoadingManager.hideWithSuccess("Registro salvo com sucesso!", function () {
          // Limpa o formulário
          inputResponsavel.value = "";
          selectMaquina.value = "";
          inputLitros.value = "";
          inputValor.value = "";
        });
      })
      .catch((err) => {
        console.error("Erro no envio:", err);
        LoadingManager.hideWithError("Erro ao enviar. Verifique a conexão e tente novamente.");
      });
  });
});

/*
================================================================
CÓDIGO DO GOOGLE APPS SCRIPT (cole no editor de scripts da planilha)
================================================================

1. Abra a planilha do Google Sheets
2. Extensões > Apps Script
3. Apague o conteúdo padrão e cole o código abaixo
4. Salve e implante: Implantar > Novo implantação > Tipo: Aplicativo da Web
   - Executar como: Eu
   - Quem tem acesso: Qualquer pessoa
5. Copie a URL gerada e cole na constante APPS_SCRIPT_URL do arquivo JS

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("REGISTROS");

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Aba REGISTROS não encontrada" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Ordem das colunas: DATA | HORA | MES | ANO | ID | NOMEPLACA | LITROS | VALOR | VALOR/LITRO
    // (se quiser incluir RESPONSAVEL, adicione uma coluna extra e inclua data.RESPONSAVEL no appendRow)
    sheet.appendRow([
      data.DATA || "",
      data.HORA || "",
      data.MES || "",
      data.ANO || "",
      data.ID || "",
      data.NOMEPLACA || "",
      data.LITROS || "",
      data.VALOR || "",
      data["VALOR/LITRO"] || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Função opcional para teste via GET
function doGet(e) {
  return ContentService.createTextOutput("Web App de Abastecimento ativo.");
}

================================================================
*/
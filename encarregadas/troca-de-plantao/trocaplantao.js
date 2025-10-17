console.log("✅ Dimensionamento.js carregado!");

document.addEventListener('DOMContentLoaded', () => {
  // Função para gerar a mensagem
  document.getElementById("gerarBtn").addEventListener("click", function() {
      // Data
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

      // Responsável
      const responsavel = document.getElementById("responsavel").value || "";

      // Montar mensagem por andar
      let msg = `📋 TROCA DE PLANTÃO 📋\n📌 RESPONSÁVEL: ${responsavel.toUpperCase()} \n🗓️ DATA: ${dataStr}\n\n`;

      // Máquinas
      msg += `*MÁQUINAS:* ${document.getElementById("maquinas").value || ""}\n\n`;
      // Residuos e roupas
      msg += `*RESIDUOS E ROUPAS:* ${document.getElementById("residuos_roupas").value || ""}\n\n`;
      // Residuos e roupas
      msg += `*TERMINAIS OU ALTAS PENDENTES:* ${document.getElementById("terminais_solicitadas").value || ""}\n\n`;
      // Leitos para vestir
      msg += `*LEITOS PARA VESTIR PENDENTES:* ${document.getElementById("leitos_vestir").value || ""}\n\n`;
      // Terminais programadas
      msg += `*TERMINAIS PROGRAMADAS NÃO EXECUTADAS:* ${document.getElementById("terminais_programadas").value || ""}\n\n`;
      // Observações
      msg += `*OBSERVAÇÕES:* ${document.getElementById("observacoes").value || ""}\n\n`;


      // Exibir mensagem
      document.getElementById("resultado").value = msg;
  });

  // Botão copiar e abrir WhatsApp
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
              const inviteCode = "IAbXun9LRzc61P6bm1coD8";

              // Tenta abrir no app do WhatsApp
              const whatsappAppURL = `whatsapp://chat?code=${inviteCode}`;
              window.location.href = whatsappAppURL;

              console.log("📱 Abrindo grupo do WhatsApp");
          })
          .catch(err => {
              console.error("Erro ao copiar: ", err);
              alert("Não foi possível copiar a mensagem.");
          });
  });
});
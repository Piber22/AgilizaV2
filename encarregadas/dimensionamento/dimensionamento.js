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
      let msg = `📋 DIMENSIONAMENTO 📋\n📌 Responsável : ${responsavel.toUpperCase()} \n🗓️ Data : ${dataStr}\n\n`;

      // 5º Andar
      msg += `5 Andar - Prolongados : ${document.getElementById("5PL").value || ""}\n`;
      msg += `5 Andar - Giro rápido : ${document.getElementById("5GR").value || ""}\n`;
      msg += `5 Andar - UTI : ${document.getElementById("5UTI").value || ""}\n\n`;

      // 4º Andar
      msg += `4 Andar - Lado A : ${document.getElementById("4A").value || ""}\n`;
      msg += `4 Andar - Lado B : ${document.getElementById("4B").value || ""}\n\n`;

      // 3º Andar

      msg += `3 Andar : ${document.getElementById("3A").value || ""}\n\n`;

      // 2º Andar

      msg += `2 Andar : ${document.getElementById("2A").value || ""}\n`;
      msg += `2 Andar - Bloco : ${document.getElementById("2B").value || ""}\n\n`;

      // 1º Andar
      msg += `Saúde mental - Feminina : ${document.getElementById("USR").value || ""}\n`;
      msg += `Saúde mental - Masculina : ${document.getElementById("USM").value || ""}\n\n`;

      // Térreo
      msg += `Térreo - Prédio internação : ${document.getElementById("TINT").value || ""}\n`;
      msg += `Térreo - Prédio ADM : ${document.getElementById("TADM").value || ""}\n\n`;

      // Outros setores

      msg += `Rouparia : ${document.getElementById("ROUPARIA").value || ""}\n\n`;


      msg += `Resíduos 1 : ${document.getElementById("R1").value || ""}\n`;
      msg += `Resíduos 2 : ${document.getElementById("R2").value || ""}\n`;

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
              alert("Mensagem copiada com sucesso! ✅\nAbrindo WhatsApp...");
              console.log("📋 Mensagem copiada para área de transferência");

              // Extrai o código do convite do link
              const inviteCode = "CCzl3lfFduN2HcT2ge1OBQ";

              // Tenta abrir no app do WhatsApp
              const whatsappAppURL = `whatsapp://chat?code=${inviteCode}`;
              window.location.href = whatsappAppURL;

              // Fallback: se o app não abrir em 2 segundos, abre no navegador
              setTimeout(() => {
                  const whatsappWebURL = "https://chat.whatsapp.com/CCzl3lfFduN2HcT2ge1OBQ";
                  window.open(whatsappWebURL, '_blank');
              }, 2000);

              console.log("📱 Abrindo grupo do WhatsApp");
          })
          .catch(err => {
              console.error("Erro ao copiar: ", err);
              alert("Não foi possível copiar a mensagem.");
          });
  });
});
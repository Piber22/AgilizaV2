console.log("✅ Dimensionamento.js carregado!");

// Variável global para armazenar os dados
let dadosRecebidos = null;

document.addEventListener('DOMContentLoaded', () => {
  // Função para gerar a mensagem
  document.getElementById("gerarBtn").addEventListener("click", function() {
      // Data
      let dataInput = document.getElementById("dataRecebimento").value;
      let dataStr;
      let horarioStr = "";

      if (dataInput) {
          const parts = dataInput.split("-");
          dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;

          const agora = new Date();
          const hora = String(agora.getHours()).padStart(2, '0');
          const minuto = String(agora.getMinutes()).padStart(2, '0');
          horarioStr = `${hora}:${minuto}`;
      } else {
          const data = new Date();
          const dia = String(data.getDate()).padStart(2, '0');
          const mes = String(data.getMonth() + 1).padStart(2, '0');
          const ano = data.getFullYear();
          const hora = String(data.getHours()).padStart(2, '0');
          const minuto = String(data.getMinutes()).padStart(2, '0');
          horarioStr = `${hora}:${minuto}`;
          dataStr = `${dia}/${mes}/${ano}`;
      }

      // Capturar campos
      const responsavel = document.getElementById("responsavel").value || "";

      // Armazenar na variável global
      dadosRecebidos = {
          data: dataStr,
          horario: horarioStr,
          responsavel,
          v5PL: document.getElementById("v5PL").value || "",
          v5GR: document.getElementById("v5GR").value || "",
          v5UTI: document.getElementById("v5UTI").value || "",
          v4A: document.getElementById("v4A").value || "",
          v4B: document.getElementById("v4B").value || "",
          v3A: document.getElementById("v3A").value || "",
          v2A: document.getElementById("v2A").value || "",
          v2B: document.getElementById("v2B").value || "",
          rouparia: document.getElementById("rouparia").value || "",
          tint: document.getElementById("tint").value || "",
          tadm: document.getElementById("tadm").value || "",
          usr: document.getElementById("usr").value || "",
          usm: document.getElementById("usm").value || "",
          r1: document.getElementById("r1").value || "",
          r2: document.getElementById("r2").value || "",
          almox: document.getElementById("r2").value || ""
      };

      // Montar mensagem
      let msg = `📋 DIMENSIONAMENTO 📋\n📌 Responsável: ${responsavel.toUpperCase()} \n🗓️ Data: ${dataStr} - ${horarioStr}\n\n`;
      msg += `5º Andar - Prolongados: ${dadosRecebidos.v5PL}\n`;
      msg += `5º Andar - Giro rápido: ${dadosRecebidos.v5GR}\n`;
      msg += `5º Andar - UTI: ${dadosRecebidos.v5UTI}\n\n`;
      msg += `4º Andar - Lado A: ${dadosRecebidos.v4A}\n`;
      msg += `4º Andar - Lado B: ${dadosRecebidos.v4B}\n\n`;
      msg += `3º Andar: ${dadosRecebidos.v3A}\n\n`;
      msg += `2º Andar: ${dadosRecebidos.v2A}\n`;
      msg += `2º Andar - Bloco: ${dadosRecebidos.v2B}\n\n`;
      msg += `Saúde Mental - Feminina: ${dadosRecebidos.usr}\n`;
      msg += `Saúde Mental - Masculina: ${dadosRecebidos.usm}\n\n`;
      msg += `Térreo - Prédio Internação: ${dadosRecebidos.tint}\n`;
      msg += `Térreo - Prédio ADM: ${dadosRecebidos.tadm}\n\n`;
      msg += `Rouparia: ${dadosRecebidos.rouparia}\n\n`;
      msg += `Resíduos 1: ${dadosRecebidos.r1}\n`;
      msg += `Resíduos 2: ${dadosRecebidos.r2}\n\n`;
      msg += `Almoxarifado: ${dadosRecebidos.almox}\n`;

      document.getElementById("resultado").value = msg;

      console.log("✅ Mensagem gerada e dados armazenados:", dadosRecebidos);
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
            const inviteCode = "CCzl3lfFduN2HcT2ge1OBQ";

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
console.log("✅ Dimensionamento.js carregado!");

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("gerarBtn").addEventListener("click", function() {
      // Data
      let dataInput = document.getElementById("dataRecebimento").value;
      let dataStr;
      let horarioStr = ""; // ✅ declarada fora do if para sempre existir

      if (dataInput) {
          const parts = dataInput.split("-");
          dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;

          // também gera o horário atual mesmo se a data for manual
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

      // Responsável
      const responsavel = document.getElementById("responsavel").value || "";
      const maquinas = document.getElementById("maquinas").value || "";
      const residuos_roupas = document.getElementById("residuos_roupas").value || "";
      const terminais_solicitadas = document.getElementById("terminais_solicitadas").value || "";
      const leitos_vestir = document.getElementById("leitos_vestir").value || "";
      const terminais_programadas = document.getElementById("terminais_programadas").value || "";
      const observacoes = document.getElementById("observacoes").value || "";

      // Montar mensagem
      let msg = `📋 TROCA DE PLANTÃO 📋\n📌 RESPONSÁVEL: ${responsavel.toUpperCase()}\n🗓️ DATA: ${dataStr} - ${horarioStr}\n\n`;
      msg += `*MÁQUINAS:* ${maquinas}\n\n`;
      msg += `*RESÍDUOS E ROUPAS:* ${residuos_roupas}\n\n`;
      msg += `*TERMINAIS OU ALTAS PENDENTES:* ${terminais_solicitadas}\n\n`;
      msg += `*LEITOS PARA VESTIR PENDENTES:* ${leitos_vestir}\n\n`;
      msg += `*TERMINAIS PROGRAMADAS NÃO EXECUTADAS:* ${terminais_programadas}\n\n`;
      msg += `*OBSERVAÇÕES:* ${observacoes}\n\n`;

      document.getElementById("resultado").value = msg;

      // Armazenar dados
      dadosRecebidos = {
          data: dataStr,
          horario: horarioStr,
          responsavel,
          maquinas,
          residuos_roupas,
          terminais_solicitadas,
          leitos_vestir,
          terminais_programadas,
          observacoes
      };
  });

  // Copiar e abrir WhatsApp
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

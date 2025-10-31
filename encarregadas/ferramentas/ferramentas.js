document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".login-option");
    const formsSection = document.getElementById("Forms");

    buttons.forEach((button) => {
        button.addEventListener("click", function () {
            // Toggle: se já ativo, desativa e limpa
            if (button.classList.contains("active")) {
                button.classList.remove("active");
                formsSection.innerHTML = "";
                return;
            }

            // Remove a seleção de todos os outros
            buttons.forEach(b => b.classList.remove("active"));
            button.classList.add("active");

            // Limpa inputs existentes
            formsSection.innerHTML = "";

            // Chama a função correspondente à ferramenta
            switch(button.id) {
                case "ap":
                    if (typeof criarCamposAP === "function") {
                        criarCamposAP(formsSection);
                    }
                    break;
                case "ipsma":
                    if (typeof criarCamposIPSMA === "function") {
                        criarCamposIPSMA(formsSection);
                    }
                    break;
                case "opai":
                    if (typeof criarCamposOPAI === "function") {
                        criarCamposOPAI(formsSection);
                    }
                    break;
            }
        });
    });
});

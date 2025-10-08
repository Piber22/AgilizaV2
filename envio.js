// Importar Firebase (usando CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD74e3F87-ONFwl2E1VR9rcfMsS-_FEw1k",
  authDomain: "recebimento-267e5.firebaseapp.com",
  projectId: "recebimento-267e5",
  storageBucket: "recebimento-267e5.firebasestorage.app",
  messagingSenderId: "519510160991",
  appId: "1:519510160991:web:1d616fd85658e236664dea"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para enviar dados ao Firebase
async function enviarParaSheets(dados) {
    try {
        // Adicionar timestamp do servidor
        const docRef = await addDoc(collection(db, "recebimentos"), {
            ...dados,
            timestamp: serverTimestamp(),
            dataEnvio: new Date().toISOString()
        });

        console.log("✅ Dados salvos com sucesso! ID:", docRef.id);

        // Mostrar confirmação visual (opcional)
        mostrarNotificacao("✅ Dados salvos no banco com sucesso!", "sucesso");

    } catch (error) {
        console.error("❌ Erro ao salvar dados:", error);
        mostrarNotificacao("⚠️ Erro ao salvar no banco de dados", "erro");
    }
}

// Função auxiliar para mostrar notificações
function mostrarNotificacao(mensagem, tipo) {
    // Criar elemento de notificação
    const notificacao = document.createElement("div");
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    if (tipo === "sucesso") {
        notificacao.style.backgroundColor = "#4CAF50";
        notificacao.style.color = "white";
    } else {
        notificacao.style.backgroundColor = "#f44336";
        notificacao.style.color = "white";
    }

    // Adicionar animação
    const style = document.createElement("style");
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notificacao);

    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = "slideIn 0.3s ease-out reverse";
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// Tornar função global para ser acessível pelo recebimento.js
window.enviarParaSheets = enviarParaSheets;
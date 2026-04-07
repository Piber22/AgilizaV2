// =============================
// FIREBASE — DESTINO PARALELO
// uniformes-firebase.js
// =============================
// Usa o SDK compat (carregado via CDN no HTML) para funcionar
// junto com os demais scripts clássicos sem precisar de bundler.

const _firebaseConfig = {
    apiKey:            "AIzaSyCeoEWuDNxpzxLNK4RVyaxPg6HMJKHJjEs",
    authDomain:        "scrubs-cbba4.firebaseapp.com",
    databaseURL:       "https://scrubs-cbba4-default-rtdb.firebaseio.com",
    projectId:         "scrubs-cbba4",
    storageBucket:     "scrubs-cbba4.firebasestorage.app",
    messagingSenderId: "70478825233",
    appId:             "1:70478825233:web:58a2e8995c093db3b8aeb0"
};

firebase.initializeApp(_firebaseConfig);
const _db = firebase.database();

// ── Enviar lista de registros ao Firebase ─────────────────────────────────────
// Cada registro vira um nó filho em /registros com chave gerada automaticamente.
// Não envia assinatura (base64 grande demais para o Realtime Database).
// Falhas são silenciosas — o Google Sheets continua sendo a fonte primária.
async function fb_enviarRegistros(registros) {
    const destino  = _db.ref('registros');
    const promises = registros.map(r => {
        const { assinatura, ...semAssinatura } = r;
        return destino.push(semAssinatura);
    });
    await Promise.all(promises);
}
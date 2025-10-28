console.log("Carregando planilha...");

const secaoDados = document.getElementById("dados");

const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9iOLrhTX24hYGpu-l508FWdrdlZcGRG83UAuAeD54deCg6074rW1AGSUDTFON2R2dgsc8-ZNcSGOC/pub?gid=2015636690&output=csv";

function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
        if (values.length < headers.length) continue;
        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx]);
        data.push(row);
    }
    return data;
}

async function carregar() {
    try {
        secaoDados.innerHTML = "<h2>Consulta</h2><p>Carregando dados...</p>";

        const res = await fetch(urlCSV);
        if (!res.ok) throw new Error("Erro HTTP: " + res.status);

        const text = await res.text();
        const dados = parseCSV(text);

        if (dados.length === 0) {
            secaoDados.innerHTML = "<h2>Consulta</h2><p>Nenhum dado encontrado.</p>";
            return;
        }

        let html = `<h2>Consulta</h2><table><thead><tr>`;
        Object.keys(dados[0]).forEach(h => html += `<th>${h}</th>`);
        html += `</tr></thead><tbody>`;

        dados.forEach(row => {
            html += `<tr>`;
            Object.values(row).forEach(v => html += `<td>${v}</td>`);
            html += `</tr>`;
        });

        html += `</tbody></table>`;
        html += `<style>
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f0f0f0; font-weight: 600; }
            tr:nth-child(even) { background: #f9f9f9; }
        </style>`;

        secaoDados.innerHTML = html;
        console.log("Dados exibidos:", dados);

    } catch (err) {
        console.error("Erro:", err);
        secaoDados.innerHTML = `<h2>Consulta</h2><p style="color:red">Erro: ${err.message}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", carregar);
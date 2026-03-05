// ============================================================
// GERADOR DE RELATÓRIO EM TEXTO — relatorios-texto.js
//
// Gera um resumo em texto puro, ideal para colar em e-mail
// ou mensagem de WhatsApp.
//
// Para personalizar o conteúdo do relatório:
//   - Edite CONFIGURACOES_TEXTO para ligar/desligar seções.
//   - Ajuste os textos dos cabeçalhos em TEXTOS.
//   - A função montarTexto() controla a ordem e estrutura
//     das seções — edite diretamente se quiser reorganizar.
// ============================================================

const CONFIGURACOES_TEXTO = {
    // Seções que aparecem no relatório de texto
    secoes: {
        cabecalho: true,
        resumoGeral: true,
        detalhesPorTamanho: true,
        listaPendencias: true,        // Lista individual de quem está com uniforme
        rodape: true
    },

    // Máximo de pendências listadas individualmente (0 = todas)
    maxPendenciasListadas: 10,

    // Separadores visuais
    separador: '─────────────────────────',
    separadorGrosso: '═════════════════════════',

    // Textos customizáveis
    textos: {
        titulo: '📋 RELATÓRIO DE UNIFORMES',
        empresa: 'Manserv — Equipe HSANA',
        secaoResumo: '📊 RESUMO DO PERÍODO',
        secaoTamanhos: '📏 MOVIMENTAÇÕES POR TAMANHO',
        secaoPendencias: '⚠️ PENDÊNCIAS',
        labelEntregas: '📦 Entregas',
        labelDevolucoes: '✅ Devoluções',
        labelPendentes: '⏳ Pendentes',
        semPendencias: '✅ Nenhuma pendência no período!',
        rodape: '© 2025 Manserv — Equipe HSANA'
    }
};

// ============================================================
// FUNÇÃO PRINCIPAL — chamada pelo relatorios.js
// ============================================================
function gerarRelatorioTexto(dadosFiltrados, calcularPendencias) {
    try {
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        const pendencias = calcularPendencias();

        const texto = montarTexto(dadosFiltrados, pendencias, dataInicio, dataFim);

        exibirModalTexto(texto);
        mostrarToast('Relatório gerado! Copie e cole onde quiser.', 'success');

    } catch (error) {
        console.error('Erro ao gerar relatório de texto:', error);
        mostrarToast('Erro ao gerar relatório de texto', 'error');
    }
}

// ============================================================
// MONTAGEM DO TEXTO
// Edite esta função para reorganizar as seções ou adicionar
// informações extras ao relatório.
// ============================================================
function montarTexto(dadosFiltrados, pendencias, dataInicio, dataFim) {
    const cfg = CONFIGURACOES_TEXTO;
    const txt = cfg.textos;
    const linhas = [];

    const periodoLabel = dataInicio === dataFim
        ? `📅 ${formatarDataTexto(dataInicio)}`
        : `📅 ${formatarDataTexto(dataInicio)} até ${formatarDataTexto(dataFim)}`;

    // — CABEÇALHO —
    if (cfg.secoes.cabecalho) {
        linhas.push(cfg.separadorGrosso);
        linhas.push(txt.titulo);
        linhas.push(periodoLabel);
        linhas.push(cfg.separadorGrosso);
        linhas.push('');
    }

    // — RESUMO GERAL —
    if (cfg.secoes.resumoGeral) {
        const totalEntregas = dadosFiltrados.filter(d => d.tipo === 'entrega').length;
        const totalDevolucoes = dadosFiltrados.filter(d => d.tipo === 'devolucao').length;
        const totalPendentes = pendencias.length;

        linhas.push(txt.secaoResumo);
        linhas.push(cfg.separador);
        linhas.push(`${txt.labelEntregas}:    ${totalEntregas}`);
        linhas.push(`${txt.labelDevolucoes}: ${totalDevolucoes}`);
        linhas.push(`${txt.labelPendentes}:   ${totalPendentes}`);
        linhas.push('');
    }

    // — DETALHES POR TAMANHO —
    if (cfg.secoes.detalhesPorTamanho) {
        const tamanhos = ['P', 'M', 'G', 'GG', 'EG'];
        const entregas = contarPorTamanhoTexto(dadosFiltrados.filter(d => d.tipo === 'entrega'));
        const devolucoes = contarPorTamanhoTexto(dadosFiltrados.filter(d => d.tipo === 'devolucao'));

        const temMovimento = tamanhos.some(t => (entregas[t] || 0) > 0 || (devolucoes[t] || 0) > 0);

        if (temMovimento) {
            linhas.push(txt.secaoTamanhos);
            linhas.push(cfg.separador);

            tamanhos.forEach(tam => {
                const e = entregas[tam] || 0;
                const d = devolucoes[tam] || 0;
                if (e > 0 || d > 0) {
                    // Adicione ou remova campos aqui para customizar o que aparece por tamanho
                    linhas.push(`  ${tam.padEnd(3)} → 📦 ${e} entrega${e !== 1 ? 's' : ''}  |  ✅ ${d} devoluções${d !== 1 ? '' : ''}`);
                }
            });

            linhas.push('');
        }
    }

    // — PENDÊNCIAS —
    if (cfg.secoes.listaPendencias) {
        linhas.push(txt.secaoPendencias);
        linhas.push(cfg.separador);

        if (pendencias.length === 0) {
            linhas.push(txt.semPendencias);
        } else {
            const lista = cfg.maxPendenciasListadas > 0
                ? pendencias.slice(0, cfg.maxPendenciasListadas)
                : pendencias;

            lista.forEach((p, i) => {
                // Edite esta linha para mudar como cada pendência aparece no texto
                linhas.push(`${i + 1}. ${p.funcionario} — Tam. ${p.tamanho} (${p.diasPendente} dia${p.diasPendente !== 1 ? 's' : ''})`);
            });

            if (cfg.maxPendenciasListadas > 0 && pendencias.length > cfg.maxPendenciasListadas) {
                linhas.push(`   ... e mais ${pendencias.length - cfg.maxPendenciasListadas} pendência(s).`);
            }
        }

        linhas.push('');
    }

    // — RODAPÉ —
    if (cfg.secoes.rodape) {
        linhas.push(cfg.separador);
        linhas.push(txt.rodape);
    }

    return linhas.join('\n');
}

// ============================================================
// MODAL DE EXIBIÇÃO + BOTÃO COPIAR
// ============================================================
function exibirModalTexto(texto) {
    // Remove modal anterior se existir
    const modalAnterior = document.getElementById('modalRelatorioTexto');
    if (modalAnterior) modalAnterior.remove();

    const modal = document.createElement('div');
    modal.id = 'modalRelatorioTexto';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 5000;
        display: flex; justify-content: center; align-items: center;
        padding: 20px; box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="
            background: #2a2a2a; border-radius: 14px; padding: 24px;
            width: 100%; max-width: 600px; max-height: 85vh;
            display: flex; flex-direction: column; gap: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #FF460A; margin: 0; font-size: 1.2em;">📋 Relatório em Texto</h2>
                <button id="fecharModalTexto" style="
                    background: none; border: none; color: #aaa;
                    font-size: 1.5em; cursor: pointer; line-height: 1;
                " title="Fechar">✕</button>
            </div>

            <textarea id="textoRelatorio" readonly style="
                flex: 1; min-height: 320px; background: #1a1a1a;
                color: #eee; border: 1px solid #5b5b5b; border-radius: 8px;
                padding: 14px; font-family: 'Courier New', monospace;
                font-size: 13px; line-height: 1.6; resize: vertical;
                outline: none;
            ">${texto}</textarea>

            <div style="display: flex; gap: 10px;">
                <button id="btnCopiarTexto" style="
                    flex: 1; padding: 12px; background: #FF460A; color: white;
                    border: none; border-radius: 8px; font-size: 15px;
                    font-weight: 600; cursor: pointer;
                ">📋 Copiar Texto</button>
                <button id="fecharModalTexto2" style="
                    padding: 12px 20px; background: #444; color: white;
                    border: none; border-radius: 8px; font-size: 15px;
                    font-weight: 600; cursor: pointer;
                ">Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fechar
    const fechar = () => modal.remove();
    document.getElementById('fecharModalTexto').addEventListener('click', fechar);
    document.getElementById('fecharModalTexto2').addEventListener('click', fechar);
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

    // Copiar
    document.getElementById('btnCopiarTexto').addEventListener('click', () => {
        const textarea = document.getElementById('textoRelatorio');
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
            mostrarToast('Texto copiado!', 'success');
        }).catch(() => {
            document.execCommand('copy');
            mostrarToast('Texto copiado!', 'success');
        });
    });
}

// ============================================================
// AUXILIARES
// ============================================================
function contarPorTamanhoTexto(dados) {
    const contagem = {};
    dados.forEach(item => {
        if (item.tamanho) {
            contagem[item.tamanho] = (contagem[item.tamanho] || 0) + 1;
        }
    });
    return contagem;
}

function formatarDataTexto(dataISO) {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
// ============================================================
// GERADOR DE RELATÓRIO EM TEXTO — relatorios-texto.js
//
// Gera resumo em texto puro para colar em e-mail / WhatsApp.
// Inclui seções separadas por origem (Autorizado / CI) e totais.
// ============================================================

const CONFIGURACOES_TEXTO = {
    secoes: {
        cabecalho:          true,
        resumoGeral:        true,
        detalhesPorTamanho: true,
        listaPendencias:    true,
        rodape:             true
    },

    maxPendenciasListadas: 10,
    separador:      '─────────────────────────',
    separadorGrosso:'═════════════════════════',

    textos: {
        titulo:           '📋 RELATÓRIO DE UNIFORMES',
        empresa:          'Manserv — Equipe HSANA',
        secaoResumo:      '📊 RESUMO DO PERÍODO',
        secaoJaleco:      '🥼 MOVIMENTAÇÕES — JALECO',
        secaoCalca:       '👖 MOVIMENTAÇÕES — CALÇA',
        secaoPendencias:  '⚠️ PENDÊNCIAS',
        labelEntregas:    '📦 Entregas',
        labelDevolucoes:  '✅ Devoluções',
        labelPendentes:   '⏳ Pendentes',
        semPendencias:    '✅ Nenhuma pendência no período!',
        rodape:           '© 2025 Manserv — Equipe HSANA'
    }
};

// ============================================================
// FUNÇÃO PRINCIPAL
// origemAtiva: 'todos' | 'autorizado' | 'ci'
// ============================================================
function gerarRelatorioTexto(dadosFiltrados, calcularPendencias, origemAtiva) {
    try {
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim    = document.getElementById('dataFim').value;
        const pendencias = calcularPendencias();

        const texto = montarTexto(dadosFiltrados, pendencias, dataInicio, dataFim, origemAtiva);
        exibirModalTexto(texto);
        mostrarToast('Relatório gerado! Copie e cole onde quiser.', 'success');

    } catch (error) {
        console.error('Erro ao gerar relatório de texto:', error);
        mostrarToast('Erro ao gerar relatório de texto', 'error');
    }
}

// ============================================================
// MONTAGEM DO TEXTO
// ============================================================
function montarTexto(dadosFiltrados, pendencias, dataInicio, dataFim, origemAtiva) {
    const cfg = CONFIGURACOES_TEXTO;
    const txt = cfg.textos;
    const linhas = [];

    const periodoLabel = dataInicio === dataFim
        ? `📅 ${formatarDataTexto(dataInicio)}`
        : `📅 ${formatarDataTexto(dataInicio)} até ${formatarDataTexto(dataFim)}`;

    const origemLabel = origemAtiva === 'ci'
        ? ' • Filtro: CI'
        : origemAtiva === 'autorizado'
            ? ' • Filtro: Autorizado'
            : ' • Visão: Geral';

    // — CABEÇALHO —
    if (cfg.secoes.cabecalho) {
        linhas.push(cfg.separadorGrosso);
        linhas.push(txt.titulo + origemLabel);
        linhas.push(periodoLabel);
        linhas.push(cfg.separadorGrosso);
        linhas.push('');
    }

    // — RESUMO GERAL —
    if (cfg.secoes.resumoGeral) {
        const totalEntregas   = dadosFiltrados.filter(d => d.tipo === 'entrega').length;
        const totalDevolucoes = dadosFiltrados.filter(d => d.tipo === 'devolucao').length;
        const totalCI         = dadosFiltrados.filter(d => normalizar(d.origem) === 'ci').length;
        const totalAutorizado = dadosFiltrados.filter(d => normalizar(d.origem) !== 'ci').length;
        const totalPendentes  = pendencias.length;

        linhas.push(txt.secaoResumo);
        linhas.push(cfg.separador);
        linhas.push(`${txt.labelEntregas}:    ${totalEntregas}`);
        linhas.push(`${txt.labelDevolucoes}: ${totalDevolucoes}`);
        linhas.push(`${txt.labelPendentes}:   ${totalPendentes}`);

        if (origemAtiva === 'todos') {
            linhas.push('');
            linhas.push(`  ✔️  Autorizados: ${totalAutorizado}`);
            linhas.push(`  📄 Com CI:       ${totalCI}`);
        }
        linhas.push('');
    }

    // — JALECO POR TAMANHO —
    if (cfg.secoes.detalhesPorTamanho) {
        const tamanhos = ['P', 'M', 'G', 'GG', 'EG', 'EXG'];

        const entJ = contarPorTamanhoTexto(dadosFiltrados.filter(d => d.tipo === 'entrega'),   'jaleco');
        const devJ = contarPorTamanhoTexto(dadosFiltrados.filter(d => d.tipo === 'devolucao'), 'jaleco');
        const temJaleco = tamanhos.some(t => (entJ[t] || 0) > 0 || (devJ[t] || 0) > 0);

        if (temJaleco) {
            linhas.push(txt.secaoJaleco);
            linhas.push(cfg.separador);
            tamanhos.forEach(tam => {
                const e = entJ[tam] || 0;
                const d = devJ[tam] || 0;
                if (e > 0 || d > 0) {
                    linhas.push(`  ${tam.padEnd(3)} → 📦 ${e} entrega${e !== 1 ? 's' : ''}  |  ✅ ${d} devolução${d !== 1 ? 'ões' : ''}`);
                }
            });
            linhas.push('');
        }

        const entC = contarPorTamanhoTexto(dadosFiltrados.filter(d => d.tipo === 'entrega'),   'calca');
        const devC = contarPorTamanhoTexto(dadosFiltrados.filter(d => d.tipo === 'devolucao'), 'calca');
        const temCalca = tamanhos.some(t => (entC[t] || 0) > 0 || (devC[t] || 0) > 0);

        if (temCalca) {
            linhas.push(txt.secaoCalca);
            linhas.push(cfg.separador);
            tamanhos.forEach(tam => {
                const e = entC[tam] || 0;
                const d = devC[tam] || 0;
                if (e > 0 || d > 0) {
                    linhas.push(`  ${tam.padEnd(3)} → 📦 ${e} entrega${e !== 1 ? 's' : ''}  |  ✅ ${d} devolução${d !== 1 ? 'ões' : ''}`);
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
            // Separar por origem se estiver na visão "todos"
            if (origemAtiva === 'todos') {
                const autorizados = pendencias.filter(p => normalizar(p.origem) !== 'ci');
                const ci          = pendencias.filter(p => normalizar(p.origem) === 'ci');

                if (autorizados.length > 0) {
                    linhas.push('  ✔️ AUTORIZADOS:');
                    autorizados.slice(0, cfg.maxPendenciasListadas).forEach((p, i) => {
                        linhas.push(`    ${i + 1}. ${p.funcionario} — 🥼 ${p.jaleco || '?'} / 👖 ${p.calca || '?'} (${p.diasPendente}d)`);
                    });
                    if (autorizados.length > cfg.maxPendenciasListadas) {
                        linhas.push(`    ... e mais ${autorizados.length - cfg.maxPendenciasListadas} pendência(s).`);
                    }
                    linhas.push('');
                }

                if (ci.length > 0) {
                    linhas.push('  📄 COM CI:');
                    ci.slice(0, cfg.maxPendenciasListadas).forEach((p, i) => {
                        const enf = p.enfermeiro ? ` (${p.enfermeiro})` : '';
                        linhas.push(`    ${i + 1}. ${p.funcionario}${enf} — 🥼 ${p.jaleco || '?'} / 👖 ${p.calca || '?'} (${p.diasPendente}d)`);
                    });
                    if (ci.length > cfg.maxPendenciasListadas) {
                        linhas.push(`    ... e mais ${ci.length - cfg.maxPendenciasListadas} pendência(s).`);
                    }
                }

            } else {
                const lista = cfg.maxPendenciasListadas > 0
                    ? pendencias.slice(0, cfg.maxPendenciasListadas)
                    : pendencias;

                lista.forEach((p, i) => {
                    const enf = (normalizar(p.origem) === 'ci' && p.enfermeiro) ? ` (${p.enfermeiro})` : '';
                    linhas.push(`${i + 1}. ${p.funcionario}${enf} — 🥼 ${p.jaleco || '?'} / 👖 ${p.calca || '?'} (${p.diasPendente} dia${p.diasPendente !== 1 ? 's' : ''})`);
                });

                if (cfg.maxPendenciasListadas > 0 && pendencias.length > cfg.maxPendenciasListadas) {
                    linhas.push(`   ... e mais ${pendencias.length - cfg.maxPendenciasListadas} pendência(s).`);
                }
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
// MODAL DE EXIBIÇÃO
// ============================================================
function exibirModalTexto(texto) {
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

    const fechar = () => modal.remove();
    document.getElementById('fecharModalTexto').addEventListener('click', fechar);
    document.getElementById('fecharModalTexto2').addEventListener('click', fechar);
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

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
function contarPorTamanhoTexto(dados, campo) {
    const contagem = {};
    dados.forEach(item => {
        const tam = item[campo];
        if (tam) contagem[tam] = (contagem[tam] || 0) + 1;
    });
    return contagem;
}

function formatarDataTexto(dataISO) {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// normalizar já existe em relatorios.js, mas redeclaramos para independência deste módulo
function normalizar(str) {
    if (!str) return '';
    return str.trim().toLowerCase();
}
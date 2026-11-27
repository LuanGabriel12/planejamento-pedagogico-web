import { describe, it, expect } from 'vitest';
import { criarEstadoInicial } from '../data/initialData';
import {
  adicionarComentarioDirecao,
  aprovarPlanejamento,
  enviarParaRevisao,
  excluirRascunho,
  salvarRascunho,
  solicitarAjustes,
  verificarIntegridadeEstado
} from './planningService';
import { PlanejamentoFormularioInput } from '../types';

function criarInputCompleto(titulo = 'Planejamento fictício de ciências naturais'): PlanejamentoFormularioInput {
  return {
    titulo,
    disciplinas: ['Ciências'],
    turmas: ['1º Ano A'],
    experienciaAprendizagem:
      'Sequência didática fictícia com observação guiada de plantas, registro ilustrado no caderno e roda de conversa sobre cuidados com o ambiente escolar.',
    objetivos: [
      { id: 'o1', texto: 'Identificar partes principais das plantas em ilustrações', atingido: false },
      { id: 'o2', texto: 'Registrar observações simples em fichas didáticas', atingido: false }
    ],
    recursosNecessarios: ['Material impresso', 'Lápis de cor'],
    metodologiaAvaliacao:
      'Acompanhamento contínuo da participação oral, dos registros ilustrados e do trabalho colaborativo em sala.',
    instrumentosAvaliacao: ['Observação diária', 'Atividades práticas'],
    conclusao:
      'Espera-se que os estudantes reconheçam elementos básicos das plantas e organizem registros simples.',
    referencias: ['Referência didática fictícia — Ciências nos Anos Iniciais.'],
    observacoes: ''
  };
}

describe('planningService — ciclo de vida, integridade e regras de negócio', () => {
  it('cria rascunho, edita sem duplicar e bloqueia criação duplicada na mesma quinzena', () => {
    const estado0 = criarEstadoInicial();
    const prof1 = estado0.usuarios.find(u => u.id === 'prof_001')!;

    // Jan 2ª quinzena está livre para prof_001
    const r1 = salvarRascunho(estado0, prof1, {
      ano: 2026,
      mes: 1,
      quinzena: 2,
      dados: { ...criarInputCompleto(), titulo: 'Rascunho inicial de janeiro' }
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(r1.dados.criado).toBe(true);
    expect(r1.dados.planejamento.status).toBe('rascunho');
    expect(r1.dados.planejamento.versao).toBe(1);

    // Tentativa de criar um segundo registro para a mesma quinzena sem passar planejamentoId
    const duplicado = salvarRascunho(r1.dados.estado, prof1, {
      ano: 2026,
      mes: 1,
      quinzena: 2,
      dados: { ...criarInputCompleto(), titulo: 'Outro registro na mesma quinzena' }
    });
    expect(duplicado.ok).toBe(false);

    // Edição do mesmo rascunho incrementa versão e não duplica
    const r2 = salvarRascunho(r1.dados.estado, prof1, {
      planejamentoId: r1.dados.planejamento.id,
      ano: 2026,
      mes: 1,
      quinzena: 2,
      dados: { ...criarInputCompleto(), titulo: 'Rascunho atualizado v2' }
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.dados.criado).toBe(false);
    expect(r2.dados.planejamento.versao).toBe(2);
    expect(r2.dados.estado.planejamentos.length).toBe(r1.dados.estado.planejamentos.length);
  });

  it('executa o fluxo completo: rascunho -> envio -> ajustes -> correção -> reenvio -> aprovação', () => {
    const estado0 = criarEstadoInicial();
    const prof1 = estado0.usuarios.find(u => u.id === 'prof_001')!;
    const diretor = estado0.usuarios.find(u => u.id === 'dir_001')!;

    // 1. Criar rascunho
    const rasc = salvarRascunho(estado0, prof1, {
      ano: 2026,
      mes: 3,
      quinzena: 1,
      dados: criarInputCompleto('Planejamento fictício de março')
    });
    expect(rasc.ok).toBe(true);
    if (!rasc.ok) return;
    const planId = rasc.dados.planejamento.id;

    // Direção NÃO pode aprovar nem devolver um rascunho
    expect(
      aprovarPlanejamento(rasc.dados.estado, diretor, { planejamentoId: planId, feedback: '' }).ok
    ).toBe(false);
    expect(
      solicitarAjustes(rasc.dados.estado, diretor, {
        planejamentoId: planId,
        feedback: 'Tentativa inválida em rascunho'
      }).ok
    ).toBe(false);

    // 2. Enviar para revisão
    const env = enviarParaRevisao(rasc.dados.estado, prof1, {
      planejamentoId: planId,
      ano: 2026,
      mes: 3,
      quinzena: 1,
      dados: criarInputCompleto('Planejamento fictício de março')
    });
    expect(env.ok).toBe(true);
    if (!env.ok) return;
    expect(env.dados.planejamento.status).toBe('aguardando_revisao');
    expect(env.dados.planejamento.historicoConsideracoes.some(h => h.tipo === 'envio')).toBe(true);

    // Professor não pode editar enquanto aguarda revisão
    expect(
      salvarRascunho(env.dados.estado, prof1, {
        planejamentoId: planId,
        ano: 2026,
        mes: 3,
        quinzena: 1,
        dados: criarInputCompleto('Tentativa durante revisão')
      }).ok
    ).toBe(false);

    // 3. Direção solicita ajustes (exige comentário válido)
    const ajusteSemTexto = solicitarAjustes(env.dados.estado, diretor, {
      planejamentoId: planId,
      feedback: '   '
    });
    expect(ajusteSemTexto.ok).toBe(false);

    const ajuste = solicitarAjustes(env.dados.estado, diretor, {
      planejamentoId: planId,
      feedback: 'Detalhar melhor os critérios de acompanhamento na metodologia.'
    });
    expect(ajuste.ok).toBe(true);
    if (!ajuste.ok) return;
    expect(ajuste.dados.planejamento.status).toBe('ajustes_solicitados');
    expect(ajuste.dados.planejamento.prazoAjustes).toBeDefined();

    // 4. Professor salva edição intermediária -> deve PRESERVAR status ajustes_solicitados e feedback
    const rascAjuste = salvarRascunho(ajuste.dados.estado, prof1, {
      planejamentoId: planId,
      ano: 2026,
      mes: 3,
      quinzena: 1,
      dados: criarInputCompleto('Planejamento fictício de março revisado')
    });
    expect(rascAjuste.ok).toBe(true);
    if (!rascAjuste.ok) return;
    expect(rascAjuste.dados.planejamento.status).toBe('ajustes_solicitados');
    expect(rascAjuste.dados.planejamento.consideracoesDiretor).toContain('Detalhar melhor');

    // 5. Professor reenvia para revisão
    const reenvio = enviarParaRevisao(rascAjuste.dados.estado, prof1, {
      planejamentoId: planId,
      ano: 2026,
      mes: 3,
      quinzena: 1,
      dados: criarInputCompleto('Planejamento fictício de março corrigido')
    });
    expect(reenvio.ok).toBe(true);
    if (!reenvio.ok) return;
    expect(reenvio.dados.planejamento.status).toBe('aguardando_revisao');
    expect(reenvio.dados.planejamento.reenviadoEm).toBeDefined();
    expect(reenvio.dados.planejamento.prazoAjustes).toBeUndefined();
    expect(reenvio.dados.planejamento.historicoConsideracoes.some(h => h.tipo === 'reenvio')).toBe(true);

    // 6. Direção aprova
    const aprov = aprovarPlanejamento(reenvio.dados.estado, diretor, {
      planejamentoId: planId,
      feedback: 'Ajustes incorporados adequadamente.',
      avaliacao: 5
    });
    expect(aprov.ok).toBe(true);
    if (!aprov.ok) return;
    expect(aprov.dados.planejamento.status).toBe('aprovado');
    expect(aprov.dados.planejamento.avaliacaoDiretor).toBe(5);

    // 7. Após aprovação: bloqueia edição e bloqueia repetição de aprovação ou ajustes
    expect(
      salvarRascunho(aprov.dados.estado, prof1, {
        planejamentoId: planId,
        ano: 2026,
        mes: 3,
        quinzena: 1,
        dados: criarInputCompleto('Tentativa pós aprovação')
      }).ok
    ).toBe(false);
    expect(
      aprovarPlanejamento(aprov.dados.estado, diretor, {
        planejamentoId: planId,
        feedback: 'Reaprovação duplicada'
      }).ok
    ).toBe(false);

    // Comentário avulso continua permitido sem alterar status
    const coment = adicionarComentarioDirecao(aprov.dados.estado, diretor, {
      planejamentoId: planId,
      feedback: 'Registro complementar após aprovação.'
    });
    expect(coment.ok).toBe(true);
    if (coment.ok) {
      expect(coment.dados.planejamento.status).toBe('aprovado');
    }

    // Integridade geral mantida
    expect(verificarIntegridadeEstado(aprov.dados.estado).integro).toBe(true);
  });

  it('impede professor de editar/excluir planejamento de outro professor e permite excluir próprio rascunho', () => {
    const estado0 = criarEstadoInicial();
    const prof1 = estado0.usuarios.find(u => u.id === 'prof_001')!;
    const prof2 = estado0.usuarios.find(u => u.id === 'prof_002')!;

    const criado = salvarRascunho(estado0, prof1, {
      ano: 2026,
      mes: 4,
      quinzena: 1,
      dados: criarInputCompleto('Rascunho do Professor 1')
    });
    expect(criado.ok).toBe(true);
    if (!criado.ok) return;

    const planId = criado.dados.planejamento.id;

    // Prof 2 não pode editar nem excluir
    expect(
      salvarRascunho(criado.dados.estado, prof2, {
        planejamentoId: planId,
        ano: 2026,
        mes: 4,
        quinzena: 1,
        dados: criarInputCompleto('Tentativa indevida')
      }).ok
    ).toBe(false);
    expect(excluirRascunho(criado.dados.estado, prof2, planId).ok).toBe(false);

    // Prof 1 pode excluir o próprio rascunho
    const excluido = excluirRascunho(criado.dados.estado, prof1, planId);
    expect(excluido.ok).toBe(true);
    if (excluido.ok) {
      expect(excluido.dados.planejamentos.some(p => p.id === planId)).toBe(false);
    }
  });

  it('detecta violações de integridade (IDs duplicados, professor inválido e quinzena duplicada)', () => {
    const estado = criarEstadoInicial();
    expect(verificarIntegridadeEstado(estado).integro).toBe(true);

    const corrompido = {
      ...estado,
      planejamentos: [
        ...estado.planejamentos,
        { ...estado.planejamentos[0] }, // mesmo ID e mesma quinzena
        { ...estado.planejamentos[0], id: 'plan_orfao', professorId: 'prof_inexistente' }
      ]
    };

    const relatorio = verificarIntegridadeEstado(corrompido);
    expect(relatorio.integro).toBe(false);
    expect(relatorio.problemas.some(p => p.includes('duplicado'))).toBe(true);
    expect(relatorio.problemas.some(p => p.includes('inexistente'))).toBe(true);
  });
});

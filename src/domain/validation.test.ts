import { describe, it, expect } from 'vitest';
import {
  LIMITES_PLANEJAMENTO,
  validarEnvio,
  validarFeedbackDirecao,
  validarRascunho
} from './validation';
import { PlanejamentoFormularioInput } from '../types';

function criarInputValido(): PlanejamentoFormularioInput {
  return {
    titulo: 'Planejamento fictício de leitura guiada',
    disciplinas: ['Língua Portuguesa'],
    turmas: ['1º Ano A'],
    experienciaAprendizagem:
      'Atividades fictícias estruturadas para demonstrar validação completa de experiência de aprendizagem com mais de cem caracteres contínuos e coerentes.',
    objetivos: [
      { id: 'obj_1', texto: 'Reconhecer padrões silábicos simples', atingido: false },
      { id: 'obj_2', texto: 'Participar de rodas de leitura coletiva', atingido: false }
    ],
    recursosNecessarios: ['Quadro branco', 'Material impresso'],
    metodologiaAvaliacao:
      'Avaliação formativa simulada por meio da observação contínua da turma nas atividades práticas.',
    instrumentosAvaliacao: ['Observação diária'],
    conclusao:
      'Espera-se que os alunos ampliem a compreensão leitora básica ao término da quinzena fictícia.',
    referencias: ['Referência bibliográfica fictícia — Guia Didático Simulado.'],
    observacoes: 'Nota fictícia opcional.'
  };
}

describe('validation — rascunho vs. envio', () => {
  it('permite salvar rascunho parcial, mas rejeita formulário totalmente vazio ou só espaços', () => {
    const vazio = validarRascunho({ titulo: '   ', disciplinas: [], turmas: [] });
    expect(vazio.valido).toBe(false);
    expect(vazio.errosPorCampo.geral).toBeDefined();

    const parcial = validarRascunho(
      { titulo: 'Rascunho inicial' },
      {
        professorId: 'prof_001',
        ano: 2026,
        mes: 3,
        quinzena: 1,
        periodoInicio: '2026-03-01',
        periodoFim: '2026-03-15',
        professoresValidosIds: ['prof_001']
      }
    );
    expect(parcial.valido).toBe(true);
  });

  it('rejeita datas, quinzenas ou perfil de professor inválidos', () => {
    const quinzenaInvalida = validarRascunho(
      { titulo: 'Teste período' },
      { ano: 2026, mes: 13, quinzena: 1 }
    );
    expect(quinzenaInvalida.valido).toBe(false);
    expect(quinzenaInvalida.errosPorCampo.periodo).toBeDefined();

    const periodoInconsistente = validarRascunho(
      { titulo: 'Teste período' },
      {
        ano: 2026,
        mes: 2,
        quinzena: 2,
        periodoInicio: '2026-02-01',
        periodoFim: '2026-02-15'
      }
    );
    expect(periodoInconsistente.valido).toBe(false);
    expect(periodoInconsistente.errosPorCampo.periodo).toBeDefined();

    const profInexistente = validarRascunho(
      { titulo: 'Teste prof' },
      { professorId: 'prof_999', professoresValidosIds: ['prof_001'] }
    );
    expect(profInexistente.valido).toBe(false);
    expect(profInexistente.errosPorCampo.professorId).toBeDefined();
  });

  it('bloqueia envio quando campos obrigatórios estão vazios, só com espaços ou abaixo do mínimo', () => {
    const resultado = validarEnvio({
      titulo: '          ',
      disciplinas: [],
      turmas: [],
      experienciaAprendizagem: 'Texto curto demais',
      objetivos: [{ id: '1', texto: 'Único objetivo', atingido: false }],
      metodologiaAvaliacao: 'Curto',
      conclusao: 'Curta',
      referencias: []
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.errosPorCampo.titulo).toBeDefined();
    expect(resultado.errosPorCampo.disciplinas).toBeDefined();
    expect(resultado.errosPorCampo.turmas).toBeDefined();
    expect(resultado.errosPorCampo.experienciaAprendizagem).toBeDefined();
    expect(resultado.errosPorCampo.objetivos).toBeDefined();
    expect(resultado.errosPorCampo.metodologiaAvaliacao).toBeDefined();
    expect(resultado.errosPorCampo.conclusao).toBeDefined();
    expect(resultado.errosPorCampo.referencias).toBeDefined();
  });

  it('valida limites máximos razoáveis e aceita planejamento completo válido', () => {
    const valido = validarEnvio(criarInputValido(), {
      professorId: 'prof_001',
      ano: 2026,
      mes: 1,
      quinzena: 2,
      periodoInicio: '2026-01-16',
      periodoFim: '2026-01-31',
      professoresValidosIds: ['prof_001']
    });
    expect(valido.valido).toBe(true);
    expect(valido.erros).toHaveLength(0);

    const excedido = validarEnvio({
      ...criarInputValido(),
      titulo: 'A'.repeat(LIMITES_PLANEJAMENTO.TITULO_MAX + 5)
    });
    expect(excedido.valido).toBe(false);
    expect(excedido.errosPorCampo.titulo).toBeDefined();
  });

  it('exige comentário descritivo para solicitar ajustes e aceita aprovação com ou sem texto', () => {
    expect(validarFeedbackDirecao('   ', 'ajuste').valido).toBe(false);
    expect(validarFeedbackDirecao('Curto', 'ajuste').valido).toBe(false);
    expect(validarFeedbackDirecao('Detalhar melhor os instrumentos avaliativos.', 'ajuste').valido).toBe(true);
    expect(validarFeedbackDirecao('', 'aprovacao').valido).toBe(true);
    expect(validarFeedbackDirecao('Oi', 'comentario').valido).toBe(false);
    expect(validarFeedbackDirecao('Bom encaminhamento!', 'comentario').valido).toBe(true);
  });
});

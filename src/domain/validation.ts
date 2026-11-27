import {
  CampoValidacao,
  MapaErrosValidacao,
  Objetivo,
  Planejamento,
  ResultadoValidacao
} from '../types';
import { DateHelpers } from '../utils/dateHelpers';

// ============================================
// VALIDAÇÃO UNIFICADA DE PLANEJAMENTOS
// Fonte única de verdade usada pelo domínio e pela interface.
// ============================================

export const LIMITES_PLANEJAMENTO = {
  ANO_MIN: 2020,
  ANO_MAX: 2035,
  TITULO_MIN: 10,
  TITULO_MAX: 100,
  EXPERIENCIA_MIN: 100,
  EXPERIENCIA_MAX: 5000,
  OBJETIVOS_MIN: 2,
  OBJETIVO_TEXTO_MIN: 5,
  OBJETIVO_TEXTO_MAX: 300,
  METODOLOGIA_MIN: 50,
  METODOLOGIA_MAX: 2000,
  CONCLUSAO_MIN: 50,
  CONCLUSAO_MAX: 1000,
  REFERENCIAS_MIN: 1,
  REFERENCIA_TEXTO_MIN: 5,
  REFERENCIA_TEXTO_MAX: 500,
  OBSERVACOES_MAX: 1000,
  RECURSO_TEXTO_MAX: 200,
  COMENTARIO_MIN: 3,
  COMENTARIO_AJUSTE_MIN: 10,
  COMENTARIO_MAX: 2000
} as const;

export interface ContextoValidacaoPeriodo {
  professorId?: string;
  ano?: number;
  mes?: number;
  quinzena?: number;
  periodoInicio?: string;
  periodoFim?: string;
  professoresValidosIds?: string[];
}

function construirResultado(errosPorCampo: MapaErrosValidacao): ResultadoValidacao {
  const erros = Object.values(errosPorCampo).filter((msg): msg is string => Boolean(msg));
  return {
    valido: erros.length === 0,
    erros,
    errosPorCampo
  };
}

export function validarMetadadosPeriodo(
  contexto: ContextoValidacaoPeriodo
): MapaErrosValidacao {
  const erros: MapaErrosValidacao = {};

  if (contexto.professorId !== undefined) {
    if (!contexto.professorId.trim()) {
      erros.professorId = 'Perfil de professor responsável é obrigatório.';
    } else if (
      contexto.professoresValidosIds &&
      !contexto.professoresValidosIds.includes(contexto.professorId)
    ) {
      erros.professorId = 'O perfil de professor associado não foi encontrado.';
    }
  }

  if (
    contexto.ano !== undefined ||
    contexto.mes !== undefined ||
    contexto.quinzena !== undefined
  ) {
    const ano = contexto.ano;
    const mes = contexto.mes;
    const quinzena = contexto.quinzena;

    if (
      typeof ano !== 'number' ||
      !Number.isInteger(ano) ||
      ano < LIMITES_PLANEJAMENTO.ANO_MIN ||
      ano > LIMITES_PLANEJAMENTO.ANO_MAX
    ) {
      erros.periodo = `Ano inválido. Utilize um valor entre ${LIMITES_PLANEJAMENTO.ANO_MIN} e ${LIMITES_PLANEJAMENTO.ANO_MAX}.`;
      return erros;
    }

    if (typeof mes !== 'number' || !Number.isInteger(mes) || mes < 1 || mes > 12) {
      erros.periodo = 'Mês inválido. Informe um mês entre 1 e 12.';
      return erros;
    }

    if (quinzena !== 1 && quinzena !== 2) {
      erros.periodo = 'Quinzena inválida. Utilize apenas 1ª ou 2ª quinzena.';
      return erros;
    }

    if (contexto.periodoInicio !== undefined || contexto.periodoFim !== undefined) {
      const okPeriodo = DateHelpers.isPeriodoQuinzenaValido(
        ano,
        mes,
        quinzena,
        contexto.periodoInicio ?? '',
        contexto.periodoFim ?? ''
      );
      if (!okPeriodo) {
        erros.periodo = 'As datas de início e fim não correspondem à quinzena informada.';
      }
    }
  }

  return erros;
}

/**
 * Verifica se o formulário possui pelo menos algum conteúdo real (não apenas espaços).
 */
export function possuiAlgumConteudo(dados: Partial<Planejamento>): boolean {
  const textos = [
    dados.titulo,
    dados.experienciaAprendizagem,
    dados.metodologiaAvaliacao,
    dados.conclusao,
    dados.observacoes
  ];

  if (textos.some(t => typeof t === 'string' && t.trim().length > 0)) {
    return true;
  }

  if ((dados.disciplinas?.length ?? 0) > 0) return true;
  if ((dados.turmas?.length ?? 0) > 0) return true;
  if ((dados.instrumentosAvaliacao?.length ?? 0) > 0) return true;
  if ((dados.recursosNecessarios?.some(r => r.trim().length > 0)) ?? false) return true;
  if ((dados.objetivos?.some(o => o.texto.trim().length > 0)) ?? false) return true;
  if ((dados.referencias?.some(r => r.trim().length > 0)) ?? false) return true;

  return false;
}

/**
 * Validação para salvar rascunho:
 * - Permite campos ainda incompletos (não exige mínimos de envio).
 * - Exige consistência de período/professor, limites máximos razoáveis,
 *   ausência de itens vazios/só espaços em listas e ao menos um dado preenchido.
 */
export function validarRascunho(
  dados: Partial<Planejamento>,
  contexto?: ContextoValidacaoPeriodo
): ResultadoValidacao {
  const erros: MapaErrosValidacao = {
    ...validarMetadadosPeriodo({
      professorId: contexto?.professorId ?? dados.professorId,
      ano: contexto?.ano ?? dados.ano,
      mes: contexto?.mes ?? dados.mes,
      quinzena: contexto?.quinzena ?? dados.quinzena,
      periodoInicio: contexto?.periodoInicio ?? dados.periodoInicio,
      periodoFim: contexto?.periodoFim ?? dados.periodoFim,
      professoresValidosIds: contexto?.professoresValidosIds
    })
  };

  if (!possuiAlgumConteudo(dados)) {
    erros.geral = 'Preencha ao menos um campo antes de salvar o rascunho.';
  }

  if (dados.titulo && dados.titulo.trim().length > LIMITES_PLANEJAMENTO.TITULO_MAX) {
    erros.titulo = `O título deve ter no máximo ${LIMITES_PLANEJAMENTO.TITULO_MAX} caracteres.`;
  }

  if (
    dados.experienciaAprendizagem &&
    dados.experienciaAprendizagem.trim().length > LIMITES_PLANEJAMENTO.EXPERIENCIA_MAX
  ) {
    erros.experienciaAprendizagem = `A experiência de aprendizagem deve ter no máximo ${LIMITES_PLANEJAMENTO.EXPERIENCIA_MAX} caracteres.`;
  }

  if (
    dados.metodologiaAvaliacao &&
    dados.metodologiaAvaliacao.trim().length > LIMITES_PLANEJAMENTO.METODOLOGIA_MAX
  ) {
    erros.metodologiaAvaliacao = `A metodologia de avaliação deve ter no máximo ${LIMITES_PLANEJAMENTO.METODOLOGIA_MAX} caracteres.`;
  }

  if (dados.conclusao && dados.conclusao.trim().length > LIMITES_PLANEJAMENTO.CONCLUSAO_MAX) {
    erros.conclusao = `A conclusão deve ter no máximo ${LIMITES_PLANEJAMENTO.CONCLUSAO_MAX} caracteres.`;
  }

  if (dados.observacoes && dados.observacoes.trim().length > LIMITES_PLANEJAMENTO.OBSERVACOES_MAX) {
    erros.observacoes = `As observações devem ter no máximo ${LIMITES_PLANEJAMENTO.OBSERVACOES_MAX} caracteres.`;
  }

  if (dados.objetivos?.some(o => !o.texto || !o.texto.trim())) {
    erros.objetivos = 'Há objetivos vazios ou contendo apenas espaços. Corrija ou remova antes de salvar.';
  } else if (
    dados.objetivos?.some(o => o.texto.trim().length > LIMITES_PLANEJAMENTO.OBJETIVO_TEXTO_MAX)
  ) {
    erros.objetivos = `Cada objetivo deve ter no máximo ${LIMITES_PLANEJAMENTO.OBJETIVO_TEXTO_MAX} caracteres.`;
  }

  if (dados.referencias?.some(r => !r || !r.trim())) {
    erros.referencias = 'Há referências vazias ou contendo apenas espaços.';
  } else if (
    dados.referencias?.some(r => r.trim().length > LIMITES_PLANEJAMENTO.REFERENCIA_TEXTO_MAX)
  ) {
    erros.referencias = `Cada referência deve ter no máximo ${LIMITES_PLANEJAMENTO.REFERENCIA_TEXTO_MAX} caracteres.`;
  }

  if (dados.recursosNecessarios?.some(r => !r || !r.trim())) {
    erros.recursosNecessarios = 'Há recursos vazios ou contendo apenas espaços.';
  } else if (
    dados.recursosNecessarios?.some(r => r.trim().length > LIMITES_PLANEJAMENTO.RECURSO_TEXTO_MAX)
  ) {
    erros.recursosNecessarios = `Cada recurso deve ter no máximo ${LIMITES_PLANEJAMENTO.RECURSO_TEXTO_MAX} caracteres.`;
  }

  return construirResultado(erros);
}

/**
 * Valida um campo individual para feedback inline no formulário,
 * usando exatamente os mesmos critérios do envio para revisão.
 */
export function validarCampoEnvio(
  campo: CampoValidacao,
  valor: unknown
): string | undefined {
  switch (campo) {
    case 'titulo': {
      const texto = typeof valor === 'string' ? valor.trim() : '';
      if (texto.length < LIMITES_PLANEJAMENTO.TITULO_MIN) {
        return `Título deve ter no mínimo ${LIMITES_PLANEJAMENTO.TITULO_MIN} caracteres válidos.`;
      }
      if (texto.length > LIMITES_PLANEJAMENTO.TITULO_MAX) {
        return `Título deve ter no máximo ${LIMITES_PLANEJAMENTO.TITULO_MAX} caracteres.`;
      }
      return undefined;
    }

    case 'disciplinas': {
      const lista = Array.isArray(valor)
        ? valor.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
      if (lista.length === 0) {
        return 'Selecione pelo menos uma disciplina.';
      }
      return undefined;
    }

    case 'turmas': {
      const lista = Array.isArray(valor)
        ? valor.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
      if (lista.length === 0) {
        return 'Selecione pelo menos uma turma.';
      }
      return undefined;
    }

    case 'experienciaAprendizagem': {
      const texto = typeof valor === 'string' ? valor.trim() : '';
      if (texto.length < LIMITES_PLANEJAMENTO.EXPERIENCIA_MIN) {
        return `Experiência de aprendizagem deve ter no mínimo ${LIMITES_PLANEJAMENTO.EXPERIENCIA_MIN} caracteres válidos.`;
      }
      if (texto.length > LIMITES_PLANEJAMENTO.EXPERIENCIA_MAX) {
        return `Experiência de aprendizagem deve ter no máximo ${LIMITES_PLANEJAMENTO.EXPERIENCIA_MAX} caracteres.`;
      }
      return undefined;
    }

    case 'objetivos': {
      const lista = Array.isArray(valor) ? (valor as Objetivo[]) : [];
      if (lista.some(o => !o || typeof o.texto !== 'string' || o.texto.trim().length === 0)) {
        return 'Remova ou preencha objetivos vazios antes de enviar.';
      }
      if (lista.length < LIMITES_PLANEJAMENTO.OBJETIVOS_MIN) {
        return `Adicione no mínimo ${LIMITES_PLANEJAMENTO.OBJETIVOS_MIN} objetivos de aprendizagem.`;
      }
      if (lista.some(o => o.texto.trim().length < LIMITES_PLANEJAMENTO.OBJETIVO_TEXTO_MIN)) {
        return `Cada objetivo deve ter no mínimo ${LIMITES_PLANEJAMENTO.OBJETIVO_TEXTO_MIN} caracteres.`;
      }
      if (lista.some(o => o.texto.trim().length > LIMITES_PLANEJAMENTO.OBJETIVO_TEXTO_MAX)) {
        return `Cada objetivo deve ter no máximo ${LIMITES_PLANEJAMENTO.OBJETIVO_TEXTO_MAX} caracteres.`;
      }
      return undefined;
    }

    case 'metodologiaAvaliacao': {
      const texto = typeof valor === 'string' ? valor.trim() : '';
      if (texto.length < LIMITES_PLANEJAMENTO.METODOLOGIA_MIN) {
        return `Metodologia de avaliação deve ter no mínimo ${LIMITES_PLANEJAMENTO.METODOLOGIA_MIN} caracteres válidos.`;
      }
      if (texto.length > LIMITES_PLANEJAMENTO.METODOLOGIA_MAX) {
        return `Metodologia de avaliação deve ter no máximo ${LIMITES_PLANEJAMENTO.METODOLOGIA_MAX} caracteres.`;
      }
      return undefined;
    }

    case 'conclusao': {
      const texto = typeof valor === 'string' ? valor.trim() : '';
      if (texto.length < LIMITES_PLANEJAMENTO.CONCLUSAO_MIN) {
        return `Conclusão deve ter no mínimo ${LIMITES_PLANEJAMENTO.CONCLUSAO_MIN} caracteres válidos.`;
      }
      if (texto.length > LIMITES_PLANEJAMENTO.CONCLUSAO_MAX) {
        return `Conclusão deve ter no máximo ${LIMITES_PLANEJAMENTO.CONCLUSAO_MAX} caracteres.`;
      }
      return undefined;
    }

    case 'referencias': {
      const lista = Array.isArray(valor) ? (valor as string[]) : [];
      if (lista.some(r => typeof r !== 'string' || r.trim().length === 0)) {
        return 'Remova referências vazias antes de enviar.';
      }
      if (lista.length < LIMITES_PLANEJAMENTO.REFERENCIAS_MIN) {
        return 'Adicione pelo menos uma referência bibliográfica.';
      }
      if (lista.some(r => r.trim().length < LIMITES_PLANEJAMENTO.REFERENCIA_TEXTO_MIN)) {
        return `Cada referência deve ter no mínimo ${LIMITES_PLANEJAMENTO.REFERENCIA_TEXTO_MIN} caracteres.`;
      }
      if (lista.some(r => r.trim().length > LIMITES_PLANEJAMENTO.REFERENCIA_TEXTO_MAX)) {
        return `Cada referência deve ter no máximo ${LIMITES_PLANEJAMENTO.REFERENCIA_TEXTO_MAX} caracteres.`;
      }
      return undefined;
    }

    case 'observacoes': {
      const texto = typeof valor === 'string' ? valor.trim() : '';
      if (texto.length > LIMITES_PLANEJAMENTO.OBSERVACOES_MAX) {
        return `Observações devem ter no máximo ${LIMITES_PLANEJAMENTO.OBSERVACOES_MAX} caracteres.`;
      }
      return undefined;
    }

    case 'recursosNecessarios': {
      const lista = Array.isArray(valor) ? (valor as string[]) : [];
      if (lista.some(r => typeof r !== 'string' || r.trim().length === 0)) {
        return 'Há recursos vazios na lista.';
      }
      if (lista.some(r => r.trim().length > LIMITES_PLANEJAMENTO.RECURSO_TEXTO_MAX)) {
        return `Cada recurso deve ter no máximo ${LIMITES_PLANEJAMENTO.RECURSO_TEXTO_MAX} caracteres.`;
      }
      return undefined;
    }

    default:
      return undefined;
  }
}

/**
 * Validação completa obrigatória antes do envio ou reenvio para revisão.
 */
export function validarEnvio(
  dados: Partial<Planejamento>,
  contexto?: ContextoValidacaoPeriodo
): ResultadoValidacao {
  const erros: MapaErrosValidacao = {
    ...validarMetadadosPeriodo({
      professorId: contexto?.professorId ?? dados.professorId,
      ano: contexto?.ano ?? dados.ano,
      mes: contexto?.mes ?? dados.mes,
      quinzena: contexto?.quinzena ?? dados.quinzena,
      periodoInicio: contexto?.periodoInicio ?? dados.periodoInicio,
      periodoFim: contexto?.periodoFim ?? dados.periodoFim,
      professoresValidosIds: contexto?.professoresValidosIds
    })
  };

  const campos: CampoValidacao[] = [
    'titulo',
    'disciplinas',
    'turmas',
    'experienciaAprendizagem',
    'objetivos',
    'recursosNecessarios',
    'metodologiaAvaliacao',
    'conclusao',
    'referencias',
    'observacoes'
  ];

  for (const campo of campos) {
    const valor = dados[campo as keyof Planejamento];
    const erroCampo = validarCampoEnvio(campo, valor);
    if (erroCampo) {
      erros[campo] = erroCampo;
    }
  }

  return construirResultado(erros);
}

/**
 * Validação de feedback da direção conforme a ação realizada.
 */
export function validarFeedbackDirecao(
  texto: string,
  tipo: 'aprovacao' | 'ajuste' | 'comentario'
): { valido: boolean; erro?: string; textoNormalizado: string } {
  const normalizado = texto.trim();

  if (normalizado.length > LIMITES_PLANEJAMENTO.COMENTARIO_MAX) {
    return {
      valido: false,
      erro: `As considerações devem ter no máximo ${LIMITES_PLANEJAMENTO.COMENTARIO_MAX} caracteres.`,
      textoNormalizado: normalizado
    };
  }

  if (tipo === 'ajuste' && normalizado.length < LIMITES_PLANEJAMENTO.COMENTARIO_AJUSTE_MIN) {
    return {
      valido: false,
      erro: `Descreva claramente os ajustes necessários (mínimo de ${LIMITES_PLANEJAMENTO.COMENTARIO_AJUSTE_MIN} caracteres).`,
      textoNormalizado: normalizado
    };
  }

  if (tipo === 'comentario' && normalizado.length < LIMITES_PLANEJAMENTO.COMENTARIO_MIN) {
    return {
      valido: false,
      erro: `Escreva um comentário com pelo menos ${LIMITES_PLANEJAMENTO.COMENTARIO_MIN} caracteres.`,
      textoNormalizado: normalizado
    };
  }

  return { valido: true, textoNormalizado: normalizado };
}

import {
  AppState,
  HistoricoConsideracao,
  Notificacao,
  Planejamento,
  PlanejamentoFormularioInput,
  ResultadoOperacao
} from '../types';
import { Usuario } from '../models/auth/users.model';
import { DateHelpers } from '../utils/dateHelpers';
import {
  isStatusValido,
  podeComentarPlanejamento,
  podeEditarPlanejamento,
  podeEnviarParaRevisao,
  podeExcluirPlanejamento,
  podeRevisarPlanejamento
} from './stateMachine';
import { validarEnvio, validarFeedbackDirecao, validarRascunho } from './validation';

// ============================================
// SERVIÇO DE DOMÍNIO (FUNÇÕES PURAS)
// Centraliza regras de negócio e integridade do estado.
// ============================================

let sequenciaLocal = 0;

export function gerarIdUnico(prefixo: string, idsExistentes: Iterable<string> = []): string {
  const conjunto = new Set(idsExistentes);
  let tentativa = '';

  do {
    sequenciaLocal += 1;
    const aleatorio = Math.random().toString(36).slice(2, 8);
    tentativa = `${prefixo}_${Date.now()}_${sequenciaLocal}_${aleatorio}`;
  } while (conjunto.has(tentativa));

  return tentativa;
}

function normalizarListaTexto(lista: string[]): string[] {
  const resultado: string[] = [];
  const vistos = new Set<string>();

  for (const item of lista) {
    const limpo = item.trim();
    if (!limpo) continue;
    const chave = limpo.toLowerCase();
    if (!vistos.has(chave)) {
      vistos.add(chave);
      resultado.push(limpo);
    }
  }
  return resultado;
}

function normalizarInputFormulario(input: PlanejamentoFormularioInput): PlanejamentoFormularioInput {
  const idsObjetivos = new Set<string>();
  return {
    titulo: input.titulo.trim(),
    disciplinas: normalizarListaTexto(input.disciplinas),
    turmas: normalizarListaTexto(input.turmas),
    experienciaAprendizagem: input.experienciaAprendizagem.trim(),
    objetivos: input.objetivos
      .filter(o => o.texto.trim().length > 0)
      .map(o => {
        const idValido =
          o.id && !idsObjetivos.has(o.id) ? o.id : gerarIdUnico('obj', idsObjetivos);
        idsObjetivos.add(idValido);
        return {
          id: idValido,
          texto: o.texto.trim(),
          atingido: Boolean(o.atingido)
        };
      }),
    recursosNecessarios: normalizarListaTexto(input.recursosNecessarios),
    metodologiaAvaliacao: input.metodologiaAvaliacao.trim(),
    instrumentosAvaliacao: normalizarListaTexto(input.instrumentosAvaliacao),
    conclusao: input.conclusao.trim(),
    referencias: input.referencias.map(r => r.trim()).filter(Boolean),
    observacoes: input.observacoes.trim()
  };
}

function encontrarConflitoQuinzena(
  planejamentos: Planejamento[],
  professorId: string,
  ano: number,
  mes: number,
  quinzena: 1 | 2,
  ignorarId?: string
): Planejamento | undefined {
  return planejamentos.find(
    p =>
      p.id !== ignorarId &&
      p.professorId === professorId &&
      p.ano === ano &&
      p.mes === mes &&
      p.quinzena === quinzena
  );
}

export interface ParamsSalvarPlanejamento {
  planejamentoId?: string;
  ano: number;
  mes: number;
  quinzena: 1 | 2;
  dados: PlanejamentoFormularioInput;
  agoraIso?: string;
}

export interface ResultadoSalvarPlanejamento {
  estado: AppState;
  planejamento: Planejamento;
  criado: boolean;
}

/**
 * Salva um planejamento novo em rascunho ou atualiza um planejamento editável.
 * Regra importante: se o planejamento já está em `ajustes_solicitados`,
 * salvar alterações em andamento preserva o status `ajustes_solicitados` e todo
 * o histórico/feedback da direção até o professor clicar explicitamente em reenviar.
 */
export function salvarRascunho(
  estado: AppState,
  usuario: Usuario | null,
  params: ParamsSalvarPlanejamento
): ResultadoOperacao<ResultadoSalvarPlanejamento> {
  if (!usuario || usuario.role !== 'professor') {
    return {
      ok: false,
      erro: 'Apenas um perfil de professor pode criar ou salvar rascunhos.'
    };
  }

  const professoresValidosIds = estado.usuarios
    .filter(u => u.role === 'professor')
    .map(u => u.id);

  if (!professoresValidosIds.includes(usuario.id)) {
    return { ok: false, erro: 'Perfil de professor inválido no estado atual.' };
  }

  const existente = params.planejamentoId
    ? estado.planejamentos.find(p => p.id === params.planejamentoId)
    : undefined;

  if (params.planejamentoId && !existente) {
    return { ok: false, erro: 'Planejamento informado para edição não foi encontrado.' };
  }

  if (existente) {
    const permissao = podeEditarPlanejamento(existente, usuario);
    if (!permissao.permitido) {
      return { ok: false, erro: permissao.motivo || 'Edição não permitida neste status.' };
    }
  }

  const anoAlvo = existente?.ano ?? params.ano;
  const mesAlvo = existente?.mes ?? params.mes;
  const quinzenaAlvo = existente?.quinzena ?? params.quinzena;
  const { periodoInicio, periodoFim } = DateHelpers.calcularPeriodo(anoAlvo, mesAlvo, quinzenaAlvo);

  const validacao = validarRascunho(params.dados, {
    professorId: usuario.id,
    ano: anoAlvo,
    mes: mesAlvo,
    quinzena: quinzenaAlvo,
    periodoInicio,
    periodoFim,
    professoresValidosIds
  });

  if (!validacao.valido) {
    return {
      ok: false,
      erro: validacao.erros[0] || 'Dados inválidos para salvar o rascunho.',
      errosPorCampo: validacao.errosPorCampo
    };
  }

  const conflito = encontrarConflitoQuinzena(
    estado.planejamentos,
    usuario.id,
    anoAlvo,
    mesAlvo,
    quinzenaAlvo,
    existente?.id
  );
  if (conflito) {
    return {
      ok: false,
      erro: `Já existe um planejamento registrado para ${DateHelpers.getNomeMes(mesAlvo)}/${anoAlvo} (${quinzenaAlvo}ª quinzena).`
    };
  }

  const agora = params.agoraIso ?? new Date().toISOString();
  const dadosLimpos = normalizarInputFormulario(params.dados);

  if (existente) {
    const atualizado: Planejamento = {
      ...existente,
      ...dadosLimpos,
      observacoes: dadosLimpos.observacoes || undefined,
      // Mantém `ajustes_solicitados` caso já tenha sido devolvido; caso contrário segue `rascunho`.
      status: existente.status === 'ajustes_solicitados' ? 'ajustes_solicitados' : 'rascunho',
      atualizadoEm: agora,
      versao: existente.versao + 1
    };

    const novoEstado: AppState = {
      ...estado,
      planejamentos: estado.planejamentos.map(p => (p.id === existente.id ? atualizado : p))
    };

    return {
      ok: true,
      dados: { estado: novoEstado, planejamento: atualizado, criado: false }
    };
  }

  const novoId = gerarIdUnico('plan', estado.planejamentos.map(p => p.id));
  const novoPlanejamento: Planejamento = {
    id: novoId,
    professorId: usuario.id,
    ano: anoAlvo,
    mes: mesAlvo,
    quinzena: quinzenaAlvo,
    periodoInicio,
    periodoFim,
    ...dadosLimpos,
    observacoes: dadosLimpos.observacoes || undefined,
    status: 'rascunho',
    criadoEm: agora,
    atualizadoEm: agora,
    historicoConsideracoes: [],
    versao: 1
  };

  return {
    ok: true,
    dados: {
      estado: {
        ...estado,
        planejamentos: [...estado.planejamentos, novoPlanejamento]
      },
      planejamento: novoPlanejamento,
      criado: true
    }
  };
}

/**
 * Valida integralmente e envia (ou reenvia após ajustes) um planejamento para revisão.
 */
export function enviarParaRevisao(
  estado: AppState,
  usuario: Usuario | null,
  params: ParamsSalvarPlanejamento
): ResultadoOperacao<ResultadoSalvarPlanejamento> {
  const existente = params.planejamentoId
    ? estado.planejamentos.find(p => p.id === params.planejamentoId)
    : undefined;

  if (params.planejamentoId && !existente) {
    return { ok: false, erro: 'Planejamento informado para envio não foi encontrado.' };
  }

  const permissao = podeEnviarParaRevisao(existente, usuario);
  if (!permissao.permitido || !usuario) {
    return { ok: false, erro: permissao.motivo || 'Envio não permitido.' };
  }

  const professoresValidosIds = estado.usuarios
    .filter(u => u.role === 'professor')
    .map(u => u.id);

  const anoAlvo = existente?.ano ?? params.ano;
  const mesAlvo = existente?.mes ?? params.mes;
  const quinzenaAlvo = existente?.quinzena ?? params.quinzena;
  const { periodoInicio, periodoFim } = DateHelpers.calcularPeriodo(anoAlvo, mesAlvo, quinzenaAlvo);

  const validacao = validarEnvio(params.dados, {
    professorId: usuario.id,
    ano: anoAlvo,
    mes: mesAlvo,
    quinzena: quinzenaAlvo,
    periodoInicio,
    periodoFim,
    professoresValidosIds
  });

  if (!validacao.valido) {
    return {
      ok: false,
      erro: 'Corrija os campos obrigatórios antes de enviar para revisão.',
      errosPorCampo: validacao.errosPorCampo
    };
  }

  const conflito = encontrarConflitoQuinzena(
    estado.planejamentos,
    usuario.id,
    anoAlvo,
    mesAlvo,
    quinzenaAlvo,
    existente?.id
  );
  if (conflito) {
    return {
      ok: false,
      erro: `Já existe um planejamento registrado para ${DateHelpers.getNomeMes(mesAlvo)}/${anoAlvo} (${quinzenaAlvo}ª quinzena).`
    };
  }

  const agora = params.agoraIso ?? new Date().toISOString();
  const dadosLimpos = normalizarInputFormulario(params.dados);
  const ehReenvio = existente?.status === 'ajustes_solicitados';

  const eventoHistorico: HistoricoConsideracao = {
    id: gerarIdUnico('hist', existente?.historicoConsideracoes.map(h => h.id) ?? []),
    texto: ehReenvio
      ? 'Planejamento corrigido e reenviado para revisão da direção.'
      : 'Planejamento enviado para revisão da direção.',
    tipo: ehReenvio ? 'reenvio' : 'envio',
    criadoEm: agora,
    lido: false,
    autorNome: usuario.nome,
    autorRole: 'professor'
  };

  let planejamentoFinal: Planejamento;
  let novosPlanejamentos: Planejamento[];

  if (existente) {
    planejamentoFinal = {
      ...existente,
      ...dadosLimpos,
      observacoes: dadosLimpos.observacoes || undefined,
      status: 'aguardando_revisao',
      atualizadoEm: agora,
      enviadoEm: existente.enviadoEm ?? agora,
      reenviadoEm: ehReenvio ? agora : existente.reenviadoEm,
      prazoAjustes: undefined,
      historicoConsideracoes: [...existente.historicoConsideracoes, eventoHistorico],
      versao: existente.versao + 1
    };
    novosPlanejamentos = estado.planejamentos.map(p =>
      p.id === existente.id ? planejamentoFinal : p
    );
  } else {
    const novoId = gerarIdUnico('plan', estado.planejamentos.map(p => p.id));
    planejamentoFinal = {
      id: novoId,
      professorId: usuario.id,
      ano: anoAlvo,
      mes: mesAlvo,
      quinzena: quinzenaAlvo,
      periodoInicio,
      periodoFim,
      ...dadosLimpos,
      observacoes: dadosLimpos.observacoes || undefined,
      status: 'aguardando_revisao',
      criadoEm: agora,
      atualizadoEm: agora,
      enviadoEm: agora,
      historicoConsideracoes: [eventoHistorico],
      versao: 1
    };
    novosPlanejamentos = [...estado.planejamentos, planejamentoFinal];
  }

  // Notificar perfis de direção
  const diretores = estado.usuarios.filter(u => u.role === 'diretor');
  const idsNotif = new Set(estado.notificacoes.map(n => n.id));
  const novasNotificacoes: Notificacao[] = diretores.map(diretor => {
    const id = gerarIdUnico('notif', idsNotif);
    idsNotif.add(id);
    return {
      id,
      usuarioId: diretor.id,
      tipo: 'envio',
      titulo: ehReenvio ? 'Planejamento reenviado para revisão' : 'Novo planejamento para revisão',
      mensagem: `${usuario.nome} ${ehReenvio ? 'reenviou' : 'enviou'} o planejamento de ${DateHelpers.getNomeMes(mesAlvo)} (${quinzenaAlvo}ª quinzena).`,
      planejamentoId: planejamentoFinal.id,
      lida: false,
      criadaEm: agora
    };
  });

  return {
    ok: true,
    dados: {
      estado: {
        ...estado,
        planejamentos: novosPlanejamentos,
        notificacoes: [...estado.notificacoes, ...novasNotificacoes]
      },
      planejamento: planejamentoFinal,
      criado: !existente
    }
  };
}

/**
 * Exclui apenas rascunhos pertencentes ao professor logado.
 */
export function excluirRascunho(
  estado: AppState,
  usuario: Usuario | null,
  planejamentoId: string
): ResultadoOperacao<AppState> {
  const alvo = estado.planejamentos.find(p => p.id === planejamentoId);
  if (!alvo) {
    return { ok: false, erro: 'Planejamento não encontrado.' };
  }

  const permissao = podeExcluirPlanejamento(alvo, usuario);
  if (!permissao.permitido) {
    return { ok: false, erro: permissao.motivo || 'Exclusão não permitida.' };
  }

  return {
    ok: true,
    dados: {
      ...estado,
      planejamentos: estado.planejamentos.filter(p => p.id !== planejamentoId),
      notificacoes: estado.notificacoes.filter(n => n.planejamentoId !== planejamentoId)
    }
  };
}

export interface ParamsRevisaoDirecao {
  planejamentoId: string;
  feedback: string;
  avaliacao?: number;
  prazoDias?: number;
  agoraIso?: string;
}

function normalizarAvaliacao(avaliacao?: number): number | undefined {
  if (avaliacao === undefined || avaliacao === 0) return undefined;
  if (!Number.isInteger(avaliacao) || avaliacao < 1 || avaliacao > 5) return undefined;
  return avaliacao;
}

/**
 * Aprova um planejamento que esteja em `aguardando_revisao`.
 */
export function aprovarPlanejamento(
  estado: AppState,
  usuario: Usuario | null,
  params: ParamsRevisaoDirecao
): ResultadoOperacao<{ estado: AppState; planejamento: Planejamento }> {
  const alvo = estado.planejamentos.find(p => p.id === params.planejamentoId);
  if (!alvo) {
    return { ok: false, erro: 'Planejamento não encontrado.' };
  }

  const permissao = podeRevisarPlanejamento(alvo, usuario);
  if (!permissao.permitido || !usuario) {
    return { ok: false, erro: permissao.motivo || 'Aprovação não permitida.' };
  }

  const validacaoTexto = validarFeedbackDirecao(params.feedback, 'aprovacao');
  if (!validacaoTexto.valido) {
    return { ok: false, erro: validacaoTexto.erro || 'Feedback inválido.' };
  }

  const agora = params.agoraIso ?? new Date().toISOString();
  const textoFinal = validacaoTexto.textoNormalizado || 'Planejamento aprovado pela direção.';
  const avaliacaoNormalizada = normalizarAvaliacao(params.avaliacao);

  const novoRegistro: HistoricoConsideracao = {
    id: gerarIdUnico('hist', alvo.historicoConsideracoes.map(h => h.id)),
    texto: textoFinal,
    tipo: 'aprovacao',
    criadoEm: agora,
    lido: false,
    autorNome: usuario.nome,
    autorRole: 'diretor'
  };

  const atualizado: Planejamento = {
    ...alvo,
    status: 'aprovado',
    revisadoEm: agora,
    atualizadoEm: agora,
    consideracoesDiretor: textoFinal,
    avaliacaoDiretor: avaliacaoNormalizada,
    prazoAjustes: undefined,
    historicoConsideracoes: [...alvo.historicoConsideracoes, novoRegistro]
  };

  const notificacao: Notificacao = {
    id: gerarIdUnico('notif', estado.notificacoes.map(n => n.id)),
    usuarioId: alvo.professorId,
    tipo: 'aprovacao',
    titulo: 'Planejamento aprovado',
    mensagem: `Seu planejamento de ${DateHelpers.getNomeMes(alvo.mes)} (${alvo.quinzena}ª quinzena) foi aprovado na simulação.`,
    planejamentoId: alvo.id,
    lida: false,
    criadaEm: agora
  };

  return {
    ok: true,
    dados: {
      planejamento: atualizado,
      estado: {
        ...estado,
        planejamentos: estado.planejamentos.map(p => (p.id === alvo.id ? atualizado : p)),
        notificacoes: [...estado.notificacoes, notificacao]
      }
    }
  };
}

/**
 * Solicita ajustes em um planejamento que esteja em `aguardando_revisao`.
 * Exige comentário descritivo obrigatório.
 */
export function solicitarAjustes(
  estado: AppState,
  usuario: Usuario | null,
  params: ParamsRevisaoDirecao
): ResultadoOperacao<{ estado: AppState; planejamento: Planejamento }> {
  const alvo = estado.planejamentos.find(p => p.id === params.planejamentoId);
  if (!alvo) {
    return { ok: false, erro: 'Planejamento não encontrado.' };
  }

  const permissao = podeRevisarPlanejamento(alvo, usuario);
  if (!permissao.permitido || !usuario) {
    return { ok: false, erro: permissao.motivo || 'Solicitação de ajustes não permitida.' };
  }

  const validacaoTexto = validarFeedbackDirecao(params.feedback, 'ajuste');
  if (!validacaoTexto.valido) {
    return { ok: false, erro: validacaoTexto.erro || 'Escreva as considerações de ajuste.' };
  }

  const agora = params.agoraIso ?? new Date().toISOString();
  const prazoDias = params.prazoDias && params.prazoDias > 0 ? params.prazoDias : 2;
  const prazo = DateHelpers.adicionarDias(agora, prazoDias);
  const avaliacaoNormalizada = normalizarAvaliacao(params.avaliacao);

  const novoRegistro: HistoricoConsideracao = {
    id: gerarIdUnico('hist', alvo.historicoConsideracoes.map(h => h.id)),
    texto: validacaoTexto.textoNormalizado,
    tipo: 'ajuste',
    criadoEm: agora,
    lido: false,
    autorNome: usuario.nome,
    autorRole: 'diretor'
  };

  const atualizado: Planejamento = {
    ...alvo,
    status: 'ajustes_solicitados',
    revisadoEm: agora,
    atualizadoEm: agora,
    consideracoesDiretor: validacaoTexto.textoNormalizado,
    avaliacaoDiretor: avaliacaoNormalizada,
    prazoAjustes: prazo,
    historicoConsideracoes: [...alvo.historicoConsideracoes, novoRegistro]
  };

  const notificacao: Notificacao = {
    id: gerarIdUnico('notif', estado.notificacoes.map(n => n.id)),
    usuarioId: alvo.professorId,
    tipo: 'ajuste',
    titulo: 'Ajustes solicitados',
    mensagem: `Seu planejamento de ${DateHelpers.getNomeMes(alvo.mes)} (${alvo.quinzena}ª quinzena) recebeu solicitações de ajuste.`,
    planejamentoId: alvo.id,
    lida: false,
    criadaEm: agora
  };

  return {
    ok: true,
    dados: {
      planejamento: atualizado,
      estado: {
        ...estado,
        planejamentos: estado.planejamentos.map(p => (p.id === alvo.id ? atualizado : p)),
        notificacoes: [...estado.notificacoes, notificacao]
      }
    }
  };
}

/**
 * Registra um comentário da direção sem alterar o status do planejamento.
 */
export function adicionarComentarioDirecao(
  estado: AppState,
  usuario: Usuario | null,
  params: { planejamentoId: string; feedback: string; agoraIso?: string }
): ResultadoOperacao<{ estado: AppState; planejamento: Planejamento }> {
  const alvo = estado.planejamentos.find(p => p.id === params.planejamentoId);
  if (!alvo) {
    return { ok: false, erro: 'Planejamento não encontrado.' };
  }

  const permissao = podeComentarPlanejamento(alvo, usuario);
  if (!permissao.permitido || !usuario) {
    return { ok: false, erro: permissao.motivo || 'Comentário não permitido.' };
  }

  const validacaoTexto = validarFeedbackDirecao(params.feedback, 'comentario');
  if (!validacaoTexto.valido) {
    return { ok: false, erro: validacaoTexto.erro || 'Comentário inválido.' };
  }

  const agora = params.agoraIso ?? new Date().toISOString();
  const novoRegistro: HistoricoConsideracao = {
    id: gerarIdUnico('hist', alvo.historicoConsideracoes.map(h => h.id)),
    texto: validacaoTexto.textoNormalizado,
    tipo: 'comentario',
    criadoEm: agora,
    lido: false,
    autorNome: usuario.nome,
    autorRole: 'diretor'
  };

  const atualizado: Planejamento = {
    ...alvo,
    atualizadoEm: agora,
    historicoConsideracoes: [...alvo.historicoConsideracoes, novoRegistro]
  };

  const notificacao: Notificacao = {
    id: gerarIdUnico('notif', estado.notificacoes.map(n => n.id)),
    usuarioId: alvo.professorId,
    tipo: 'comentario',
    titulo: 'Novo comentário da direção',
    mensagem: `A direção registrou um comentário no planejamento de ${DateHelpers.getNomeMes(alvo.mes)} (${alvo.quinzena}ª quinzena).`,
    planejamentoId: alvo.id,
    lida: false,
    criadaEm: agora
  };

  return {
    ok: true,
    dados: {
      planejamento: atualizado,
      estado: {
        ...estado,
        planejamentos: estado.planejamentos.map(p => (p.id === alvo.id ? atualizado : p)),
        notificacoes: [...estado.notificacoes, notificacao]
      }
    }
  };
}

export interface RelatorioIntegridade {
  integro: boolean;
  problemas: string[];
}

/**
 * Verifica a consistência estrutural e referencial de todo o estado da aplicação.
 */
export function verificarIntegridadeEstado(estado: AppState): RelatorioIntegridade {
  const problemas: string[] = [];

  const idsUsuarios = new Set<string>();
  const idsProfessores = new Set<string>();
  for (const usuario of estado.usuarios) {
    if (idsUsuarios.has(usuario.id)) {
      problemas.push(`ID de usuário duplicado: ${usuario.id}`);
    }
    idsUsuarios.add(usuario.id);
    if (usuario.role === 'professor') {
      idsProfessores.add(usuario.id);
    }
  }

  if (estado.sessaoAtual && !idsUsuarios.has(estado.sessaoAtual.usuarioId)) {
    problemas.push(`Sessão aponta para usuário inexistente: ${estado.sessaoAtual.usuarioId}`);
  }

  const idsPlanejamentos = new Set<string>();
  const slotsQuinzenais = new Set<string>();

  for (const p of estado.planejamentos) {
    if (idsPlanejamentos.has(p.id)) {
      problemas.push(`ID de planejamento duplicado: ${p.id}`);
    }
    idsPlanejamentos.add(p.id);

    if (!idsProfessores.has(p.professorId)) {
      problemas.push(`Planejamento ${p.id} associado a professor inexistente: ${p.professorId}`);
    }

    if (!isStatusValido(p.status)) {
      problemas.push(`Planejamento ${p.id} possui status inválido: ${String(p.status)}`);
    }

    const chaveSlot = `${p.professorId}:${p.ano}:${p.mes}:${p.quinzena}`;
    if (slotsQuinzenais.has(chaveSlot)) {
      problemas.push(`Duplicidade de quinzena para o mesmo professor: ${chaveSlot}`);
    }
    slotsQuinzenais.add(chaveSlot);

    if (!DateHelpers.isPeriodoQuinzenaValido(p.ano, p.mes, p.quinzena, p.periodoInicio, p.periodoFim)) {
      problemas.push(`Período quinzenal inconsistente no planejamento ${p.id}`);
    }

    const idsHistorico = new Set<string>();
    for (const h of p.historicoConsideracoes) {
      if (idsHistorico.has(h.id)) {
        problemas.push(`ID de histórico duplicado no planejamento ${p.id}: ${h.id}`);
      }
      idsHistorico.add(h.id);
    }
  }

  const idsNotificacoes = new Set<string>();
  for (const n of estado.notificacoes) {
    if (idsNotificacoes.has(n.id)) {
      problemas.push(`ID de notificação duplicado: ${n.id}`);
    }
    idsNotificacoes.add(n.id);

    if (!idsUsuarios.has(n.usuarioId)) {
      problemas.push(`Notificação ${n.id} aponta para usuário inexistente: ${n.usuarioId}`);
    }
  }

  return {
    integro: problemas.length === 0,
    problemas
  };
}

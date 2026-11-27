import { Planejamento, StatusPlanejamento } from '../types';
import { Usuario } from '../models/auth/users.model';

// ============================================
// MÁQUINA DE ESTADOS DOS PLANEJAMENTOS
// ============================================

/**
 * Mapa explícito de transições válidas entre os 4 status reais do sistema.
 * - rascunho -> rascunho (editar rascunho) | aguardando_revisao (enviar)
 * - aguardando_revisao -> aprovado (direção aprova) | ajustes_solicitados (direção devolve)
 * - ajustes_solicitados -> ajustes_solicitados (professor salva correções em andamento)
 *                        | aguardando_revisao (professor reenvia para revisão)
 * - aprovado -> [] (estado final; somente comentários adicionais da direção sem alterar status)
 */
export const TRANSICOES_PERMITIDAS: Record<
  StatusPlanejamento,
  readonly StatusPlanejamento[]
> = {
  rascunho: ['rascunho', 'aguardando_revisao'],
  aguardando_revisao: ['aprovado', 'ajustes_solicitados'],
  ajustes_solicitados: ['ajustes_solicitados', 'aguardando_revisao'],
  aprovado: []
};

export const LABELS_STATUS: Record<StatusPlanejamento, string> = {
  rascunho: 'Rascunho',
  aguardando_revisao: 'Aguardando revisão',
  ajustes_solicitados: 'Ajustes solicitados',
  aprovado: 'Aprovado'
};

export const STATUS_VALIDOS: readonly StatusPlanejamento[] = [
  'rascunho',
  'aguardando_revisao',
  'ajustes_solicitados',
  'aprovado'
];

export interface ResultadoPermissao {
  permitido: boolean;
  motivo?: string;
}

export function isStatusValido(status: unknown): status is StatusPlanejamento {
  return typeof status === 'string' && (STATUS_VALIDOS as readonly string[]).includes(status);
}

export function podeTransicionarStatus(
  statusAtual: StatusPlanejamento,
  statusDestino: StatusPlanejamento
): boolean {
  return TRANSICOES_PERMITIDAS[statusAtual].includes(statusDestino);
}

export function podeEditarPlanejamento(
  planejamento: Pick<Planejamento, 'status' | 'professorId'>,
  usuario: Pick<Usuario, 'id' | 'role'> | null
): ResultadoPermissao {
  if (!usuario) {
    return { permitido: false, motivo: 'Selecione um perfil para editar planejamentos.' };
  }
  if (usuario.role !== 'professor') {
    return { permitido: false, motivo: 'Apenas o perfil de professor pode editar o conteúdo do planejamento.' };
  }
  if (planejamento.professorId !== usuario.id) {
    return { permitido: false, motivo: 'Este planejamento pertence a outro perfil de professor.' };
  }
  if (planejamento.status === 'aprovado') {
    return { permitido: false, motivo: 'Planejamentos aprovados não podem ser editados.' };
  }
  if (planejamento.status === 'aguardando_revisao') {
    return {
      permitido: false,
      motivo: 'Planejamentos aguardando revisão não podem ser editados até o retorno da direção.'
    };
  }
  return { permitido: true };
}

export function podeExcluirPlanejamento(
  planejamento: Pick<Planejamento, 'status' | 'professorId'>,
  usuario: Pick<Usuario, 'id' | 'role'> | null
): ResultadoPermissao {
  if (!usuario) {
    return { permitido: false, motivo: 'Selecione um perfil para excluir rascunhos.' };
  }
  if (usuario.role !== 'professor' || planejamento.professorId !== usuario.id) {
    return { permitido: false, motivo: 'Apenas o professor responsável pode excluir este rascunho.' };
  }
  if (planejamento.status !== 'rascunho') {
    return { permitido: false, motivo: 'Apenas planejamentos em rascunho podem ser excluídos.' };
  }
  return { permitido: true };
}

export function podeEnviarParaRevisao(
  planejamento: Pick<Planejamento, 'status' | 'professorId'> | undefined,
  usuario: Pick<Usuario, 'id' | 'role'> | null
): ResultadoPermissao {
  if (!usuario) {
    return { permitido: false, motivo: 'Selecione um perfil de professor para enviar.' };
  }
  if (usuario.role !== 'professor') {
    return { permitido: false, motivo: 'Apenas professores podem enviar planejamentos para revisão.' };
  }
  if (!planejamento) {
    return { permitido: true };
  }
  if (planejamento.professorId !== usuario.id) {
    return { permitido: false, motivo: 'Este planejamento pertence a outro perfil de professor.' };
  }
  if (!podeTransicionarStatus(planejamento.status, 'aguardando_revisao')) {
    if (planejamento.status === 'aguardando_revisao') {
      return { permitido: false, motivo: 'Este planejamento já foi enviado e aguarda revisão.' };
    }
    return { permitido: false, motivo: 'Planejamentos já aprovados não podem ser reenviados.' };
  }
  return { permitido: true };
}

export function podeRevisarPlanejamento(
  planejamento: Pick<Planejamento, 'status'>,
  usuario: Pick<Usuario, 'id' | 'role'> | null
): ResultadoPermissao {
  if (!usuario) {
    return { permitido: false, motivo: 'Selecione o perfil da direção para revisar.' };
  }
  if (usuario.role !== 'diretor') {
    return { permitido: false, motivo: 'Apenas o perfil da direção pode aprovar ou solicitar ajustes.' };
  }
  if (planejamento.status === 'rascunho') {
    return {
      permitido: false,
      motivo: 'Rascunhos ainda não foram enviados pelo professor e não podem ser revisados ou aprovados.'
    };
  }
  if (planejamento.status === 'aprovado') {
    return {
      permitido: false,
      motivo: 'Este planejamento já foi aprovado e não aceita novas decisões de status.'
    };
  }
  if (planejamento.status === 'ajustes_solicitados') {
    return {
      permitido: false,
      motivo: 'Aguardando correção e reenvio pelo professor antes de uma nova decisão.'
    };
  }
  return { permitido: true };
}

export function podeComentarPlanejamento(
  planejamento: Pick<Planejamento, 'status'>,
  usuario: Pick<Usuario, 'id' | 'role'> | null
): ResultadoPermissao {
  if (!usuario || usuario.role !== 'diretor') {
    return { permitido: false, motivo: 'Apenas a direção pode registrar considerações de revisão.' };
  }
  if (planejamento.status === 'rascunho') {
    return {
      permitido: false,
      motivo: 'Não é permitido comentar um rascunho antes do envio pelo professor.'
    };
  }
  return { permitido: true };
}

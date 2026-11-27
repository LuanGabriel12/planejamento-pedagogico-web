import {
  AppState,
  EnvelopePersistenciaV2,
  HistoricoConsideracao,
  Notificacao,
  Objetivo,
  Planejamento,
  ResultadoCarregamentoStorage,
  ResultadoGravacaoStorage,
  ResultadoRestauracaoStorage,
  TipoHistorico,
  TipoNotificacao
} from '../types';
import { Usuario } from '../models/auth/users.model';
import { ANO_PADRAO_DEMO, criarEstadoInicial, usuariosIniciais } from '../data/initialData';
import { DateHelpers } from '../utils/dateHelpers';
import { isStatusValido } from '../domain/stateMachine';

// ============================================
// PERSISTÊNCIA LOCAL (localStorage) — V2 COM COMPATIBILIDADE V1
// Atenção: localStorage NÃO é banco de dados seguro nem permanente.
// ============================================

export const STORAGE_KEY_V2 = 'demo_pedagogica_v2_state';
export const STORAGE_KEY_V1 = 'demo_pedagogica_v1_state';
export const BACKUP_PREFIX_V1 = 'demo_pedagogica_v1_backup_';
export const THEME_KEY_V2 = 'demo_pedagogica_v2_theme';
export const THEME_KEY_V1 = 'demo_pedagogica_v1_theme';
export const SCHEMA_VERSION_V2 = 2 as const;

const TIPOS_HISTORICO_VALIDOS: readonly TipoHistorico[] = [
  'aprovacao',
  'ajuste',
  'comentario',
  'envio',
  'reenvio'
];

const TIPOS_NOTIFICACAO_VALIDOS: readonly TipoNotificacao[] = [
  'aprovacao',
  'ajuste',
  'comentario',
  'lembrete',
  'envio'
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizarListaString(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

function sanitizarObjetivos(value: unknown): Objetivo[] {
  if (!Array.isArray(value)) return [];
  const idsVistos = new Set<string>();
  const resultado: Objetivo[] = [];

  value.forEach((item, index) => {
    if (!isObject(item) || typeof item.texto !== 'string') return;
    const texto = item.texto.trim();
    if (!texto) return;
    let id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `obj_mig_${index}`;
    while (idsVistos.has(id)) {
      id = `${id}_${index}`;
    }
    idsVistos.add(id);
    resultado.push({
      id,
      texto,
      atingido: Boolean(item.atingido)
    });
  });

  return resultado;
}

function sanitizarHistorico(value: unknown): HistoricoConsideracao[] {
  if (!Array.isArray(value)) return [];
  const idsVistos = new Set<string>();
  const resultado: HistoricoConsideracao[] = [];

  value.forEach((item, index) => {
    if (!isObject(item) || typeof item.texto !== 'string') return;
    const texto = item.texto.trim();
    if (!texto) return;

    const tipoBruto = item.tipo;
    const tipo: TipoHistorico =
      typeof tipoBruto === 'string' && (TIPOS_HISTORICO_VALIDOS as readonly string[]).includes(tipoBruto)
        ? (tipoBruto as TipoHistorico)
        : 'comentario';

    let id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `hist_mig_${index}`;
    while (idsVistos.has(id)) {
      id = `${id}_${index}`;
    }
    idsVistos.add(id);

    const criadoEm =
      typeof item.criadoEm === 'string' && DateHelpers.isDataValida(item.criadoEm)
        ? item.criadoEm
        : new Date().toISOString();

    const autorRole =
      item.autorRole === 'professor' || item.autorRole === 'diretor' ? item.autorRole : undefined;

    resultado.push({
      id,
      texto,
      tipo,
      criadoEm,
      lido: Boolean(item.lido),
      autorNome: typeof item.autorNome === 'string' ? item.autorNome.trim() || undefined : undefined,
      autorRole
    });
  });

  return resultado;
}

function sanitizarUsuarios(value: unknown, warnings: string[]): Usuario[] {
  if (!Array.isArray(value)) {
    warnings.push('Lista de perfis ausente nos dados salvos; perfis fictícios padrão foram restaurados.');
    return usuariosIniciais.map(u => ({ ...u }));
  }

  const idsVistos = new Set<string>();
  const validos: Usuario[] = [];

  for (const item of value) {
    if (!isObject(item)) continue;
    if (
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      typeof item.nome !== 'string' ||
      !item.nome.trim() ||
      (item.role !== 'professor' && item.role !== 'diretor')
    ) {
      continue;
    }

    const id = item.id.trim();
    if (idsVistos.has(id)) continue;
    idsVistos.add(id);

    validos.push({
      id,
      nome: item.nome.trim(),
      role: item.role,
      email: typeof item.email === 'string' ? item.email.trim() : `${id}@example.invalid`,
      avatar: typeof item.avatar === 'string' && item.avatar.trim() ? item.avatar.trim() : 'US',
      disciplinas: Array.isArray(item.disciplinas) ? sanitizarListaString(item.disciplinas) : undefined,
      turmas: Array.isArray(item.turmas) ? sanitizarListaString(item.turmas) : undefined
    });
  }

  // Garante que os perfis base fictícios existam para não quebrar a demonstração
  for (const base of usuariosIniciais) {
    if (!idsVistos.has(base.id)) {
      validos.push({ ...base });
      idsVistos.add(base.id);
    }
  }

  return validos;
}

function sanitizarPlanejamentos(
  value: unknown,
  idsProfessoresValidos: Set<string>,
  warnings: string[]
): Planejamento[] {
  if (!Array.isArray(value)) {
    throw new Error('Campo "planejamentos" inválido ou ausente.');
  }

  const idsVistos = new Set<string>();
  const slotsVistos = new Set<string>();
  const resultado: Planejamento[] = [];

  value.forEach((item, index) => {
    if (!isObject(item)) {
      warnings.push(`Registro de planejamento #${index + 1} ignorado por formato inválido.`);
      return;
    }

    const id = typeof item.id === 'string' ? item.id.trim() : '';
    const professorId = typeof item.professorId === 'string' ? item.professorId.trim() : '';
    const ano = Number(item.ano);
    const mes = Number(item.mes);
    const quinzena = Number(item.quinzena);

    if (!id || idsVistos.has(id)) {
      warnings.push(`Planejamento #${index + 1} ignorado por ID ausente ou duplicado.`);
      return;
    }

    if (!professorId || !idsProfessoresValidos.has(professorId)) {
      warnings.push(`Planejamento "${id}" ignorado por referenciar professor inexistente.`);
      return;
    }

    if (
      !Number.isInteger(ano) ||
      ano < 2020 ||
      ano > 2035 ||
      !Number.isInteger(mes) ||
      mes < 1 ||
      mes > 12 ||
      (quinzena !== 1 && quinzena !== 2)
    ) {
      warnings.push(`Planejamento "${id}" ignorado por ano/mês/quinzena inválidos.`);
      return;
    }

    if (!isStatusValido(item.status)) {
      warnings.push(`Planejamento "${id}" ignorado por status inválido.`);
      return;
    }

    const chaveSlot = `${professorId}:${ano}:${mes}:${quinzena}`;
    if (slotsVistos.has(chaveSlot)) {
      warnings.push(`Planejamento "${id}" ignorado por duplicidade na mesma quinzena (${chaveSlot}).`);
      return;
    }

    const periodoCalculado = DateHelpers.calcularPeriodo(ano, mes, quinzena);
    const parPeriodoValido =
      typeof item.periodoInicio === 'string' &&
      typeof item.periodoFim === 'string' &&
      DateHelpers.isPeriodoQuinzenaValido(
        ano,
        mes,
        quinzena,
        item.periodoInicio,
        item.periodoFim
      );
    const periodoInicio = parPeriodoValido
      ? (item.periodoInicio as string)
      : periodoCalculado.periodoInicio;
    const periodoFim = parPeriodoValido
      ? (item.periodoFim as string)
      : periodoCalculado.periodoFim;

    const criadoEm =
      typeof item.criadoEm === 'string' && DateHelpers.isDataValida(item.criadoEm)
        ? item.criadoEm
        : new Date().toISOString();
    const atualizadoEm =
      typeof item.atualizadoEm === 'string' && DateHelpers.isDataValida(item.atualizadoEm)
        ? item.atualizadoEm
        : criadoEm;
    const enviadoEm =
      typeof item.enviadoEm === 'string' && DateHelpers.isDataValida(item.enviadoEm)
        ? item.enviadoEm
        : undefined;
    const reenviadoEm =
      typeof item.reenviadoEm === 'string' && DateHelpers.isDataValida(item.reenviadoEm)
        ? item.reenviadoEm
        : undefined;
    const revisadoEm =
      typeof item.revisadoEm === 'string' && DateHelpers.isDataValida(item.revisadoEm)
        ? item.revisadoEm
        : undefined;
    const prazoAjustes =
      typeof item.prazoAjustes === 'string' && DateHelpers.isDataValida(item.prazoAjustes)
        ? item.prazoAjustes
        : undefined;

    const avaliacao =
      typeof item.avaliacaoDiretor === 'number' &&
      Number.isInteger(item.avaliacaoDiretor) &&
      item.avaliacaoDiretor >= 1 &&
      item.avaliacaoDiretor <= 5
        ? item.avaliacaoDiretor
        : undefined;

    const versao =
      typeof item.versao === 'number' && Number.isInteger(item.versao) && item.versao >= 1
        ? item.versao
        : 1;

    idsVistos.add(id);
    slotsVistos.add(chaveSlot);

    resultado.push({
      id,
      professorId,
      ano,
      mes,
      quinzena,
      periodoInicio,
      periodoFim,
      titulo: typeof item.titulo === 'string' ? item.titulo : '',
      disciplinas: sanitizarListaString(item.disciplinas),
      turmas: sanitizarListaString(item.turmas),
      experienciaAprendizagem:
        typeof item.experienciaAprendizagem === 'string' ? item.experienciaAprendizagem : '',
      objetivos: sanitizarObjetivos(item.objetivos),
      recursosNecessarios: sanitizarListaString(item.recursosNecessarios),
      metodologiaAvaliacao:
        typeof item.metodologiaAvaliacao === 'string' ? item.metodologiaAvaliacao : '',
      instrumentosAvaliacao: sanitizarListaString(item.instrumentosAvaliacao),
      conclusao: typeof item.conclusao === 'string' ? item.conclusao : '',
      referencias: sanitizarListaString(item.referencias),
      observacoes:
        typeof item.observacoes === 'string' && item.observacoes.trim()
          ? item.observacoes.trim()
          : undefined,
      status: item.status,
      criadoEm,
      atualizadoEm,
      enviadoEm,
      reenviadoEm,
      revisadoEm,
      consideracoesDiretor:
        typeof item.consideracoesDiretor === 'string' && item.consideracoesDiretor.trim()
          ? item.consideracoesDiretor.trim()
          : undefined,
      avaliacaoDiretor: avaliacao,
      prazoAjustes: item.status === 'ajustes_solicitados' ? prazoAjustes : undefined,
      historicoConsideracoes: sanitizarHistorico(item.historicoConsideracoes),
      versao
    });
  });

  return resultado;
}

function sanitizarNotificacoes(
  value: unknown,
  idsUsuariosValidos: Set<string>,
  idsPlanejamentosValidos: Set<string>
): Notificacao[] {
  if (!Array.isArray(value)) return [];

  const idsVistos = new Set<string>();
  const resultado: Notificacao[] = [];

  value.forEach((item, index) => {
    if (!isObject(item)) return;
    const usuarioId = typeof item.usuarioId === 'string' ? item.usuarioId.trim() : '';
    if (!usuarioId || !idsUsuariosValidos.has(usuarioId)) return;

    const titulo = typeof item.titulo === 'string' ? item.titulo.trim() : '';
    const mensagem = typeof item.mensagem === 'string' ? item.mensagem.trim() : '';
    if (!titulo || !mensagem) return;

    let id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `notif_mig_${index}`;
    while (idsVistos.has(id)) {
      id = `${id}_${index}`;
    }
    idsVistos.add(id);

    const tipoBruto = item.tipo;
    const tipo: TipoNotificacao =
      typeof tipoBruto === 'string' && (TIPOS_NOTIFICACAO_VALIDOS as readonly string[]).includes(tipoBruto)
        ? (tipoBruto as TipoNotificacao)
        : 'comentario';

    const planejamentoId =
      typeof item.planejamentoId === 'string' && idsPlanejamentosValidos.has(item.planejamentoId)
        ? item.planejamentoId
        : undefined;

    const criadaEm =
      typeof item.criadaEm === 'string' && DateHelpers.isDataValida(item.criadaEm)
        ? item.criadaEm
        : new Date().toISOString();

    resultado.push({
      id,
      usuarioId,
      tipo,
      titulo,
      mensagem,
      planejamentoId,
      lida: Boolean(item.lida),
      criadaEm
    });
  });

  return resultado;
}

/**
 * Valida e normaliza um objeto de estado bruto (seja V1 ou V2).
 * Lança erro se o formato raiz for estruturalmente corrompido.
 */
export function normalizarEstadoBruto(raw: unknown): { state: AppState; warnings: string[] } {
  if (!isObject(raw)) {
    throw new Error('Estrutura raiz de dados inválida.');
  }

  const warnings: string[] = [];
  const usuarios = sanitizarUsuarios(raw.usuarios, warnings);
  const idsUsuarios = new Set(usuarios.map(u => u.id));
  const idsProfessores = new Set(usuarios.filter(u => u.role === 'professor').map(u => u.id));

  const planejamentos = sanitizarPlanejamentos(raw.planejamentos, idsProfessores, warnings);
  const idsPlanejamentos = new Set(planejamentos.map(p => p.id));
  const notificacoes = sanitizarNotificacoes(raw.notificacoes, idsUsuarios, idsPlanejamentos);

  let sessaoAtual: AppState['sessaoAtual'] = null;
  if (isObject(raw.sessaoAtual) && typeof raw.sessaoAtual.usuarioId === 'string') {
    if (idsUsuarios.has(raw.sessaoAtual.usuarioId)) {
      sessaoAtual = {
        usuarioId: raw.sessaoAtual.usuarioId,
        loginEm:
          typeof raw.sessaoAtual.loginEm === 'string' &&
          DateHelpers.isDataValida(raw.sessaoAtual.loginEm)
            ? raw.sessaoAtual.loginEm
            : new Date().toISOString()
      };
    } else {
      warnings.push('Sessão anterior referenciava perfil inexistente e foi encerrada.');
    }
  }

  let anoAtual = ANO_PADRAO_DEMO;
  let temaEscuro = false;
  if (isObject(raw.configuracoes)) {
    const anoBruto = Number(raw.configuracoes.anoAtual);
    if (Number.isInteger(anoBruto) && anoBruto >= 2020 && anoBruto <= 2035) {
      anoAtual = anoBruto;
    }
    temaEscuro = Boolean(raw.configuracoes.temaEscuro);
  }

  return {
    state: {
      usuarios,
      planejamentos,
      notificacoes,
      sessaoAtual,
      configuracoes: {
        anoAtual,
        temaEscuro
      }
    },
    warnings
  };
}

/**
 * Migra dados salvos na V1 (`demo_pedagogica_v1_state`) para o formato V2,
 * preservando planejamentos, notificações, sessão e configurações válidas.
 */
export function migrarEstadoV1ParaV2(rawV1: unknown): { state: AppState; warnings: string[] } {
  const normalizado = normalizarEstadoBruto(rawV1);
  return {
    state: normalizado.state,
    warnings: [
      'Dados compatíveis da V1 foram migrados automaticamente para o formato V2.',
      ...normalizado.warnings
    ]
  };
}

function obterStorage(customStorage?: Storage): Storage {
  if (customStorage) return customStorage;
  return window.localStorage;
}

export function carregarEstadoStorage(customStorage?: Storage): ResultadoCarregamentoStorage {
  let storage: Storage;
  try {
    storage = obterStorage(customStorage);
  } catch {
    return {
      status: 'storage_unavailable',
      state: criarEstadoInicial(),
      message: 'O armazenamento local (localStorage) não está disponível neste navegador.',
      warnings: []
    };
  }

  let rawV2: string | null = null;
  let rawV1: string | null = null;

  try {
    rawV2 = storage.getItem(STORAGE_KEY_V2);
    if (!rawV2) {
      rawV1 = storage.getItem(STORAGE_KEY_V1);
    }
  } catch {
    return {
      status: 'storage_unavailable',
      state: criarEstadoInicial(),
      message: 'Não foi possível ler o armazenamento local devido a restrições do navegador.',
      warnings: []
    };
  }

  // 1. Tenta carregar formato V2
  if (rawV2 !== null) {
    try {
      const parsed: unknown = JSON.parse(rawV2);
      if (!isObject(parsed) || parsed.schemaVersion !== SCHEMA_VERSION_V2 || !isObject(parsed.data)) {
        throw new Error('Envelope de versão V2 inválido ou incompleto.');
      }
      const { state, warnings } = normalizarEstadoBruto(parsed.data);
      return {
        status: 'ok',
        state,
        rawKey: STORAGE_KEY_V2,
        warnings
      };
    } catch (error) {
      return {
        status: 'corrupted',
        state: criarEstadoInicial(),
        rawKey: STORAGE_KEY_V2,
        rawCorruptedValue: rawV2,
        message:
          error instanceof Error
            ? `Os dados salvos na chave "${STORAGE_KEY_V2}" estão corrompidos (${error.message}). O registro original foi preservado sem sobrescrita automática.`
            : `Os dados salvos na chave "${STORAGE_KEY_V2}" estão corrompidos.`,
        warnings: []
      };
    }
  }

  // 2. Compatibilidade: migra V1 se existir
  if (rawV1 !== null) {
    try {
      const parsedV1: unknown = JSON.parse(rawV1);
      const { state, warnings } = migrarEstadoV1ParaV2(parsedV1);
      return {
        status: 'migrated_v1',
        state,
        rawKey: STORAGE_KEY_V1,
        message: 'Dados anteriores da V1 foram importados para a V2 preservando os registros válidos.',
        warnings
      };
    } catch (error) {
      return {
        status: 'corrupted',
        state: criarEstadoInicial(),
        rawKey: STORAGE_KEY_V1,
        rawCorruptedValue: rawV1,
        message:
          error instanceof Error
            ? `Os dados legados da V1 em "${STORAGE_KEY_V1}" contêm JSON inválido (${error.message}). Nenhum dado foi sobrescrito automaticamente.`
            : `Os dados legados da V1 em "${STORAGE_KEY_V1}" estão corrompidos.`,
        warnings: []
      };
    }
  }

  // 3. Primeiro acesso limpo
  return {
    status: 'empty',
    state: criarEstadoInicial(),
    warnings: []
  };
}

function classificarErroGravacao(error: unknown): {
  reason: 'quota_exceeded' | 'unavailable' | 'unknown';
  message: string;
} {
  if (error instanceof DOMException || (isObject(error) && typeof error.name === 'string')) {
    const name = String((error as { name: string }).name);
    if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return {
        reason: 'quota_exceeded',
        message:
          'Espaço insuficiente no armazenamento local (localStorage). Exporte os dados em JSON ou remova rascunhos antigos.'
      };
    }
    if (name === 'SecurityError') {
      return {
        reason: 'unavailable',
        message: 'O navegador bloqueou a gravação no armazenamento local (localStorage).'
      };
    }
  }
  return {
    reason: 'unknown',
    message: 'Não foi possível salvar os dados no navegador. Suas alterações não foram gravadas.'
  };
}

export function salvarEstadoStorage(
  estado: AppState,
  customStorage?: Storage
): ResultadoGravacaoStorage {
  try {
    const storage = obterStorage(customStorage);
    const envelope: EnvelopePersistenciaV2 = {
      schemaVersion: SCHEMA_VERSION_V2,
      savedAt: new Date().toISOString(),
      data: estado
    };
    const serialized = JSON.stringify(envelope);
    storage.setItem(STORAGE_KEY_V2, serialized);
    return { ok: true };
  } catch (error) {
    const detalhes = classificarErroGravacao(error);
    return {
      ok: false,
      reason: detalhes.reason,
      message: detalhes.message
    };
  }
}

export function carregarTemaStorage(customStorage?: Storage): 'light' | 'dark' {
  try {
    const storage = obterStorage(customStorage);
    const v2 = storage.getItem(THEME_KEY_V2);
    if (v2 === 'light' || v2 === 'dark') return v2;

    const v1 = storage.getItem(THEME_KEY_V1);
    if (v1 === 'light' || v1 === 'dark') return v1;
  } catch {
    // Fallback silencioso para tema claro se storage estiver indisponível
  }
  return 'light';
}

export function salvarTemaStorage(
  tema: 'light' | 'dark',
  customStorage?: Storage
): ResultadoGravacaoStorage {
  try {
    const storage = obterStorage(customStorage);
    storage.setItem(THEME_KEY_V2, tema);
    return { ok: true };
  } catch (error) {
    const detalhes = classificarErroGravacao(error);
    return { ok: false, reason: detalhes.reason, message: detalhes.message };
  }
}

/**
 * Remove somente chaves legadas da V1 (estado V1 e backups diários V1),
 * sem tocar na chave ativa V2.
 */
export function limparChavesLegadasV1Storage(
  customStorage?: Storage
): ResultadoGravacaoStorage {
  try {
    const storage = obterStorage(customStorage);
    storage.removeItem(STORAGE_KEY_V1);

    const chavesParaRemover: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX_V1)) {
        chavesParaRemover.push(key);
      }
    }
    chavesParaRemover.forEach(k => storage.removeItem(k));
    return { ok: true };
  } catch (error) {
    const detalhes = classificarErroGravacao(error);
    return { ok: false, reason: detalhes.reason, message: detalhes.message };
  }
}

/**
 * Restauração não destrutiva:
 * 1. Grava e confirma o novo envelope V2 ANTES de remover chaves legadas da V1.
 *    Se a gravação falhar, preserva integralmente os registros existentes (V1 e V2).
 * 2. Se a gravação V2 tiver sucesso mas a limpeza posterior das chaves legadas falhar,
 *    retorna sucesso com ressalva explícita (sem simular atomicidade entre operações).
 */
export function restaurarEstadoDemonstrativoStorage(
  estadoDemonstrativo: AppState,
  customStorage?: Storage
): ResultadoRestauracaoStorage {
  const gravacao = salvarEstadoStorage(estadoDemonstrativo, customStorage);
  if (!gravacao.ok) {
    return {
      ok: false,
      reason: gravacao.reason,
      message: `${gravacao.message} Os dados anteriores foram preservados.`
    };
  }

  const limpezaLegada = limparChavesLegadasV1Storage(customStorage);
  if (!limpezaLegada.ok) {
    return {
      ok: true,
      cleanupWarning:
        'Os dados demonstrativos V2 foram gravados com sucesso, mas não foi possível remover todas as chaves legadas da V1 neste navegador.'
    };
  }

  return { ok: true };
}

export function limparDadosDemoStorage(customStorage?: Storage): ResultadoGravacaoStorage {
  try {
    const storage = obterStorage(customStorage);
    storage.removeItem(STORAGE_KEY_V2);
    return limparChavesLegadasV1Storage(storage);
  } catch (error) {
    const detalhes = classificarErroGravacao(error);
    return { ok: false, reason: detalhes.reason, message: detalhes.message };
  }
}

export function exportarDadosJson(estado: AppState): void {
  const envelope: EnvelopePersistenciaV2 = {
    schemaVersion: SCHEMA_VERSION_V2,
    savedAt: new Date().toISOString(),
    data: estado
  };
  const dataStr = JSON.stringify(envelope, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `planejamentos_demo_v2_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

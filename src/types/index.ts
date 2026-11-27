import { Usuario } from '../models/auth/users.model';

// ============================================
// TIPOS DE DOMÍNIO DO SISTEMA (V2)
// ============================================

export type StatusPlanejamento =
  | 'rascunho'
  | 'aguardando_revisao'
  | 'aprovado'
  | 'ajustes_solicitados';

export type TipoHistorico =
  | 'aprovacao'
  | 'ajuste'
  | 'comentario'
  | 'envio'
  | 'reenvio';

export interface Objetivo {
  id: string;
  texto: string;
  atingido: boolean;
}

export interface HistoricoConsideracao {
  id: string;
  texto: string;
  tipo: TipoHistorico;
  criadoEm: string;
  lido: boolean;
  autorNome?: string;
  autorRole?: 'professor' | 'diretor';
}

export interface Planejamento {
  id: string;
  professorId: string;

  // Período quinzenal
  ano: number;
  mes: number; // 1-12
  quinzena: 1 | 2;
  periodoInicio: string; // YYYY-MM-DD
  periodoFim: string; // YYYY-MM-DD

  // Conteúdo pedagógico
  titulo: string;
  disciplinas: string[];
  turmas: string[];
  experienciaAprendizagem: string;
  objetivos: Objetivo[];
  recursosNecessarios: string[];
  metodologiaAvaliacao: string;
  instrumentosAvaliacao: string[];
  conclusao: string;
  referencias: string[];
  observacoes?: string;

  // Ciclo de vida e datas ISO
  status: StatusPlanejamento;
  criadoEm: string;
  atualizadoEm: string;
  enviadoEm?: string;
  reenviadoEm?: string;
  revisadoEm?: string;

  // Feedback da direção
  consideracoesDiretor?: string;
  avaliacaoDiretor?: number; // 1-5
  prazoAjustes?: string;
  historicoConsideracoes: HistoricoConsideracao[];

  versao: number;
}

export interface PlanejamentoFormularioInput {
  titulo: string;
  disciplinas: string[];
  turmas: string[];
  experienciaAprendizagem: string;
  objetivos: Objetivo[];
  recursosNecessarios: string[];
  metodologiaAvaliacao: string;
  instrumentosAvaliacao: string[];
  conclusao: string;
  referencias: string[];
  observacoes: string;
}

export type TipoNotificacao =
  | 'aprovacao'
  | 'ajuste'
  | 'comentario'
  | 'lembrete'
  | 'envio';

export interface Notificacao {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  planejamentoId?: string;
  lida: boolean;
  criadaEm: string;
}

export interface Sessao {
  usuarioId: string;
  loginEm: string;
}

export interface Configuracoes {
  anoAtual: number;
  temaEscuro: boolean;
}

export interface AppState {
  usuarios: Usuario[];
  planejamentos: Planejamento[];
  notificacoes: Notificacao[];
  sessaoAtual: Sessao | null;
  configuracoes: Configuracoes;
}

export type CampoValidacao =
  | 'geral'
  | 'periodo'
  | 'professorId'
  | 'titulo'
  | 'disciplinas'
  | 'turmas'
  | 'experienciaAprendizagem'
  | 'objetivos'
  | 'recursosNecessarios'
  | 'metodologiaAvaliacao'
  | 'conclusao'
  | 'referencias'
  | 'observacoes';

export type MapaErrosValidacao = Partial<Record<CampoValidacao, string>>;

export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
  errosPorCampo: MapaErrosValidacao;
}

export type ResultadoOperacao<T = void> =
  | {
      ok: true;
      dados: T;
    }
  | {
      ok: false;
      erro: string;
      errosPorCampo?: MapaErrosValidacao;
    };

export type StatusPersistencia =
  | 'ok'
  | 'empty'
  | 'migrated_v1'
  | 'corrupted'
  | 'storage_unavailable';

export interface EnvelopePersistenciaV2 {
  schemaVersion: 2;
  savedAt: string;
  data: AppState;
}

export interface ResultadoCarregamentoStorage {
  status: StatusPersistencia;
  state: AppState;
  rawKey?: string;
  rawCorruptedValue?: string;
  message?: string;
  warnings: string[];
}

export type MotivoErroGravacao =
  | 'quota_exceeded'
  | 'unavailable'
  | 'read_failure_lock'
  | 'unknown';

export type ResultadoGravacaoStorage =
  | { ok: true }
  | {
      ok: false;
      reason: MotivoErroGravacao;
      message: string;
    };

export type ResultadoRestauracaoStorage =
  | {
      ok: true;
      cleanupWarning?: string;
    }
  | {
      ok: false;
      reason: MotivoErroGravacao;
      message: string;
    };

export type FiltroStatusDirecao = 'todos' | StatusPlanejamento;

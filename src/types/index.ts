import { Usuario } from '../models/auth/users.model';

// ============================================
// TIPOS COMPLETOS DO SISTEMA
// ============================================

export interface Objetivo {
  id: string;
  texto: string;
  atingido: boolean;
}

export interface HistoricoConsideracao {
  id: string;
  texto: string;
  tipo: 'aprovacao' | 'ajuste' | 'comentario';
  criadoEm: string;
  lido: boolean;
}

export type StatusPlanejamento = 'rascunho' | 'aguardando_revisao' | 'aprovado' | 'ajustes_solicitados';

export interface Planejamento {
  id: string;
  professorId: string;
  
  // Período (QUINZENAL!)
  ano: number;
  mes: number; // 1-12
  quinzena: 1 | 2;
  periodoInicio: string; // ISO date
  periodoFim: string;
  
  // Dados do Planejamento
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
  observacoes?: string; // Observações de demonstração, sem garantia de privacidade
  
  // Status e Datas
  status: StatusPlanejamento;
  criadoEm: string;
  atualizadoEm: string;
  enviadoEm?: string;
  revisadoEm?: string;
  
  // Feedback do Diretor
  consideracoesDiretor?: string;
  avaliacaoDiretor?: number; // 1-5 estrelas
  prazoAjustes?: string;
  historicoConsideracoes: HistoricoConsideracao[];
  
  versao: number;
}

export type TipoNotificacao = 'aprovacao' | 'ajuste' | 'comentario' | 'lembrete';

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

// Resultado de validação
export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
}

// ============================================
// DADOS INICIAIS DO SISTEMA
// ============================================

import { Planejamento, AppState } from '../types';
import { Usuario } from '../models/auth/users.model';
// import { DateHelpers } from '../utils/dateHelpers';

// Usuários pré-cadastrados
export const usuariosIniciais: Usuario[] = [
  {
    id: 'prof_001',
    nome: 'Professor Exemplo 1',
    role: 'professor',
    email: 'professor1@example.invalid',
    avatar: 'P1',
    disciplinas: ['Língua Portuguesa', 'Artes'],
    turmas: ['1º Ano A', '1º Ano B']
  },
  {
    id: 'prof_002',
    nome: 'Professor Exemplo 2',
    role: 'professor',
    email: 'professor2@example.invalid',
    avatar: 'P2',
    disciplinas: ['Matemática', 'Ciências'],
    turmas: ['2º Ano A']
  },
  {
    id: 'prof_003',
    nome: 'Professor Exemplo 3',
    role: 'professor',
    email: 'professor3@example.invalid',
    avatar: 'P3',
    disciplinas: ['História', 'Geografia'],
    turmas: ['3º Ano A', '3º Ano B']
  },
  {
    id: 'prof_004',
    nome: 'Professor Exemplo 4',
    role: 'professor',
    email: 'professor4@example.invalid',
    avatar: 'P4',
    disciplinas: ['Educação Física'],
    turmas: ['Todas as turmas']
  },
  {
    id: 'dir_001',
    nome: 'Direção Exemplo',
    role: 'diretor',
    email: 'direcao@example.invalid',
    avatar: 'DE'
  }
];

// Planejamento exemplo (aprovado)
export const planejamentoExemplo: Planejamento = {
  id: 'plan_001',
  professorId: 'prof_001',
  ano: 2026,
  mes: 1,
  quinzena: 1,
  periodoInicio: '2026-01-01',
  periodoFim: '2026-01-15',
  titulo: 'Alfabetização - Introdução às Vogais',
  disciplinas: ['Língua Portuguesa'],
  turmas: ['1º Ano A', '1º Ano B'],
  experienciaAprendizagem: 'Os alunos participarão de atividades lúdicas e práticas para reconhecer e identificar as vogais. Serão utilizadas músicas, jogos educativos, atividades de escrita e desenho. As aulas terão uma abordagem multissensorial, integrando elementos visuais, auditivos e cinestésicos para garantir a compreensão de todos os alunos, respeitando os diferentes ritmos de aprendizagem.',
  objetivos: [
    { id: 'obj_001', texto: 'Reconhecer e identificar as 5 vogais (A, E, I, O, U)', atingido: true },
    { id: 'obj_002', texto: 'Escrever as vogais de forma autônoma', atingido: true },
    { id: 'obj_003', texto: 'Associar os sons às letras correspondentes', atingido: true }
  ],
  recursosNecessarios: ['Quadro branco', 'Datashow', 'Material impresso', 'Canetinhas coloridas', 'Alfabeto móvel'],
  metodologiaAvaliacao: 'A avaliação será contínua e formativa, observando a participação dos alunos nas atividades práticas, a capacidade de reconhecer e escrever as vogais, e o progresso individual ao longo da quinzena.',
  instrumentosAvaliacao: ['Observação diária', 'Atividades práticas', 'Participação em sala'],
  conclusao: 'Ao final desta quinzena, espera-se que os alunos sejam capazes de reconhecer as cinco vogais, tanto em formato maiúsculo quanto minúsculo, e iniciem o processo de escrita autônoma dessas letras.',
  referencias: [
    'Referência didática fictícia A.',
    'Referência didática fictícia B.'
  ],
  status: 'aprovado',
  criadoEm: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  atualizadoEm: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  enviadoEm: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  revisadoEm: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  consideracoesDiretor: 'Excelente planejamento fictício! Os objetivos estão bem definidos e as atividades são adequadas. Continue com o ótimo trabalho!',
  avaliacaoDiretor: 5,
  historicoConsideracoes: [
    {
      id: 'hist_001',
      texto: 'Excelente planejamento! Aprovado.',
      tipo: 'aprovacao',
      criadoEm: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      lido: true
    }
  ],
  versao: 1
};

// Estado inicial da aplicação
export const estadoInicial: AppState = {
  usuarios: usuariosIniciais,
  planejamentos: [planejamentoExemplo],
  notificacoes: [],
  sessaoAtual: null,
  configuracoes: {
    anoAtual: 2026, // Ano atualizado para 2026
    temaEscuro: false
  }
};

// Listas de opções
export const disciplinasDisponiveis = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Artes',
  'Educação Física',
  'Inglês'
];

export const turmasDisponiveis = [
  '1º Ano A', '1º Ano B',
  '2º Ano A', '2º Ano B',
  '3º Ano A', '3º Ano B',
  '4º Ano A', '4º Ano B',
  '5º Ano A', '5º Ano B'
];

export const instrumentosAvaliacaoDisponiveis = [
  'Prova escrita',
  'Observação diária',
  'Atividades práticas',
  'Trabalho em grupo',
  'Autoavaliação',
  'Participação',
  'Apresentação oral',
  'Portfólio'
];

export const recursosDisponiveis = [
  'Quadro branco',
  'Datashow',
  'Computador',
  'Material impresso',
  'Cartolina',
  'Canetinhas',
  'Lápis de cor',
  'Tesoura',
  'Cola',
  'Alfabeto móvel',
  'Jogos educativos',
  'Livro didático'
];

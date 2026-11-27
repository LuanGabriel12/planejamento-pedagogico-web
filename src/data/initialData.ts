// ============================================
// DADOS DEMONSTRATIVOS FICTÍCIOS (V2)
// Nenhum dado pessoal, escolar ou real deve ser inserido aqui.
// ============================================

import { AppState, Planejamento } from '../types';
import { Usuario } from '../models/auth/users.model';

export const ANOS_DISPONIVEIS = [2024, 2025, 2026, 2027] as const;
export const ANO_PADRAO_DEMO = 2026;

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

export const planejamentoExemplo: Planejamento = {
  id: 'plan_001',
  professorId: 'prof_001',
  ano: 2026,
  mes: 1,
  quinzena: 1,
  periodoInicio: '2026-01-01',
  periodoFim: '2026-01-15',
  titulo: '[Exemplo] Alfabetização - Introdução às Vogais',
  disciplinas: ['Língua Portuguesa'],
  turmas: ['1º Ano A', '1º Ano B'],
  experienciaAprendizagem:
    'Registro fictício de demonstração. Os estudantes participarão de atividades lúdicas e práticas para reconhecer e identificar as vogais com músicas, jogos educativos, escrita orientada e desenho. A proposta combina estímulos visuais, auditivos e práticos para respeitar diferentes ritmos de aprendizagem ao longo da quinzena.',
  objetivos: [
    { id: 'obj_001', texto: 'Reconhecer e identificar as cinco vogais (A, E, I, O, U)', atingido: true },
    { id: 'obj_002', texto: 'Escrever as vogais de forma autônoma em palavras simples', atingido: true },
    { id: 'obj_003', texto: 'Associar sons iniciais às letras correspondentes em atividades coletivas', atingido: true }
  ],
  recursosNecessarios: ['Quadro branco', 'Material impresso', 'Canetinhas', 'Alfabeto móvel'],
  metodologiaAvaliacao:
    'Avaliação contínua e formativa por meio da observação da participação em sala, registros das atividades práticas e acompanhamento do progresso individual durante a quinzena.',
  instrumentosAvaliacao: ['Observação diária', 'Atividades práticas', 'Participação'],
  conclusao:
    'Ao final desta quinzena simulada, espera-se que a turma reconheça as cinco vogais em formatos maiúsculo e minúsculo e avance na escrita autônoma inicial.',
  referencias: [
    'Referência didática fictícia A — Guia Demonstrativo de Alfabetização.',
    'Referência didática fictícia B — Caderno Simulado de Práticas Pedagógicas.'
  ],
  status: 'aprovado',
  criadoEm: '2026-01-02T10:00:00.000Z',
  atualizadoEm: '2026-01-04T15:30:00.000Z',
  enviadoEm: '2026-01-03T11:20:00.000Z',
  revisadoEm: '2026-01-04T15:30:00.000Z',
  consideracoesDiretor:
    'Exemplo de aprovação simulada: objetivos claros, atividades coerentes com a faixa etária e critérios de acompanhamento bem descritos.',
  avaliacaoDiretor: 5,
  historicoConsideracoes: [
    {
      id: 'hist_001_env',
      texto: 'Planejamento fictício enviado para revisão.',
      tipo: 'envio',
      criadoEm: '2026-01-03T11:20:00.000Z',
      lido: true,
      autorNome: 'Professor Exemplo 1',
      autorRole: 'professor'
    },
    {
      id: 'hist_001',
      texto: 'Exemplo de aprovação simulada: objetivos claros e atividades adequadas.',
      tipo: 'aprovacao',
      criadoEm: '2026-01-04T15:30:00.000Z',
      lido: true,
      autorNome: 'Direção Exemplo',
      autorRole: 'diretor'
    }
  ],
  versao: 1
};

export const planejamentoPendenteExemplo: Planejamento = {
  id: 'plan_002',
  professorId: 'prof_002',
  ano: 2026,
  mes: 1,
  quinzena: 1,
  periodoInicio: '2026-01-01',
  periodoFim: '2026-01-15',
  titulo: '[Exemplo] Números Naturais e Contagem em Grupo',
  disciplinas: ['Matemática'],
  turmas: ['2º Ano A'],
  experienciaAprendizagem:
    'Registro fictício aguardando revisão no fluxo demonstrativo. Serão realizadas oficinas de agrupamento com materiais concretos, jogos de trilha numérica e resolução de pequenos desafios cotidianos envolvendo adição e subtração simples para consolidar o valor posicional.',
  objetivos: [
    { id: 'obj_004', texto: 'Agrupar e comparar quantidades até 100 usando material concreto', atingido: false },
    { id: 'obj_005', texto: 'Resolver problemas simples de adição e subtração em duplas', atingido: false }
  ],
  recursosNecessarios: ['Quadro branco', 'Jogos educativos', 'Material impresso'],
  metodologiaAvaliacao:
    'Acompanhamento processual nas estações de atividades em grupo, com registro das estratégias utilizadas pelas duplas na resolução dos problemas propostos.',
  instrumentosAvaliacao: ['Observação diária', 'Trabalho em grupo', 'Atividades práticas'],
  conclusao:
    'Espera-se que os alunos relacionem representação numérica e quantidade com maior segurança e expliquem oralmente seus raciocínios matemáticos.',
  referencias: [
    'Referência didática fictícia C — Caderno Simulado de Matemática nos Anos Iniciais.'
  ],
  status: 'aguardando_revisao',
  criadoEm: '2026-01-05T09:15:00.000Z',
  atualizadoEm: '2026-01-05T14:00:00.000Z',
  enviadoEm: '2026-01-05T14:00:00.000Z',
  historicoConsideracoes: [
    {
      id: 'hist_002_env',
      texto: 'Planejamento fictício enviado para revisão.',
      tipo: 'envio',
      criadoEm: '2026-01-05T14:00:00.000Z',
      lido: true,
      autorNome: 'Professor Exemplo 2',
      autorRole: 'professor'
    }
  ],
  versao: 1
};

export const planejamentoAjustesExemplo: Planejamento = {
  id: 'plan_003',
  professorId: 'prof_001',
  ano: 2026,
  mes: 2,
  quinzena: 1,
  periodoInicio: '2026-02-01',
  periodoFim: '2026-02-15',
  titulo: '[Exemplo] Leitura Compartilhada e Produção de Rimas',
  disciplinas: ['Língua Portuguesa', 'Artes'],
  turmas: ['1º Ano A'],
  experienciaAprendizagem:
    'Registro fictício devolvido para ajustes no fluxo demonstrativo. Rodas de leitura com parlendas e poemas curtos, identificação oral de palavras que rimam e produção coletiva de cartazes ilustrados para exposição em sala.',
  objetivos: [
    { id: 'obj_006', texto: 'Identificar sonoridades semelhantes e rimas em parlendas', atingido: false },
    { id: 'obj_007', texto: 'Produzir ilustrações coletivas relacionando imagem e texto curto', atingido: false }
  ],
  recursosNecessarios: ['Cartolina', 'Lápis de cor', 'Livro didático'],
  metodologiaAvaliacao:
    'Observação da participação nas rodas de leitura e registro da produção coletiva dos cartazes ao longo das duas semanas.',
  instrumentosAvaliacao: ['Observação diária', 'Participação'],
  conclusao:
    'Ao término da quinzena demonstrativa, busca-se ampliar o repertório oral e a familiaridade com textos rimados curtos.',
  referencias: [
    'Referência didática fictícia D — Antologia Simulada de Parlendas.'
  ],
  status: 'ajustes_solicitados',
  criadoEm: '2026-01-20T10:00:00.000Z',
  atualizadoEm: '2026-01-22T16:40:00.000Z',
  enviadoEm: '2026-01-21T11:00:00.000Z',
  revisadoEm: '2026-01-22T16:40:00.000Z',
  consideracoesDiretor:
    'Exemplo de solicitação de ajustes: detalhar como será acompanhada a participação individual dos estudantes durante a produção coletiva dos cartazes.',
  avaliacaoDiretor: 4,
  prazoAjustes: '2026-01-26T16:40:00.000Z',
  historicoConsideracoes: [
    {
      id: 'hist_003_env',
      texto: 'Planejamento fictício enviado para revisão.',
      tipo: 'envio',
      criadoEm: '2026-01-21T11:00:00.000Z',
      lido: true,
      autorNome: 'Professor Exemplo 1',
      autorRole: 'professor'
    },
    {
      id: 'hist_003_aj',
      texto:
        'Exemplo de solicitação de ajustes: detalhar como será acompanhada a participação individual dos estudantes durante a produção coletiva dos cartazes.',
      tipo: 'ajuste',
      criadoEm: '2026-01-22T16:40:00.000Z',
      lido: false,
      autorNome: 'Direção Exemplo',
      autorRole: 'diretor'
    }
  ],
  versao: 1
};

export const planejamentosDemonstrativos: Planejamento[] = [
  planejamentoExemplo,
  planejamentoPendenteExemplo,
  planejamentoAjustesExemplo
];

/**
 * Cria uma cópia limpa do estado demonstrativo inicial.
 * Evita mutação compartilhada entre testes ou reinicializações.
 */
export function criarEstadoInicial(): AppState {
  return {
    usuarios: usuariosIniciais.map(u => ({
      ...u,
      disciplinas: u.disciplinas ? [...u.disciplinas] : undefined,
      turmas: u.turmas ? [...u.turmas] : undefined
    })),
    planejamentos: planejamentosDemonstrativos.map(p => ({
      ...p,
      disciplinas: [...p.disciplinas],
      turmas: [...p.turmas],
      objetivos: p.objetivos.map(o => ({ ...o })),
      recursosNecessarios: [...p.recursosNecessarios],
      instrumentosAvaliacao: [...p.instrumentosAvaliacao],
      referencias: [...p.referencias],
      historicoConsideracoes: p.historicoConsideracoes.map(h => ({ ...h }))
    })),
    notificacoes: [
      {
        id: 'notif_demo_001',
        usuarioId: 'prof_001',
        tipo: 'ajuste',
        titulo: 'Ajustes solicitados (exemplo)',
        mensagem: 'O planejamento fictício de Fevereiro (1ª quinzena) recebeu uma solicitação de ajustes.',
        planejamentoId: 'plan_003',
        lida: false,
        criadaEm: '2026-01-22T16:40:00.000Z'
      },
      {
        id: 'notif_demo_002',
        usuarioId: 'dir_001',
        tipo: 'envio',
        titulo: 'Novo planejamento para revisão (exemplo)',
        mensagem: 'Professor Exemplo 2 enviou o planejamento fictício de Janeiro (1ª quinzena).',
        planejamentoId: 'plan_002',
        lida: false,
        criadaEm: '2026-01-05T14:00:00.000Z'
      }
    ],
    sessaoAtual: null,
    configuracoes: {
      anoAtual: ANO_PADRAO_DEMO,
      temaEscuro: false
    }
  };
}

export const estadoInicial: AppState = criarEstadoInicial();

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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEY_V1, STORAGE_KEY_V2, THEME_KEY_V2 } from './persistence/storage';
import { usuariosIniciais } from './data/initialData';

describe('App — testes de integração de fluxos essenciais', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('executa fluxo completo professor -> rascunho -> envio -> direção ajustes -> correção/reenvio -> aprovação -> recarga', async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = render(<App />);

    // 1. Entrar como Professor Exemplo 1
    const selectProf = screen.getByLabelText(/Selecione um professor fictício/i);
    await user.selectOptions(selectProf, 'prof_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Professor/i }));

    expect(screen.getByRole('heading', { name: /Calendário Pedagógico/i })).toBeInTheDocument();

    // 2. Criar planejamento na próxima quinzena livre (Janeiro - 2ª Quinzena)
    await user.click(screen.getByRole('button', { name: /Criar próximo planejamento/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Janeiro 2026 · 2ª Quinzena/i)).toBeInTheDocument();

    // Tentar enviar incompleto -> deve bloquear e mostrar erros
    await user.click(within(dialog).getByRole('button', { name: /Enviar para revisão/i }));
    expect(within(dialog).getByText(/Revise os pontos abaixo/i)).toBeInTheDocument();

    // Preencher título e salvar rascunho
    const inputTitulo = within(dialog).getByLabelText(/Título do planejamento/i);
    await user.type(inputTitulo, 'Sequência Fictícia de Leitura Silábica');
    await user.click(within(dialog).getByRole('button', { name: /Salvar rascunho/i }));
    expect(within(dialog).getByText(/Salvo às/i)).toBeInTheDocument();

    // Completar demais campos obrigatórios para envio
    await user.click(within(dialog).getByRole('button', { name: 'Língua Portuguesa' }));
    await user.click(within(dialog).getByRole('button', { name: '1º Ano A' }));

    await user.type(
      within(dialog).getByLabelText(/Experiência de aprendizagem/i),
      'Atividade fictícia de demonstração com jogos de sílabas, leitura compartilhada em duplas e cartazes coletivos elaborados ao longo da quinzena letiva.'
    );

    const inputObj = within(dialog).getByLabelText(/Objetivos de aprendizagem/i);
    await user.type(inputObj, 'Reconhecer sílabas iniciais em palavras conhecidas');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar objetivo/i }));
    await user.type(inputObj, 'Participar da leitura coletiva em sala');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar objetivo/i }));

    await user.type(
      within(dialog).getByLabelText(/Metodologia de avaliação/i),
      'Avaliação formativa contínua com observação das atividades práticas e registro de participação.'
    );

    await user.type(
      within(dialog).getByLabelText(/Conclusão e resultados esperados/i),
      'Ao final da quinzena fictícia, espera-se avanço no reconhecimento silábico e leitura inicial.'
    );

    const inputRef = within(dialog).getByLabelText(/Referências bibliográficas/i);
    await user.type(inputRef, 'Referência didática fictícia — Caderno de Leitura.');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar referência/i }));

    // Enviar para revisão
    await user.click(within(dialog).getByRole('button', { name: /Enviar para revisão/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Sequência Fictícia de Leitura Silábica')).toBeInTheDocument();

    // 3. Alternar para Direção Exemplo
    await user.click(screen.getByRole('button', { name: /Trocar de perfil simulado/i }));
    const selectDir = screen.getByLabelText(/Selecione um perfil da direção/i);
    await user.selectOptions(selectDir, 'dir_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Direção/i }));

    expect(screen.getByRole('heading', { name: /Painel da Direção/i })).toBeInTheDocument();

    // Buscar pelo título criado
    await user.type(screen.getByLabelText(/Buscar por título/i), 'Leitura Silábica');
    expect(screen.getByText('Sequência Fictícia de Leitura Silábica')).toBeInTheDocument();

    // Abrir revisão e solicitar ajustes
    await user.click(screen.getByRole('button', { name: /^Revisar$/i }));
    expect(screen.getByRole('heading', { name: /Revisão de Planejamento/i })).toBeInTheDocument();

    const campoFeedback = screen.getByLabelText(/Considerações da direção/i);
    await user.type(campoFeedback, 'Por favor, detalhar os instrumentos de acompanhamento individual.');
    await user.click(screen.getByRole('button', { name: /Solicitar ajustes/i }));

    const confirmDialog = screen.getByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: /Solicitar ajustes/i }));

    // 4. Retornar ao Professor Exemplo 1, corrigir e reenviar
    await user.click(screen.getByRole('button', { name: /Trocar de perfil simulado/i }));
    await user.selectOptions(screen.getByLabelText(/Selecione um professor fictício/i), 'prof_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Professor/i }));

    const cardTexto = screen.getByText('Sequência Fictícia de Leitura Silábica').closest('article')!;
    await user.click(within(cardTexto).getByRole('button', { name: /Corrigir/i }));

    const dialogCorrecao = screen.getByRole('dialog');
    expect(within(dialogCorrecao).getByText(/Ajustes solicitados pela direção/i)).toBeInTheDocument();
    await user.click(within(dialogCorrecao).getByRole('button', { name: /Reenviar para revisão/i }));

    // 5. Voltar à Direção e aprovar
    await user.click(screen.getByRole('button', { name: /Trocar de perfil simulado/i }));
    await user.selectOptions(screen.getByLabelText(/Selecione um perfil da direção/i), 'dir_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Direção/i }));

    await user.type(screen.getByLabelText(/Buscar por título/i), 'Leitura Silábica');
    await user.click(screen.getByRole('button', { name: /^Revisar$/i }));
    await user.type(
      screen.getByLabelText(/Considerações da direção/i),
      'Correções aplicadas com clareza. Aprovado.'
    );
    await user.click(screen.getByRole('button', { name: /Aprovar planejamento/i }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /Confirmar aprovação/i })
    );

    // 6. Simular recarregamento da página (unmount + render) e confirmar persistência
    unmount();
    render(<App />);

    expect(screen.getByRole('heading', { name: /Painel da Direção/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Buscar por título/i), 'Leitura Silábica');
    const cardAprovado = screen.getByText('Sequência Fictícia de Leitura Silábica').closest('div')!;
    expect(within(cardAprovado.parentElement!).getByText('Aprovado')).toBeInTheDocument();
  });

  it('protege dados corrompidos no localStorage sem sobrescrita automática e permite restauração consciente', async () => {
    const user = userEvent.setup();
    const valorCorrompido = '{json_corrompido_manualmente';
    window.localStorage.setItem(STORAGE_KEY_V2, valorCorrompido);

    render(<App />);

    // Banner de proteção aparece
    expect(
      screen.getByText(/Falha ao ler dados salvos no navegador \(modo proteção ativo\)/i)
    ).toBeInTheDocument();

    // Valor corrompido NÃO foi sobrescrito automaticamente
    expect(window.localStorage.getItem(STORAGE_KEY_V2)).toBe(valorCorrompido);

    // Usuário decide restaurar explicitamente
    await user.click(screen.getByRole('button', { name: /Restaurar dados demonstrativos/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Restaurar agora/i }));

    expect(
      screen.queryByText(/Falha ao ler dados salvos no navegador/i)
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY_V2)).not.toBe(valorCorrompido);
  });

  it('exibe estado vazio claro quando busca ou ano não possuem resultados', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/Selecione um perfil da direção/i), 'dir_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Direção/i }));

    await user.type(screen.getByLabelText(/Buscar por título/i), 'nenhum-titulo-assim');
    expect(screen.getByText(/Nenhum resultado encontrado/i)).toBeInTheDocument();

    const botoesLimpar = screen.getAllByRole('button', { name: /Limpar filtros/i });
    await user.click(botoesLimpar[botoesLimpar.length - 1]);
    expect(screen.getByText(/\[Exemplo\] Alfabetização/i)).toBeInTheDocument();

    // Alterar para ano sem registros (2024) e verificar estado vazio anual
    await user.click(screen.getByRole('button', { name: /Ano letivo selecionado: 2026/i }));
    await user.click(screen.getByRole('option', { name: '2024' }));
    expect(screen.getByText(/Nenhum planejamento registrado em 2024/i)).toBeInTheDocument();
  });

  it('não informa salvamento bem-sucedido quando localStorage falha ao gravar', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/Selecione um professor fictício/i), 'prof_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Professor/i }));

    await user.click(screen.getByRole('button', { name: /Criar próximo planejamento/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(
      within(dialog).getByLabelText(/Título do planejamento/i),
      'Rascunho que vai falhar no storage'
    );

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(within(dialog).getByRole('button', { name: /Salvar rascunho/i }));

    // Deve exibir alerta de falha de gravação e NÃO marcar como salvo
    expect(screen.getByText(/Erro ao gravar no armazenamento local/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Salvo às/i)).not.toBeInTheDocument();
  });

  it('alterna modo claro e escuro e persiste a escolha ao recarregar', async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = render(<App />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    await user.click(screen.getByRole('button', { name: /Alternar para tema escuro/i }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem(THEME_KEY_V2)).toBe('dark');

    unmount();
    render(<App />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('bloqueia decisões de aprovação ou ajustes quando a direção abre planejamento já aprovado ou rascunho', async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/Selecione um perfil da direção/i), 'dir_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Direção/i }));

    // Filtrar apenas aprovados e abrir o planejamento exemplo aprovado
    await user.selectOptions(screen.getByLabelText(/^Status$/i), 'aprovado');
    await user.click(screen.getByRole('button', { name: /Visualizar/i }));

    expect(
      screen.getByText(/Este planejamento já foi aprovado e não aceita novas decisões de status/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aprovar planejamento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Solicitar ajustes/i })).not.toBeInTheDocument();
  });

  it('migra dados válidos da chave V1 automaticamente sem apagar o registro legado', async () => {
    const estadoV1 = {
      usuarios: usuariosIniciais,
      planejamentos: [
        {
          id: 'plan_legado_v1',
          professorId: 'prof_001',
          ano: 2026,
          mes: 7,
          quinzena: 1,
          periodoInicio: '2026-07-01',
          periodoFim: '2026-07-15',
          titulo: 'Registro Migrado da V1',
          disciplinas: ['Artes'],
          turmas: ['1º Ano A'],
          experienciaAprendizagem: 'Texto migrado.',
          objetivos: [{ id: 'o1', texto: 'Objetivo migrado', atingido: false }],
          recursosNecessarios: [],
          metodologiaAvaliacao: 'Observação.',
          instrumentosAvaliacao: [],
          conclusao: 'Conclusão migrada.',
          referencias: ['Ref V1'],
          status: 'rascunho',
          criadoEm: '2026-07-01T10:00:00.000Z',
          atualizadoEm: '2026-07-01T10:00:00.000Z',
          historicoConsideracoes: [],
          versao: 1
        }
      ],
      notificacoes: [],
      sessaoAtual: { usuarioId: 'dir_001', loginEm: '2026-07-01T10:00:00.000Z' },
      configuracoes: { anoAtual: 2026, temaEscuro: false }
    };

    window.localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(estadoV1));

    render(<App />);

    expect(
      screen.getByText(/Dados anteriores da V1 foram importados para a V2/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Registro Migrado da V1')).toBeInTheDocument();
    // Chave V1 preservada e V2 gravada
    expect(window.localStorage.getItem(STORAGE_KEY_V1)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY_V2)).not.toBeNull();
  });

  it('bloqueia gravação destrutiva quando getItem falha inicialmente mesmo com setItem funcional, e permite recuperação segura', async () => {
    const user = userEvent.setup({ delay: null });

    // Dados reais preexistentes no navegador que não podem ser sobrescritos
    const estadoPreexistente = {
      schemaVersion: 2,
      savedAt: '2026-05-01T10:00:00.000Z',
      data: {
        usuarios: usuariosIniciais,
        planejamentos: [
          {
            id: 'plan_real_preservado',
            professorId: 'prof_001',
            ano: 2026,
            mes: 8,
            quinzena: 1,
            periodoInicio: '2026-08-01',
            periodoFim: '2026-08-15',
            titulo: 'Registro Existente Que Não Pode Ser Perdido',
            disciplinas: ['Língua Portuguesa'],
            turmas: ['1º Ano A'],
            experienciaAprendizagem: 'Texto preservado.',
            objetivos: [{ id: 'o1', texto: 'Obj preservado', atingido: false }],
            recursosNecessarios: [],
            metodologiaAvaliacao: 'Avaliação.',
            instrumentosAvaliacao: [],
            conclusao: 'Conclusão.',
            referencias: ['Ref'],
            status: 'rascunho',
            criadoEm: '2026-08-01T10:00:00.000Z',
            atualizadoEm: '2026-08-01T10:00:00.000Z',
            historicoConsideracoes: [],
            versao: 1
          }
        ],
        notificacoes: [],
        sessaoAtual: null,
        configuracoes: { anoAtual: 2026, temaEscuro: false }
      }
    };
    const jsonPreexistente = JSON.stringify(estadoPreexistente);
    window.localStorage.setItem(STORAGE_KEY_V2, jsonPreexistente);

    // Simula falha de leitura (getItem lança erro), mantendo setItem funcional
    const getItemOriginal = Storage.prototype.getItem;
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string
    ) {
      if (key === STORAGE_KEY_V2 || key === STORAGE_KEY_V1) {
        throw new DOMException('Read blocked temporarily', 'SecurityError');
      }
      return getItemOriginal.call(this, key);
    });

    render(<App />);

    // Modo proteção ativo para storage_unavailable
    expect(
      screen.getByText(/Falha ao acessar o armazenamento local \(modo proteção ativo\)/i)
    ).toBeInTheDocument();

    // Tentar navegar e salvar um rascunho NÃO pode gravar por cima de STORAGE_KEY_V2
    await user.selectOptions(screen.getByLabelText(/Selecione um professor fictício/i), 'prof_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Professor/i }));
    await user.click(screen.getByRole('button', { name: /Criar próximo planejamento/i }));

    const dialog = screen.getByRole('dialog');
    await user.type(
      within(dialog).getByLabelText(/Título do planejamento/i),
      'Tentativa bloqueada durante falha de leitura'
    );
    await user.click(within(dialog).getByRole('button', { name: /Salvar rascunho/i }));

    // Nenhuma chamada destrutiva para STORAGE_KEY_V2 ocorreu
    const gravacoesEmStateV2 = setItemSpy.mock.calls.filter(call => call[0] === STORAGE_KEY_V2);
    expect(gravacoesEmStateV2).toHaveLength(0);

    // Fechar formulário descartando o rascunho não salvo
    await user.click(within(dialog).getByRole('button', { name: /^Fechar$/i }));
    const confirmFechar = screen.getAllByRole('dialog');
    await user.click(
      within(confirmFechar[confirmFechar.length - 1]).getByRole('button', {
        name: /Descartar e fechar/i
      })
    );

    // Leitura volta a funcionar: usuário clica em "Tentar ler novamente" e recupera o dado real
    getItemSpy.mockRestore();
    expect(window.localStorage.getItem(STORAGE_KEY_V2)).toBe(jsonPreexistente);

    await user.click(screen.getByRole('button', { name: /Tentar ler novamente/i }));
    expect(
      screen.queryByText(/Falha ao acessar o armazenamento local/i)
    ).not.toBeInTheDocument();

    // Confirma que o registro original foi carregado integralmente sem sobrescrita
    await user.selectOptions(screen.getByLabelText(/Selecione um perfil da direção/i), 'dir_001');
    await user.click(screen.getByRole('button', { name: /Entrar como Direção/i }));
    expect(screen.getByText('Registro Existente Que Não Pode Ser Perdido')).toBeInTheDocument();
  });

  it('preserva dados existentes quando restaurarDadosDemonstrativos falha na gravação V2 e reporta ressalva se limpeza legada falhar', async () => {
    const user = userEvent.setup({ delay: null });
    const corrompido = '{corrompido_preservado';
    window.localStorage.setItem(STORAGE_KEY_V2, corrompido);
    window.localStorage.setItem(STORAGE_KEY_V1, '{"legado":true}');

    render(<App />);

    // 1. Falha em setItem durante restauração -> preserva V1 e V2 intactos
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await user.click(screen.getByRole('button', { name: /Restaurar dados demonstrativos/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Restaurar agora/i }));

    expect(window.localStorage.getItem(STORAGE_KEY_V2)).toBe(corrompido);
    expect(window.localStorage.getItem(STORAGE_KEY_V1)).toBe('{"legado":true}');

    // 2. Gravação V2 passa, mas removeItem falha -> conclui restauração com aviso explícito de ressalva
    setItemSpy.mockRestore();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Remove blocked', 'SecurityError');
    });

    await user.click(screen.getByRole('button', { name: /Restaurar dados demonstrativos/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Restaurar agora/i }));

    expect(
      screen.getAllByText(/não foi possível remover todas as chaves legadas da V1/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(window.localStorage.getItem(STORAGE_KEY_V2)).not.toBe(corrompido);
  });
});

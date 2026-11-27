import { describe, it, expect } from 'vitest';
import {
  BACKUP_PREFIX_V1,
  STORAGE_KEY_V1,
  STORAGE_KEY_V2,
  THEME_KEY_V1,
  THEME_KEY_V2,
  carregarEstadoStorage,
  carregarTemaStorage,
  normalizarEstadoBruto,
  restaurarEstadoDemonstrativoStorage,
  salvarEstadoStorage,
  salvarTemaStorage
} from './storage';
import { criarEstadoInicial, usuariosIniciais } from '../data/initialData';

function criarMemoryStorage(iniciais: Record<string, string> = {}): Storage {
  const mapa = new Map<string, string>(Object.entries(iniciais));
  return {
    get length() {
      return mapa.size;
    },
    clear() {
      mapa.clear();
    },
    getItem(key: string) {
      return mapa.has(key) ? mapa.get(key)! : null;
    },
    key(index: number) {
      return Array.from(mapa.keys())[index] ?? null;
    },
    removeItem(key: string) {
      mapa.delete(key);
    },
    setItem(key: string, value: string) {
      mapa.set(key, value);
    }
  };
}

describe('storage — persistência, corrupção, falha de gravação e migração V1->V2', () => {
  it('salva e recarrega o estado V2 preservando todos os registros', () => {
    const storage = criarMemoryStorage();
    const inicial = criarEstadoInicial();

    const grav = salvarEstadoStorage(inicial, storage);
    expect(grav.ok).toBe(true);

    const carregado = carregarEstadoStorage(storage);
    expect(carregado.status).toBe('ok');
    expect(carregado.state.planejamentos).toHaveLength(inicial.planejamentos.length);
    expect(carregado.state.planejamentos[0].id).toBe('plan_001');
  });

  it('detecta JSON corrompido sem sobrescrever o valor original no localStorage', () => {
    const brutoCorrompido = '{ "schemaVersion": 2, "data": [JSON QUEBRADO';
    const storage = criarMemoryStorage({
      [STORAGE_KEY_V2]: brutoCorrompido
    });

    const resultado = carregarEstadoStorage(storage);
    expect(resultado.status).toBe('corrupted');
    expect(resultado.rawKey).toBe(STORAGE_KEY_V2);
    expect(resultado.rawCorruptedValue).toBe(brutoCorrompido);
    // O registro corrompido continua intacto no storage
    expect(storage.getItem(STORAGE_KEY_V2)).toBe(brutoCorrompido);
  });

  it('detecta estrutura inválida mesmo quando o JSON é sintaticamente válido', () => {
    const storage = criarMemoryStorage({
      [STORAGE_KEY_V2]: JSON.stringify({ schemaVersion: 2, data: { planejamentos: 'nao-array' } })
    });

    const resultado = carregarEstadoStorage(storage);
    expect(resultado.status).toBe('corrupted');
  });

  it('migra dados válidos da V1 para V2 e descarta registros inválidos/duplicados com aviso', () => {
    const estadoV1 = {
      usuarios: usuariosIniciais,
      planejamentos: [
        {
          id: 'plan_v1_valido',
          professorId: 'prof_001',
          ano: 2026,
          mes: 5,
          quinzena: 1,
          periodoInicio: '2026-05-01',
          periodoFim: '2026-05-15',
          titulo: 'Planejamento salvo na V1',
          disciplinas: ['Artes'],
          turmas: ['1º Ano A'],
          experienciaAprendizagem: 'Descrição preservada da V1.',
          objetivos: [{ id: 'obj_v1', texto: 'Objetivo V1', atingido: false }],
          recursosNecessarios: ['Cartolina'],
          metodologiaAvaliacao: 'Observação contínua.',
          instrumentosAvaliacao: ['Participação'],
          conclusao: 'Conclusão V1.',
          referencias: ['Referência V1'],
          status: 'rascunho',
          criadoEm: '2026-05-01T10:00:00.000Z',
          atualizadoEm: '2026-05-01T10:00:00.000Z',
          historicoConsideracoes: [],
          versao: 2
        },
        {
          id: 'plan_v1_invalido_status',
          professorId: 'prof_001',
          ano: 2026,
          mes: 6,
          quinzena: 1,
          status: 'status_fantasma'
        }
      ],
      notificacoes: [],
      sessaoAtual: { usuarioId: 'prof_001', loginEm: '2026-05-01T10:00:00.000Z' },
      configuracoes: { anoAtual: 2026, temaEscuro: false }
    };

    const storage = criarMemoryStorage({
      [STORAGE_KEY_V1]: JSON.stringify(estadoV1)
    });

    const migrado = carregarEstadoStorage(storage);
    expect(migrado.status).toBe('migrated_v1');
    expect(migrado.state.planejamentos).toHaveLength(1);
    expect(migrado.state.planejamentos[0].id).toBe('plan_v1_valido');
    expect(migrado.state.sessaoAtual?.usuarioId).toBe('prof_001');
    expect(migrado.warnings.length).toBeGreaterThan(0);
  });

  it('reporta falha explícita quando a gravação estoura cota (QuotaExceededError)', () => {
    const storageCheio = criarMemoryStorage();
    storageCheio.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    const res = salvarEstadoStorage(criarEstadoInicial(), storageCheio);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe('quota_exceeded');
      expect(res.message).toContain('Espaço insuficiente');
    }
  });

  it('preserva compatibilidade do tema salvo na V1 e salva na chave V2', () => {
    const storage = criarMemoryStorage({ [THEME_KEY_V1]: 'dark' });
    expect(carregarTemaStorage(storage)).toBe('dark');

    const res = salvarTemaStorage('light', storage);
    expect(res.ok).toBe(true);
    expect(storage.getItem(THEME_KEY_V2)).toBe('light');
    expect(carregarTemaStorage(storage)).toBe('light');
  });

  it('normaliza ambos periodoInicio e periodoFim quando qualquer uma das datas estiver inválida', () => {
    const basePlan = {
      id: 'plan_periodo',
      professorId: 'prof_001',
      ano: 2026,
      mes: 1,
      quinzena: 1,
      titulo: 'Teste normalização período',
      disciplinas: ['Matemática'],
      turmas: ['1º Ano A'],
      experienciaAprendizagem: 'Descrição.',
      objetivos: [],
      recursosNecessarios: [],
      metodologiaAvaliacao: 'Avaliação.',
      instrumentosAvaliacao: [],
      conclusao: 'Conclusão.',
      referencias: [],
      status: 'rascunho',
      criadoEm: '2026-01-02T10:00:00.000Z',
      atualizadoEm: '2026-01-02T10:00:00.000Z',
      historicoConsideracoes: [],
      versao: 1
    };

    // Caso 1: início válido + fim inválido ("garbage") -> ambos devem ser normalizados
    const fimInvalido = normalizarEstadoBruto({
      usuarios: usuariosIniciais,
      planejamentos: [{ ...basePlan, periodoInicio: '2026-01-01', periodoFim: 'garbage' }],
      notificacoes: [],
      sessaoAtual: null,
      configuracoes: { anoAtual: 2026, temaEscuro: false }
    });
    expect(fimInvalido.state.planejamentos[0].periodoInicio).toBe('2026-01-01');
    expect(fimInvalido.state.planejamentos[0].periodoFim).toBe('2026-01-15');

    // Caso 2: início inválido + fim válido -> ambos devem ser normalizados
    const inicioInvalido = normalizarEstadoBruto({
      usuarios: usuariosIniciais,
      planejamentos: [{ ...basePlan, periodoInicio: 'garbage', periodoFim: '2026-01-15' }],
      notificacoes: [],
      sessaoAtual: null,
      configuracoes: { anoAtual: 2026, temaEscuro: false }
    });
    expect(inicioInvalido.state.planejamentos[0].periodoInicio).toBe('2026-01-01');
    expect(inicioInvalido.state.planejamentos[0].periodoFim).toBe('2026-01-15');

    // Caso 3: par integralmente válido (2ª quinzena de fevereiro) -> preservado
    const parValido = normalizarEstadoBruto({
      usuarios: usuariosIniciais,
      planejamentos: [
        {
          ...basePlan,
          mes: 2,
          quinzena: 2,
          periodoInicio: '2026-02-16',
          periodoFim: '2026-02-28'
        }
      ],
      notificacoes: [],
      sessaoAtual: null,
      configuracoes: { anoAtual: 2026, temaEscuro: false }
    });
    expect(parValido.state.planejamentos[0].periodoInicio).toBe('2026-02-16');
    expect(parValido.state.planejamentos[0].periodoFim).toBe('2026-02-28');
  });

  it('preserva integralmente chaves V1 e V2 se a gravação falhar durante a restauração', () => {
    const v2Original = '{"schemaVersion":2,"savedAt":"2026-01-01T00:00:00.000Z","data":{"usuarios":[],"planejamentos":[],"notificacoes":[],"sessaoAtual":null,"configuracoes":{"anoAtual":2026,"temaEscuro":false}}}';
    const v1Original = '{"usuarios":[],"planejamentos":[],"notificacoes":[],"sessaoAtual":null,"configuracoes":{"anoAtual":2026,"temaEscuro":false}}';
    const backupKey = `${BACKUP_PREFIX_V1}2026-01-01`;

    const storage = criarMemoryStorage({
      [STORAGE_KEY_V2]: v2Original,
      [STORAGE_KEY_V1]: v1Original,
      [backupKey]: v1Original
    });
    storage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    const res = restaurarEstadoDemonstrativoStorage(criarEstadoInicial(), storage);
    expect(res.ok).toBe(false);
    // Nenhuma chave anterior foi removida
    expect(storage.getItem(STORAGE_KEY_V2)).toBe(v2Original);
    expect(storage.getItem(STORAGE_KEY_V1)).toBe(v1Original);
    expect(storage.getItem(backupKey)).toBe(v1Original);
  });

  it('informa restauração com ressalvas quando V2 grava com sucesso mas a limpeza de chaves legadas falha', () => {
    const v1Original = '{"usuarios":[],"planejamentos":[]}';
    const storage = criarMemoryStorage({
      [STORAGE_KEY_V1]: v1Original
    });
    storage.removeItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };

    const res = restaurarEstadoDemonstrativoStorage(criarEstadoInicial(), storage);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.cleanupWarning).toBeDefined();
      expect(res.cleanupWarning).toContain('chaves legadas da V1');
    }
    // O novo envelope V2 foi efetivamente salvo
    expect(storage.getItem(STORAGE_KEY_V2)).not.toBeNull();
  });

  it('grava o novo estado V2 e remove chaves legadas V1/backups quando ambas as etapas funcionam', () => {
    const backupKey = `${BACKUP_PREFIX_V1}2026-01-01`;
    const storage = criarMemoryStorage({
      [STORAGE_KEY_V1]: '{"legado":true}',
      [backupKey]: '{"backup":true}'
    });

    const res = restaurarEstadoDemonstrativoStorage(criarEstadoInicial(), storage);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.cleanupWarning).toBeUndefined();
    }
    expect(storage.getItem(STORAGE_KEY_V2)).not.toBeNull();
    expect(storage.getItem(STORAGE_KEY_V1)).toBeNull();
    expect(storage.getItem(backupKey)).toBeNull();
  });
});

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode
} from 'react';
import toast from 'react-hot-toast';
import {
  AppState,
  Planejamento,
  PlanejamentoFormularioInput,
  ResultadoOperacao,
  StatusPersistencia
} from '../types';
import { Usuario } from '../models/auth/users.model';
import { ANOS_DISPONIVEIS, criarEstadoInicial } from '../data/initialData';
import {
  adicionarComentarioDirecao,
  aprovarPlanejamento,
  enviarParaRevisao,
  excluirRascunho,
  salvarRascunho,
  solicitarAjustes
} from '../domain/planningService';
import {
  carregarEstadoStorage,
  exportarDadosJson,
  restaurarEstadoDemonstrativoStorage,
  salvarEstadoStorage
} from '../persistence/storage';

export interface InfoPersistencia {
  status: StatusPersistencia;
  escritaBloqueadaPorFalhaLeitura: boolean;
  mensagem?: string;
  chaveOrigem?: string;
  dadoBrutoCorrompido?: string;
  avisos: string[];
  erroUltimaGravacao?: string;
}

interface AppContextType {
  estado: AppState;
  usuarioLogado: Usuario | null;
  persistencia: InfoPersistencia;

  // Seleção de perfil simulado
  login: (usuarioId: string) => ResultadoOperacao;
  logout: () => ResultadoOperacao;

  // Fluxo do professor
  salvarRascunhoPlanejamento: (params: {
    planejamentoId?: string;
    ano: number;
    mes: number;
    quinzena: 1 | 2;
    dados: PlanejamentoFormularioInput;
    silencioso?: boolean;
  }) => ResultadoOperacao<{ planejamento: Planejamento; criado: boolean }>;
  enviarPlanejamentoParaRevisao: (params: {
    planejamentoId?: string;
    ano: number;
    mes: number;
    quinzena: 1 | 2;
    dados: PlanejamentoFormularioInput;
  }) => ResultadoOperacao<{ planejamento: Planejamento; criado: boolean }>;
  excluirRascunhoPlanejamento: (planejamentoId: string) => ResultadoOperacao;

  // Fluxo da direção
  aprovarPlanejamentoDirecao: (params: {
    planejamentoId: string;
    feedback: string;
    avaliacao?: number;
  }) => ResultadoOperacao<{ planejamento: Planejamento }>;
  solicitarAjustesDirecao: (params: {
    planejamentoId: string;
    feedback: string;
    avaliacao?: number;
  }) => ResultadoOperacao<{ planejamento: Planejamento }>;
  comentarPlanejamentoDirecao: (params: {
    planejamentoId: string;
    feedback: string;
  }) => ResultadoOperacao<{ planejamento: Planejamento }>;

  // Notificações
  marcarNotificacaoLida: (id: string) => void;
  marcarTodasLidas: () => void;

  // Configurações e dados demonstrativos
  mudarAno: (ano: number) => void;
  tentarRecarregarStorage: () => ResultadoOperacao;
  restaurarDadosDemonstrativos: () => ResultadoOperacao<{ ressalva?: string }>;
  exportarDados: () => void;
  descartarAvisoPersistencia: () => void;

  // Navegação por notificação
  planejamentoParaAbrir: string | null;
  abrirPlanejamento: (id: string) => void;
  limparPlanejamentoParaAbrir: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const cargaInicial = useRef(carregarEstadoStorage());
  const [estado, setEstado] = useState<AppState>(() => cargaInicial.current.state);
  const estadoRef = useRef<AppState>(estado);
  estadoRef.current = estado;

  const [persistencia, setPersistencia] = useState<InfoPersistencia>(() => {
    const res = cargaInicial.current;
    return {
      status: res.status,
      escritaBloqueadaPorFalhaLeitura:
        res.status === 'corrupted' || res.status === 'storage_unavailable',
      mensagem: res.message,
      chaveOrigem: res.rawKey,
      dadoBrutoCorrompido: res.rawCorruptedValue,
      avisos: res.warnings
    };
  });

  const persistenciaRef = useRef<InfoPersistencia>(persistencia);
  persistenciaRef.current = persistencia;

  const [planejamentoParaAbrir, setPlanejamentoParaAbrir] = useState<string | null>(null);

  // Grava o estado migrado da V1 na chave V2 (sem tocar na chave V1) ou inicializa primeiro acesso limpo.
  // Nunca grava automaticamente quando há corrupção ou falha de leitura (storage_unavailable)!
  useEffect(() => {
    const statusInicial = cargaInicial.current.status;
    if (statusInicial === 'migrated_v1' || statusInicial === 'empty') {
      const gravacao = salvarEstadoStorage(estadoRef.current);
      if (!gravacao.ok) {
        setPersistencia(prev => ({
          ...prev,
          erroUltimaGravacao: gravacao.message
        }));
      }
    }
  }, []);

  /**
   * Aplica e persiste uma transição de estado com proteção contra sobrescrita:
   * - Se houve falha de leitura (corrupted ou storage_unavailable), bloqueia sobrescrita automática
   *   até recuperação bem-sucedida ou decisão explícita do usuário.
   * - Se a gravação no localStorage falhar, NÃO altera o estado nem informa sucesso falso.
   */
  const persistirEAtualizar = useCallback(
    (proximoEstado: AppState): ResultadoOperacao => {
      if (persistenciaRef.current.escritaBloqueadaPorFalhaLeitura) {
        const ehCorrompido = persistenciaRef.current.status === 'corrupted';
        const erro = ehCorrompido
          ? 'A gravação está pausada para proteger dados corrompidos existentes no navegador. Exporte ou restaure os dados demonstrativos no aviso superior.'
          : 'A gravação está pausada após falha de leitura do armazenamento local para evitar sobrescrita acidental. Tente ler novamente ou restaure explicitamente no aviso superior.';
        toast.error(erro);
        return { ok: false, erro };
      }

      const gravacao = salvarEstadoStorage(proximoEstado);
      if (!gravacao.ok) {
        setPersistencia(prev => ({
          ...prev,
          erroUltimaGravacao: gravacao.message
        }));
        toast.error(gravacao.message);
        return { ok: false, erro: gravacao.message };
      }

      estadoRef.current = proximoEstado;
      setEstado(proximoEstado);
      if (persistenciaRef.current.erroUltimaGravacao) {
        setPersistencia(prev => ({ ...prev, erroUltimaGravacao: undefined }));
      }
      return { ok: true, dados: undefined };
    },
    []
  );

  const obterUsuarioAtual = useCallback((stateAtual: AppState): Usuario | null => {
    if (!stateAtual.sessaoAtual) return null;
    return stateAtual.usuarios.find(u => u.id === stateAtual.sessaoAtual?.usuarioId) || null;
  }, []);

  const usuarioLogado = obterUsuarioAtual(estado);

  const login = useCallback(
    (usuarioId: string): ResultadoOperacao => {
      const atual = estadoRef.current;
      const usuario = atual.usuarios.find(u => u.id === usuarioId);
      if (!usuario) {
        const erro = 'Perfil fictício não encontrado.';
        toast.error(erro);
        return { ok: false, erro };
      }

      const proximoEstado: AppState = {
        ...atual,
        sessaoAtual: {
          usuarioId: usuario.id,
          loginEm: new Date().toISOString()
        }
      };

      // Permite navegar na interface em modo leitura mesmo se storage estiver protegido por falha de leitura
      if (persistenciaRef.current.escritaBloqueadaPorFalhaLeitura) {
        estadoRef.current = proximoEstado;
        setEstado(proximoEstado);
        toast(`Sessão simulada aberta em modo somente leitura (${usuario.nome}).`);
        return { ok: true, dados: undefined };
      }

      const res = persistirEAtualizar(proximoEstado);
      if (!res.ok) return res;

      toast.success(`Perfil ativo: ${usuario.nome}`);
      return { ok: true, dados: undefined };
    },
    [persistirEAtualizar]
  );

  const logout = useCallback((): ResultadoOperacao => {
    const proximoEstado: AppState = {
      ...estadoRef.current,
      sessaoAtual: null
    };

    if (persistenciaRef.current.escritaBloqueadaPorFalhaLeitura) {
      estadoRef.current = proximoEstado;
      setEstado(proximoEstado);
      return { ok: true, dados: undefined };
    }

    const res = persistirEAtualizar(proximoEstado);
    if (!res.ok) return res;

    toast.success('Sessão simulada encerrada.');
    return { ok: true, dados: undefined };
  }, [persistirEAtualizar]);

  const salvarRascunhoPlanejamento = useCallback(
    (params: {
      planejamentoId?: string;
      ano: number;
      mes: number;
      quinzena: 1 | 2;
      dados: PlanejamentoFormularioInput;
      silencioso?: boolean;
    }): ResultadoOperacao<{ planejamento: Planejamento; criado: boolean }> => {
      const atual = estadoRef.current;
      const usuario = obterUsuarioAtual(atual);
      const resultadoDominio = salvarRascunho(atual, usuario, params);

      if (!resultadoDominio.ok) {
        if (!params.silencioso) {
          toast.error(resultadoDominio.erro);
        }
        return resultadoDominio;
      }

      const persistido = persistirEAtualizar(resultadoDominio.dados.estado);
      if (!persistido.ok) {
        return { ok: false, erro: persistido.erro };
      }

      if (!params.silencioso) {
        const ehAjuste = resultadoDominio.dados.planejamento.status === 'ajustes_solicitados';
        toast.success(
          ehAjuste
            ? 'Alterações salvas. Quando concluir, clique em Reenviar para Revisão.'
            : 'Rascunho salvo no navegador.'
        );
      }

      return {
        ok: true,
        dados: {
          planejamento: resultadoDominio.dados.planejamento,
          criado: resultadoDominio.dados.criado
        }
      };
    },
    [obterUsuarioAtual, persistirEAtualizar]
  );

  const enviarPlanejamentoParaRevisao = useCallback(
    (params: {
      planejamentoId?: string;
      ano: number;
      mes: number;
      quinzena: 1 | 2;
      dados: PlanejamentoFormularioInput;
    }): ResultadoOperacao<{ planejamento: Planejamento; criado: boolean }> => {
      const atual = estadoRef.current;
      const usuario = obterUsuarioAtual(atual);
      const existenteAntes = params.planejamentoId
        ? atual.planejamentos.find(p => p.id === params.planejamentoId)
        : undefined;
      const ehReenvio = existenteAntes?.status === 'ajustes_solicitados';

      const resultadoDominio = enviarParaRevisao(atual, usuario, params);
      if (!resultadoDominio.ok) {
        toast.error(resultadoDominio.erro);
        return resultadoDominio;
      }

      const persistido = persistirEAtualizar(resultadoDominio.dados.estado);
      if (!persistido.ok) {
        return { ok: false, erro: persistido.erro };
      }

      toast.success(
        ehReenvio
          ? 'Planejamento corrigido e reenviado para revisão.'
          : 'Planejamento enviado para revisão.'
      );

      return {
        ok: true,
        dados: {
          planejamento: resultadoDominio.dados.planejamento,
          criado: resultadoDominio.dados.criado
        }
      };
    },
    [obterUsuarioAtual, persistirEAtualizar]
  );

  const excluirRascunhoPlanejamento = useCallback(
    (planejamentoId: string): ResultadoOperacao => {
      const atual = estadoRef.current;
      const usuario = obterUsuarioAtual(atual);
      const resultadoDominio = excluirRascunho(atual, usuario, planejamentoId);

      if (!resultadoDominio.ok) {
        toast.error(resultadoDominio.erro);
        return resultadoDominio;
      }

      const persistido = persistirEAtualizar(resultadoDominio.dados);
      if (!persistido.ok) return persistido;

      toast.success('Rascunho removido.');
      return { ok: true, dados: undefined };
    },
    [obterUsuarioAtual, persistirEAtualizar]
  );

  const aprovarPlanejamentoDirecao = useCallback(
    (params: {
      planejamentoId: string;
      feedback: string;
      avaliacao?: number;
    }): ResultadoOperacao<{ planejamento: Planejamento }> => {
      const atual = estadoRef.current;
      const usuario = obterUsuarioAtual(atual);
      const resultadoDominio = aprovarPlanejamento(atual, usuario, params);

      if (!resultadoDominio.ok) {
        toast.error(resultadoDominio.erro);
        return resultadoDominio;
      }

      const persistido = persistirEAtualizar(resultadoDominio.dados.estado);
      if (!persistido.ok) return { ok: false, erro: persistido.erro };

      toast.success('Planejamento aprovado na simulação.');
      return { ok: true, dados: { planejamento: resultadoDominio.dados.planejamento } };
    },
    [obterUsuarioAtual, persistirEAtualizar]
  );

  const solicitarAjustesDirecao = useCallback(
    (params: {
      planejamentoId: string;
      feedback: string;
      avaliacao?: number;
    }): ResultadoOperacao<{ planejamento: Planejamento }> => {
      const atual = estadoRef.current;
      const usuario = obterUsuarioAtual(atual);
      const resultadoDominio = solicitarAjustes(atual, usuario, params);

      if (!resultadoDominio.ok) {
        toast.error(resultadoDominio.erro);
        return resultadoDominio;
      }

      const persistido = persistirEAtualizar(resultadoDominio.dados.estado);
      if (!persistido.ok) return { ok: false, erro: persistido.erro };

      toast.success('Solicitação de ajustes registrada.');
      return { ok: true, dados: { planejamento: resultadoDominio.dados.planejamento } };
    },
    [obterUsuarioAtual, persistirEAtualizar]
  );

  const comentarPlanejamentoDirecao = useCallback(
    (params: {
      planejamentoId: string;
      feedback: string;
    }): ResultadoOperacao<{ planejamento: Planejamento }> => {
      const atual = estadoRef.current;
      const usuario = obterUsuarioAtual(atual);
      const resultadoDominio = adicionarComentarioDirecao(atual, usuario, params);

      if (!resultadoDominio.ok) {
        toast.error(resultadoDominio.erro);
        return resultadoDominio;
      }

      const persistido = persistirEAtualizar(resultadoDominio.dados.estado);
      if (!persistido.ok) return { ok: false, erro: persistido.erro };

      toast.success('Comentário registrado no histórico.');
      return { ok: true, dados: { planejamento: resultadoDominio.dados.planejamento } };
    },
    [obterUsuarioAtual, persistirEAtualizar]
  );

  const marcarNotificacaoLida = useCallback(
    (id: string) => {
      const atual = estadoRef.current;
      const proximoEstado: AppState = {
        ...atual,
        notificacoes: atual.notificacoes.map(n => (n.id === id ? { ...n, lida: true } : n))
      };
      persistirEAtualizar(proximoEstado);
    },
    [persistirEAtualizar]
  );

  const marcarTodasLidas = useCallback(() => {
    const atual = estadoRef.current;
    const usuario = obterUsuarioAtual(atual);
    if (!usuario) return;

    const proximoEstado: AppState = {
      ...atual,
      notificacoes: atual.notificacoes.map(n =>
        n.usuarioId === usuario.id ? { ...n, lida: true } : n
      )
    };
    const res = persistirEAtualizar(proximoEstado);
    if (res.ok) {
      toast.success('Notificações marcadas como lidas.');
    }
  }, [obterUsuarioAtual, persistirEAtualizar]);

  const mudarAno = useCallback(
    (ano: number) => {
      if (!(ANOS_DISPONIVEIS as readonly number[]).includes(ano)) return;
      const atual = estadoRef.current;
      const proximoEstado: AppState = {
        ...atual,
        configuracoes: { ...atual.configuracoes, anoAtual: ano }
      };
      if (persistenciaRef.current.escritaBloqueadaPorFalhaLeitura) {
        estadoRef.current = proximoEstado;
        setEstado(proximoEstado);
        return;
      }
      persistirEAtualizar(proximoEstado);
    },
    [persistirEAtualizar]
  );

  const tentarRecarregarStorage = useCallback((): ResultadoOperacao => {
    const res = carregarEstadoStorage();
    const aindaBloqueado =
      res.status === 'corrupted' || res.status === 'storage_unavailable';

    if (aindaBloqueado) {
      const novaPersistencia: InfoPersistencia = {
        status: res.status,
        escritaBloqueadaPorFalhaLeitura: true,
        mensagem: res.message,
        chaveOrigem: res.rawKey,
        dadoBrutoCorrompido: res.rawCorruptedValue,
        avisos: res.warnings
      };
      persistenciaRef.current = novaPersistencia;
      setPersistencia(novaPersistencia);
      const erro = res.message || 'O armazenamento local continua indisponível para leitura.';
      toast.error(erro);
      return { ok: false, erro };
    }

    if (res.status === 'migrated_v1' || res.status === 'empty') {
      const gravacao = salvarEstadoStorage(res.state);
      if (!gravacao.ok) {
        setPersistencia(prev => ({
          ...prev,
          erroUltimaGravacao: gravacao.message
        }));
        toast.error(gravacao.message);
        return { ok: false, erro: gravacao.message };
      }
    }

    estadoRef.current = res.state;
    setEstado(res.state);
    const novaPersistencia: InfoPersistencia = {
      status: res.status,
      escritaBloqueadaPorFalhaLeitura: false,
      mensagem: res.message,
      chaveOrigem: res.rawKey,
      avisos: res.warnings
    };
    persistenciaRef.current = novaPersistencia;
    setPersistencia(novaPersistencia);
    toast.success('Leitura do armazenamento local restabelecida.');
    return { ok: true, dados: undefined };
  }, []);

  const restaurarDadosDemonstrativos = useCallback((): ResultadoOperacao<{
    ressalva?: string;
  }> => {
    const limpo = criarEstadoInicial();
    const resultado = restaurarEstadoDemonstrativoStorage(limpo);
    if (!resultado.ok) {
      setPersistencia(prev => ({
        ...prev,
        erroUltimaGravacao: resultado.message
      }));
      toast.error(resultado.message);
      return { ok: false, erro: resultado.message };
    }

    estadoRef.current = limpo;
    setEstado(limpo);
    const novaPersistencia: InfoPersistencia = {
      status: 'ok',
      escritaBloqueadaPorFalhaLeitura: false,
      mensagem: resultado.cleanupWarning,
      avisos: resultado.cleanupWarning ? [resultado.cleanupWarning] : []
    };
    persistenciaRef.current = novaPersistencia;
    setPersistencia(novaPersistencia);

    if (resultado.cleanupWarning) {
      toast(resultado.cleanupWarning);
      return { ok: true, dados: { ressalva: resultado.cleanupWarning } };
    }

    toast.success('Dados demonstrativos restaurados.');
    return { ok: true, dados: {} };
  }, []);

  const exportarDados = useCallback(() => {
    exportarDadosJson(estadoRef.current);
    toast.success('Arquivo JSON exportado.');
  }, []);

  const descartarAvisoPersistencia = useCallback(() => {
    setPersistencia(prev => ({
      ...prev,
      mensagem: undefined,
      avisos: [],
      erroUltimaGravacao: undefined
    }));
  }, []);

  const abrirPlanejamento = useCallback((id: string) => {
    setPlanejamentoParaAbrir(id);
  }, []);

  const limparPlanejamentoParaAbrir = useCallback(() => {
    setPlanejamentoParaAbrir(null);
  }, []);

  const value: AppContextType = {
    estado,
    usuarioLogado,
    persistencia,
    login,
    logout,
    salvarRascunhoPlanejamento,
    enviarPlanejamentoParaRevisao,
    excluirRascunhoPlanejamento,
    aprovarPlanejamentoDirecao,
    solicitarAjustesDirecao,
    comentarPlanejamentoDirecao,
    marcarNotificacaoLida,
    marcarTodasLidas,
    mudarAno,
    tentarRecarregarStorage,
    restaurarDadosDemonstrativos,
    exportarDados,
    descartarAvisoPersistencia,
    planejamentoParaAbrir,
    abrirPlanejamento,
    limparPlanejamentoParaAbrir
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
};

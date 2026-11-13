import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Planejamento, Notificacao } from '../types';
import { estadoInicial } from '../data/initialData';
import { StorageHelpers } from '../utils/storageHelpers';
import toast from 'react-hot-toast';
import { Usuario } from  '../models/auth/users.model'; 

// Tipo do contexto
interface AppContextType {
  estado: AppState;
  usuarioLogado: Usuario | null;
  
  // Autenticação
  login: (usuarioId: string) => void;
  logout: () => void;
  
  // Planejamentos
  adicionarPlanejamento: (planejamento: Omit<Planejamento, 'id'>) => string;
  atualizarPlanejamento: (id: string, dados: Partial<Planejamento>) => void;
  removerPlanejamento: (id: string) => void;
  
  // Notificações
  adicionarNotificacao: (notificacao: Omit<Notificacao, 'id'>) => void;
  marcarNotificacaoLida: (id: string) => void;
  marcarTodasLidas: () => void;
  
  // Configurações
  mudarAno: (ano: number) => void;
  
  // Navegação
  planejamentoParaAbrir: string | null;
  abrirPlanejamento: (id: string) => void;
  limparPlanejamentoParaAbrir: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [estado, setEstado] = useState<AppState>(() => {
    const salvo = StorageHelpers.carregar();
    return salvo || estadoInicial;
  });
  
  const [planejamentoParaAbrir, setPlanejamentoParaAbrir] = useState<string | null>(null);

  useEffect(() => {
    StorageHelpers.salvar(estado);
  }, [estado]);

  // Usuário logado
  const usuarioLogado = estado.sessaoAtual
    ? estado.usuarios.find(u => u.id === estado.sessaoAtual?.usuarioId) || null
    : null;

  // LOGIN
  const login = (usuarioId: string) => {
    const usuario = estado.usuarios.find(u => u.id === usuarioId);
    if (!usuario) {
      toast.error('Usuário não encontrado');
      return;
    }

    setEstado(prev => ({
      ...prev,
      sessaoAtual: {
        usuarioId: usuario.id,
        loginEm: new Date().toISOString()
      }
    }));

    toast.success(`Bem-vindo(a), ${usuario.nome}! 👋`);
  };

  // LOGOUT
  const logout = () => {
    setEstado(prev => ({ ...prev, sessaoAtual: null }));
    toast.success('Até logo! 👋');
  };

  // ADICIONAR PLANEJAMENTO
  const adicionarPlanejamento = (planejamento: Omit<Planejamento, 'id'>): string => {
    const id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const novo: Planejamento = { ...planejamento, id };

    setEstado(prev => ({
      ...prev,
      planejamentos: [...prev.planejamentos, novo]
    }));

    toast.success('Planejamento criado com sucesso! ✓');
    return id;
  };

  // ATUALIZAR PLANEJAMENTO
  const atualizarPlanejamento = (id: string, dados: Partial<Planejamento>) => {
    setEstado(prev => ({
      ...prev,
      planejamentos: prev.planejamentos.map(p =>
        p.id === id ? { ...p, ...dados, atualizadoEm: new Date().toISOString() } : p
      )
    }));

    toast.success('Planejamento atualizado! ✓');
  };

  // REMOVER PLANEJAMENTO
  const removerPlanejamento = (id: string) => {
    if (!confirm('Tem certeza que deseja remover este planejamento?')) return;

    setEstado(prev => ({
      ...prev,
      planejamentos: prev.planejamentos.filter(p => p.id !== id)
    }));

    toast.success('Planejamento removido!');
  };

  // ADICIONAR NOTIFICAÇÃO
  const adicionarNotificacao = (notificacao: Omit<Notificacao, 'id'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const nova: Notificacao = { ...notificacao, id };

    setEstado(prev => ({
      ...prev,
      notificacoes: [...prev.notificacoes, nova]
    }));
  };

  // MARCAR NOTIFICAÇÃO COMO LIDA
  const marcarNotificacaoLida = (id: string) => {
    setEstado(prev => ({
      ...prev,
      notificacoes: prev.notificacoes.map(n =>
        n.id === id ? { ...n, lida: true } : n
      )
    }));
  };

  // MARCAR TODAS COMO LIDAS
  const marcarTodasLidas = () => {
    if (!usuarioLogado) return;

    setEstado(prev => ({
      ...prev,
      notificacoes: prev.notificacoes.map(n =>
        n.usuarioId === usuarioLogado.id ? { ...n, lida: true } : n
      )
    }));

    toast.success('Todas marcadas como lidas');
  };

  // MUDAR ANO
  const mudarAno = (ano: number) => {
    setEstado(prev => ({
      ...prev,
      configuracoes: { ...prev.configuracoes, anoAtual: ano }
    }));
  };
  
  // NAVEGAÇÃO - Abrir planejamento
  const abrirPlanejamento = (id: string) => {
    setPlanejamentoParaAbrir(id);
  };
  
  const limparPlanejamentoParaAbrir = () => {
    setPlanejamentoParaAbrir(null);
  };

  const value: AppContextType = {
    estado,
    usuarioLogado,
    login,
    logout,
    adicionarPlanejamento,
    atualizarPlanejamento,
    removerPlanejamento,
    adicionarNotificacao,
    marcarNotificacaoLida,
    marcarTodasLidas,
    mudarAno,
    planejamentoParaAbrir,
    abrirPlanejamento,
    limparPlanejamentoParaAbrir
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook personalizado
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
};

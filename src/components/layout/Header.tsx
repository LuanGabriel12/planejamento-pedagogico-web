import React, { useState, useEffect, useRef } from 'react';
import { Bell, BookOpen, Sun, Moon, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { ProfileModal } from '../common/ProfileModal';
import { DateHelpers } from '../../utils/dateHelpers';

export const Header: React.FC = () => {
  const { estado, usuarioLogado, mudarAno, marcarNotificacaoLida, marcarTodasLidas, abrirPlanejamento } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [seletorAnoAberto, setSeletorAnoAberto] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  
  const seletorAnoRef = useRef<HTMLDivElement>(null);
  const notificacoesRef = useRef<HTMLDivElement>(null);

  if (!usuarioLogado) return null;

  const { anoAtual } = estado.configuracoes;
  
  // Notificações do usuário
  const notificacoesUsuario = estado.notificacoes
    .filter(n => n.usuarioId === usuarioLogado.id)
    .sort((a, b) => {
      if (a.lida !== b.lida) return a.lida ? 1 : -1;
      return new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime();
    })
    .slice(0, 10);

  const naoLidas = notificacoesUsuario.filter(n => !n.lida).length;

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seletorAnoRef.current && !seletorAnoRef.current.contains(event.target as Node)) {
        setSeletorAnoAberto(false);
      }
      if (notificacoesRef.current && !notificacoesRef.current.contains(event.target as Node)) {
        setNotificacoesAbertas(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ícone de notificação baseado no tipo
  const getIconeNotificacao = (tipo: string) => {
    switch (tipo) {
      case 'aprovacao': return '✅';
      case 'ajuste': return '⚠️';
      case 'comentario': return '💬';
      case 'lembrete': return '⏰';
      default: return 'ℹ️';
    }
  };

  // Anos disponíveis
  const anosDisponiveis = [2024, 2025, 2026, 2027];

  return (
    <header className="shadow-md sticky top-0 z-40 bg-surface border-b-2 border-base transition-colors">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo e Título */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold text-primary">
                Planejamento Pedagógico
              </h1>
              <p className="text-xs text-muted hidden sm:block">
                {usuarioLogado.role === 'professor' ? 'Professor' : 'Diretor'} • {usuarioLogado.nome}
              </p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-1 md:gap-4 shrink-0">
            {/* Seletor de Ano */}
            <div className="relative" ref={seletorAnoRef}>
              <button
                onClick={() => setSeletorAnoAberto(!seletorAnoAberto)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-sm md:text-base rounded-lg transition-all bg-elevated border border-base text-primary hover:bg-hover hover:border-strong shadow-sm"
              >
                <span className="font-semibold whitespace-nowrap">{anoAtual}</span>
                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${seletorAnoAberto ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown do Ano */}
              {seletorAnoAberto && (
                <div className="absolute right-0 mt-2 w-32 rounded-lg shadow-xl border-2 z-50 animate-scale-in bg-surface border-base overflow-hidden">
                  {anosDisponiveis.map(ano => (
                    <button
                      key={ano}
                      onClick={() => {
                        mudarAno(ano);
                        setSeletorAnoAberto(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-all ${
                        ano === anoAtual
                          ? 'bg-primary text-white font-semibold'
                          : 'text-primary hover:bg-hover'
                      }`}
                    >
                      {ano}
                      {ano === anoAtual && <span className="ml-2">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all hover:bg-hover text-muted hover:text-primary active:scale-95"
              title={theme === 'dark' ? 'Mudar para Claro' : 'Mudar para Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notificações */}
            <div className="relative" ref={notificacoesRef}>
              <button
                onClick={() => setNotificacoesAbertas(!notificacoesAbertas)}
                className="relative p-1.5 md:p-2 rounded-lg transition-colors hover:bg-hover"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                {naoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </span>
                )}
              </button>

              {/* Dropdown de Notificações */}
              {notificacoesAbertas && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl shadow-xl border-2 z-50 animate-scale-in bg-surface border-base overflow-hidden">
                  <div className="p-3 md:p-4 border-b-2 border-base flex items-center justify-between bg-surface">
                    <h3 className="text-sm md:text-base font-bold text-primary">
                      Notificações
                    </h3>
                    {naoLidas > 0 && (
                      <button
                        onClick={marcarTodasLidas}
                        className="text-xs md:text-sm text-primary hover:underline whitespace-nowrap"
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificacoesUsuario.length === 0 ? (
                      <div className="p-8 text-center text-muted">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-muted" />
                        <p>Nenhuma notificação</p>
                      </div>
                    ) : (
                      notificacoesUsuario.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.lida) marcarNotificacaoLida(notif.id);
                            if (notif.planejamentoId) {
                              abrirPlanejamento(notif.planejamentoId);
                              setNotificacoesAbertas(false);
                            }
                          }}
                          className={`p-3 md:p-4 border-b border-base transition-colors cursor-pointer ${
                            !notif.lida 
                              ? 'bg-primary/5' 
                              : 'hover:bg-hover'
                          }`}
                        >
                          <div className="flex items-start gap-2 md:gap-3">
                            <span className="text-xl md:text-2xl">{getIconeNotificacao(notif.tipo)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs md:text-sm text-primary break-words">
                                {notif.titulo}
                              </p>
                              <p className="text-xs md:text-sm mt-1 text-secondary break-words">
                                {notif.mensagem}
                              </p>
                              <p className="text-xs mt-2 text-muted">
                                {DateHelpers.tempoDesde(notif.criadaEm)}
                              </p>
                            </div>
                            {!notif.lida && (
                              <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar e Perfil */}
            <button
              onClick={() => setPerfilAberto(true)}
              className="flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-hover active:scale-95"
              title="Ver Perfil"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-info text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                {usuarioLogado.avatar}
              </div>
              <span className="hidden md:block font-medium text-primary">
                {usuarioLogado.nome.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Perfil */}
      <ProfileModal isOpen={perfilAberto} onClose={() => setPerfilAberto(false)} />
    </header>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BookOpen, Sun, Moon, ChevronDown, Check, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { ANOS_DISPONIVEIS } from '../../data/initialData';
import { ProfileModal } from '../common/ProfileModal';
import { DateHelpers } from '../../utils/dateHelpers';

export const Header: React.FC = () => {
  const {
    estado,
    usuarioLogado,
    mudarAno,
    marcarNotificacaoLida,
    marcarTodasLidas,
    abrirPlanejamento,
    logout
  } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [seletorAnoAberto, setSeletorAnoAberto] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);

  const seletorAnoRef = useRef<HTMLDivElement>(null);
  const notificacoesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seletorAnoRef.current && !seletorAnoRef.current.contains(event.target as Node)) {
        setSeletorAnoAberto(false);
      }
      if (notificacoesRef.current && !notificacoesRef.current.contains(event.target as Node)) {
        setNotificacoesAbertas(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSeletorAnoAberto(false);
        setNotificacoesAbertas(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!usuarioLogado) return null;

  const { anoAtual } = estado.configuracoes;

  const notificacoesUsuario = estado.notificacoes
    .filter(n => n.usuarioId === usuarioLogado.id)
    .sort((a, b) => {
      if (a.lida !== b.lida) return a.lida ? 1 : -1;
      return new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime();
    })
    .slice(0, 15);

  const naoLidas = notificacoesUsuario.filter(n => !n.lida).length;

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-base shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Identidade */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-on-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-primary truncate">
                Planejamento Pedagógico
              </p>
              <p className="text-xs text-muted truncate">
                {usuarioLogado.role === 'professor' ? 'Professor' : 'Direção'} · {usuarioLogado.nome}
              </p>
            </div>
          </div>

          {/* Controles */}
          <nav aria-label="Controles principais" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Seletor de Ano */}
            <div className="relative" ref={seletorAnoRef}>
              <button
                type="button"
                onClick={() => {
                  setSeletorAnoAberto(prev => !prev);
                  setNotificacoesAbertas(false);
                }}
                aria-expanded={seletorAnoAberto}
                aria-haspopup="listbox"
                aria-label={`Ano letivo selecionado: ${anoAtual}. Alterar ano`}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm font-semibold rounded-lg bg-elevated border border-base text-primary hover:bg-hover transition-colors"
              >
                <span>{anoAtual}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform ${seletorAnoAberto ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {seletorAnoAberto && (
                <div
                  role="listbox"
                  aria-label="Selecionar ano letivo"
                  className="absolute right-0 mt-2 w-32 rounded-xl shadow-lg border border-base z-50 bg-surface overflow-hidden py-1"
                >
                  {ANOS_DISPONIVEIS.map(ano => (
                    <button
                      key={ano}
                      type="button"
                      role="option"
                      aria-selected={ano === anoAtual}
                      onClick={() => {
                        mudarAno(ano);
                        setSeletorAnoAberto(false);
                      }}
                      className={`w-full px-3.5 py-2 text-sm text-left flex items-center justify-between transition-colors ${
                        ano === anoAtual
                          ? 'bg-primary text-on-primary font-semibold'
                          : 'text-primary hover:bg-hover'
                      }`}
                    >
                      <span>{ano}</span>
                      {ano === anoAtual && <Check className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tema */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
              title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
              className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Moon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>

            {/* Notificações */}
            <div className="relative" ref={notificacoesRef}>
              <button
                type="button"
                onClick={() => {
                  setNotificacoesAbertas(prev => !prev);
                  setSeletorAnoAberto(false);
                }}
                aria-expanded={notificacoesAbertas}
                aria-label={`Notificações${naoLidas > 0 ? ` (${naoLidas} não lidas)` : ''}`}
                className="relative p-2 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {naoLidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-danger text-on-danger text-[11px] font-bold rounded-full flex items-center justify-center">
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </span>
                )}
              </button>

              {notificacoesAbertas && (
                <div
                  role="region"
                  aria-label="Lista de notificações locais"
                  className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-96 rounded-xl shadow-xl border border-base z-50 bg-surface overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-base flex items-center justify-between">
                    <h2 className="text-sm font-bold text-primary">Notificações locais</h2>
                    {naoLidas > 0 && (
                      <button
                        type="button"
                        onClick={marcarTodasLidas}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-base">
                    {notificacoesUsuario.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted">
                        Nenhuma notificação registrada para este perfil.
                      </div>
                    ) : (
                      notificacoesUsuario.map(notif => (
                        <button
                          key={notif.id}
                          type="button"
                          onClick={() => {
                            if (!notif.lida) marcarNotificacaoLida(notif.id);
                            if (notif.planejamentoId) {
                              abrirPlanejamento(notif.planejamentoId);
                              setNotificacoesAbertas(false);
                            }
                          }}
                          className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                            !notif.lida ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-hover'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs sm:text-sm text-primary">
                              {notif.titulo}
                            </p>
                            <p className="text-xs text-secondary mt-0.5 break-words">
                              {notif.mensagem}
                            </p>
                            <p className="text-[11px] text-muted mt-1">
                              {DateHelpers.tempoDesde(notif.criadaEm)}
                            </p>
                          </div>
                          {!notif.lida && (
                            <span
                              className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0"
                              aria-label="Não lida"
                            />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Perfil */}
            <button
              type="button"
              onClick={() => setPerfilAberto(true)}
              aria-label={`Abrir perfil de ${usuarioLogado.nome}`}
              className="flex items-center gap-2 p-1.5 sm:pr-2.5 rounded-lg hover:bg-hover transition-colors"
            >
              <div className="w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center text-xs font-bold">
                {usuarioLogado.avatar}
              </div>
              <span className="hidden md:block text-sm font-medium text-primary max-w-[140px] truncate">
                {usuarioLogado.nome}
              </span>
            </button>

            {/* Atalho rápido para trocar perfil */}
            <button
              type="button"
              onClick={() => logout()}
              aria-label="Trocar de perfil simulado"
              title="Trocar de perfil"
              className="p-2 rounded-lg text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>

      <ProfileModal isOpen={perfilAberto} onClose={() => setPerfilAberto(false)} />
    </header>
  );
};

import React from 'react';
import { X, Mail, User, Shield, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { usuarioLogado, logout, estado } = useApp();

  if (!isOpen || !usuarioLogado) return null;

  const handleLogout = () => {
    if (confirm('Deseja realmente sair?')) {
      logout();
      onClose();
    }
  };

  // Estatísticas do usuário
  const getEstatisticas = () => {
    if (usuarioLogado.role === 'professor') {
      const planejamentos = estado.planejamentos.filter(p => p.professorId === usuarioLogado.id);
      const aprovados = planejamentos.filter(p => p.status === 'aprovado').length;
      const pendentes = planejamentos.filter(p => p.status === 'aguardando_revisao').length;
      
      return {
        total: planejamentos.length,
        aprovados,
        pendentes,
        taxaAprovacao: planejamentos.length > 0 ? Math.round((aprovados / planejamentos.length) * 100) : 0
      };
    } else {
      const total = estado.planejamentos.length;
      const pendentes = estado.planejamentos.filter(p => p.status === 'aguardando_revisao').length;
      const aprovados = estado.planejamentos.filter(p => p.status === 'aprovado').length;
      
      return { total, pendentes, aprovados };
    }
  };

  const stats = getEstatisticas();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - fundo 100% sólido */}
      <div className="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full animate-scale-in border-2 border-base">
        {/* Header */}
        <div className="px-8 py-6 border-b-2 border-base bg-surface">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              Meu Perfil
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all hover:bg-hover text-text-muted hover:text-text-primary active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 bg-surface">
          {/* Avatar e Nome */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-info rounded-full flex items-center justify-center text-on-primary text-3xl font-bold mb-4 shadow-lg">
              {usuarioLogado.avatar}
            </div>
            <h3 className="text-2xl font-bold text-text-primary">
              {usuarioLogado.nome}
            </h3>
            <span className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              usuarioLogado.role === 'professor'
                ? 'bg-primary/10 text-primary'
                : 'bg-info/10 text-info'
            }`}>
              {usuarioLogado.role === 'professor' ? (
                <>
                  <User className="w-4 h-4" />
                  Professor
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Diretor
                </>
              )}
            </span>
          </div>

          {/* Informações */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-elevated border-2 border-base shadow-sm">
              <Mail className="w-5 h-5 text-text-muted" />
              <div className="flex-1">
                <p className="text-xs font-medium text-text-muted">Email</p>
                <p className="font-semibold text-text-primary">
                  {usuarioLogado.email}
                </p>
              </div>
            </div>

            {usuarioLogado.role === 'professor' && usuarioLogado.disciplinas && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-elevated border-2 border-base shadow-sm">
                <div className="flex-1">
                  <p className="text-xs font-medium text-text-muted mb-2">Disciplinas</p>
                  <div className="flex flex-wrap gap-2">
                    {usuarioLogado.disciplinas.map(disc => (
                      <span
                        key={disc}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary"
                      >
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {usuarioLogado.role === 'professor' && usuarioLogado.turmas && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-elevated border-2 border-base shadow-sm">
                <div className="flex-1">
                  <p className="text-xs font-medium text-text-muted mb-2">Turmas</p>
                  <div className="flex flex-wrap gap-2">
                    {usuarioLogado.turmas.map(turma => (
                      <span
                        key={turma}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-info/10 border border-info/20 text-info"
                      >
                        {turma}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Estatísticas */}
          <div className="p-5 rounded-xl bg-elevated border-2 border-base shadow-sm">
            <h4 className="text-sm font-bold mb-4 text-text-primary">
              📊 Estatísticas {estado.configuracoes.anoAtual}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-surface border-2 border-base shadow-sm">
                <p className="text-2xl font-bold text-text-primary">
                  {stats.total}
                </p>
                <p className="text-xs font-medium text-text-muted mt-1">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-success/10 border-2 border-success/30 shadow-sm">
                <p className="text-2xl font-bold text-success">
                  {stats.aprovados}
                </p>
                <p className="text-xs font-medium text-text-muted mt-1">Aprovados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-warning/10 border-2 border-warning/30 shadow-sm">
                <p className="text-2xl font-bold text-warning">
                  {stats.pendentes}
                </p>
                <p className="text-xs font-medium text-text-muted mt-1">Pendentes</p>
              </div>
            </div>
            {'taxaAprovacao' in stats && (
              <div className="mt-4 pt-4 border-t-2 border-base">
                <p className="text-xs font-medium text-text-muted">Taxa de Aprovação</p>
                <p className="text-lg font-bold text-text-primary">
                  {stats.taxaAprovacao}%
                </p>
              </div>
            )}
          </div>

          {/* Botão de Logout */}
          <Button
            variant="danger"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </Button>
        </div>
      </div>
    </div>
  );
};

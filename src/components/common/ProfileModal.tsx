import React, { useState } from 'react';
import { Mail, User, Shield, LogOut, Download, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calcularEstatisticasPerfil } from '../../domain/metrics';
import { Modal } from './Modal';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    usuarioLogado,
    logout,
    estado,
    exportarDados,
    restaurarDadosDemonstrativos
  } = useApp();
  const [confirmandoReset, setConfirmandoReset] = useState(false);

  if (!usuarioLogado) return null;

  const anoAtual = estado.configuracoes.anoAtual;
  const stats = calcularEstatisticasPerfil(estado.planejamentos, usuarioLogado, anoAtual);

  const handleSair = () => {
    logout();
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Perfil Simulado"
        subtitle="Informações fictícias armazenadas apenas neste navegador"
        size="sm"
        footer={
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={exportarDados}>
                <Download className="w-4 h-4" aria-hidden="true" />
                Exportar JSON
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmandoReset(true)}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Restaurar demo
              </Button>
            </div>
            <Button variant="danger" onClick={handleSair} className="w-full">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Trocar de perfil
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center text-xl font-bold mb-3">
              {usuarioLogado.avatar}
            </div>
            <h3 className="text-lg font-bold text-primary">{usuarioLogado.nome}</h3>
            <span
              className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${
                usuarioLogado.role === 'professor'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-info/10 text-info'
              }`}
            >
              {usuarioLogado.role === 'professor' ? (
                <>
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  Professor fictício
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                  Direção fictícia
                </>
              )}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-elevated border border-base">
              <Mail className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-muted">E-mail fictício</p>
                <p className="text-sm font-medium text-primary truncate">{usuarioLogado.email}</p>
              </div>
            </div>

            {usuarioLogado.role === 'professor' && usuarioLogado.disciplinas && (
              <div className="p-3 rounded-lg bg-elevated border border-base">
                <p className="text-xs text-muted mb-1.5">Disciplinas de referência</p>
                <div className="flex flex-wrap gap-1.5">
                  {usuarioLogado.disciplinas.map(disc => (
                    <span
                      key={disc}
                      className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-primary/10 text-primary"
                    >
                      {disc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {usuarioLogado.role === 'professor' && usuarioLogado.turmas && (
              <div className="p-3 rounded-lg bg-elevated border border-base">
                <p className="text-xs text-muted mb-1.5">Turmas de referência</p>
                <div className="flex flex-wrap gap-1.5">
                  {usuarioLogado.turmas.map(turma => (
                    <span
                      key={turma}
                      className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-info/10 text-info"
                    >
                      {turma}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Estatísticas do ano selecionado */}
          <div className="p-4 rounded-xl bg-elevated border border-base">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted mb-3">
              Resumo em {stats.ano}
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-surface border border-base text-center">
                <p className="text-xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted">Total</p>
              </div>
              <div className="p-2.5 rounded-lg bg-success/10 border border-success/20 text-center">
                <p className="text-xl font-bold text-success">{stats.aprovados}</p>
                <p className="text-xs text-muted">Aprovados</p>
              </div>
              <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-center">
                <p className="text-xl font-bold text-warning">{stats.pendentes}</p>
                <p className="text-xs text-muted">Em revisão</p>
              </div>
              <div className="p-2.5 rounded-lg bg-danger/10 border border-danger/20 text-center">
                <p className="text-xl font-bold text-danger">{stats.ajustes}</p>
                <p className="text-xs text-muted">Ajustes</p>
              </div>
            </div>
            {stats.taxaAprovacao !== undefined && (
              <p className="text-xs text-secondary mt-3 text-center">
                Taxa de aprovação em {stats.ano}: <strong>{stats.taxaAprovacao}%</strong>
              </p>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmandoReset}
        title="Restaurar dados demonstrativos?"
        description="Todos os planejamentos criados ou alterados localmente serão substituídos pelos exemplos fictícios iniciais."
        confirmLabel="Restaurar exemplos"
        confirmVariant="danger"
        onConfirm={() => {
          restaurarDadosDemonstrativos();
          setConfirmandoReset(false);
          onClose();
        }}
        onCancel={() => setConfirmandoReset(false)}
      />
    </>
  );
};

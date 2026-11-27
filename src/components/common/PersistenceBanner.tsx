import React, { useState } from 'react';
import { AlertTriangle, Info, RotateCcw, Download, RefreshCw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

export const PersistenceBanner: React.FC = () => {
  const {
    persistencia,
    tentarRecarregarStorage,
    restaurarDadosDemonstrativos,
    descartarAvisoPersistencia
  } = useApp();
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false);

  const escritaProtegida = persistencia.escritaBloqueadaPorFalhaLeitura;
  const temErroGravacao = Boolean(persistencia.erroUltimaGravacao);
  const temAvisoInformativo =
    !escritaProtegida &&
    !temErroGravacao &&
    (persistencia.status === 'migrated_v1' || Boolean(persistencia.mensagem));

  if (!escritaProtegida && !temErroGravacao && !temAvisoInformativo) {
    return null;
  }

  const baixarBrutoCorrompido = () => {
    if (!persistencia.dadoBrutoCorrompido) return;
    const blob = new Blob([persistencia.dadoBrutoCorrompido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registro_corrompido_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (escritaProtegida) {
    const ehIndisponivel = persistencia.status === 'storage_unavailable';

    return (
      <>
        <div
          role="alert"
          className="bg-danger/10 border-b border-danger/30 text-primary px-4 py-3"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-danger">
                  {ehIndisponivel
                    ? 'Falha ao acessar o armazenamento local (modo proteção ativo)'
                    : 'Falha ao ler dados salvos no navegador (modo proteção ativo)'}
                </p>
                <p className="text-secondary mt-0.5">
                  {persistencia.mensagem}{' '}
                  Nenhuma gravação automática será realizada até recuperação da leitura ou confirmação explícita.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {ehIndisponivel && (
                <Button variant="secondary" size="sm" onClick={tentarRecarregarStorage}>
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Tentar ler novamente
                </Button>
              )}
              {persistencia.dadoBrutoCorrompido && (
                <Button variant="secondary" size="sm" onClick={baixarBrutoCorrompido}>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Baixar registro bruto
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmandoRestauracao(true)}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Restaurar dados demonstrativos
              </Button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmandoRestauracao}
          title="Restaurar dados demonstrativos?"
          description="Esta ação gravará um novo conjunto de exemplos fictícios na chave V2 e, somente após confirmar a gravação, removerá chaves legadas da V1. Registros anteriores serão substituídos se a gravação for concluída."
          confirmLabel="Restaurar agora"
          confirmVariant="danger"
          onConfirm={() => {
            restaurarDadosDemonstrativos();
            setConfirmandoRestauracao(false);
          }}
          onCancel={() => setConfirmandoRestauracao(false)}
        />
      </>
    );
  }

  if (temErroGravacao) {
    return (
      <div role="alert" className="bg-danger/10 border-b border-danger/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-danger">Erro ao gravar no armazenamento local</p>
              <p className="text-secondary">{persistencia.erroUltimaGravacao}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={descartarAvisoPersistencia}
            aria-label="Fechar aviso de erro"
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-hover"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div role="status" className="bg-info/10 border-b border-info/30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-sm">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-info shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-secondary">{persistencia.mensagem}</p>
        </div>
        <button
          type="button"
          onClick={descartarAvisoPersistencia}
          aria-label="Dispensar aviso"
          className="p-1 rounded-lg text-muted hover:text-primary hover:bg-hover shrink-0"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

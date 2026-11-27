import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileEdit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { Planejamento } from '../../types';
import { calcularProgressoProfessor } from '../../domain/metrics';
import { podeEditarPlanejamento, podeExcluirPlanejamento } from '../../domain/stateMachine';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DateHelpers } from '../../utils/dateHelpers';
import { FormularioPlanejamento } from './FormularioPlanejamento';
import { VisualizadorPlanejamento } from './VisualizadorPlanejamento';

export const ProfessorDashboard: React.FC = () => {
  const {
    estado,
    usuarioLogado,
    planejamentoParaAbrir,
    limparPlanejamentoParaAbrir,
    excluirRascunhoPlanejamento
  } = useApp();

  const [modalFormulario, setModalFormulario] = useState<{
    aberto: boolean;
    mes: number;
    quinzena: 1 | 2;
    planejamentoId?: string;
  }>({ aberto: false, mes: 1, quinzena: 1 });

  const [modalVisualizador, setModalVisualizador] = useState<{
    aberto: boolean;
    planejamentoId: string | null;
  }>({ aberto: false, planejamentoId: null });

  const [rascunhoParaExcluir, setRascunhoParaExcluir] = useState<Planejamento | null>(null);

  useEffect(() => {
    if (planejamentoParaAbrir) {
      setModalVisualizador({ aberto: true, planejamentoId: planejamentoParaAbrir });
      limparPlanejamentoParaAbrir();
    }
  }, [planejamentoParaAbrir, limparPlanejamentoParaAbrir]);

  if (!usuarioLogado) return null;

  const { anoAtual } = estado.configuracoes;
  const planejamentosProfessor = estado.planejamentos.filter(
    p => p.professorId === usuarioLogado.id && p.ano === anoAtual
  );

  const resumo = calcularProgressoProfessor(estado.planejamentos, usuarioLogado.id, anoAtual);

  const obterPlanejamento = (mes: number, quinzena: 1 | 2): Planejamento | undefined =>
    planejamentosProfessor.find(p => p.mes === mes && p.quinzena === quinzena);

  const abrirFormularioCriar = (mes: number, quinzena: 1 | 2) => {
    setModalFormulario({ aberto: true, mes, quinzena });
  };

  const abrirFormularioEditar = (planejamentoId: string) => {
    const plan = estado.planejamentos.find(p => p.id === planejamentoId);
    if (!plan) return;

    const permissao = podeEditarPlanejamento(plan, usuarioLogado);
    if (!permissao.permitido) {
      toast.error(permissao.motivo || 'Este planejamento não pode ser editado no status atual.');
      return;
    }

    setModalVisualizador({ aberto: false, planejamentoId: null });
    setModalFormulario({
      aberto: true,
      mes: plan.mes,
      quinzena: plan.quinzena,
      planejamentoId
    });
  };

  const abrirProximaQuinzenaLivre = () => {
    for (let mes = 1; mes <= 12; mes += 1) {
      for (const quinzena of [1, 2] as const) {
        if (!obterPlanejamento(mes, quinzena)) {
          abrirFormularioCriar(mes, quinzena);
          return;
        }
      }
    }
    toast('Todas as 24 quinzenas de ' + anoAtual + ' já possuem planejamento registrado.');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Cabeçalho e Progresso */}
      <section aria-labelledby="titulo-painel-professor" className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 id="titulo-painel-professor" className="text-2xl sm:text-3xl font-bold text-primary">
              Calendário Pedagógico · {anoAtual}
            </h1>
            <p className="text-sm text-secondary mt-1">
              {usuarioLogado.nome} — {resumo.aprovados} de {resumo.totalQuinzenas} quinzenas aprovadas ({resumo.percentualAprovados}%)
            </p>
          </div>
          <Button variant="primary" onClick={abrirProximaQuinzenaLivre} className="w-full sm:w-auto">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Criar próximo planejamento
          </Button>
        </div>

        {/* Cards de resumo calculados */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aprovados</p>
                <p className="text-2xl font-bold text-success mt-1">{resumo.aprovados}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aguardando</p>
                <p className="text-2xl font-bold text-warning mt-1">{resumo.aguardando}</p>
              </div>
              <Clock className="w-5 h-5 text-warning" aria-hidden="true" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ajustes</p>
                <p className="text-2xl font-bold text-danger mt-1">{resumo.ajustes}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-danger" aria-hidden="true" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rascunhos</p>
                <p className="text-2xl font-bold text-info mt-1">{resumo.rascunhos}</p>
              </div>
              <FileEdit className="w-5 h-5 text-info" aria-hidden="true" />
            </div>
          </Card>
        </div>

        {/* Barra de progresso anual */}
        <div className="bg-surface border border-base rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-secondary mb-2">
            <span>Progresso anual de aprovações</span>
            <span>
              {resumo.aprovados}/{resumo.totalQuinzenas} aprovados · {resumo.criados}/{resumo.totalQuinzenas} registrados
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Progresso anual de planejamentos aprovados"
            aria-valuenow={resumo.percentualAprovados}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-elevated rounded-full h-3 overflow-hidden"
          >
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${resumo.percentualAprovados}%` }}
            />
          </div>
        </div>
      </section>

      {/* Calendário das 24 quinzenas */}
      <section aria-label="Calendário anual de 24 quinzenas" className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(mes => (
          <Card key={mes} className="p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-bold text-primary mb-3.5">
              {DateHelpers.getNomeMes(mes)} {anoAtual}
            </h2>

            <div className="grid md:grid-cols-2 gap-3.5">
              {([1, 2] as const).map(quinzena => {
                const planejamento = obterPlanejamento(mes, quinzena);
                const { periodoInicio, periodoFim } = DateHelpers.calcularPeriodo(
                  anoAtual,
                  mes,
                  quinzena
                );

                const podeEditar = planejamento
                  ? podeEditarPlanejamento(planejamento, usuarioLogado).permitido
                  : false;
                const podeExcluir = planejamento
                  ? podeExcluirPlanejamento(planejamento, usuarioLogado).permitido
                  : false;

                const borderStatus = !planejamento
                  ? 'border-base border-dashed bg-elevated/40'
                  : planejamento.status === 'aprovado'
                    ? 'border-success/50 bg-surface'
                    : planejamento.status === 'aguardando_revisao'
                      ? 'border-warning/50 bg-surface'
                      : planejamento.status === 'ajustes_solicitados'
                        ? 'border-danger/60 bg-danger/[0.03]'
                        : 'border-info/50 border-dashed bg-surface';

                return (
                  <article
                    key={`${mes}-${quinzena}`}
                    className={`p-4 rounded-xl border transition-colors ${borderStatus}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <h3 className="text-sm font-bold text-primary">
                          {quinzena}ª Quinzena
                        </h3>
                        <p className="text-xs text-muted">
                          {DateHelpers.formatarPeriodo(periodoInicio, periodoFim)}
                        </p>
                      </div>
                      <StatusBadge status={planejamento?.status} size="sm" />
                    </div>

                    {planejamento ? (
                      <>
                        <p className="text-sm font-semibold text-primary line-clamp-2 break-words mb-1">
                          {planejamento.titulo || 'Rascunho sem título definido'}
                        </p>
                        <p className="text-xs text-muted mb-3">
                          v{planejamento.versao} ·{' '}
                          {planejamento.enviadoEm
                            ? `Enviado em ${DateHelpers.formatarData(planejamento.enviadoEm)}`
                            : `Atualizado em ${DateHelpers.formatarData(planejamento.atualizadoEm)}`}
                        </p>

                        {planejamento.status === 'ajustes_solicitados' &&
                          planejamento.consideracoesDiretor && (
                            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg p-2 mb-3 line-clamp-2">
                              <strong>Direção:</strong> {planejamento.consideracoesDiretor}
                            </p>
                          )}

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setModalVisualizador({ aberto: true, planejamentoId: planejamento.id })
                            }
                            className="flex-1"
                          >
                            <FileText className="w-4 h-4" aria-hidden="true" />
                            Detalhes
                          </Button>

                          {podeEditar && (
                            <Button
                              variant={
                                planejamento.status === 'ajustes_solicitados' ? 'danger' : 'primary'
                              }
                              size="sm"
                              onClick={() => abrirFormularioEditar(planejamento.id)}
                              className="flex-1"
                            >
                              <Edit3 className="w-4 h-4" aria-hidden="true" />
                              {planejamento.status === 'ajustes_solicitados'
                                ? 'Corrigir'
                                : 'Editar'}
                            </Button>
                          )}

                          {podeExcluir && (
                            <button
                              type="button"
                              onClick={() => setRascunhoParaExcluir(planejamento)}
                              aria-label={`Excluir rascunho de ${DateHelpers.getNomeMes(mes)} (${quinzena}ª quinzena)`}
                              title="Excluir rascunho"
                              className="p-2 rounded-lg text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => abrirFormularioCriar(mes, quinzena)}
                        className="w-full mt-2"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Criar planejamento
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          </Card>
        ))}
      </section>

      {modalFormulario.aberto && (
        <FormularioPlanejamento
          mes={modalFormulario.mes}
          quinzena={modalFormulario.quinzena}
          planejamentoId={modalFormulario.planejamentoId}
          onClose={() => setModalFormulario({ aberto: false, mes: 1, quinzena: 1 })}
        />
      )}

      {modalVisualizador.aberto && modalVisualizador.planejamentoId && (
        <VisualizadorPlanejamento
          planejamentoId={modalVisualizador.planejamentoId}
          onClose={() => setModalVisualizador({ aberto: false, planejamentoId: null })}
          onEditar={abrirFormularioEditar}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(rascunhoParaExcluir)}
        title="Excluir rascunho?"
        description={`Deseja remover o rascunho "${rascunhoParaExcluir?.titulo || 'sem título'}"? Esta ação remove o registro apenas deste navegador.`}
        confirmLabel="Excluir rascunho"
        confirmVariant="danger"
        onConfirm={() => {
          if (rascunhoParaExcluir) {
            excluirRascunhoPlanejamento(rascunhoParaExcluir.id);
          }
          setRascunhoParaExcluir(null);
        }}
        onCancel={() => setRascunhoParaExcluir(null)}
      />
    </div>
  );
};

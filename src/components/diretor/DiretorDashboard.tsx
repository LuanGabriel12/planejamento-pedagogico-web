import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  ClipboardCheck,
  SearchX
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FiltroStatusDirecao } from '../../types';
import {
  calcularIndicadoresDirecao,
  filtrarPlanejamentosDirecao
} from '../../domain/metrics';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StatusBadge } from '../common/StatusBadge';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { DateHelpers } from '../../utils/dateHelpers';
import { PaginaRevisao } from './PaginaRevisao';

export const DiretorDashboard: React.FC = () => {
  const { estado, planejamentoParaAbrir, limparPlanejamentoParaAbrir } = useApp();
  const [busca, setBusca] = useState('');
  const [filtroProfessor, setFiltroProfessor] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusDirecao>('todos');
  const [planejamentoRevisao, setPlanejamentoRevisao] = useState<string | null>(null);

  const { anoAtual } = estado.configuracoes;

  const indicadores = calcularIndicadoresDirecao(estado.planejamentos, anoAtual);
  const planejamentosFiltrados = filtrarPlanejamentosDirecao(estado.planejamentos, {
    ano: anoAtual,
    busca,
    professorId: filtroProfessor,
    status: filtroStatus
  });

  const professores = estado.usuarios.filter(u => u.role === 'professor');
  const getProfessor = (id: string) => estado.usuarios.find(u => u.id === id);

  useEffect(() => {
    if (planejamentoParaAbrir) {
      setPlanejamentoRevisao(planejamentoParaAbrir);
      limparPlanejamentoParaAbrir();
    }
  }, [planejamentoParaAbrir, limparPlanejamentoParaAbrir]);

  if (planejamentoRevisao) {
    return (
      <PaginaRevisao
        planejamentoId={planejamentoRevisao}
        onClose={() => setPlanejamentoRevisao(null)}
        onProximo={() => {
          const proximosPendentes = filtrarPlanejamentosDirecao(estado.planejamentos, {
            ano: anoAtual,
            busca: '',
            professorId: '',
            status: 'aguardando_revisao'
          }).filter(p => p.id !== planejamentoRevisao);

          if (proximosPendentes.length > 0) {
            setPlanejamentoRevisao(proximosPendentes[0].id);
          } else {
            setPlanejamentoRevisao(null);
          }
        }}
      />
    );
  }

  const temFiltrosAtivos = Boolean(busca.trim() || filtroProfessor || filtroStatus !== 'todos');

  const limparFiltros = () => {
    setBusca('');
    setFiltroProfessor('');
    setFiltroStatus('todos');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Painel da Direção · {anoAtual}
        </h1>
        <p className="text-sm text-secondary mt-1">
          Indicadores calculados sobre os registros locais de {anoAtual}. Revise envios, solicite ajustes ou aprove planejamentos na simulação.
        </p>
      </div>

      {/* Indicadores interativos acessíveis */}
      <section aria-label="Indicadores do ano" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <button
          type="button"
          onClick={() => setFiltroStatus('todos')}
          aria-pressed={filtroStatus === 'todos'}
          className={`text-left p-4 sm:p-5 rounded-xl bg-surface border transition-all shadow-sm hover:border-strong ${
            filtroStatus === 'todos' ? 'border-primary ring-1 ring-primary' : 'border-base'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Total em {anoAtual}
            </span>
            <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary">{indicadores.total}</p>
          <p className="text-xs text-muted mt-1">
            Inclui {indicadores.rascunhos} rascunho{indicadores.rascunhos === 1 ? '' : 's'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFiltroStatus('aguardando_revisao')}
          aria-pressed={filtroStatus === 'aguardando_revisao'}
          className={`text-left p-4 sm:p-5 rounded-xl bg-surface border transition-all shadow-sm hover:border-warning ${
            filtroStatus === 'aguardando_revisao'
              ? 'border-warning ring-1 ring-warning'
              : 'border-base'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-warning">
              Aguardando revisão
            </span>
            <Clock className="w-5 h-5 text-warning" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-warning">{indicadores.pendentes}</p>
          <p className="text-xs text-muted mt-1">
            {indicadores.pendentes > 0 ? 'Prontos para análise' : 'Fila de revisão vazia'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFiltroStatus('aprovado')}
          aria-pressed={filtroStatus === 'aprovado'}
          className={`text-left p-4 sm:p-5 rounded-xl bg-surface border transition-all shadow-sm hover:border-success ${
            filtroStatus === 'aprovado' ? 'border-success ring-1 ring-success' : 'border-base'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-success">
              Aprovados
            </span>
            <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-success">{indicadores.aprovados}</p>
          <p className="text-xs text-muted mt-1">{indicadores.taxaAprovacao}% do total do ano</p>
        </button>

        <button
          type="button"
          onClick={() => setFiltroStatus('ajustes_solicitados')}
          aria-pressed={filtroStatus === 'ajustes_solicitados'}
          className={`text-left p-4 sm:p-5 rounded-xl bg-surface border transition-all shadow-sm hover:border-danger ${
            filtroStatus === 'ajustes_solicitados'
              ? 'border-danger ring-1 ring-danger'
              : 'border-base'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-danger">
              Ajustes solicitados
            </span>
            <AlertTriangle className="w-5 h-5 text-danger" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-danger">{indicadores.ajustes}</p>
          <p className="text-xs text-muted mt-1">
            {indicadores.ajustes > 0 ? 'Aguardando reenvio' : 'Nenhum em correção'}
          </p>
        </button>
      </section>

      {/* Filtros e Busca */}
      <Card className="p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <Input
              label="Buscar por título"
              placeholder="Digite parte do título..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <Select
              label="Professor"
              value={filtroProfessor}
              onChange={e => setFiltroProfessor(e.target.value)}
              options={[
                { value: '', label: 'Todos os professores' },
                ...professores.map(u => ({ value: u.id, label: u.nome }))
              ]}
            />
          </div>

          <div className="md:col-span-3">
            <Select
              label="Status"
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as FiltroStatusDirecao)}
              options={[
                { value: 'todos', label: 'Todos os status' },
                { value: 'aguardando_revisao', label: 'Aguardando revisão' },
                { value: 'ajustes_solicitados', label: 'Ajustes solicitados' },
                { value: 'aprovado', label: 'Aprovados' },
                { value: 'rascunho', label: 'Rascunhos' }
              ]}
            />
          </div>

          <div className="md:col-span-2">
            <Button
              variant="secondary"
              onClick={limparFiltros}
              disabled={!temFiltrosAtivos}
              className="w-full"
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Listagem */}
      <section aria-labelledby="titulo-lista-planejamentos">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 id="titulo-lista-planejamentos" className="text-lg sm:text-xl font-bold text-primary">
            Planejamentos ({planejamentosFiltrados.length})
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Exibindo {planejamentosFiltrados.length} de {indicadores.total} registro
            {indicadores.total === 1 ? '' : 's'} em {anoAtual}
          </p>
        </div>

        {indicadores.total === 0 ? (
          <Card className="p-10 text-center">
            <FileText className="w-10 h-10 text-muted mx-auto mb-3" aria-hidden="true" />
            <h3 className="text-base font-bold text-primary mb-1">
              Nenhum planejamento registrado em {anoAtual}
            </h3>
            <p className="text-sm text-secondary max-w-md mx-auto">
              Alterne para um perfil fictício de professor para criar e enviar um planejamento neste ano ou selecione outro ano no cabeçalho.
            </p>
          </Card>
        ) : planejamentosFiltrados.length === 0 ? (
          <Card className="p-10 text-center">
            <SearchX className="w-10 h-10 text-muted mx-auto mb-3" aria-hidden="true" />
            <h3 className="text-base font-bold text-primary mb-1">
              Nenhum resultado encontrado
            </h3>
            <p className="text-sm text-secondary mb-4">
              Nenhum planejamento em {anoAtual} corresponde aos filtros atuais.
            </p>
            <Button variant="secondary" size="sm" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {planejamentosFiltrados.map(planej => {
              const professor = getProfessor(planej.professorId);
              const dataReferenciaEnvio = planej.reenviadoEm || planej.enviadoEm;
              const diasEspera =
                planej.status === 'aguardando_revisao'
                  ? DateHelpers.diasDesde(dataReferenciaEnvio)
                  : null;

              return (
                <Card key={planej.id} hover className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          aria-hidden="true"
                        >
                          {professor?.avatar || '??'}
                        </div>
                        <div className="min-w-0 mr-2">
                          <p className="text-sm font-semibold text-primary truncate">
                            {professor?.nome || 'Professor desconhecido'}
                          </p>
                          <p className="text-xs text-muted">
                            {DateHelpers.getNomeMes(planej.mes)} {planej.ano} · {planej.quinzena}ª
                            Quinzena · v{planej.versao}
                          </p>
                        </div>
                        <StatusBadge status={planej.status} size="sm" />
                        {diasEspera !== null && diasEspera > 2 && (
                          <Badge variant="danger" size="sm">
                            {diasEspera} dias em espera
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-primary break-words mb-1.5">
                        {planej.titulo || 'Rascunho sem título definido'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary">
                        {planej.disciplinas.length > 0 && (
                          <span>Disciplinas: {planej.disciplinas.join(', ')}</span>
                        )}
                        <span>{planej.objetivos.length} objetivo(s)</span>
                        {dataReferenciaEnvio ? (
                          <span>
                            {planej.reenviadoEm ? 'Reenviado' : 'Enviado'}:{' '}
                            {DateHelpers.formatarData(dataReferenciaEnvio)}
                          </span>
                        ) : (
                          <span>Atualizado: {DateHelpers.formatarData(planej.atualizadoEm)}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        variant={planej.status === 'aguardando_revisao' ? 'primary' : 'secondary'}
                        onClick={() => setPlanejamentoRevisao(planej.id)}
                        className="w-full sm:w-auto"
                      >
                        {planej.status === 'aguardando_revisao' ? (
                          <>
                            <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                            Revisar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" aria-hidden="true" />
                            Visualizar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

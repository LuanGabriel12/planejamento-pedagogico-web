import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Star,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  podeComentarPlanejamento,
  podeRevisarPlanejamento
} from '../../domain/stateMachine';
import { LIMITES_PLANEJAMENTO } from '../../domain/validation';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StatusBadge } from '../common/StatusBadge';
import { Textarea } from '../common/Textarea';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { HistoricoTimeline } from '../common/HistoricoTimeline';
import { DateHelpers } from '../../utils/dateHelpers';

interface PaginaRevisaoProps {
  planejamentoId: string;
  onClose: () => void;
  onProximo: () => void;
}

const SUGESTOES_RAPIDAS = [
  'Objetivos claros e bem alinhados ao período quinzenal.',
  'Detalhar melhor os critérios da metodologia de avaliação.',
  'Especificar os recursos necessários para cada etapa.',
  'Ampliar ou padronizar as referências bibliográficas.',
  'Incluir estratégia de acompanhamento para diferentes ritmos de aprendizagem.'
];

export const PaginaRevisao: React.FC<PaginaRevisaoProps> = ({
  planejamentoId,
  onClose,
  onProximo
}) => {
  const {
    estado,
    usuarioLogado,
    aprovarPlanejamentoDirecao,
    solicitarAjustesDirecao,
    comentarPlanejamentoDirecao
  } = useApp();

  const planejamento = estado.planejamentos.find(p => p.id === planejamentoId);
  const professor = planejamento
    ? estado.usuarios.find(u => u.id === planejamento.professorId)
    : null;

  const [feedback, setFeedback] = useState('');
  const [avaliacao, setAvaliacao] = useState<number>(0);
  const [confirmacao, setConfirmacao] = useState<'aprovar' | 'ajustes' | null>(null);

  if (!planejamento || !professor) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <p className="text-danger font-semibold mb-4">Planejamento não encontrado.</p>
        <Button variant="secondary" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar ao painel
        </Button>
      </div>
    );
  }

  const permissaoRevisao = podeRevisarPlanejamento(planejamento, usuarioLogado);
  const permissaoComentario = podeComentarPlanejamento(planejamento, usuarioLogado);

  const adicionarSugestao = (sugestao: string) => {
    setFeedback(prev => (prev.trim() ? `${prev.trim()}\n\n${sugestao}` : sugestao));
  };

  const confirmarAprovacao = () => {
    const res = aprovarPlanejamentoDirecao({
      planejamentoId: planejamento.id,
      feedback,
      avaliacao: avaliacao || undefined
    });
    setConfirmacao(null);
    if (res.ok) {
      setFeedback('');
      setAvaliacao(0);
      onProximo();
    }
  };

  const confirmarSolicitacaoAjustes = () => {
    const res = solicitarAjustesDirecao({
      planejamentoId: planejamento.id,
      feedback,
      avaliacao: avaliacao || undefined
    });
    setConfirmacao(null);
    if (res.ok) {
      setFeedback('');
      setAvaliacao(0);
      onProximo();
    }
  };

  const handleComentar = () => {
    const res = comentarPlanejamentoDirecao({
      planejamentoId: planejamento.id,
      feedback
    });
    if (res.ok) {
      setFeedback('');
    }
  };

  const feedbackTrimmedLen = feedback.trim().length;
  const ajusteValido = feedbackTrimmedLen >= LIMITES_PLANEJAMENTO.COMENTARIO_AJUSTE_MIN;
  const comentarioValido = feedbackTrimmedLen >= LIMITES_PLANEJAMENTO.COMENTARIO_MIN;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Topo */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={onClose} className="mb-1 -ml-2">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Voltar para a lista
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            Revisão de Planejamento
          </h1>
        </div>
        <StatusBadge status={planejamento.status} size="lg" />
      </div>

      {/* Layout responsivo: empilha em mobile/tablet e divide em desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna esquerda: conteúdo do planejamento */}
        <div className="lg:col-span-7 space-y-5">
          {/* Identificação */}
          <div className="bg-surface rounded-xl p-5 border border-base shadow-sm">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center text-base font-bold shrink-0"
                aria-hidden="true"
              >
                {professor.avatar}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-primary truncate">
                  {professor.nome}
                </h2>
                <p className="text-xs sm:text-sm text-secondary">
                  {DateHelpers.getNomeMes(planejamento.mes)} {planejamento.ano} ·{' '}
                  {planejamento.quinzena}ª Quinzena (
                  {DateHelpers.formatarPeriodo(planejamento.periodoInicio, planejamento.periodoFim)})
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Versão {planejamento.versao} ·{' '}
                  {planejamento.reenviadoEm
                    ? `Reenviado em ${DateHelpers.formatarDataHora(planejamento.reenviadoEm)}`
                    : planejamento.enviadoEm
                      ? `Enviado em ${DateHelpers.formatarDataHora(planejamento.enviadoEm)}`
                      : `Rascunho atualizado em ${DateHelpers.formatarDataHora(planejamento.atualizadoEm)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="bg-surface rounded-xl p-5 sm:p-6 border border-base shadow-sm space-y-5">
            <Section title="Título">
              <p className="text-base font-semibold text-primary">
                {planejamento.titulo || 'Rascunho sem título definido'}
              </p>
            </Section>

            <div className="grid sm:grid-cols-2 gap-4">
              <Section title="Disciplinas">
                {planejamento.disciplinas.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {planejamento.disciplinas.map(d => (
                      <Badge key={d} variant="info">
                        {d}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted italic">Não informado.</p>
                )}
              </Section>

              <Section title="Turmas">
                {planejamento.turmas.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {planejamento.turmas.map(t => (
                      <Badge key={t} variant="gray">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted italic">Não informado.</p>
                )}
              </Section>
            </div>

            <Section title="Experiência de aprendizagem">
              <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                {planejamento.experienciaAprendizagem || 'Não preenchido.'}
              </p>
            </Section>

            <Section title="Objetivos de aprendizagem">
              {planejamento.objetivos.length > 0 ? (
                <ol className="space-y-2 text-sm text-secondary">
                  {planejamento.objetivos.map((obj, idx) => (
                    <li key={obj.id} className="flex gap-2">
                      <span className="font-bold text-primary">{idx + 1}.</span>
                      <span>{obj.texto}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted italic">Nenhum objetivo informado.</p>
              )}
            </Section>

            {planejamento.recursosNecessarios.length > 0 && (
              <Section title="Recursos necessários">
                <p className="text-sm text-secondary">
                  {planejamento.recursosNecessarios.join(' · ')}
                </p>
              </Section>
            )}

            <Section title="Metodologia de avaliação">
              <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                {planejamento.metodologiaAvaliacao || 'Não preenchido.'}
              </p>
              {planejamento.instrumentosAvaliacao.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {planejamento.instrumentosAvaliacao.map(inst => (
                    <Badge key={inst} variant="info">
                      {inst}
                    </Badge>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Conclusão e resultados esperados">
              <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                {planejamento.conclusao || 'Não preenchido.'}
              </p>
            </Section>

            <Section title="Referências bibliográficas">
              {planejamento.referencias.length > 0 ? (
                <ol className="list-decimal list-inside space-y-1 text-sm text-secondary">
                  {planejamento.referencias.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted italic">Nenhuma referência informada.</p>
              )}
            </Section>

            {planejamento.observacoes && (
              <Section title="Observações adicionais">
                <p className="text-sm text-secondary whitespace-pre-wrap italic">
                  {planejamento.observacoes}
                </p>
              </Section>
            )}
          </div>
        </div>

        {/* Coluna direita: painel de decisão e histórico */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          <div className="bg-surface rounded-xl p-5 border border-base shadow-sm space-y-5">
            <h2 className="text-base font-bold text-primary">Ações da Direção</h2>

            {!permissaoRevisao.permitido && (
              <div
                role="note"
                className="p-3.5 rounded-lg bg-elevated border border-base flex items-start gap-2.5 text-xs sm:text-sm text-secondary"
              >
                <Lock className="w-4 h-4 text-muted shrink-0 mt-0.5" aria-hidden="true" />
                <p>{permissaoRevisao.motivo}</p>
              </div>
            )}

            {permissaoComentario.permitido && (
              <>
                <Textarea
                  label="Considerações da direção"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Escreva orientações claras ou observações sobre o planejamento..."
                  rows={5}
                  showCharCount
                  maxChars={LIMITES_PLANEJAMENTO.COMENTARIO_MAX}
                />

                {/* Sugestões rápidas */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                    Sugestões rápidas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGESTOES_RAPIDAS.map(sug => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => adicionarSugestao(sug)}
                        className="text-xs text-left px-2.5 py-1 rounded-lg bg-elevated border border-base text-secondary hover:text-primary hover:bg-hover transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avaliação opcional (apenas durante revisão ativa) */}
                {permissaoRevisao.permitido && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                        Avaliação (opcional)
                      </span>
                      {avaliacao > 0 && (
                        <button
                          type="button"
                          onClick={() => setAvaliacao(0)}
                          className="text-xs text-muted hover:text-primary underline"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1" role="group" aria-label="Avaliação de 1 a 5 estrelas">
                      {[1, 2, 3, 4, 5].map(estrela => (
                        <button
                          key={estrela}
                          type="button"
                          onClick={() => setAvaliacao(estrela)}
                          aria-label={`Avaliar com ${estrela} estrela${estrela > 1 ? 's' : ''}`}
                          aria-pressed={estrela <= avaliacao}
                          className={`p-1.5 rounded-lg transition-colors ${
                            estrela <= avaliacao
                              ? 'text-warning'
                              : 'text-muted hover:text-secondary'
                          }`}
                        >
                          <Star
                            className={`w-6 h-6 ${estrela <= avaliacao ? 'fill-current' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="space-y-2.5 pt-1">
                  {permissaoRevisao.permitido && (
                    <>
                      <Button
                        variant="success"
                        onClick={() => setConfirmacao('aprovar')}
                        className="w-full"
                      >
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        Aprovar planejamento
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => setConfirmacao('ajustes')}
                        disabled={!ajusteValido}
                        className="w-full"
                      >
                        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                        Solicitar ajustes
                      </Button>

                      {!ajusteValido && (
                        <p className="text-xs text-muted">
                          Para solicitar ajustes, escreva ao menos {LIMITES_PLANEJAMENTO.COMENTARIO_AJUSTE_MIN} caracteres descrevendo o que precisa ser revisado.
                        </p>
                      )}
                    </>
                  )}

                  <Button
                    variant="secondary"
                    onClick={handleComentar}
                    disabled={!comentarioValido}
                    className="w-full"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    Registrar comentário
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Histórico */}
          <div className="bg-surface rounded-xl p-5 border border-base shadow-sm">
            <h2 className="text-base font-bold text-primary mb-3">
              Histórico de envios e revisões
            </h2>
            <HistoricoTimeline itens={planejamento.historicoConsideracoes} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmacao === 'aprovar'}
        title="Confirmar aprovação simulada?"
        description="O planejamento será marcado como Aprovado e não poderá mais ser editado pelo professor nesta demonstração."
        confirmLabel="Confirmar aprovação"
        confirmVariant="success"
        onConfirm={confirmarAprovacao}
        onCancel={() => setConfirmacao(null)}
      />

      <ConfirmDialog
        isOpen={confirmacao === 'ajustes'}
        title="Confirmar solicitação de ajustes?"
        description="O planejamento retornará ao professor com status Ajustes solicitados para correção e reenvio."
        confirmLabel="Solicitar ajustes"
        confirmVariant="danger"
        onConfirm={confirmarSolicitacaoAjustes}
        onCancel={() => setConfirmacao(null)}
      />
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-2 pb-1.5 border-b border-base">
      {title}
    </h3>
    {children}
  </div>
);

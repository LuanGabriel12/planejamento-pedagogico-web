import React from 'react';
import { Edit3, CheckCircle2, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { podeEditarPlanejamento } from '../../domain/stateMachine';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StatusBadge } from '../common/StatusBadge';
import { HistoricoTimeline } from '../common/HistoricoTimeline';
import { DateHelpers } from '../../utils/dateHelpers';

interface VisualizadorPlanejamentoProps {
  planejamentoId: string;
  onClose: () => void;
  onEditar: (id: string) => void;
}

export const VisualizadorPlanejamento: React.FC<VisualizadorPlanejamentoProps> = ({
  planejamentoId,
  onClose,
  onEditar
}) => {
  const { estado, usuarioLogado } = useApp();
  const planejamento = estado.planejamentos.find(p => p.id === planejamentoId);
  const professor = estado.usuarios.find(u => u.id === planejamento?.professorId);

  if (!planejamento || !professor) return null;

  const permissaoEdicao = podeEditarPlanejamento(planejamento, usuarioLogado);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={planejamento.titulo || 'Planejamento sem título'}
      subtitle={`${DateHelpers.getNomeMes(planejamento.mes)} ${planejamento.ano} · ${planejamento.quinzena}ª Quinzena (${DateHelpers.formatarPeriodo(planejamento.periodoInicio, planejamento.periodoFim)}) · v${planejamento.versao}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {permissaoEdicao.permitido && (
            <Button variant="primary" onClick={() => onEditar(planejamento.id)}>
              <Edit3 className="w-4 h-4" aria-hidden="true" />
              {planejamento.status === 'ajustes_solicitados'
                ? 'Corrigir e reenviar'
                : 'Editar planejamento'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metadados */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-elevated border border-base">
          <div className="text-xs sm:text-sm text-secondary space-y-1">
            <p>
              <strong className="text-primary">Professor responsável:</strong> {professor.nome}
            </p>
            <p>
              <strong className="text-primary">Criado em:</strong>{' '}
              {DateHelpers.formatarDataHora(planejamento.criadoEm)}
            </p>
            {planejamento.enviadoEm && (
              <p>
                <strong className="text-primary">Enviado em:</strong>{' '}
                {DateHelpers.formatarDataHora(planejamento.enviadoEm)}
              </p>
            )}
            {planejamento.reenviadoEm && (
              <p>
                <strong className="text-primary">Último reenvio:</strong>{' '}
                {DateHelpers.formatarDataHora(planejamento.reenviadoEm)}
              </p>
            )}
            {planejamento.revisadoEm && (
              <p>
                <strong className="text-primary">Última revisão:</strong>{' '}
                {DateHelpers.formatarDataHora(planejamento.revisadoEm)}
              </p>
            )}
          </div>
          <StatusBadge status={planejamento.status} size="lg" />
        </div>

        {/* Destaque das considerações recentes da direção */}
        {planejamento.consideracoesDiretor && (
          <div
            className={`p-4 rounded-xl border ${
              planejamento.status === 'ajustes_solicitados'
                ? 'bg-danger/10 border-danger/30'
                : 'bg-success/10 border-success/30'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold text-primary">Considerações mais recentes da direção</h3>
              {planejamento.avaliacaoDiretor && (
                <div
                  className="inline-flex items-center gap-0.5 text-warning"
                  aria-label={`Avaliação: ${planejamento.avaliacaoDiretor} de 5 estrelas`}
                >
                  {Array.from({ length: planejamento.avaliacaoDiretor }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
              {planejamento.consideracoesDiretor}
            </p>
            {planejamento.prazoAjustes && planejamento.status === 'ajustes_solicitados' && (
              <p className="text-xs font-semibold text-danger mt-2">
                Prazo sugerido para ajustes: {DateHelpers.formatarDataHora(planejamento.prazoAjustes)}
              </p>
            )}
          </div>
        )}

        {/* Disciplinas e Turmas */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Section title="Disciplinas">
            {planejamento.disciplinas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {planejamento.disciplinas.map(disc => (
                  <Badge key={disc} variant="info">
                    {disc}
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
                {planejamento.turmas.map(turma => (
                  <Badge key={turma} variant="gray">
                    {turma}
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
            <ol className="space-y-2">
              {planejamento.objetivos.map((obj, index) => (
                <li key={obj.id} className="flex items-start gap-2.5 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-primary">{obj.texto}</p>
                    {obj.atingido && (
                      <span className="inline-flex items-center gap-1 text-xs text-success mt-0.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Objetivo marcado como atingido
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted italic">Nenhum objetivo cadastrado.</p>
          )}
        </Section>

        {planejamento.recursosNecessarios.length > 0 && (
          <Section title="Recursos necessários">
            <div className="flex flex-wrap gap-1.5">
              {planejamento.recursosNecessarios.map(recurso => (
                <Badge key={recurso} variant="gray">
                  {recurso}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        <Section title="Metodologia de avaliação">
          <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">
            {planejamento.metodologiaAvaliacao || 'Não preenchido.'}
          </p>
          {planejamento.instrumentosAvaliacao.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted uppercase mb-1.5">Instrumentos</p>
              <div className="flex flex-wrap gap-1.5">
                {planejamento.instrumentosAvaliacao.map(inst => (
                  <Badge key={inst} variant="info">
                    {inst}
                  </Badge>
                ))}
              </div>
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
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-secondary">
              {planejamento.referencias.map((ref, index) => (
                <li key={index}>{ref}</li>
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

        <Section title="Histórico de envios e revisões">
          <HistoricoTimeline itens={planejamento.historicoConsideracoes} />
        </Section>
      </div>
    </Modal>
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

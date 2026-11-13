import React from 'react';
import { X, Edit, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
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
  const { estado } = useApp();
  const planejamento = estado.planejamentos.find(p => p.id === planejamentoId);
  const professor = estado.usuarios.find(u => u.id === planejamento?.professorId);

  if (!planejamento || !professor) return null;

  // Status badge
  const getStatusBadge = () => {
    switch (planejamento.status) {
      case 'aprovado':
        return <Badge variant="success">✅ APROVADO</Badge>;
      case 'aguardando_revisao':
        return <Badge variant="warning">⏳ AGUARDANDO REVISÃO</Badge>;
      case 'ajustes_solicitados':
        return <Badge variant="danger">⚠️ AJUSTES SOLICITADOS</Badge>;
      case 'rascunho':
        return <Badge variant="info">📝 RASCUNHO</Badge>;
      default:
        return null;
    }
  };

  const podeEditar = planejamento.status === 'rascunho' || planejamento.status === 'ajustes_solicitados';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto bg-surface rounded-2xl shadow-2xl animate-scale-in border-2 border-base">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-surface border-b-2 border-base px-8 py-6 rounded-t-2xl shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                    PLANEJAMENTO PEDAGÓGICO QUINZENAL
                  </h2>
                  {getStatusBadge()}
                </div>
                <div className="text-sm font-medium text-text-muted space-y-1">
                  <p>📅 {DateHelpers.getNomeMes(planejamento.mes)} {planejamento.ano} - {planejamento.quinzena}ª Quinzena ({DateHelpers.formatarPeriodo(planejamento.periodoInicio, planejamento.periodoFim)})</p>
                  <p>👩‍🏫 Professor(a): {professor.nome}</p>
                  <p>📅 Criado em: {DateHelpers.formatarDataHora(planejamento.criadoEm)}</p>
                  {planejamento.enviadoEm && (
                    <p>📤 Enviado em: {DateHelpers.formatarDataHora(planejamento.enviadoEm)}</p>
                  )}
                  {planejamento.revisadoEm && (
                    <p>✅ Revisado em: {DateHelpers.formatarDataHora(planejamento.revisadoEm)}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-hover rounded-lg transition-all text-text-muted hover:text-text-primary active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-8 space-y-6 bg-surface">
            {/* Título */}
            <Section title="📋 TÍTULO">
              <p className="text-lg font-semibold text-text-primary">{planejamento.titulo}</p>
            </Section>

            {/* Disciplinas e Turmas */}
            <div className="grid md:grid-cols-2 gap-6">
              <Section title="📚 DISCIPLINAS">
                <div className="flex flex-wrap gap-2">
                  {planejamento.disciplinas.map(disc => (
                    <Badge key={disc} variant="info">{disc}</Badge>
                  ))}
                </div>
              </Section>

              <Section title="👥 TURMAS">
                <div className="flex flex-wrap gap-2">
                  {planejamento.turmas.map(turma => (
                    <Badge key={turma} variant="info">{turma}</Badge>
                  ))}
                </div>
              </Section>
            </div>

            {/* Experiência de Aprendizagem */}
            <Section title="🎯 EXPERIÊNCIA DE APRENDIZAGEM">
              <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                {planejamento.experienciaAprendizagem}
              </p>
            </Section>

            {/* Objetivos */}
            <Section title="🎓 OBJETIVOS DE APRENDIZAGEM">
              <ul className="space-y-3">
                {planejamento.objetivos.map((obj, index) => (
                  <li key={obj.id} className="flex items-start gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-primary text-on-primary rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-text-secondary font-medium">{obj.texto}</p>
                      {obj.atingido && (
                        <span className="inline-flex items-center gap-1 text-sm text-success mt-1 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Objetivo atingido
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Recursos Necessários */}
            {planejamento.recursosNecessarios.length > 0 && (
              <Section title="🛠️ RECURSOS NECESSÁRIOS">
                <div className="flex flex-wrap gap-2">
                  {planejamento.recursosNecessarios.map(recurso => (
                    <span key={recurso} className="px-3 py-1.5 bg-elevated border-2 border-base text-text-secondary rounded-lg text-sm font-medium shadow-sm">
                      • {recurso}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Metodologia de Avaliação */}
            <Section title="📊 METODOLOGIA DE AVALIAÇÃO">
              <p className="text-text-secondary whitespace-pre-wrap leading-relaxed mb-4">
                {planejamento.metodologiaAvaliacao}
              </p>
              {planejamento.instrumentosAvaliacao.length > 0 && (
                <>
                  <p className="font-semibold text-text-primary mb-2">Instrumentos:</p>
                  <div className="flex flex-wrap gap-2">
                    {planejamento.instrumentosAvaliacao.map(inst => (
                      <Badge key={inst} variant="info">{inst}</Badge>
                    ))}
                  </div>
                </>
              )}
            </Section>

            {/* Conclusão */}
            <Section title="✅ CONCLUSÃO E RESULTADOS ESPERADOS">
              <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                {planejamento.conclusao}
              </p>
            </Section>

            {/* Referências */}
            <Section title="📚 REFERÊNCIAS BIBLIOGRÁFICAS">
              <ol className="space-y-2">
                {planejamento.referencias.map((ref, index) => (
                  <li key={index} className="text-sm text-text-secondary">
                    <span className="font-bold">{index + 1}.</span> {ref}
                  </li>
                ))}
              </ol>
            </Section>

            {/* Observações */}
            {planejamento.observacoes && (
              <Section title="📝 OBSERVAÇÕES ADICIONAIS">
                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed italic">
                  {planejamento.observacoes}
                </p>
              </Section>
            )}

            {/* Considerações do Diretor */}
            {planejamento.consideracoesDiretor && (
              <div className={`p-6 rounded-lg border-2 shadow-md ${
                planejamento.status === 'ajustes_solicitados'
                  ? 'bg-danger/10 border-danger'
                  : 'bg-success/10 border-success'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-bold text-text-primary">
                    💬 CONSIDERAÇÕES DO DIRETOR
                  </h3>
                  {planejamento.avaliacaoDiretor && (
                    <span className="text-warning">
                      {'⭐'.repeat(planejamento.avaliacaoDiretor)}
                    </span>
                  )}
                </div>
                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {planejamento.consideracoesDiretor}
                </p>
                <p className="text-sm text-text-muted mt-3">
                  📅 {DateHelpers.formatarDataHora(planejamento.revisadoEm || planejamento.atualizadoEm)}
                </p>
                {planejamento.prazoAjustes && (
                  <p className="text-sm text-danger mt-2 font-semibold">
                    ⏰ Prazo para ajustes: {DateHelpers.formatarDataHora(planejamento.prazoAjustes)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-surface border-t-2 border-base px-6 py-4 flex items-center justify-between rounded-b-2xl shadow-lg">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>

            {podeEditar && (
              <Button variant="primary" onClick={() => onEditar(planejamento.id)}>
                <Edit className="w-5 h-5" />
                Editar Planejamento
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para seções
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-bold text-text-primary mb-3 pb-2 border-b-2 border-base">
      {title}
    </h3>
    {children}
  </div>
);


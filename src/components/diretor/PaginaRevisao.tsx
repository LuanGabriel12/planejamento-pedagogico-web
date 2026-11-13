import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Textarea } from '../common/Textarea';
import { DateHelpers } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

interface PaginaRevisaoProps {
  planejamentoId: string;
  onClose: () => void;
  onProximo: () => void;
}

export const PaginaRevisao: React.FC<PaginaRevisaoProps> = ({
  planejamentoId,
  onClose,
  onProximo
}) => {
  const { estado, atualizarPlanejamento, adicionarNotificacao } = useApp();
  const planejamento = estado.planejamentos.find(p => p.id === planejamentoId);
  const professor = planejamento ? estado.usuarios.find(u => u.id === planejamento.professorId) : null;

  const [feedback, setFeedback] = useState('');
  const [avaliacao, setAvaliacao] = useState(0);
  const [processando, setProcessando] = useState(false);

  // Sugestões rápidas
  const sugestoesRapidas = [
    'Excelente planejamento! Objetivos bem definidos.',
    'Sugestão: Detalhar mais a metodologia de avaliação.',
    'Adicionar mais referências bibliográficas atualizadas.',
    'Especificar melhor os recursos materiais necessários.',
    'Incluir indicadores mensuráveis de sucesso.',
    'Revisar formatação das referências (ABNT).',
    'Ótimo trabalho! Continue assim.',
    'Considere adicionar atividades de recuperação.'
  ];

  if (!planejamento || !professor) {
    return (
      <div className="p-8 text-center">
        <p className="text-danger font-semibold">Planejamento não encontrado</p>
        <Button onClick={onClose} className="mt-4">Voltar</Button>
      </div>
    );
  }

  // Adicionar sugestão ao feedback
  const adicionarSugestao = (sugestao: string) => {
    setFeedback(prev => prev ? `${prev}\n\n${sugestao}` : sugestao);
  };

  // APROVAR
  const handleAprovar = async () => {
    if (!window.confirm('Deseja aprovar este planejamento?')) return;

    setProcessando(true);

    try {
      // Atualizar planejamento
      atualizarPlanejamento(planejamento.id, {
        status: 'aprovado',
        revisadoEm: new Date().toISOString(),
        consideracoesDiretor: feedback || 'Planejamento aprovado!',
        avaliacaoDiretor: avaliacao || 5,
        historicoConsideracoes: [
          ...planejamento.historicoConsideracoes,
          {
            id: `hist_${Date.now()}`,
            texto: feedback || 'Planejamento aprovado!',
            tipo: 'aprovacao' as const,
            criadoEm: new Date().toISOString(),
            lido: false
          }
        ]
      });

      // Criar notificação
      adicionarNotificacao({
        usuarioId: professor.id,
        tipo: 'aprovacao',
        titulo: 'Planejamento Aprovado! 🎉',
        mensagem: `Seu planejamento de ${DateHelpers.getNomeMes(planejamento.mes)} (${planejamento.quinzena}ª quinzena) foi aprovado!`,
        planejamentoId: planejamento.id,
        lida: false,
        criadaEm: new Date().toISOString()
      });

      toast.success('Planejamento aprovado com sucesso! 🎉');
      onProximo();
    } catch (error) {
      toast.error('Erro ao aprovar planejamento');
    } finally {
      setProcessando(false);
    }
  };

  // SOLICITAR AJUSTES
  const handleSolicitarAjustes = async () => {
    if (!feedback.trim()) {
      toast.error('Por favor, escreva as considerações antes de solicitar ajustes!');
      return;
    }

    if (!window.confirm('Solicitar ajustes neste planejamento?')) return;

    setProcessando(true);

    try {
      const prazo = DateHelpers.adicionarDias(new Date().toISOString(), 2); // 48h

      // Atualizar planejamento
      atualizarPlanejamento(planejamento.id, {
        status: 'ajustes_solicitados',
        revisadoEm: new Date().toISOString(),
        consideracoesDiretor: feedback,
        avaliacaoDiretor: avaliacao,
        prazoAjustes: prazo,
        historicoConsideracoes: [
          ...planejamento.historicoConsideracoes,
          {
            id: `hist_${Date.now()}`,
            texto: feedback,
            tipo: 'ajuste' as const,
            criadoEm: new Date().toISOString(),
            lido: false
          }
        ]
      });

      // Criar notificação
      adicionarNotificacao({
        usuarioId: professor.id,
        tipo: 'ajuste',
        titulo: 'Ajustes Solicitados ⚠️',
        mensagem: `Seu planejamento de ${DateHelpers.getNomeMes(planejamento.mes)} (${planejamento.quinzena}ª quinzena) precisa de ajustes.`,
        planejamentoId: planejamento.id,
        lida: false,
        criadaEm: new Date().toISOString()
      });

      toast.success('Ajustes solicitados com sucesso!');
      onProximo();
    } catch (error) {
      toast.error('Erro ao solicitar ajustes');
    } finally {
      setProcessando(false);
    }
  };

  // APENAS COMENTAR
  const handleComentar = async () => {
    if (!feedback.trim()) {
      toast.error('Escreva um comentário primeiro!');
      return;
    }

    setProcessando(true);

    try {
      atualizarPlanejamento(planejamento.id, {
        historicoConsideracoes: [
          ...planejamento.historicoConsideracoes,
          {
            id: `hist_${Date.now()}`,
            texto: feedback,
            tipo: 'comentario' as const,
            criadoEm: new Date().toISOString(),
            lido: false
          }
        ]
      });

      // Criar notificação
      adicionarNotificacao({
        usuarioId: professor.id,
        tipo: 'comentario',
        titulo: 'Novo Comentário 💬',
        mensagem: `O diretor comentou seu planejamento de ${DateHelpers.getNomeMes(planejamento.mes)} (${planejamento.quinzena}ª quinzena).`,
        planejamentoId: planejamento.id,
        lida: false,
        criadaEm: new Date().toISOString()
      });

      toast.success('Comentário adicionado!');
      setFeedback('');
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-base">
      {/* Header */}
      <div className="bg-surface border-b-2 border-base px-6 py-4 shadow-md">
        <Button variant="ghost" onClick={onClose} className="mb-2">
          <ArrowLeft className="w-5 h-5" />
          Voltar para Lista
        </Button>
        <h1 className="text-2xl font-bold text-text-primary">REVISAR PLANEJAMENTO</h1>
      </div>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Esquerda: Planejamento (60%) */}
        <div className="w-3/5 overflow-y-auto p-6 bg-base">
          {/* Info do Professor */}
          <div className="bg-surface rounded-xl p-6 mb-6 shadow-lg border-2 border-base">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-hover text-on-primary rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
                {professor.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">{professor.nome}</h2>
                <p className="text-text-secondary">
                  {DateHelpers.getNomeMes(planejamento.mes)} {planejamento.ano} - {planejamento.quinzena}ª Quinzena
                </p>
                <p className="text-sm text-text-muted">
                  Enviado {DateHelpers.tempoDesde(planejamento.enviadoEm!)}
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo do Planejamento */}
          <div className="bg-surface rounded-xl p-6 shadow-lg space-y-6 border-2 border-base">
            <Section title="📋 TÍTULO">
              <p className="text-lg font-semibold text-text-primary">{planejamento.titulo}</p>
            </Section>

            <Section title="📚 DISCIPLINAS E TURMAS">
              <div className="flex gap-4">
                <div>
                  <p className="text-sm font-semibold text-text-secondary mb-2">Disciplinas:</p>
                  <p className="text-text-primary">{planejamento.disciplinas.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-secondary mb-2">Turmas:</p>
                  <p className="text-text-primary">{planejamento.turmas.join(', ')}</p>
                </div>
              </div>
            </Section>

            <Section title="🎯 EXPERIÊNCIA DE APRENDIZAGEM">
              <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                {planejamento.experienciaAprendizagem}
              </p>
            </Section>

            <Section title="🎓 OBJETIVOS">
              <ul className="space-y-2">
                {planejamento.objetivos.map((obj, i) => (
                  <li key={obj.id} className="flex gap-2">
                    <span className="font-bold text-primary">{i + 1}.</span>
                    <span className="text-text-secondary">{obj.texto}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {planejamento.recursosNecessarios.length > 0 && (
              <Section title="🛠️ RECURSOS">
                <p className="text-text-secondary">{planejamento.recursosNecessarios.join(' • ')}</p>
              </Section>
            )}

            <Section title="📊 METODOLOGIA DE AVALIAÇÃO">
              <p className="text-text-secondary whitespace-pre-wrap">{planejamento.metodologiaAvaliacao}</p>
            </Section>

            <Section title="✅ CONCLUSÃO">
              <p className="text-text-secondary whitespace-pre-wrap">{planejamento.conclusao}</p>
            </Section>

            <Section title="📚 REFERÊNCIAS">
              <ol className="space-y-1">
                {planejamento.referencias.map((ref, i) => (
                  <li key={i} className="text-sm text-text-secondary">
                    {i + 1}. {ref}
                  </li>
                ))}
              </ol>
            </Section>
          </div>
        </div>

        {/* Direita: Painel de Feedback (40%) */}
        <div className="w-2/5 bg-surface border-l-2 border-base overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">💬 Suas Considerações</h2>

          {/* Editor de Feedback */}
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Digite seu feedback detalhado aqui..."
            rows={8}
            showCharCount
            maxChars={2000}
            className="mb-4"
          />

          {/* Sugestões Rápidas */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">💡 Sugestões Rápidas:</h3>
            <div className="flex flex-wrap gap-2">
              {sugestoesRapidas.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => adicionarSugestao(sug)}
                  className="text-xs px-3 py-1.5 bg-primary/15 text-primary border-2 border-primary/30 rounded-full hover:bg-primary/25 hover:border-primary/50 transition-all font-medium"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Avaliação por Estrelas */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">⭐ Avaliação (opcional):</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setAvaliacao(star)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  {star <= avaliacao ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist de Revisão */}
          <div className="mb-6 p-4 bg-elevated rounded-lg border-2 border-base shadow-sm">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">📋 Checklist:</h3>
            <div className="space-y-2 text-sm text-text-primary">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Objetivos claros</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Metodologia adequada</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Recursos suficientes</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Avaliação detalhada</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Referências ABNT</span>
              </label>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <Button
              variant="success"
              onClick={handleAprovar}
              isLoading={processando}
              className="w-full text-lg py-4"
            >
              <CheckCircle2 className="w-6 h-6" />
              APROVAR PLANEJAMENTO
            </Button>

            <Button
              variant="danger"
              onClick={handleSolicitarAjustes}
              isLoading={processando}
              disabled={!feedback.trim()}
              className="w-full text-lg py-4"
            >
              <AlertTriangle className="w-6 h-6" />
              SOLICITAR AJUSTES
            </Button>

            <Button
              variant="primary"
              onClick={handleComentar}
              isLoading={processando}
              disabled={!feedback.trim()}
              className="w-full"
            >
              <MessageCircle className="w-5 h-5" />
              APENAS COMENTAR
            </Button>

            <Button
              variant="ghost"
              onClick={onProximo}
              className="w-full"
            >
              Pular para Próximo
            </Button>
          </div>

          {/* Info */}
          <div className="mt-6 p-3 bg-info/15 border-2 border-info/30 rounded-lg">
            <p className="text-xs text-info">
              ℹ️ Dica: Use as sugestões rápidas para agilizar o processo de revisão.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Section
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="font-bold text-text-primary mb-2 pb-2 border-b border-border-base">{title}</h3>
    {children}
  </div>
);


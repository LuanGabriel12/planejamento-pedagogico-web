import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DateHelpers } from '../../utils/dateHelpers';
import { FormularioPlanejamento } from './FormularioPlanejamento';
import { VisualizadorPlanejamento } from './VisualizadorPlanejamento';

export const ProfessorDashboard: React.FC = () => {
  const { estado, usuarioLogado, planejamentoParaAbrir, limparPlanejamentoParaAbrir } = useApp();
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

  if (!usuarioLogado) return null;

  const { anoAtual } = estado.configuracoes;
  const planejamentosProfessor = estado.planejamentos.filter(
    p => p.professorId === usuarioLogado.id && p.ano === anoAtual
  );

  // Calcular progresso
  const totalQuinzenas = 24;
  const concluidos = planejamentosProfessor.filter(p => p.status === 'aprovado').length;
  const progresso = Math.round((concluidos / totalQuinzenas) * 100);

  // Obter planejamento de uma quinzena específica
  const obterPlanejamento = (mes: number, quinzena: 1 | 2) => {
    return planejamentosProfessor.find(
      p => p.mes === mes && p.quinzena === quinzena
    );
  };

  // Criar novo planejamento
  const abrirFormularioCriar = (mes: number, quinzena: 1 | 2) => {
    setModalFormulario({ aberto: true, mes, quinzena });
  };

  // Editar planejamento
  const abrirFormularioEditar = (planejamentoId: string) => {
    const plan = estado.planejamentos.find(p => p.id === planejamentoId);
    if (plan) {
      setModalFormulario({
        aberto: true,
        mes: plan.mes,
        quinzena: plan.quinzena,
        planejamentoId
      });
    }
  };

  // Visualizar planejamento
  const visualizarPlanejamento = (planejamentoId: string) => {
    setModalVisualizador({ aberto: true, planejamentoId });
  };
  
  // Escutar notificações para abrir planejamentos
  useEffect(() => {
    if (planejamentoParaAbrir) {
      visualizarPlanejamento(planejamentoParaAbrir);
      limparPlanejamentoParaAbrir();
    }
  }, [planejamentoParaAbrir]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header com Progresso */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Bem-vindo(a), {usuarioLogado.nome}! 👋
            </h1>
            <p className="text-sm md:text-base text-secondary mt-1">
              Você completou {concluidos} de {totalQuinzenas} planejamentos este ano ({progresso}%)
            </p>
          </div>
          <Button variant="primary" onClick={() => {
            for (let mes = 1; mes <= 12; mes++) {
              for (const quinzena of [1, 2] as const) {
                if (!obterPlanejamento(mes, quinzena)) { abrirFormularioCriar(mes, quinzena); return; }
              }
            }
            alert('Todas as quinzenas já possuem planejamento.');
          }} className="w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Criar Novo</span>
            <span className="sm:hidden">Novo Planejamento</span>
          </Button>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-elevated rounded-full h-4 overflow-hidden border-2 border-base shadow-inner">
          <div
            className="bg-gradient-to-r from-primary to-primary-hover h-full transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${progresso}%` }}
          >
            {progresso > 10 && (
              <span className="text-xs font-medium text-white">{progresso}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Meses */}
      <div className="space-y-4 md:space-y-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(mes => (
          <Card key={mes} className="p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">
              {DateHelpers.getNomeMes(mes).toUpperCase()} {anoAtual}
            </h2>

            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
              {/* 1ª Quinzena */}
              <QuinzenaCard
                mes={mes}
                quinzena={1}
                ano={anoAtual}
                planejamento={obterPlanejamento(mes, 1)}
                onCriar={() => abrirFormularioCriar(mes, 1)}
                onEditar={abrirFormularioEditar}
                onVisualizar={visualizarPlanejamento}
              />

              {/* 2ª Quinzena */}
              <QuinzenaCard
                mes={mes}
                quinzena={2}
                ano={anoAtual}
                planejamento={obterPlanejamento(mes, 2)}
                onCriar={() => abrirFormularioCriar(mes, 2)}
                onEditar={abrirFormularioEditar}
                onVisualizar={visualizarPlanejamento}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Formulário */}
      {modalFormulario.aberto && (
        <FormularioPlanejamento
          mes={modalFormulario.mes}
          quinzena={modalFormulario.quinzena}
          planejamentoId={modalFormulario.planejamentoId}
          onClose={() => setModalFormulario({ aberto: false, mes: 1, quinzena: 1 })}
        />
      )}

      {/* Modal de Visualização */}
      {modalVisualizador.aberto && modalVisualizador.planejamentoId && (
        <VisualizadorPlanejamento
          planejamentoId={modalVisualizador.planejamentoId}
          onClose={() => setModalVisualizador({ aberto: false, planejamentoId: null })}
          onEditar={abrirFormularioEditar}
        />
      )}
    </div>
  );
};

// Componente Card de Quinzena
interface QuinzenaCardProps {
  mes: number;
  quinzena: 1 | 2;
  ano: number;
  planejamento?: any;
  onCriar: () => void;
  onEditar: (id: string) => void;
  onVisualizar: (id: string) => void;
}

const QuinzenaCard: React.FC<QuinzenaCardProps> = ({
  mes,
  quinzena,
  ano,
  planejamento,
  onCriar,
  onEditar,
  onVisualizar
}) => {
  const { periodoInicio, periodoFim } = DateHelpers.calcularPeriodo(ano, mes, quinzena);

  // Definir cor e estilo baseado no status
  const getStatusConfig = () => {
    if (!planejamento) {
      return {
        bg: 'bg-elevated',
        border: 'border-base border-dashed',
        badge: <Badge variant="gray">⚪ Não criado</Badge>,
        animacao: ''
      };
    }

    switch (planejamento.status) {
      case 'aprovado':
        return {
          bg: 'bg-surface',
          border: 'border-success border-2',
          badge: <Badge variant="success">✅ Aprovado</Badge>,
          animacao: ''
        };
      case 'aguardando_revisao':
        return {
          bg: 'bg-surface',
          border: 'border-warning border-2',
          badge: <Badge variant="warning">⏳ Aguardando</Badge>,
          animacao: 'animate-pulse-soft'
        };
      case 'ajustes_solicitados':
        return {
          bg: 'bg-surface',
          border: 'border-danger border-2',
          badge: <Badge variant="danger">⚠️ Ajustes</Badge>,
          animacao: 'animate-shake'
        };
      case 'rascunho':
        return {
          bg: 'bg-surface',
          border: 'border-info border-2 border-dashed',
          badge: <Badge variant="info">📝 Rascunho</Badge>,
          animacao: ''
        };
      default:
        return {
          bg: 'bg-surface',
          border: 'border-base border-2',
          badge: <Badge variant="gray">⚪ Não criado</Badge>,
          animacao: ''
        };
    }
  };

  const { bg, border, badge, animacao } = getStatusConfig();

  return (
    <div
      className={`p-3 md:p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg shadow-md ${bg} ${border} ${animacao}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm md:text-base font-bold text-primary">
            {quinzena}ª Quinzena
          </h3>
          <p className="text-xs md:text-sm text-secondary">
            {DateHelpers.formatarPeriodo(periodoInicio, periodoFim)}
          </p>
        </div>
        {badge}
      </div>

      {planejamento ? (
        <>
          <p className="text-xs md:text-sm font-medium text-primary mb-2 line-clamp-2 break-words">
            {planejamento.titulo}
          </p>
          <p className="text-xs text-muted mb-3">
            {planejamento.enviadoEm ? 'Enviado' : 'Criado'}: {DateHelpers.formatarData(planejamento.enviadoEm || planejamento.criadoEm)}
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={() => onVisualizar(planejamento.id)}
              className="flex-1 text-xs md:text-sm py-2"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Detalhes</span>
              <span className="sm:hidden">Detalhes</span>
            </Button>
            {(planejamento.status === 'rascunho' || planejamento.status === 'ajustes_solicitados') && (
              <Button
                variant="primary"
                onClick={() => onEditar(planejamento.id)}
                className="flex-1 text-xs md:text-sm py-2"
              >
                Editar
              </Button>
            )}
          </div>
        </>
      ) : (
        <Button
          variant="primary"
          onClick={onCriar}
          className="w-full text-xs md:text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Criar Planejamento</span>
          <span className="sm:hidden">Criar</span>
        </Button>
      )}
    </div>
  );
};


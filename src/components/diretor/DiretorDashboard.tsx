import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { DateHelpers } from '../../utils/dateHelpers';
import { PaginaRevisao } from './PaginaRevisao';

export const DiretorDashboard: React.FC = () => {
  const { estado, planejamentoParaAbrir, limparPlanejamentoParaAbrir } = useApp();
  const [busca, setBusca] = useState('');
  const [filtroProfessor, setFiltroProfessor] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [planejamentoRevisao, setPlanejamentoRevisao] = useState<string | null>(null);

  const { anoAtual } = estado.configuracoes;
  const planejamentos = estado.planejamentos.filter(p => p.ano === anoAtual);

  // Estatísticas
  const total = planejamentos.length;
  const pendentes = planejamentos.filter(p => p.status === 'aguardando_revisao');
  const aprovados = planejamentos.filter(p => p.status === 'aprovado');
  const ajustes = planejamentos.filter(p => p.status === 'ajustes_solicitados');

  // Filtrar planejamentos
  let planejamentosFiltrados = filtroStatus 
    ? planejamentos.filter(p => p.status === filtroStatus)
    : pendentes; // Por padrão, mostrar pendentes

  if (busca) {
    planejamentosFiltrados = planejamentosFiltrados.filter(p =>
      p.titulo.toLowerCase().includes(busca.toLowerCase())
    );
  }

  if (filtroProfessor) {
    planejamentosFiltrados = planejamentosFiltrados.filter(p => p.professorId === filtroProfessor);
  }

  // Ordenar por mais antigos primeiro (se tiver enviadoEm) ou por criação
  planejamentosFiltrados.sort((a, b) => {
    const dataA = a.enviadoEm || a.criadoEm;
    const dataB = b.enviadoEm || b.criadoEm;
    return new Date(dataA).getTime() - new Date(dataB).getTime();
  });

  // Obter professor
  const getProfessor = (id: string) => {
    return estado.usuarios.find(u => u.id === id);
  };
  
  // Escutar notificações para abrir planejamentos
  useEffect(() => {
    if (planejamentoParaAbrir) {
      setPlanejamentoRevisao(planejamentoParaAbrir);
      limparPlanejamentoParaAbrir();
    }
  }, [planejamentoParaAbrir]);

  // Se está revisando um planejamento
  if (planejamentoRevisao) {
    return (
      <PaginaRevisao
        planejamentoId={planejamentoRevisao}
        onClose={() => setPlanejamentoRevisao(null)}
        onProximo={() => {
          // Ir para o próximo pendente
          const index = planejamentosFiltrados.findIndex(p => p.id === planejamentoRevisao);
          if (index < planejamentosFiltrados.length - 1) {
            setPlanejamentoRevisao(planejamentosFiltrados[index + 1].id);
          } else {
            setPlanejamentoRevisao(null);
          }
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Dashboard do Diretor 👔
        </h1>
        <p className="text-secondary">
          Gerencie e revise os planejamentos pedagógicos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total */}
        <Card hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted mb-1">TOTAL</p>
              <p className="text-3xl font-bold text-primary">{total}</p>
            </div>
            <div className="p-3 bg-elevated rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Pendentes */}
        <Card hover className="p-6 bg-surface border-2 border-warning cursor-pointer" onClick={() => setFiltroStatus('aguardando_revisao')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning mb-1 font-medium">PENDENTES</p>
              <p className="text-3xl font-bold text-warning">{pendentes.length}</p>
              <p className="text-xs text-warning/80 mt-1">
                {pendentes.length > 0 ? 'Revisar agora! 🔴' : 'Tudo em dia!'}
              </p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg animate-pulse-soft">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>

        {/* Aprovados */}
        <Card hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted mb-1">APROVADOS</p>
              <p className="text-3xl font-bold text-success">{aprovados.length}</p>
              <p className="text-xs text-muted mt-1">
                {Math.round((aprovados.length / Math.max(total, 1)) * 100)}% do total
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        {/* Ajustes */}
        <Card hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted mb-1">AJUSTES</p>
              <p className="text-3xl font-bold text-danger">{ajustes.length}</p>
              <p className="text-xs text-muted mt-1">
                {ajustes.length > 0 ? 'Aguardando retorno' : 'Nenhum pendente'}
              </p>
            </div>
            <div className="p-3 bg-danger/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-danger" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-primary mb-4">🔍 Filtros e Busca</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar por título..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          
          <Select
            value={filtroProfessor}
            onChange={e => setFiltroProfessor(e.target.value)}
            options={[
              { value: '', label: 'Todos os professores' },
              ...estado.usuarios
                .filter(u => u.role === 'professor')
                .map(u => ({ value: u.id, label: u.nome }))
            ]}
          />
          
          <Select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            options={[
              { value: '', label: 'Pendentes (padrão)' },
              { value: 'aguardando_revisao', label: '⏳ Aguardando Revisão' },
              { value: 'aprovado', label: '✅ Aprovados' },
              { value: 'ajustes_solicitados', label: '⚠️ Ajustes Solicitados' },
              { value: 'rascunho', label: '📝 Rascunhos' }
            ]}
          />

          <Button
            variant="ghost"
            onClick={() => {
              setBusca('');
              setFiltroProfessor('');
              setFiltroStatus('');
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Lista de Planejamentos */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-4">
          📋 {filtroStatus ? 'PLANEJAMENTOS' : 'PLANEJAMENTOS PENDENTES'} ({planejamentosFiltrados.length})
        </h2>

        {planejamentosFiltrados.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">
              Tudo em dia! 🎉
            </h3>
            <p className="text-secondary">
              Nenhum planejamento corresponde aos filtros selecionados.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {planejamentosFiltrados.map(planej => {
              const professor = getProfessor(planej.professorId);
              const diasEspera = Math.floor((Date.now() - new Date(planej.enviadoEm!).getTime()) / (1000 * 60 * 60 * 24));

              // Badge de status
              const getStatusBadge = () => {
                switch (planej.status) {
                  case 'aguardando_revisao':
                    return <Badge variant="warning">⏳ Aguardando</Badge>;
                  case 'aprovado':
                    return <Badge variant="success">✅ Aprovado</Badge>;
                  case 'ajustes_solicitados':
                    return <Badge variant="danger">⚠️ Ajustes</Badge>;
                  case 'rascunho':
                    return <Badge variant="info">📝 Rascunho</Badge>;
                  default:
                    return null;
                }
              };

              return (
                <Card key={planej.id} hover className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                          {professor?.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-primary">{professor?.nome}</p>
                          <p className="text-sm text-secondary">
                            {DateHelpers.getNomeMes(planej.mes)} {planej.ano} - {planej.quinzena}ª Quinzena
                          </p>
                        </div>
                        {getStatusBadge()}
                        {planej.status === 'aguardando_revisao' && diasEspera > 2 && (
                          <Badge variant="danger" className="animate-pulse-soft">
                            ⏰ {diasEspera} dias
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {planej.titulo}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-secondary flex-wrap">
                        {planej.enviadoEm && (
                          <span>📤 Enviado: {DateHelpers.tempoDesde(planej.enviadoEm)}</span>
                        )}
                        {planej.revisadoEm && (
                          <span>✅ Revisado: {DateHelpers.tempoDesde(planej.revisadoEm)}</span>
                        )}
                        <span>🎯 {planej.objetivos.length} objetivos</span>
                        <span>📚 {planej.disciplinas.join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      <Button
                        variant={planej.status === 'aguardando_revisao' ? 'primary' : 'ghost'}
                        onClick={() => setPlanejamentoRevisao(planej.id)}
                      >
                        {planej.status === 'aguardando_revisao' ? '✅ Revisar Agora' : '👁️ Visualizar'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


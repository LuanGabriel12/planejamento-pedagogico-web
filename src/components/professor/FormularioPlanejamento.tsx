import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Send, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Planejamento, Objetivo } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { DateHelpers } from '../../utils/dateHelpers';
import { ValidationHelpers } from '../../utils/validationHelpers';
import { disciplinasDisponiveis, turmasDisponiveis, instrumentosAvaliacaoDisponiveis } from '../../data/initialData';
import toast from 'react-hot-toast';

interface FormularioPlanejamentoProps {
  mes: number;
  quinzena: 1 | 2;
  planejamentoId?: string;
  onClose: () => void;
}

export const FormularioPlanejamento: React.FC<FormularioPlanejamentoProps> = ({
  mes,
  quinzena,
  planejamentoId,
  onClose
}) => {
  const { estado, usuarioLogado, adicionarPlanejamento, atualizarPlanejamento } = useApp();
  const { anoAtual } = estado.configuracoes;
  const idSalvo = useRef<string | undefined>(planejamentoId);

  // Carregar planejamento existente se for edição
  const planejamentoExistente = planejamentoId
    ? estado.planejamentos.find(p => p.id === planejamentoId)
    : undefined;

  const { periodoInicio: inicio, periodoFim: fim } = DateHelpers.calcularPeriodo(anoAtual, mes, quinzena);

  // Estado do formulário
  const [form, setForm] = useState({
    titulo: planejamentoExistente?.titulo || '',
    disciplinas: planejamentoExistente?.disciplinas || [],
    turmas: planejamentoExistente?.turmas || [],
    experienciaAprendizagem: planejamentoExistente?.experienciaAprendizagem || '',
    objetivos: planejamentoExistente?.objetivos || [],
    recursosNecessarios: planejamentoExistente?.recursosNecessarios || [],
    metodologiaAvaliacao: planejamentoExistente?.metodologiaAvaliacao || '',
    instrumentosAvaliacao: planejamentoExistente?.instrumentosAvaliacao || [],
    conclusao: planejamentoExistente?.conclusao || '',
    referencias: planejamentoExistente?.referencias || [],
    observacoes: planejamentoExistente?.observacoes || ''
  });

  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tocado, setTocado] = useState<Record<string, boolean>>({});

  // Novo objetivo
  const [novoObjetivo, setNovoObjetivo] = useState('');
  const [novaReferencia, setNovaReferencia] = useState('');
  const [novoRecurso, setNovoRecurso] = useState('');

  // Validar campo específico
  const validarCampo = (campo: string, valor: any) => {
    const novosErros = { ...erros };
    
    switch (campo) {
      case 'titulo':
        if (!valor || valor.trim().length < 10) {
          novosErros.titulo = 'Título deve ter no mínimo 10 caracteres';
        } else if (valor.length > 100) {
          novosErros.titulo = 'Título deve ter no máximo 100 caracteres';
        } else {
          delete novosErros.titulo;
        }
        break;
      
      case 'disciplinas':
        if (!valor || valor.length === 0) {
          novosErros.disciplinas = 'Selecione pelo menos uma disciplina';
        } else {
          delete novosErros.disciplinas;
        }
        break;
      
      case 'turmas':
        if (!valor || valor.length === 0) {
          novosErros.turmas = 'Selecione pelo menos uma turma';
        } else {
          delete novosErros.turmas;
        }
        break;
      
      case 'experienciaAprendizagem':
        if (!valor || valor.trim().length < 100) {
          novosErros.experienciaAprendizagem = 'Deve ter no mínimo 100 caracteres';
        } else {
          delete novosErros.experienciaAprendizagem;
        }
        break;
      
      case 'objetivos':
        if (!valor || valor.length < 2) {
          novosErros.objetivos = 'Adicione no mínimo 2 objetivos';
        } else {
          delete novosErros.objetivos;
        }
        break;
      
      case 'metodologiaAvaliacao':
        if (!valor || valor.trim().length < 50) {
          novosErros.metodologiaAvaliacao = 'Deve ter no mínimo 50 caracteres';
        } else {
          delete novosErros.metodologiaAvaliacao;
        }
        break;
      
      case 'conclusao':
        if (!valor || valor.trim().length < 50) {
          novosErros.conclusao = 'Deve ter no mínimo 50 caracteres';
        } else {
          delete novosErros.conclusao;
        }
        break;
      
      case 'referencias':
        if (!valor || valor.length < 1) {
          novosErros.referencias = 'Adicione pelo menos uma referência';
        } else {
          delete novosErros.referencias;
        }
        break;
    }
    
    setErros(novosErros);
  };

  // Salvar automaticamente a cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (!planejamentoId && Object.values(form).some(v => v && (Array.isArray(v) ? v.length > 0 : v.length > 0))) {
        handleSalvarRascunho(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [form]);

  // Adicionar objetivo
  const adicionarObjetivo = () => {
    if (!novoObjetivo.trim()) return;

    const objetivo: Objetivo = {
      id: `obj_${Date.now()}`,
      texto: novoObjetivo,
      atingido: false
    };

    const novosObjetivos = [...form.objetivos, objetivo];
    setForm(prev => ({
      ...prev,
      objetivos: novosObjetivos
    }));
    setNovoObjetivo('');
    setTocado(prev => ({ ...prev, objetivos: true }));
    validarCampo('objetivos', novosObjetivos);
  };

  // Remover objetivo
  const removerObjetivo = (id: string) => {
    const novosObjetivos = form.objetivos.filter(o => o.id !== id);
    setForm(prev => ({
      ...prev,
      objetivos: novosObjetivos
    }));
    setTocado(prev => ({ ...prev, objetivos: true }));
    validarCampo('objetivos', novosObjetivos);
  };

  // Adicionar referência
  const adicionarReferencia = () => {
    if (!novaReferencia.trim()) return;

    const novasReferencias = [...form.referencias, novaReferencia];
    setForm(prev => ({
      ...prev,
      referencias: novasReferencias
    }));
    setNovaReferencia('');
    setTocado(prev => ({ ...prev, referencias: true }));
    validarCampo('referencias', novasReferencias);
  };

  // Remover referência
  const removerReferencia = (index: number) => {
    const novasReferencias = form.referencias.filter((_, i) => i !== index);
    setForm(prev => ({
      ...prev,
      referencias: novasReferencias
    }));
    setTocado(prev => ({ ...prev, referencias: true }));
    validarCampo('referencias', novasReferencias);
  };

  // Adicionar recurso
  const adicionarRecurso = () => {
    if (!novoRecurso.trim()) return;
    
    // Verificar se já existe
    if (form.recursosNecessarios.includes(novoRecurso)) {
      toast.error('Este recurso já foi adicionado!');
      return;
    }

    setForm(prev => ({
      ...prev,
      recursosNecessarios: [...prev.recursosNecessarios, novoRecurso]
    }));
    setNovoRecurso('');
  };

  // Remover recurso
  const removerRecurso = (recurso: string) => {
    setForm(prev => ({
      ...prev,
      recursosNecessarios: prev.recursosNecessarios.filter(r => r !== recurso)
    }));
  };

  // Toggle disciplina
  const toggleDisciplina = (disc: string) => {
    const novasDisciplinas = form.disciplinas.includes(disc)
      ? form.disciplinas.filter(d => d !== disc)
      : [...form.disciplinas, disc];
    
    setForm(prev => ({
      ...prev,
      disciplinas: novasDisciplinas
    }));
    setTocado(prev => ({ ...prev, disciplinas: true }));
    validarCampo('disciplinas', novasDisciplinas);
  };

  // Toggle turma
  const toggleTurma = (turma: string) => {
    const novasTurmas = form.turmas.includes(turma)
      ? form.turmas.filter(t => t !== turma)
      : [...form.turmas, turma];
    
    setForm(prev => ({
      ...prev,
      turmas: novasTurmas
    }));
    setTocado(prev => ({ ...prev, turmas: true }));
    validarCampo('turmas', novasTurmas);
  };

  // Toggle instrumento de avaliação
  const toggleInstrumento = (inst: string) => {
    setForm(prev => ({
      ...prev,
      instrumentosAvaliacao: prev.instrumentosAvaliacao.includes(inst)
        ? prev.instrumentosAvaliacao.filter(i => i !== inst)
        : [...prev.instrumentosAvaliacao, inst]
    }));
  };

  // Salvar como rascunho
  const handleSalvarRascunho = async (auto = false) => {
    if (!usuarioLogado) return;

    setSalvando(true);

    try {
      const planejamento: Omit<Planejamento, 'id'> = {
        professorId: usuarioLogado.id,
        ano: anoAtual,
        mes,
        quinzena,
        periodoInicio: inicio,
        periodoFim: fim,
        ...form,
        status: 'rascunho',
        criadoEm: planejamentoExistente?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        historicoConsideracoes: planejamentoExistente?.historicoConsideracoes || [],
        versao: (planejamentoExistente?.versao || 0) + 1
      };

      if (idSalvo.current) {
        atualizarPlanejamento(idSalvo.current, planejamento);
      } else {
        idSalvo.current = adicionarPlanejamento(planejamento);
      }

      if (!auto) {
        toast.success('Rascunho salvo com sucesso! ✓');
      }
    } catch (error) {
      toast.error('Erro ao salvar rascunho');
    } finally {
      setSalvando(false);
    }
  };

  // Enviar para revisão
  const handleEnviar = async () => {
    if (!usuarioLogado) return;

    // Validar
    const resultado = ValidationHelpers.validarPlanejamento(form);
    
    if (!resultado.valido) {
      toast.error('Preencha todos os campos obrigatórios!');
      // Mostrar erros
      const novosErros: Record<string, string> = {};
      resultado.erros.forEach((erro, index) => {
        novosErros[`erro_${index}`] = erro;
      });
      setErros(novosErros);
      return;
    }

    setEnviando(true);

    try {
      const planejamento: Omit<Planejamento, 'id'> = {
        professorId: usuarioLogado.id,
        ano: anoAtual,
        mes,
        quinzena,
        periodoInicio: inicio,
        periodoFim: fim,
        ...form,
        status: 'aguardando_revisao',
        criadoEm: planejamentoExistente?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        enviadoEm: new Date().toISOString(),
        historicoConsideracoes: planejamentoExistente?.historicoConsideracoes || [],
        versao: (planejamentoExistente?.versao || 0) + 1
      };

      if (idSalvo.current) {
        atualizarPlanejamento(idSalvo.current, planejamento);
      } else {
        idSalvo.current = adicionarPlanejamento(planejamento);
      }

      toast.success('Planejamento enviado para revisão! 🎉');
      onClose();
    } catch (error) {
      toast.error('Erro ao enviar planejamento');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto bg-surface rounded-2xl shadow-2xl animate-scale-in border-2 border-base">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-surface border-b-2 border-base px-4 md:px-8 py-4 md:py-6 flex items-center justify-between rounded-t-2xl shadow-md">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-text-primary tracking-tight">
                {planejamentoId ? 'Editar' : 'Criar'} Planejamento
              </h2>
              <p className="text-xs md:text-sm font-medium text-text-muted mt-1">
                {DateHelpers.getNomeMes(mes)} {anoAtual} - {quinzena}ª Quinzena
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-lg transition-all text-text-muted hover:text-text-primary active:scale-95"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Formulário */}
          <div className="p-8 space-y-6 bg-surface">
            {/* Erros */}
            {Object.keys(erros).length > 0 && (
              <div className="bg-danger/15 border-2 border-danger/30 rounded-lg p-4">
                <h3 className="font-bold text-danger mb-2">Erros encontrados:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {Object.values(erros).map((erro, i) => (
                    <li key={i} className="text-sm text-danger">{erro}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Título */}
            <Input
              label="Título do Planejamento"
              required
              value={form.titulo}
              onChange={e => {
                const novoTitulo = e.target.value;
                setForm(prev => ({ ...prev, titulo: novoTitulo }));
                if (tocado.titulo) {
                  validarCampo('titulo', novoTitulo);
                }
              }}
              onBlur={() => {
                setTocado(prev => ({ ...prev, titulo: true }));
                validarCampo('titulo', form.titulo);
              }}
              placeholder="Ex: Alfabetização - Introdução às Vogais"
              maxLength={100}
              error={tocado.titulo ? erros.titulo : undefined}
              success={tocado.titulo && !erros.titulo && form.titulo.length >= 10}
              helperText={!erros.titulo ? `${form.titulo.length}/100 caracteres` : undefined}
            />

            {/* Disciplinas */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Disciplinas <span className="text-danger">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {disciplinasDisponiveis.map(disc => (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => toggleDisciplina(disc)}
                    className={`px-3 py-2 text-sm md:px-4 md:text-base rounded-lg border-2 transition-all ${
                      form.disciplinas.includes(disc)
                        ? 'bg-primary text-white border-primary shadow-md hover:shadow-lg hover:bg-primary-hover'
                        : 'bg-surface text-primary border-base hover:border-primary hover:bg-hover shadow-md'
                    }`}
                  >
                    {disc}
                  </button>
                ))}
              </div>
              {tocado.disciplinas && erros.disciplinas && (
                <p className="mt-2 text-sm text-danger flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {erros.disciplinas}
                </p>
              )}
            </div>

            {/* Turmas */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Turmas <span className="text-danger">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {turmasDisponiveis.map(turma => (
                  <button
                    key={turma}
                    type="button"
                    onClick={() => toggleTurma(turma)}
                    className={`px-3 py-2 text-sm md:px-4 md:text-base rounded-lg border-2 transition-all ${
                      form.turmas.includes(turma)
                        ? 'bg-primary text-white border-primary shadow-md hover:shadow-lg hover:bg-primary-hover'
                        : 'bg-surface text-primary border-base hover:border-primary hover:bg-hover shadow-md'
                    }`}
                  >
                    {turma}
                  </button>
                ))}
              </div>
              {tocado.turmas && erros.turmas && (
                <p className="mt-2 text-sm text-danger flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {erros.turmas}
                </p>
              )}
            </div>

            {/* Experiência de Aprendizagem */}
            <Textarea
              label="Experiência de Aprendizagem"
              required
              value={form.experienciaAprendizagem}
              onChange={e => {
                const novoValor = e.target.value;
                setForm(prev => ({ ...prev, experienciaAprendizagem: novoValor }));
                if (tocado.experienciaAprendizagem) {
                  validarCampo('experienciaAprendizagem', novoValor);
                }
              }}
              onBlur={() => {
                setTocado(prev => ({ ...prev, experienciaAprendizagem: true }));
                validarCampo('experienciaAprendizagem', form.experienciaAprendizagem);
              }}
              placeholder="Descreva as atividades, metodologias e dinâmicas que serão utilizadas..."
              rows={5}
              showCharCount
              minChars={100}
              maxChars={5000}
              error={tocado.experienciaAprendizagem ? erros.experienciaAprendizagem : undefined}
              success={tocado.experienciaAprendizagem && !erros.experienciaAprendizagem && form.experienciaAprendizagem.length >= 100}
            />

            {/* Objetivos */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Objetivos de Aprendizagem <span className="text-danger">*</span> (mínimo 2)
              </label>
              
              {/* Lista de objetivos */}
              <div className="space-y-2 mb-3">
                {form.objetivos.map((obj, index) => (
                  <div key={obj.id} className="flex items-start gap-2 p-3 bg-elevated rounded-lg border-2 border-base shadow-md">
                    <span className="font-bold text-muted mt-1 text-sm md:text-base">{index + 1}.</span>
                    <p className="flex-1 text-primary text-sm md:text-base break-words">{obj.texto}</p>
                    <button
                      type="button"
                      onClick={() => removerObjetivo(obj.id)}
                      className="p-1 text-danger hover:bg-danger/10 rounded transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Adicionar objetivo */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={novoObjetivo}
                  onChange={e => setNovoObjetivo(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && adicionarObjetivo()}
                  placeholder="Digite um objetivo e pressione Enter"
                  maxLength={300}
                  className="flex-1 px-4 py-2 text-sm md:text-base border-2 border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface text-primary placeholder:text-muted shadow-md"
                />
                <Button onClick={adicionarObjetivo} disabled={!novoObjetivo.trim()}>
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </div>
              
              {tocado.objetivos && erros.objetivos && (
                <p className="mt-2 text-sm text-danger flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {erros.objetivos}
                </p>
              )}
            </div>

            {/* Recursos Necessários */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Recursos Necessários
              </label>
              
              {/* Lista de recursos */}
              {form.recursosNecessarios.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.recursosNecessarios.map(recurso => (
                    <span
                      key={recurso}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-info/15 text-info border-2 border-info/30 rounded-full text-xs md:text-sm font-medium"
                    >
                      {recurso}
                      <button
                        type="button"
                        onClick={() => removerRecurso(recurso)}
                        className="hover:text-info/80"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Adicionar recurso */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={novoRecurso}
                  onChange={e => setNovoRecurso(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && adicionarRecurso()}
                  placeholder="Digite um recurso e pressione Enter"
                  maxLength={200}
                  className="flex-1 px-4 py-2 text-sm md:text-base border-2 border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface text-primary placeholder:text-muted shadow-md"
                />
                <Button onClick={adicionarRecurso} disabled={!novoRecurso.trim()}>
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Metodologia de Avaliação */}
            <Textarea
              label="Metodologia de Avaliação"
              required
              value={form.metodologiaAvaliacao}
              onChange={e => {
                const novoValor = e.target.value;
                setForm(prev => ({ ...prev, metodologiaAvaliacao: novoValor }));
                if (tocado.metodologiaAvaliacao) {
                  validarCampo('metodologiaAvaliacao', novoValor);
                }
              }}
              onBlur={() => {
                setTocado(prev => ({ ...prev, metodologiaAvaliacao: true }));
                validarCampo('metodologiaAvaliacao', form.metodologiaAvaliacao);
              }}
              placeholder="Como será avaliado o aprendizado dos alunos..."
              rows={4}
              showCharCount
              minChars={50}
              maxChars={2000}
              error={tocado.metodologiaAvaliacao ? erros.metodologiaAvaliacao : undefined}
              success={tocado.metodologiaAvaliacao && !erros.metodologiaAvaliacao && form.metodologiaAvaliacao.length >= 50}
            />

            {/* Instrumentos de Avaliação */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Instrumentos de Avaliação
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {instrumentosAvaliacaoDisponiveis.map(inst => (
                  <label key={inst} className="flex items-center gap-2 p-3 bg-elevated rounded-lg cursor-pointer hover:bg-hover transition-all border-2 border-base hover:border-primary shadow-sm">
                    <input
                      type="checkbox"
                      checked={form.instrumentosAvaliacao.includes(inst)}
                      onChange={() => toggleInstrumento(inst)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm text-primary font-medium">{inst}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conclusão */}
            <Textarea
              label="Conclusão e Resultados Esperados"
              required
              value={form.conclusao}
              onChange={e => {
                const novoValor = e.target.value;
                setForm(prev => ({ ...prev, conclusao: novoValor }));
                if (tocado.conclusao) {
                  validarCampo('conclusao', novoValor);
                }
              }}
              onBlur={() => {
                setTocado(prev => ({ ...prev, conclusao: true }));
                validarCampo('conclusao', form.conclusao);
              }}
              placeholder="Ao final desta quinzena, espera-se que os alunos..."
              rows={4}
              showCharCount
              minChars={50}
              maxChars={1000}
              error={tocado.conclusao ? erros.conclusao : undefined}
              success={tocado.conclusao && !erros.conclusao && form.conclusao.length >= 50}
            />

            {/* Referências */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Referências Bibliográficas (ABNT) <span className="text-danger">*</span> (mínimo 1)
              </label>
              
              {/* Lista de referências */}
              <div className="space-y-2 mb-3">
                {form.referencias.map((ref, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-elevated rounded-lg border-2 border-base shadow-md">
                    <span className="font-bold text-text-muted mt-1 text-sm md:text-base">{index + 1}.</span>
                    <p className="flex-1 text-xs md:text-sm text-text-primary break-words">{ref}</p>
                    <button
                      type="button"
                      onClick={() => removerReferencia(index)}
                      className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Adicionar referência */}
              <div className="space-y-2">
                <textarea
                  value={novaReferencia}
                  onChange={e => setNovaReferencia(e.target.value)}
                  placeholder="Ex: Referência bibliográfica fictícia"
                  maxLength={500}
                  className="w-full px-4 py-2 text-sm md:text-base border-2 border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-primary placeholder:text-muted shadow-md"
                  rows={2}
                />
                <div className="text-xs text-right text-muted">
                  {novaReferencia.length}/500 caracteres
                </div>
                <Button onClick={adicionarReferencia} disabled={!novaReferencia.trim()}>
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Adicionar Referência</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </div>
              
              {tocado.referencias && erros.referencias && (
                <p className="mt-2 text-sm text-danger flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {erros.referencias}
                </p>
              )}
            </div>

            {/* Observações (opcional) */}
            <Textarea
              label="Observações Adicionais (opcional; apenas dados fictícios)"
              value={form.observacoes}
              onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Notas pessoais, adaptações necessárias, etc..."
              rows={3}
              showCharCount
              maxChars={1000}
            />
          </div>

          {/* Footer com botões */}
          <div className="sticky bottom-0 bg-surface border-t-2 border-base px-4 md:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-b-2xl shadow-lg">
            <Button variant="ghost" onClick={onClose} className="order-3 sm:order-1">
              Cancelar
            </Button>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
              <Button
                variant="secondary"
                onClick={() => handleSalvarRascunho(false)}
                isLoading={salvando}
                className="w-full sm:w-auto"
              >
                <Save className="w-5 h-5" />
                <span className="hidden md:inline">Salvar Rascunho</span>
                <span className="md:hidden">Rascunho</span>
              </Button>

              <Button
                variant="success"
                onClick={handleEnviar}
                isLoading={enviando}
                className="w-full sm:w-auto"
              >
                <Send className="w-5 h-5" />
                <span className="hidden md:inline">Enviar para Revisão</span>
                <span className="md:hidden">Enviar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


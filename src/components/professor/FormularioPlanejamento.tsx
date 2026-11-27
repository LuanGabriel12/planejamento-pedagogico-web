import React, { useState, useRef, useId } from 'react';
import { Save, Send, Plus, Trash2, AlertCircle, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import {
  CampoValidacao,
  MapaErrosValidacao,
  Objetivo,
  PlanejamentoFormularioInput
} from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DateHelpers } from '../../utils/dateHelpers';
import { LIMITES_PLANEJAMENTO, validarCampoEnvio } from '../../domain/validation';
import {
  disciplinasDisponiveis,
  turmasDisponiveis,
  instrumentosAvaliacaoDisponiveis,
  recursosDisponiveis
} from '../../data/initialData';

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
  const {
    estado,
    salvarRascunhoPlanejamento,
    enviarPlanejamentoParaRevisao
  } = useApp();
  const { anoAtual } = estado.configuracoes;

  const idSalvoRef = useRef<string | undefined>(planejamentoId);
  const objetivoInputId = useId();
  const recursoInputId = useId();
  const referenciaInputId = useId();

  const planejamentoAtual = idSalvoRef.current
    ? estado.planejamentos.find(p => p.id === idSalvoRef.current)
    : undefined;

  const anoPlanejamento = planejamentoAtual?.ano ?? anoAtual;
  const mesPlanejamento = planejamentoAtual?.mes ?? mes;
  const quinzenaPlanejamento = planejamentoAtual?.quinzena ?? quinzena;
  const { periodoInicio, periodoFim } = DateHelpers.calcularPeriodo(
    anoPlanejamento,
    mesPlanejamento,
    quinzenaPlanejamento
  );

  const [form, setForm] = useState<PlanejamentoFormularioInput>({
    titulo: planejamentoAtual?.titulo || '',
    disciplinas: planejamentoAtual?.disciplinas ? [...planejamentoAtual.disciplinas] : [],
    turmas: planejamentoAtual?.turmas ? [...planejamentoAtual.turmas] : [],
    experienciaAprendizagem: planejamentoAtual?.experienciaAprendizagem || '',
    objetivos: planejamentoAtual?.objetivos ? planejamentoAtual.objetivos.map(o => ({ ...o })) : [],
    recursosNecessarios: planejamentoAtual?.recursosNecessarios
      ? [...planejamentoAtual.recursosNecessarios]
      : [],
    metodologiaAvaliacao: planejamentoAtual?.metodologiaAvaliacao || '',
    instrumentosAvaliacao: planejamentoAtual?.instrumentosAvaliacao
      ? [...planejamentoAtual.instrumentosAvaliacao]
      : [],
    conclusao: planejamentoAtual?.conclusao || '',
    referencias: planejamentoAtual?.referencias ? [...planejamentoAtual.referencias] : [],
    observacoes: planejamentoAtual?.observacoes || ''
  });

  const [erros, setErros] = useState<MapaErrosValidacao>({});
  const [tocado, setTocado] = useState<Partial<Record<CampoValidacao, boolean>>>({});
  const [alteracoesNaoSalvas, setAlteracoesNaoSalvas] = useState(false);
  const [ultimoSalvoHora, setUltimoSalvoHora] = useState<string | null>(null);
  const [confirmandoFechamento, setConfirmandoFechamento] = useState(false);

  const [novoObjetivo, setNovoObjetivo] = useState('');
  const [novaReferencia, setNovaReferencia] = useState('');
  const [novoRecurso, setNovoRecurso] = useState('');

  const atualizarErroCampo = (campo: CampoValidacao, valor: unknown) => {
    const mensagem = validarCampoEnvio(campo, valor);
    setErros(prev => {
      const proximo = { ...prev };
      if (mensagem) {
        proximo[campo] = mensagem;
      } else {
        delete proximo[campo];
      }
      delete proximo.geral;
      return proximo;
    });
  };

  const atualizarCampo = <K extends keyof PlanejamentoFormularioInput>(
    campo: K,
    valor: PlanejamentoFormularioInput[K]
  ) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setAlteracoesNaoSalvas(true);
    if (tocado[campo as CampoValidacao]) {
      atualizarErroCampo(campo as CampoValidacao, valor);
    }
  };

  const marcarTocado = (campo: CampoValidacao, valor: unknown) => {
    setTocado(prev => ({ ...prev, [campo]: true }));
    atualizarErroCampo(campo, valor);
  };

  const adicionarObjetivo = () => {
    const texto = novoObjetivo.trim();
    if (!texto) return;

    const objetivo: Objetivo = {
      id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      texto,
      atingido: false
    };
    const novos = [...form.objetivos, objetivo];
    setForm(prev => ({ ...prev, objetivos: novos }));
    setNovoObjetivo('');
    setAlteracoesNaoSalvas(true);
    marcarTocado('objetivos', novos);
  };

  const removerObjetivo = (id: string) => {
    const novos = form.objetivos.filter(o => o.id !== id);
    setForm(prev => ({ ...prev, objetivos: novos }));
    setAlteracoesNaoSalvas(true);
    marcarTocado('objetivos', novos);
  };

  const adicionarReferencia = () => {
    const texto = novaReferencia.trim();
    if (!texto) return;

    const novas = [...form.referencias, texto];
    setForm(prev => ({ ...prev, referencias: novas }));
    setNovaReferencia('');
    setAlteracoesNaoSalvas(true);
    marcarTocado('referencias', novas);
  };

  const removerReferencia = (index: number) => {
    const novas = form.referencias.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, referencias: novas }));
    setAlteracoesNaoSalvas(true);
    marcarTocado('referencias', novas);
  };

  const adicionarRecurso = (recursoTexto?: string) => {
    const texto = (recursoTexto ?? novoRecurso).trim();
    if (!texto) return;

    const jaExiste = form.recursosNecessarios.some(
      r => r.toLowerCase() === texto.toLowerCase()
    );
    if (jaExiste) {
      toast.error('Este recurso já foi adicionado.');
      return;
    }

    const novos = [...form.recursosNecessarios, texto];
    setForm(prev => ({ ...prev, recursosNecessarios: novos }));
    if (!recursoTexto) setNovoRecurso('');
    setAlteracoesNaoSalvas(true);
  };

  const removerRecurso = (recurso: string) => {
    setForm(prev => ({
      ...prev,
      recursosNecessarios: prev.recursosNecessarios.filter(r => r !== recurso)
    }));
    setAlteracoesNaoSalvas(true);
  };

  const toggleItemLista = (campo: 'disciplinas' | 'turmas' | 'instrumentosAvaliacao', valor: string) => {
    const atual = form[campo];
    const proximo = atual.includes(valor)
      ? atual.filter(item => item !== valor)
      : [...atual, valor];

    setForm(prev => ({ ...prev, [campo]: proximo }));
    setAlteracoesNaoSalvas(true);
    if (campo === 'disciplinas' || campo === 'turmas') {
      marcarTocado(campo, proximo);
    }
  };

  const handleSalvarRascunho = () => {
    const resultado = salvarRascunhoPlanejamento({
      planejamentoId: idSalvoRef.current,
      ano: anoPlanejamento,
      mes: mesPlanejamento,
      quinzena: quinzenaPlanejamento,
      dados: form
    });

    if (!resultado.ok) {
      if (resultado.errosPorCampo) {
        setErros(resultado.errosPorCampo);
      }
      return;
    }

    idSalvoRef.current = resultado.dados.planejamento.id;
    setAlteracoesNaoSalvas(false);
    setErros({});
    const agora = new Date();
    setUltimoSalvoHora(
      `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
    );
  };

  const handleEnviar = () => {
    const resultado = enviarPlanejamentoParaRevisao({
      planejamentoId: idSalvoRef.current,
      ano: anoPlanejamento,
      mes: mesPlanejamento,
      quinzena: quinzenaPlanejamento,
      dados: form
    });

    if (!resultado.ok) {
      if (resultado.errosPorCampo) {
        setErros(resultado.errosPorCampo);
        const todosTocados: Partial<Record<CampoValidacao, boolean>> = {};
        (Object.keys(resultado.errosPorCampo) as CampoValidacao[]).forEach(campo => {
          todosTocados[campo] = true;
        });
        setTocado(prev => ({ ...prev, ...todosTocados }));
      }
      return;
    }

    idSalvoRef.current = resultado.dados.planejamento.id;
    setAlteracoesNaoSalvas(false);
    onClose();
  };

  const solicitarFechamento = () => {
    if (alteracoesNaoSalvas) {
      setConfirmandoFechamento(true);
      return;
    }
    onClose();
  };

  const ehDevolvido = planejamentoAtual?.status === 'ajustes_solicitados';
  const listaErrosResumo = Object.values(erros).filter((m): m is string => Boolean(m));

  return (
    <>
      <Modal
        isOpen
        onClose={solicitarFechamento}
        title={
          ehDevolvido
            ? 'Corrigir Planejamento Devolvido'
            : idSalvoRef.current
              ? 'Editar Planejamento'
              : 'Novo Planejamento Quinzenal'
        }
        subtitle={`${DateHelpers.getNomeMes(mesPlanejamento)} ${anoPlanejamento} · ${quinzenaPlanejamento}ª Quinzena (${DateHelpers.formatarPeriodo(periodoInicio, periodoFim)})`}
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <Button variant="ghost" onClick={solicitarFechamento}>
                Fechar
              </Button>
              <span className="text-xs text-muted">
                {alteracoesNaoSalvas
                  ? 'Alterações não salvas'
                  : ultimoSalvoHora
                    ? `Salvo às ${ultimoSalvoHora}`
                    : 'Sem alterações pendentes'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="secondary" onClick={handleSalvarRascunho}>
                <Save className="w-4 h-4" aria-hidden="true" />
                {ehDevolvido ? 'Salvar alterações' : 'Salvar rascunho'}
              </Button>
              <Button variant="success" onClick={handleEnviar}>
                <Send className="w-4 h-4" aria-hidden="true" />
                {ehDevolvido ? 'Reenviar para revisão' : 'Enviar para revisão'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Contexto de ajustes solicitados */}
          {ehDevolvido && planejamentoAtual?.consideracoesDiretor && (
            <div
              role="note"
              className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-sm"
            >
              <div className="flex items-center gap-2 font-bold text-danger mb-1">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Ajustes solicitados pela direção
              </div>
              <p className="text-primary whitespace-pre-wrap">
                {planejamentoAtual.consideracoesDiretor}
              </p>
              {planejamentoAtual.prazoAjustes && (
                <p className="text-xs text-danger mt-2 font-medium">
                  Prazo sugerido: {DateHelpers.formatarDataHora(planejamentoAtual.prazoAjustes)}
                </p>
              )}
            </div>
          )}

          {/* Resumo de erros */}
          {listaErrosResumo.length > 0 && (
            <div
              role="alert"
              className="bg-danger/10 border border-danger/30 rounded-xl p-4"
            >
              <h3 className="text-sm font-bold text-danger mb-1.5">
                Revise os pontos abaixo antes de continuar:
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {listaErrosResumo.map((erro, index) => (
                  <li key={index} className="text-xs sm:text-sm text-danger">
                    {erro}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Título */}
          <Input
            label="Título do planejamento"
            required
            value={form.titulo}
            onChange={e => atualizarCampo('titulo', e.target.value)}
            onBlur={() => marcarTocado('titulo', form.titulo)}
            placeholder="Ex: Leitura compartilhada e reconhecimento de sílabas"
            maxLength={LIMITES_PLANEJAMENTO.TITULO_MAX}
            error={tocado.titulo ? erros.titulo : undefined}
            success={
              Boolean(tocado.titulo) &&
              !erros.titulo &&
              form.titulo.trim().length >= LIMITES_PLANEJAMENTO.TITULO_MIN
            }
            helperText={`${form.titulo.trim().length}/${LIMITES_PLANEJAMENTO.TITULO_MAX} caracteres (mínimo para envio: ${LIMITES_PLANEJAMENTO.TITULO_MIN})`}
          />

          {/* Disciplinas */}
          <fieldset>
            <legend className="block text-sm font-medium text-primary mb-2">
              Disciplinas <span className="text-danger" aria-hidden="true">*</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {disciplinasDisponiveis.map(disc => {
                const selecionado = form.disciplinas.includes(disc);
                return (
                  <button
                    key={disc}
                    type="button"
                    aria-pressed={selecionado}
                    onClick={() => toggleItemLista('disciplinas', disc)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selecionado
                        ? 'bg-primary text-on-primary border-primary font-medium'
                        : 'bg-surface text-primary border-strong hover:bg-hover'
                    }`}
                  >
                    {disc}
                  </button>
                );
              })}
            </div>
            {tocado.disciplinas && erros.disciplinas && (
              <p role="alert" className="mt-1.5 text-xs text-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {erros.disciplinas}
              </p>
            )}
          </fieldset>

          {/* Turmas */}
          <fieldset>
            <legend className="block text-sm font-medium text-primary mb-2">
              Turmas <span className="text-danger" aria-hidden="true">*</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {turmasDisponiveis.map(turma => {
                const selecionado = form.turmas.includes(turma);
                return (
                  <button
                    key={turma}
                    type="button"
                    aria-pressed={selecionado}
                    onClick={() => toggleItemLista('turmas', turma)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selecionado
                        ? 'bg-primary text-on-primary border-primary font-medium'
                        : 'bg-surface text-primary border-strong hover:bg-hover'
                    }`}
                  >
                    {turma}
                  </button>
                );
              })}
            </div>
            {tocado.turmas && erros.turmas && (
              <p role="alert" className="mt-1.5 text-xs text-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {erros.turmas}
              </p>
            )}
          </fieldset>

          {/* Experiência de Aprendizagem */}
          <Textarea
            label="Experiência de aprendizagem"
            required
            value={form.experienciaAprendizagem}
            onChange={e => atualizarCampo('experienciaAprendizagem', e.target.value)}
            onBlur={() => marcarTocado('experienciaAprendizagem', form.experienciaAprendizagem)}
            placeholder="Descreva atividades, estratégias pedagógicas e sequência planejada para a quinzena..."
            rows={5}
            showCharCount
            minChars={LIMITES_PLANEJAMENTO.EXPERIENCIA_MIN}
            maxChars={LIMITES_PLANEJAMENTO.EXPERIENCIA_MAX}
            error={tocado.experienciaAprendizagem ? erros.experienciaAprendizagem : undefined}
            success={
              Boolean(tocado.experienciaAprendizagem) &&
              !erros.experienciaAprendizagem &&
              form.experienciaAprendizagem.trim().length >= LIMITES_PLANEJAMENTO.EXPERIENCIA_MIN
            }
          />

          {/* Objetivos */}
          <div>
            <label htmlFor={objetivoInputId} className="block text-sm font-medium text-primary mb-2">
              Objetivos de aprendizagem <span className="text-danger" aria-hidden="true">*</span>{' '}
              <span className="text-xs font-normal text-muted">
                (mínimo {LIMITES_PLANEJAMENTO.OBJETIVOS_MIN} para envio)
              </span>
            </label>

            {form.objetivos.length > 0 && (
              <ol className="space-y-2 mb-3">
                {form.objetivos.map((obj, index) => (
                  <li
                    key={obj.id}
                    className="flex items-start gap-2.5 p-3 bg-elevated rounded-lg border border-base"
                  >
                    <span className="text-xs font-bold text-muted mt-0.5">{index + 1}.</span>
                    <p className="flex-1 text-sm text-primary break-words">{obj.texto}</p>
                    <button
                      type="button"
                      onClick={() => removerObjetivo(obj.id)}
                      aria-label={`Remover objetivo ${index + 1}`}
                      className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id={objetivoInputId}
                type="text"
                value={novoObjetivo}
                onChange={e => setNovoObjetivo(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarObjetivo();
                  }
                }}
                placeholder="Digite um objetivo e pressione Enter ou clique em Adicionar"
                maxLength={LIMITES_PLANEJAMENTO.OBJETIVO_TEXTO_MAX}
                className="flex-1 px-3.5 py-2.5 text-sm border border-strong rounded-lg bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button variant="secondary" onClick={adicionarObjetivo} disabled={!novoObjetivo.trim()}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Adicionar objetivo
              </Button>
            </div>

            {tocado.objetivos && erros.objetivos && (
              <p role="alert" className="mt-1.5 text-xs text-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {erros.objetivos}
              </p>
            )}
          </div>

          {/* Recursos */}
          <div>
            <label htmlFor={recursoInputId} className="block text-sm font-medium text-primary mb-2">
              Recursos necessários <span className="text-xs font-normal text-muted">(opcional)</span>
            </label>

            {form.recursosNecessarios.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.recursosNecessarios.map(recurso => (
                  <span
                    key={recurso}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-info/15 text-info border border-info/30 rounded-full text-xs font-medium"
                  >
                    <span>{recurso}</span>
                    <button
                      type="button"
                      onClick={() => removerRecurso(recurso)}
                      aria-label={`Remover recurso ${recurso}`}
                      className="hover:opacity-75"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mb-2.5">
              <input
                id={recursoInputId}
                type="text"
                value={novoRecurso}
                onChange={e => setNovoRecurso(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarRecurso();
                  }
                }}
                placeholder="Ex: Quadro branco, material impresso..."
                maxLength={LIMITES_PLANEJAMENTO.RECURSO_TEXTO_MAX}
                className="flex-1 px-3.5 py-2.5 text-sm border border-strong rounded-lg bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button variant="secondary" onClick={() => adicionarRecurso()} disabled={!novoRecurso.trim()}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Adicionar recurso
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {recursosDisponiveis
                .filter(sug => !form.recursosNecessarios.some(r => r.toLowerCase() === sug.toLowerCase()))
                .slice(0, 6)
                .map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => adicionarRecurso(sug)}
                    className="text-xs px-2.5 py-1 rounded-full bg-elevated border border-base text-secondary hover:bg-hover hover:text-primary transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
            </div>
          </div>

          {/* Metodologia de Avaliação */}
          <Textarea
            label="Metodologia de avaliação"
            required
            value={form.metodologiaAvaliacao}
            onChange={e => atualizarCampo('metodologiaAvaliacao', e.target.value)}
            onBlur={() => marcarTocado('metodologiaAvaliacao', form.metodologiaAvaliacao)}
            placeholder="Descreva os critérios e a forma como a aprendizagem será acompanhada..."
            rows={4}
            showCharCount
            minChars={LIMITES_PLANEJAMENTO.METODOLOGIA_MIN}
            maxChars={LIMITES_PLANEJAMENTO.METODOLOGIA_MAX}
            error={tocado.metodologiaAvaliacao ? erros.metodologiaAvaliacao : undefined}
            success={
              Boolean(tocado.metodologiaAvaliacao) &&
              !erros.metodologiaAvaliacao &&
              form.metodologiaAvaliacao.trim().length >= LIMITES_PLANEJAMENTO.METODOLOGIA_MIN
            }
          />

          {/* Instrumentos */}
          <fieldset>
            <legend className="block text-sm font-medium text-primary mb-2">
              Instrumentos de avaliação <span className="text-xs font-normal text-muted">(opcional)</span>
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {instrumentosAvaliacaoDisponiveis.map(inst => (
                <label
                  key={inst}
                  className="flex items-center gap-2 p-2.5 bg-elevated rounded-lg cursor-pointer hover:bg-hover border border-base transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form.instrumentosAvaliacao.includes(inst)}
                    onChange={() => toggleItemLista('instrumentosAvaliacao', inst)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-xs sm:text-sm text-primary">{inst}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Conclusão */}
          <Textarea
            label="Conclusão e resultados esperados"
            required
            value={form.conclusao}
            onChange={e => atualizarCampo('conclusao', e.target.value)}
            onBlur={() => marcarTocado('conclusao', form.conclusao)}
            placeholder="Descreva os avanços esperados ao final da quinzena..."
            rows={4}
            showCharCount
            minChars={LIMITES_PLANEJAMENTO.CONCLUSAO_MIN}
            maxChars={LIMITES_PLANEJAMENTO.CONCLUSAO_MAX}
            error={tocado.conclusao ? erros.conclusao : undefined}
            success={
              Boolean(tocado.conclusao) &&
              !erros.conclusao &&
              form.conclusao.trim().length >= LIMITES_PLANEJAMENTO.CONCLUSAO_MIN
            }
          />

          {/* Referências */}
          <div>
            <label htmlFor={referenciaInputId} className="block text-sm font-medium text-primary mb-2">
              Referências bibliográficas <span className="text-danger" aria-hidden="true">*</span>{' '}
              <span className="text-xs font-normal text-muted">(mínimo 1 para envio)</span>
            </label>

            {form.referencias.length > 0 && (
              <ol className="space-y-2 mb-3">
                {form.referencias.map((ref, index) => (
                  <li
                    key={`${ref}-${index}`}
                    className="flex items-start gap-2.5 p-3 bg-elevated rounded-lg border border-base"
                  >
                    <span className="text-xs font-bold text-muted mt-0.5">{index + 1}.</span>
                    <p className="flex-1 text-sm text-primary break-words">{ref}</p>
                    <button
                      type="button"
                      onClick={() => removerReferencia(index)}
                      aria-label={`Remover referência ${index + 1}`}
                      className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <div className="space-y-2">
              <textarea
                id={referenciaInputId}
                value={novaReferencia}
                onChange={e => setNovaReferencia(e.target.value)}
                placeholder="Ex: Referência didática fictícia — Guia de Atividades."
                maxLength={LIMITES_PLANEJAMENTO.REFERENCIA_TEXTO_MAX}
                rows={2}
                className="w-full px-3.5 py-2.5 text-sm border border-strong rounded-lg bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center justify-between gap-2">
                <Button variant="secondary" size="sm" onClick={adicionarReferencia} disabled={!novaReferencia.trim()}>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Adicionar referência
                </Button>
                <span className="text-xs text-muted">
                  {novaReferencia.length}/{LIMITES_PLANEJAMENTO.REFERENCIA_TEXTO_MAX}
                </span>
              </div>
            </div>

            {tocado.referencias && erros.referencias && (
              <p role="alert" className="mt-1.5 text-xs text-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {erros.referencias}
              </p>
            )}
          </div>

          {/* Observações */}
          <Textarea
            label="Observações adicionais (opcional; use apenas dados fictícios)"
            value={form.observacoes}
            onChange={e => atualizarCampo('observacoes', e.target.value)}
            placeholder="Notas gerais ou adaptações simuladas..."
            rows={3}
            showCharCount
            maxChars={LIMITES_PLANEJAMENTO.OBSERVACOES_MAX}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmandoFechamento}
        title="Descartar alterações não salvas?"
        description="Você modificou campos deste formulário sem salvar. Deseja fechar mesmo assim?"
        confirmLabel="Descartar e fechar"
        cancelLabel="Continuar editando"
        confirmVariant="danger"
        onConfirm={() => {
          setConfirmandoFechamento(false);
          onClose();
        }}
        onCancel={() => setConfirmandoFechamento(false)}
      />
    </>
  );
};

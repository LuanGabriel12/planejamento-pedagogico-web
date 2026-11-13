// ============================================
// HELPERS DE VALIDAÇÃO
// ============================================

import { Planejamento, ResultadoValidacao } from '../types';

export const ValidationHelpers = {
  // Validar planejamento completo
  validarPlanejamento(planejamento: Partial<Planejamento>): ResultadoValidacao {
    const erros: string[] = [];

    // Título
    if (!planejamento.titulo || planejamento.titulo.trim().length < 10) {
      erros.push('Título deve ter no mínimo 10 caracteres');
    }
    if (planejamento.titulo && planejamento.titulo.length > 100) {
      erros.push('Título deve ter no máximo 100 caracteres');
    }

    // Disciplinas
    if (!planejamento.disciplinas || planejamento.disciplinas.length === 0) {
      erros.push('Selecione pelo menos uma disciplina');
    }

    // Turmas
    if (!planejamento.turmas || planejamento.turmas.length === 0) {
      erros.push('Selecione pelo menos uma turma');
    }

    // Experiência de Aprendizagem
    if (!planejamento.experienciaAprendizagem || planejamento.experienciaAprendizagem.trim().length < 100) {
      erros.push('Experiência de Aprendizagem deve ter no mínimo 100 caracteres');
    }

    // Objetivos
    if (!planejamento.objetivos || planejamento.objetivos.length < 2) {
      erros.push('Adicione no mínimo 2 objetivos de aprendizagem');
    }

    // Metodologia de Avaliação
    if (!planejamento.metodologiaAvaliacao || planejamento.metodologiaAvaliacao.trim().length < 50) {
      erros.push('Metodologia de Avaliação deve ter no mínimo 50 caracteres');
    }

    // Conclusão
    if (!planejamento.conclusao || planejamento.conclusao.trim().length < 50) {
      erros.push('Conclusão deve ter no mínimo 50 caracteres');
    }

    // Referências
    if (!planejamento.referencias || planejamento.referencias.length < 1) {
      erros.push('Adicione pelo menos uma referência bibliográfica');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  // Validar email
  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
};


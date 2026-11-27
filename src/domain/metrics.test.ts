import { describe, it, expect } from 'vitest';
import { criarEstadoInicial } from '../data/initialData';
import {
  calcularEstatisticasPerfil,
  calcularIndicadoresDirecao,
  calcularProgressoProfessor,
  filtrarPlanejamentosDirecao
} from './metrics';

describe('metrics — indicadores, filtros e consistência', () => {
  it('calcula indicadores da direção coerentes com os registros do ano selecionado', () => {
    const estado = criarEstadoInicial();
    const ind2026 = calcularIndicadoresDirecao(estado.planejamentos, 2026);

    expect(ind2026.total).toBe(3);
    expect(ind2026.aprovados).toBe(1);
    expect(ind2026.pendentes).toBe(1);
    expect(ind2026.ajustes).toBe(1);
    expect(ind2026.rascunhos).toBe(0);
    expect(ind2026.taxaAprovacao).toBe(33);

    // Ano sem registros não gera NaN
    const ind2024 = calcularIndicadoresDirecao(estado.planejamentos, 2024);
    expect(ind2024.total).toBe(0);
    expect(ind2024.taxaAprovacao).toBe(0);
  });

  it('filtra por busca de título, professor e status, retornando lista vazia sem erros', () => {
    const estado = criarEstadoInicial();

    const todos = filtrarPlanejamentosDirecao(estado.planejamentos, {
      ano: 2026,
      busca: '',
      professorId: '',
      status: 'todos'
    });
    expect(todos).toHaveLength(3);

    const buscaVogais = filtrarPlanejamentosDirecao(estado.planejamentos, {
      ano: 2026,
      busca: '  vogais ',
      professorId: '',
      status: 'todos'
    });
    expect(buscaVogais).toHaveLength(1);
    expect(buscaVogais[0].id).toBe('plan_001');

    const porProf2 = filtrarPlanejamentosDirecao(estado.planejamentos, {
      ano: 2026,
      busca: '',
      professorId: 'prof_002',
      status: 'aguardando_revisao'
    });
    expect(porProf2).toHaveLength(1);
    expect(porProf2[0].id).toBe('plan_002');

    const semMatch = filtrarPlanejamentosDirecao(estado.planejamentos, {
      ano: 2026,
      busca: 'termo-inexistente-xyz',
      professorId: '',
      status: 'todos'
    });
    expect(semMatch).toHaveLength(0);
  });

  it('calcula progresso do professor e estatísticas do perfil respeitando o ano selecionado', () => {
    const estado = criarEstadoInicial();
    const prof1 = estado.usuarios.find(u => u.id === 'prof_001')!;
    const diretor = estado.usuarios.find(u => u.id === 'dir_001')!;

    // Adiciona registro em 2025 para garantir que não vaza nas estatísticas de 2026
    estado.planejamentos.push({
      ...estado.planejamentos[0],
      id: 'plan_2025',
      ano: 2025,
      periodoInicio: '2025-01-01',
      periodoFim: '2025-01-15'
    });

    const prog2026 = calcularProgressoProfessor(estado.planejamentos, 'prof_001', 2026);
    expect(prog2026.criados).toBe(2);
    expect(prog2026.aprovados).toBe(1);
    expect(prog2026.ajustes).toBe(1);
    expect(prog2026.percentualAprovados).toBe(4);

    const statsProf2026 = calcularEstatisticasPerfil(estado.planejamentos, prof1, 2026);
    expect(statsProf2026.total).toBe(2);
    expect(statsProf2026.aprovados).toBe(1);
    expect(statsProf2026.taxaAprovacao).toBe(50);

    const statsDir2025 = calcularEstatisticasPerfil(estado.planejamentos, diretor, 2025);
    expect(statsDir2025.total).toBe(1);
  });
});

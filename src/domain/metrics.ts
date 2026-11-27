import { FiltroStatusDirecao, Planejamento } from '../types';
import { Usuario } from '../models/auth/users.model';

// ============================================
// INDICADORES, FILTROS E ESTATÍSTICAS (FUNÇÕES PURAS)
// Todos os números exibidos na interface derivam daqui.
// ============================================

export interface IndicadoresDirecao {
  total: number;
  pendentes: number;
  aprovados: number;
  ajustes: number;
  rascunhos: number;
  taxaAprovacao: number;
}

export interface ProgressoProfessor {
  totalQuinzenas: number;
  criados: number;
  rascunhos: number;
  aguardando: number;
  ajustes: number;
  aprovados: number;
  percentualAprovados: number;
  percentualPreenchidos: number;
}

export interface FiltrosDirecao {
  ano: number;
  busca: string;
  professorId: string;
  status: FiltroStatusDirecao;
}

export interface EstatisticasPerfil {
  ano: number;
  total: number;
  aprovados: number;
  pendentes: number;
  ajustes: number;
  rascunhos: number;
  taxaAprovacao?: number;
}

export function calcularIndicadoresDirecao(
  planejamentos: Planejamento[],
  anoAtual: number
): IndicadoresDirecao {
  const doAno = planejamentos.filter(p => p.ano === anoAtual);
  const total = doAno.length;
  const pendentes = doAno.filter(p => p.status === 'aguardando_revisao').length;
  const aprovados = doAno.filter(p => p.status === 'aprovado').length;
  const ajustes = doAno.filter(p => p.status === 'ajustes_solicitados').length;
  const rascunhos = doAno.filter(p => p.status === 'rascunho').length;
  const taxaAprovacao = total > 0 ? Math.round((aprovados / total) * 100) : 0;

  return {
    total,
    pendentes,
    aprovados,
    ajustes,
    rascunhos,
    taxaAprovacao
  };
}

export function calcularProgressoProfessor(
  planejamentos: Planejamento[],
  professorId: string,
  anoAtual: number
): ProgressoProfessor {
  const totalQuinzenas = 24;
  const doProfessor = planejamentos.filter(
    p => p.professorId === professorId && p.ano === anoAtual
  );

  const rascunhos = doProfessor.filter(p => p.status === 'rascunho').length;
  const aguardando = doProfessor.filter(p => p.status === 'aguardando_revisao').length;
  const ajustes = doProfessor.filter(p => p.status === 'ajustes_solicitados').length;
  const aprovados = doProfessor.filter(p => p.status === 'aprovado').length;
  const criados = doProfessor.length;

  return {
    totalQuinzenas,
    criados,
    rascunhos,
    aguardando,
    ajustes,
    aprovados,
    percentualAprovados: Math.round((aprovados / totalQuinzenas) * 100),
    percentualPreenchidos: Math.round((criados / totalQuinzenas) * 100)
  };
}

function timestampSeguro(data?: string): number {
  if (!data) return 0;
  const ms = new Date(data).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function filtrarPlanejamentosDirecao(
  planejamentos: Planejamento[],
  filtros: FiltrosDirecao
): Planejamento[] {
  const termo = filtros.busca.trim().toLowerCase();

  const filtrados = planejamentos.filter(p => {
    if (p.ano !== filtros.ano) return false;
    if (filtros.status !== 'todos' && p.status !== filtros.status) return false;
    if (filtros.professorId && p.professorId !== filtros.professorId) return false;
    if (termo && !p.titulo.toLowerCase().includes(termo)) return false;
    return true;
  });

  // Ordenação determinística: pendentes mais antigos primeiro; demais por atualização mais recente.
  return [...filtrados].sort((a, b) => {
    if (filtros.status === 'aguardando_revisao') {
      const dataA = timestampSeguro(a.reenviadoEm || a.enviadoEm || a.criadoEm);
      const dataB = timestampSeguro(b.reenviadoEm || b.enviadoEm || b.criadoEm);
      return dataA - dataB;
    }

    const dataA = timestampSeguro(a.atualizadoEm || a.criadoEm);
    const dataB = timestampSeguro(b.atualizadoEm || b.criadoEm);
    return dataB - dataA;
  });
}

export function calcularEstatisticasPerfil(
  planejamentos: Planejamento[],
  usuario: Usuario,
  anoAtual: number
): EstatisticasPerfil {
  const base =
    usuario.role === 'professor'
      ? planejamentos.filter(p => p.professorId === usuario.id && p.ano === anoAtual)
      : planejamentos.filter(p => p.ano === anoAtual);

  const total = base.length;
  const aprovados = base.filter(p => p.status === 'aprovado').length;
  const pendentes = base.filter(p => p.status === 'aguardando_revisao').length;
  const ajustes = base.filter(p => p.status === 'ajustes_solicitados').length;
  const rascunhos = base.filter(p => p.status === 'rascunho').length;

  if (usuario.role === 'professor') {
    return {
      ano: anoAtual,
      total,
      aprovados,
      pendentes,
      ajustes,
      rascunhos,
      taxaAprovacao: total > 0 ? Math.round((aprovados / total) * 100) : 0
    };
  }

  return {
    ano: anoAtual,
    total,
    aprovados,
    pendentes,
    ajustes,
    rascunhos
  };
}

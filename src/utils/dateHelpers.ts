// ============================================
// HELPERS DE DATA - QUINZENAS E FORMATAÇÃO SEGURA
// ============================================

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
] as const;

const REGEX_DATA_CURTA = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDataSegura(data?: string | null): Date | null {
  if (!data || typeof data !== 'string') return null;

  const trimmed = data.trim();
  if (!trimmed) return null;

  const matchCurta = REGEX_DATA_CURTA.exec(trimmed);
  if (matchCurta) {
    const ano = Number(matchCurta[1]);
    const mes = Number(matchCurta[2]);
    const dia = Number(matchCurta[3]);
    const d = new Date(ano, mes - 1, dia);
    if (
      d.getFullYear() !== ano ||
      d.getMonth() !== mes - 1 ||
      d.getDate() !== dia
    ) {
      return null;
    }
    return d;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export const DateHelpers = {
  getNomeMes(mes: number): string {
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) return '';
    return NOMES_MESES[mes - 1];
  },

  isDataValida(data?: string | null): boolean {
    return parseDataSegura(data) !== null;
  },

  calcularPeriodo(
    ano: number,
    mes: number,
    quinzena: 1 | 2
  ): { inicio: string; fim: string; periodoInicio: string; periodoFim: string } {
    const mesPad = String(mes).padStart(2, '0');
    if (quinzena === 1) {
      const inicio = `${ano}-${mesPad}-01`;
      const fim = `${ano}-${mesPad}-15`;
      return { inicio, fim, periodoInicio: inicio, periodoFim: fim };
    }

    const ultimoDia = new Date(ano, mes, 0).getDate();
    const inicio = `${ano}-${mesPad}-16`;
    const fim = `${ano}-${mesPad}-${String(ultimoDia).padStart(2, '0')}`;
    return { inicio, fim, periodoInicio: inicio, periodoFim: fim };
  },

  isPeriodoQuinzenaValido(
    ano: number,
    mes: number,
    quinzena: number,
    periodoInicio: string,
    periodoFim: string
  ): boolean {
    if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
      return false;
    }
    if (quinzena !== 1 && quinzena !== 2) {
      return false;
    }
    if (!this.isDataValida(periodoInicio) || !this.isDataValida(periodoFim)) {
      return false;
    }
    const esperado = this.calcularPeriodo(ano, mes, quinzena);
    return periodoInicio === esperado.periodoInicio && periodoFim === esperado.periodoFim;
  },

  formatarPeriodo(inicio: string, fim: string): string {
    const d1 = parseDataSegura(inicio);
    const d2 = parseDataSegura(fim);
    if (!d1 || !d2) return 'Período inválido';

    return `${String(d1.getDate()).padStart(2, '0')}/${String(d1.getMonth() + 1).padStart(2, '0')} a ${String(d2.getDate()).padStart(2, '0')}/${String(d2.getMonth() + 1).padStart(2, '0')}`;
  },

  formatarData(data?: string | null): string {
    const d = parseDataSegura(data);
    if (!d) return 'Data indisponível';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  },

  formatarDataHora(data?: string | null): string {
    const d = parseDataSegura(data);
    if (!d) return 'Data indisponível';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  tempoDesde(data?: string | null, agoraRef?: Date): string {
    const passado = parseDataSegura(data);
    if (!passado) return 'Data indisponível';

    const agora = agoraRef ?? new Date();
    const diff = agora.getTime() - passado.getTime();
    if (diff < 0) return 'Agora mesmo';

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `Há ${dias} dia${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Há ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `Há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'Agora mesmo';
  },

  diasDesde(data?: string | null, agoraRef?: Date): number | null {
    const passado = parseDataSegura(data);
    if (!passado) return null;

    const agora = agoraRef ?? new Date();
    const diff = agora.getTime() - passado.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  },

  diasRestantes(dataFutura?: string | null, agoraRef?: Date): number | null {
    const futuro = parseDataSegura(dataFutura);
    if (!futuro) return null;

    const agora = agoraRef ?? new Date();
    const diff = futuro.getTime() - agora.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  adicionarDias(data: string, dias: number): string {
    const d = parseDataSegura(data) ?? new Date();
    const copia = new Date(d.getTime());
    copia.setDate(copia.getDate() + dias);
    return copia.toISOString();
  },

  getQuinzenaAtual(agoraRef?: Date): { mes: number; quinzena: 1 | 2; ano: number } {
    const hoje = agoraRef ?? new Date();
    const dia = hoje.getDate();
    return {
      ano: hoje.getFullYear(),
      mes: hoje.getMonth() + 1,
      quinzena: dia <= 15 ? 1 : 2
    };
  }
};

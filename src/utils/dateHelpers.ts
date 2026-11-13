// ============================================
// HELPERS DE DATA - FOCO EM QUINZENAS
// ============================================

export const DateHelpers = {
  // Nomes dos meses
  getNomeMes(mes: number): string {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes - 1] || '';
  },

  // Calcular período de uma quinzena
  calcularPeriodo(ano: number, mes: number, quinzena: 1 | 2): { inicio: string; fim: string; periodoInicio: string; periodoFim: string } {
    if (quinzena === 1) {
      return {
        inicio: `${ano}-${String(mes).padStart(2, '0')}-01`,
        fim: `${ano}-${String(mes).padStart(2, '0')}-15`,
        periodoInicio: `${ano}-${String(mes).padStart(2, '0')}-01`,
        periodoFim: `${ano}-${String(mes).padStart(2, '0')}-15`
      };
    } else {
      const ultimoDia = new Date(ano, mes, 0).getDate();
      return {
        inicio: `${ano}-${String(mes).padStart(2, '0')}-16`,
        fim: `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
        periodoInicio: `${ano}-${String(mes).padStart(2, '0')}-16`,
        periodoFim: `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
      };
    }
  },

  // Formatar período (ex: "01/01 a 15/01")
  formatarPeriodo(inicio: string, fim: string): string {
    // Corrigir parsing de data para evitar problemas de timezone
    const parseDate = (dateStr: string) => {
      const [ano, mes, dia] = dateStr.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    };
    
    const d1 = parseDate(inicio);
    const d2 = parseDate(fim);
    
    return `${String(d1.getDate()).padStart(2, '0')}/${String(d1.getMonth() + 1).padStart(2, '0')} a ${String(d2.getDate()).padStart(2, '0')}/${String(d2.getMonth() + 1).padStart(2, '0')}`;
  },

  // Formatar data completa
  formatarData(data: string): string {
    // Corrigir parsing de data para evitar problemas de timezone
    const parseDate = (dateStr: string) => {
      if (dateStr.includes('T')) {
        // ISO string com hora
        return new Date(dateStr);
      }
      // Data no formato YYYY-MM-DD
      const [ano, mes, dia] = dateStr.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    };
    
    const d = parseDate(data);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  },

  // Formatar data e hora
  formatarDataHora(data: string): string {
    const d = new Date(data);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  // Tempo desde uma data (ex: "Há 3 dias")
  tempoDesde(data: string): string {
    const agora = new Date();
    const passado = new Date(data);
    const diff = agora.getTime() - passado.getTime();

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `Há ${dias} dia${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Há ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `Há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'Agora mesmo';
  },

  // Dias restantes até uma data
  diasRestantes(dataFutura: string): number {
    const agora = new Date();
    const futuro = new Date(dataFutura);
    const diff = futuro.getTime() - agora.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  // Adicionar dias a uma data
  adicionarDias(data: string, dias: number): string {
    const d = new Date(data);
    d.setDate(d.getDate() + dias);
    return d.toISOString();
  },

  // Quinzena atual
  getQuinzenaAtual(): { mes: number; quinzena: 1 | 2; ano: number } {
    const hoje = new Date();
    const dia = hoje.getDate();
    return {
      ano: hoje.getFullYear(),
      mes: hoje.getMonth() + 1,
      quinzena: dia <= 15 ? 1 : 2
    };
  }
};

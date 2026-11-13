// ============================================
// HELPERS DE ARMAZENAMENTO (localStorage)
// ============================================

import { AppState } from '../types';

const STORAGE_KEY = 'demo_pedagogica_v1_state';
const BACKUP_PREFIX = 'demo_pedagogica_v1_backup_';

export const StorageHelpers = {
  // Salvar estado
  salvar(estado: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
      
      // Backup automático diário
      const hoje = new Date().toISOString().split('T')[0];
      const backupKey = `${BACKUP_PREFIX}${hoje}`;
      localStorage.setItem(backupKey, JSON.stringify(estado));
      
      // Limpar backups antigos (manter apenas últimos 7 dias)
      this.limparBackupsAntigos();
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      alert('Erro ao salvar dados. O armazenamento pode estar cheio.');
    }
  },

  // Carregar estado
  carregar(): AppState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return null;
    }
  },

  // Limpar backups antigos
  limparBackupsAntigos(): void {
    try {
      const keys = Object.keys(localStorage);
      const backupKeys = keys.filter(k => k.startsWith(BACKUP_PREFIX));
      backupKeys.sort().reverse();
      
      // Remover backups além dos 7 mais recentes
      backupKeys.slice(7).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Erro ao limpar backups:', error);
    }
  },

  // Exportar dados
  exportar(estado: AppState): void {
    const dataStr = JSON.stringify(estado, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planejamentos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // Limpar tudo
  limparTudo(): void {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
      [STORAGE_KEY, 'demo_pedagogica_v1_theme', ...Object.keys(localStorage).filter(key => key.startsWith(BACKUP_PREFIX))].forEach(key => localStorage.removeItem(key));
      window.location.reload();
    }
  }
};

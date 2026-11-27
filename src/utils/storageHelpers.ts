// ============================================
// WRAPPER DE COMPATIBILIDADE — STORAGE HELPERS
// Delega integralmente para src/persistence/storage.ts
// ============================================

import {
  carregarEstadoStorage,
  exportarDadosJson,
  limparDadosDemoStorage,
  salvarEstadoStorage
} from '../persistence/storage';

export const StorageHelpers = {
  salvar: salvarEstadoStorage,
  carregar: carregarEstadoStorage,
  exportar: exportarDadosJson,
  limparTudo: limparDadosDemoStorage
};

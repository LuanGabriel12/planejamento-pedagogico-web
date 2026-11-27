// ============================================
// WRAPPER DE COMPATIBILIDADE — VALIDATION HELPERS
// Delega integralmente para src/domain/validation.ts
// ============================================

import {
  validarCampoEnvio,
  validarEnvio,
  validarFeedbackDirecao,
  validarRascunho
} from '../domain/validation';

export const ValidationHelpers = {
  validarPlanejamento: validarEnvio,
  validarRascunho,
  validarCampo: validarCampoEnvio,
  validarFeedbackDirecao
};

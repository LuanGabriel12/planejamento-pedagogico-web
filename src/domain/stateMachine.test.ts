import { describe, it, expect } from 'vitest';
import {
  podeComentarPlanejamento,
  podeEditarPlanejamento,
  podeEnviarParaRevisao,
  podeExcluirPlanejamento,
  podeRevisarPlanejamento,
  podeTransicionarStatus
} from './stateMachine';
import { Usuario } from '../models/auth/users.model';

const prof1: Usuario = {
  id: 'prof_001',
  nome: 'Professor Exemplo 1',
  role: 'professor',
  email: 'professor1@example.invalid',
  avatar: 'P1'
};

const prof2: Usuario = {
  id: 'prof_002',
  nome: 'Professor Exemplo 2',
  role: 'professor',
  email: 'professor2@example.invalid',
  avatar: 'P2'
};

const diretor: Usuario = {
  id: 'dir_001',
  nome: 'Direção Exemplo',
  role: 'diretor',
  email: 'direcao@example.invalid',
  avatar: 'DE'
};

describe('stateMachine — transições e permissões', () => {
  it('permite apenas as transições definidas no fluxo pedagógico', () => {
    expect(podeTransicionarStatus('rascunho', 'rascunho')).toBe(true);
    expect(podeTransicionarStatus('rascunho', 'aguardando_revisao')).toBe(true);
    expect(podeTransicionarStatus('aguardando_revisao', 'aprovado')).toBe(true);
    expect(podeTransicionarStatus('aguardando_revisao', 'ajustes_solicitados')).toBe(true);
    expect(podeTransicionarStatus('ajustes_solicitados', 'ajustes_solicitados')).toBe(true);
    expect(podeTransicionarStatus('ajustes_solicitados', 'aguardando_revisao')).toBe(true);
  });

  it('bloqueia transições incompatíveis (ex.: aprovar rascunho ou alterar aprovado)', () => {
    expect(podeTransicionarStatus('rascunho', 'aprovado')).toBe(false);
    expect(podeTransicionarStatus('rascunho', 'ajustes_solicitados')).toBe(false);
    expect(podeTransicionarStatus('aguardando_revisao', 'rascunho')).toBe(false);
    expect(podeTransicionarStatus('ajustes_solicitados', 'aprovado')).toBe(false);
    expect(podeTransicionarStatus('ajustes_solicitados', 'rascunho')).toBe(false);
    expect(podeTransicionarStatus('aprovado', 'rascunho')).toBe(false);
    expect(podeTransicionarStatus('aprovado', 'aguardando_revisao')).toBe(false);
    expect(podeTransicionarStatus('aprovado', 'ajustes_solicitados')).toBe(false);
    expect(podeTransicionarStatus('aprovado', 'aprovado')).toBe(false);
  });

  it('restringe edição ao professor dono e aos status rascunho ou ajustes_solicitados', () => {
    expect(podeEditarPlanejamento({ status: 'rascunho', professorId: 'prof_001' }, prof1).permitido).toBe(true);
    expect(podeEditarPlanejamento({ status: 'ajustes_solicitados', professorId: 'prof_001' }, prof1).permitido).toBe(true);
    expect(podeEditarPlanejamento({ status: 'aguardando_revisao', professorId: 'prof_001' }, prof1).permitido).toBe(false);
    expect(podeEditarPlanejamento({ status: 'aprovado', professorId: 'prof_001' }, prof1).permitido).toBe(false);
    expect(podeEditarPlanejamento({ status: 'rascunho', professorId: 'prof_001' }, prof2).permitido).toBe(false);
    expect(podeEditarPlanejamento({ status: 'rascunho', professorId: 'prof_001' }, diretor).permitido).toBe(false);
  });

  it('restringe exclusão apenas a rascunhos do próprio professor', () => {
    expect(podeExcluirPlanejamento({ status: 'rascunho', professorId: 'prof_001' }, prof1).permitido).toBe(true);
    expect(podeExcluirPlanejamento({ status: 'ajustes_solicitados', professorId: 'prof_001' }, prof1).permitido).toBe(false);
    expect(podeExcluirPlanejamento({ status: 'aprovado', professorId: 'prof_001' }, prof1).permitido).toBe(false);
    expect(podeExcluirPlanejamento({ status: 'rascunho', professorId: 'prof_001' }, prof2).permitido).toBe(false);
  });

  it('permite envio ou reenvio apenas pelo professor responsável nos status adequados', () => {
    expect(podeEnviarParaRevisao(undefined, prof1).permitido).toBe(true);
    expect(podeEnviarParaRevisao({ status: 'rascunho', professorId: 'prof_001' }, prof1).permitido).toBe(true);
    expect(podeEnviarParaRevisao({ status: 'ajustes_solicitados', professorId: 'prof_001' }, prof1).permitido).toBe(true);
    expect(podeEnviarParaRevisao({ status: 'aguardando_revisao', professorId: 'prof_001' }, prof1).permitido).toBe(false);
    expect(podeEnviarParaRevisao({ status: 'aprovado', professorId: 'prof_001' }, prof1).permitido).toBe(false);
    expect(podeEnviarParaRevisao(undefined, diretor).permitido).toBe(false);
  });

  it('permite decisão da direção apenas em aguardando_revisao e comentários fora de rascunho', () => {
    expect(podeRevisarPlanejamento({ status: 'aguardando_revisao' }, diretor).permitido).toBe(true);
    expect(podeRevisarPlanejamento({ status: 'rascunho' }, diretor).permitido).toBe(false);
    expect(podeRevisarPlanejamento({ status: 'ajustes_solicitados' }, diretor).permitido).toBe(false);
    expect(podeRevisarPlanejamento({ status: 'aprovado' }, diretor).permitido).toBe(false);
    expect(podeRevisarPlanejamento({ status: 'aguardando_revisao' }, prof1).permitido).toBe(false);

    expect(podeComentarPlanejamento({ status: 'rascunho' }, diretor).permitido).toBe(false);
    expect(podeComentarPlanejamento({ status: 'aguardando_revisao' }, diretor).permitido).toBe(true);
    expect(podeComentarPlanejamento({ status: 'ajustes_solicitados' }, diretor).permitido).toBe(true);
    expect(podeComentarPlanejamento({ status: 'aprovado' }, diretor).permitido).toBe(true);
  });
});

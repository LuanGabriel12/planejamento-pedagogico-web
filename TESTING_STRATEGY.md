# Estratégia de Testes — Planejamento Pedagógico Web V2

## 1. Ferramentas adotadas

Como a V1 não possuía suíte automatizada, foram adicionadas exclusivamente as `devDependencies` autorizadas:

- **Vitest (`^5.1.2`)** — runner de testes integrado ao Vite 8.
- **Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`)** — testes baseados em comportamento real da interface e nomes acessíveis.
- **jsdom (`^31.0.1`)** — simulação de DOM e `localStorage` em Node.js.

## 2. Pirâmide e escopo dos testes

A suíte prioriza **regras de negócio e integridade** em funções puras (rápidos e determinísticos), complementados por testes de persistência e integração completa da interface.

| Arquivo de teste | Foco e comportamentos cobertos |
|---|---|
| [`src/domain/stateMachine.test.ts`](src/domain/stateMachine.test.ts) | Todas as transições válidas e inválidas entre os 4 status; bloqueio de edição após aprovação ou durante revisão; bloqueio de aprovação/devolução de rascunhos; restrição de exclusão apenas a rascunhos do próprio professor; permissão de comentários. |
| [`src/domain/validation.test.ts`](src/domain/validation.test.ts) | Diferença entre validação de rascunho e envio; rejeição de formulários vazios ou contendo apenas espaços; limites máximos; validação de ano, mês, quinzena, datas e `professorId`; validação de feedback obrigatório para ajustes. |
| [`src/domain/planningService.test.ts`](src/domain/planningService.test.ts) | Criação e edição repetida sem duplicação; bloqueio de dois planejamentos na mesma quinzena; ciclo completo (rascunho → envio → ajustes → edição intermediária preservando status/feedback → reenvio → aprovação → bloqueio pós-aprovação); isolamento entre professores fictícios; `verificarIntegridadeEstado` (IDs duplicados, professor órfão, quinzena duplicada). |
| [`src/domain/metrics.test.ts`](src/domain/metrics.test.ts) | Cálculo de indicadores da direção (incluindo ano vazio sem `NaN`), progresso do professor em 24 quinzenas, filtros combinados (busca com espaços, professor, status e resultado vazio) e estatísticas do perfil respeitando `anoAtual`. |
| [`src/persistence/storage.test.ts`](src/persistence/storage.test.ts) | Gravação e recarga V2; detecção de JSON corrompido sem sobrescrita automática; estrutura inválida mesmo com JSON válido; migração V1 → V2 preservando registros válidos e filtrando corrompidos; falha de gravação (`QuotaExceededError`); compatibilidade de tema; normalização conjunta de `(periodoInicio, periodoFim)` (início válido/fim inválido, início inválido/fim válido e par válido); restauração não destrutiva (falha em `setItem` preservando V1/V2 e falha posterior em `removeItem` reportando ressalva). |
| [`src/App.integration.test.tsx`](src/App.integration.test.tsx) | Fluxo ponta a ponta na UI (seleção de perfil, validação bloqueando envio incompleto, rascunho, envio, troca para direção, busca, solicitação de ajustes, retorno ao professor, correção/reenvio, aprovação e persistência após recarga/remount); modo proteção com `localStorage` corrompido e com falha de leitura (`getItem` falhando + `setItem` funcional, com recuperação via *Tentar ler novamente*); restauração segura com falha de escrita e com ressalva na limpeza legada; estados vazios; falha de gravação sem falso positivo; alternância e persistência de tema; bloqueio pós-aprovação; migração V1 → V2 na interface. |

## 3. Como executar

```bash
npm run typecheck   # Verificação estrita TypeScript (tsc --noEmit)
npm test            # Execução única da suíte Vitest
npm run test:watch  # Modo interativo durante desenvolvimento
npm run build       # Typecheck + build de produção Vite
```

## 4. Limitações de verificação

- Os testes de integração executam em `jsdom`, que valida DOM, eventos, ARIA e `localStorage`, mas não calcula layout visual real (CSS computado, overflow em pixels ou contraste renderizado).
- Não foi medida porcentagem formal de cobertura de linhas/branches (não declaramos cobertura percentual não medida).
- Verificação visual local: tela inicial, painel do professor, formulário e persistência de rascunho após recarregar foram conferidos em navegador. Não constitui teste visual exaustivo.

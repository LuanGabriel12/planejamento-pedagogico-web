# Persistência de Dados — Planejamento Pedagógico Web V2

Implementação centralizada em [`src/persistence/storage.ts`](src/persistence/storage.ts).

> **Aviso fundamental:** `localStorage` **não é um banco de dados seguro**, não possui criptografia, não isola perfis simulados e não garante retenção permanente (pode ser limpo pelo usuário, pelo navegador ou ficar limitado por cota).

## 1. Chaves de armazenamento

| Chave | Versão | Conteúdo |
|---|---|---|
| `demo_pedagogica_v2_state` | V2 (ativa) | Envelope JSON `{ schemaVersion: 2, savedAt: string, data: AppState }` |
| `demo_pedagogica_v2_theme` | V2 (ativa) | `'light'` ou `'dark'` |
| `demo_pedagogica_v1_state` | V1 (legada, somente leitura na migração) | Objeto `AppState` plano da V1 |
| `demo_pedagogica_v1_theme` | V1 (legada, fallback de tema) | `'light'` ou `'dark'` |
| `demo_pedagogica_v1_backup_*` | V1 (legada, descontinuada na V2) | Backups diários removidos apenas se o usuário restaurar explicitamente a demo |

**Por que os backups diários duplicados em `localStorage` foram removidos na V2?**
Na V1, toda edição gravava o estado inteiro duas vezes no mesmo `localStorage` (`state` + `backup_YYYY-MM-DD`, acumulando até 8 cópias). Isso consumia cota rapidamente sem oferecer backup independente (se o navegador limpa a origem, tudo some junto). Na V2, mantemos apenas uma cópia versionada e oferecemos **Exportar JSON** explícito no modal de perfil.

## 2. Estratégia de compatibilidade e migração V1 -> V2

Ao iniciar, `carregarEstadoStorage()` executa a seguinte ordem determinística:

1. Tenta ler `demo_pedagogica_v2_state`.
   - Se existir e for válido (`schemaVersion === 2` + `normalizarEstadoBruto`), retorna `status: 'ok'`.
   - Se existir e contiver JSON inválido ou estrutura corrompida, retorna `status: 'corrupted'`.
2. Se `demo_pedagogica_v2_state` não existir, verifica `demo_pedagogica_v1_state`.
   - Se existir e for JSON válido, executa `migrarEstadoV1ParaV2()`:
     - Garante presença dos perfis fictícios base.
     - Preserva todos os planejamentos com `id`, `professorId`, `ano`, `mes`, `quinzena` e `status` válidos.
     - Recalcula o par `(periodoInicio, periodoFim)` por completo sempre que qualquer uma das duas datas estiver inválida ou incompatível com `(ano, mes, quinzena)`, sanitiza listas e histórico e descarta duplicatas de ID ou de mesma quinzena com avisos registrados.
     - Preserva sessão e configurações válidas.
     - Grava o resultado em `demo_pedagogica_v2_state` **sem apagar** `demo_pedagogica_v1_state`.
   - Se `demo_pedagogica_v1_state` contiver JSON inválido, retorna `status: 'corrupted'` sem sobrescrever nada.
3. Se nenhuma chave existir, retorna `status: 'empty'` com `criarEstadoInicial()` (dados demonstrativos fictícios).

## 3. Proteção contra falha de leitura (`corrupted` e `storage_unavailable`)

- Quando `carregarEstadoStorage()` detecta `status: 'corrupted'` ou `status: 'storage_unavailable'`:
  - `AppContext` ativa `escritaBloqueadaPorFalhaLeitura = true`.
  - **Nenhuma gravação automática ou destrutiva é executada**, preservando integralmente eventuais dados existentes no armazenamento local mesmo que `setItem` esteja funcional.
  - O componente `PersistenceBanner` exibe um alerta claro com opções conscientes:
    1. **Tentar ler novamente** (em caso de `storage_unavailable`) para recuperar com segurança os registros reais se a leitura voltar a funcionar.
    2. **Baixar registro bruto** (em caso de `corrupted`, arquivo `.txt` para inspeção local).
    3. **Restaurar dados demonstrativos** (somente após confirmação explícita em `ConfirmDialog`).

## 4. Restauração não destrutiva e falhas de gravação

- **Restauração segura (`restaurarEstadoDemonstrativoStorage`):**
  1. Grava e confirma primeiro o novo envelope V2 em `demo_pedagogica_v2_state`.
  2. Se essa gravação falhar, a operação é interrompida imediatamente e **todos os registros anteriores (chaves V1, V2 e backups legados) permanecem intactos**.
  3. Somente após confirmar a gravação do novo estado V2, executa `limparChavesLegadasV1Storage` para remover chaves legadas da V1.
  4. Se a limpeza posterior falhar, o sistema informa explicitamente que a restauração V2 foi concluída **com ressalvas** (sem simular atomicidade entre múltiplas chamadas do `localStorage`).
- **Gravação com erro (`QuotaExceededError`, `SecurityError` ou erro inesperado):**
  - `salvarEstadoStorage()` retorna `{ ok: false, reason, message }`.
  - `AppContext.persistirEAtualizar()` intercepta o erro, **não** atualiza o estado como salvo, **não** exibe toast de sucesso e apresenta aviso explícito de falha.
  - No formulário de planejamento, o modal permanece aberto para evitar perda do texto digitado.

## 5. Limitações de múltiplas abas

- Se o usuário abrir duas abas simultâneas na mesma origem, cada aba mantém seu estado React em memória.
- Uma gravação na aba B substituirá a chave `demo_pedagogica_v2_state` sem atualizar automaticamente a aba A; se a aba A salvar depois, prevalecerá o último estado gravado (*last-write-wins*).
- Não foram implementados locks distribuídos ou sincronização entre abas para manter a simplicidade do escopo demonstrativo.

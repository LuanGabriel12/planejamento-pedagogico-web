# Dicionário de Dados — Planejamento Pedagógico Web V2

Definições oficiais em [`src/types/index.ts`](src/types/index.ts) e [`src/models/auth/users.model.ts`](src/models/auth/users.model.ts).

## 1. `EnvelopePersistenciaV2`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `schemaVersion` | `2` | Sim | Versão fixa do esquema salvo em `demo_pedagogica_v2_state`. |
| `savedAt` | `string` (ISO 8601) | Sim | Data/hora da última gravação bem-sucedida. |
| `data` | `AppState` | Sim | Estado completo da demonstração. |

## 2. `AppState`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `usuarios` | `Usuario[]` | Sim | Perfis fictícios disponíveis na demonstração. |
| `planejamentos` | `Planejamento[]` | Sim | Lista de planejamentos pedagógicos registrados. |
| `notificacoes` | `Notificacao[]` | Sim | Notificações locais associadas aos perfis. |
| `sessaoAtual` | `Sessao \| null` | Sim | Perfil simulado ativo no navegador (`null` na tela inicial). |
| `configuracoes` | `Configuracoes` | Sim | Preferências globais (`anoAtual`, `temaEscuro`). |

## 3. `Usuario` (perfil fictício)

| Campo | Tipo | Obrigatório | Restrições / Observações |
|---|---|---|---|
| `id` | `string` | Sim | Identificador único (ex.: `prof_001`, `dir_001`). |
| `nome` | `string` | Sim | Nome fictício exibido na interface. |
| `role` | `'professor' \| 'diretor'` | Sim | Papel funcional na simulação. |
| `email` | `string` | Sim | Domínio fictício reservado `@example.invalid`. |
| `avatar` | `string` | Sim | Iniciais curtas exibidas no círculo de avatar (ex.: `P1`, `DE`). |
| `disciplinas` | `string[]` | Não | Disciplinas de referência do professor fictício. |
| `turmas` | `string[]` | Não | Turmas de referência do professor fictício. |

## 4. `Planejamento`

| Campo | Tipo | Obrigatório | Regras / Validação |
|---|---|---|---|
| `id` | `string` | Sim | Identificador único gerado por `gerarIdUnico('plan')`. |
| `professorId` | `string` | Sim | Deve referenciar um `Usuario` existente com `role === 'professor'`. |
| `ano` | `number` | Sim | Inteiro entre `2020` e `2035`. |
| `mes` | `number` | Sim | Inteiro entre `1` e `12`. |
| `quinzena` | `1 \| 2` | Sim | `1` (dias 01–15) ou `2` (dia 16 ao último dia do mês). |
| `periodoInicio` | `string` (`YYYY-MM-DD`) | Sim | Data inicial coerente com `(ano, mes, quinzena)`. |
| `periodoFim` | `string` (`YYYY-MM-DD`) | Sim | Data final coerente com `(ano, mes, quinzena)`. |
| `titulo` | `string` | Sim | Envio: 10–100 caracteres (`trim`). Rascunho: até 100. |
| `disciplinas` | `string[]` | Sim | Envio: mínimo 1 item não vazio, sem duplicatas. |
| `turmas` | `string[]` | Sim | Envio: mínimo 1 item não vazio, sem duplicatas. |
| `experienciaAprendizagem` | `string` | Sim | Envio: 100–5.000 caracteres (`trim`). |
| `objetivos` | `Objetivo[]` | Sim | Envio: mínimo 2 objetivos válidos (5–300 chars cada). |
| `recursosNecessarios` | `string[]` | Sim | Opcional; até 200 chars por item, sem duplicatas case-insensitive. |
| `metodologiaAvaliacao` | `string` | Sim | Envio: 50–2.000 caracteres (`trim`). |
| `instrumentosAvaliacao` | `string[]` | Sim | Opcional; lista de instrumentos selecionados. |
| `conclusao` | `string` | Sim | Envio: 50–1.000 caracteres (`trim`). |
| `referencias` | `string[]` | Sim | Envio: mínimo 1 referência válida (5–500 chars cada). |
| `observacoes` | `string` | Não | Opcional; máximo 1.000 caracteres; apenas dados fictícios. |
| `status` | `StatusPlanejamento` | Sim | `'rascunho' \| 'aguardando_revisao' \| 'ajustes_solicitados' \| 'aprovado'`. |
| `criadoEm` | `string` (ISO 8601) | Sim | Timestamp da criação inicial. |
| `atualizadoEm` | `string` (ISO 8601) | Sim | Timestamp da última modificação. |
| `enviadoEm` | `string` (ISO 8601) | Não | Timestamp do primeiro envio para revisão. |
| `reenviadoEm` | `string` (ISO 8601) | Não | Timestamp do último reenvio após ajustes. |
| `revisadoEm` | `string` (ISO 8601) | Não | Timestamp da última decisão da direção. |
| `consideracoesDiretor` | `string` | Não | Resumo mais recente da decisão da direção. |
| `avaliacaoDiretor` | `number` | Não | Inteiro opcional entre `1` e `5`. |
| `prazoAjustes` | `string` (ISO 8601) | Não | Presente apenas quando `status === 'ajustes_solicitados'`. |
| `historicoConsideracoes` | `HistoricoConsideracao[]` | Sim | Linha do tempo imutável de envios, reenvios, comentários, ajustes e aprovações. |
| `versao` | `number` | Sim | Inteiro `>= 1`, incrementado a cada edição/envio do registro. |

## 5. `Objetivo`, `HistoricoConsideracao`, `Notificacao`, `Sessao`, `Configuracoes`

- **`Objetivo`:** `{ id: string, texto: string, atingido: boolean }`.
- **`HistoricoConsideracao`:** `{ id: string, texto: string, tipo: 'aprovacao' | 'ajuste' | 'comentario' | 'envio' | 'reenvio', criadoEm: string, lido: boolean, autorNome?: string, autorRole?: 'professor' | 'diretor' }`.
- **`Notificacao`:** `{ id: string, usuarioId: string, tipo: 'aprovacao' | 'ajuste' | 'comentario' | 'lembrete' | 'envio', titulo: string, mensagem: string, planejamentoId?: string, lida: boolean, criadaEm: string }`.
- **`Sessao`:** `{ usuarioId: string, loginEm: string }`.
- **`Configuracoes`:** `{ anoAtual: number, temaEscuro: boolean }`.

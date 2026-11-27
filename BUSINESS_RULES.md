# Regras de Negócio — Planejamento Pedagógico Web V2

Todas as regras abaixo são implementadas na camada de domínio (`src/domain/`) e verificadas por testes automatizados, sem depender apenas de botões desabilitados na interface.

## 1. Perfis simulados e escopo

- Existem dois papéis fictícios: `professor` (`prof_001` a `prof_004`) e `diretor` (`dir_001`).
- Perfis servem exclusivamente para demonstrar fluxos distintos no mesmo navegador; não constituem autenticação nem segurança real.

## 2. Calendário e unicidade quinzenal

- Cada ano letivo possui **24 quinzenas**: meses `1` a `12`, cada um dividido em `1ª quinzena` (dia 1 a 15) e `2ª quinzena` (dia 16 ao último dia real do mês, tratando corretamente meses de 28, 29, 30 e 31 dias).
- **Regra de unicidade:** um mesmo professor não pode ter dois planejamentos distintos para a mesma combinação `(professorId, ano, mes, quinzena)`.
- Professores diferentes podem criar planejamentos para a mesma quinzena normalmente.

## 3. Regras de rascunho vs. envio para revisão

| Critério | Salvar rascunho (`validarRascunho`) | Enviar / Reenviar (`validarEnvio`) |
|---|---|---|
| Conteúdo mínimo geral | Ao menos 1 campo com conteúdo não vazio | Todos os campos obrigatórios preenchidos |
| Título | Opcional no rascunho; máximo 100 caracteres | Obrigatório: 10 a 100 caracteres válidos (`trim`) |
| Disciplinas | Opcional no rascunho | Mínimo 1 disciplina |
| Turmas | Opcional no rascunho | Mínimo 1 turma |
| Experiência de aprendizagem | Opcional; máximo 5.000 caracteres | Obrigatório: 100 a 5.000 caracteres válidos |
| Objetivos | Sem itens vazios/só espaços; máximo 300 chars cada | Mínimo 2 objetivos válidos (5 a 300 chars cada) |
| Recursos necessários | Opcional; sem duplicatas (case-insensitive); máx 200 chars | Opcional; sem duplicatas; máx 200 chars |
| Metodologia de avaliação | Opcional; máximo 2.000 caracteres | Obrigatório: 50 a 2.000 caracteres válidos |
| Instrumentos de avaliação | Opcional | Opcional |
| Conclusão | Opcional; máximo 1.000 caracteres | Obrigatório: 50 a 1.000 caracteres válidos |
| Referências bibliográficas | Sem itens vazios; máximo 500 chars cada | Mínimo 1 referência válida (5 a 500 chars cada) |
| Observações | Opcional; máximo 1.000 caracteres | Opcional; máximo 1.000 caracteres |
| Metadados (`ano`, `mes`, `quinzena`, `periodoInicio`, `periodoFim`, `professorId`) | Sempre validados | Sempre validados |

## 4. Regras de edição, exclusão e versionamento

- **Edição pelo professor:** permitida apenas ao `professorId` dono do registro e somente quando `status` for `rascunho` ou `ajustes_solicitados`.
- **Preservação de devolução:** ao salvar alterações intermediárias em um planejamento com status `ajustes_solicitados`, o status **permanece `ajustes_solicitados`** e as considerações/prazo da direção são preservados até que o professor clique explicitamente em **Reenviar para revisão**. (Na V1, salvar rascunho rebaixava indevidamente o status para `rascunho` e apagava o feedback.)
- **Exclusão:** permitida somente para registros em `rascunho` pertencentes ao professor ativo. Planejamentos enviados, devolvidos ou aprovados não podem ser excluídos para manter a rastreabilidade do histórico.
- **Versionamento:** cada salvamento ou envio de um planejamento existente incrementa `versao` em `+1` a partir da versão armazenada atual.

## 5. Regras de revisão da direção

- **Aprovação (`aprovarPlanejamento`):**
  - Permitida apenas ao papel `diretor` quando o planejamento estiver em `aguardando_revisao`.
  - Comentário opcional (se vazio, registra texto padrão explícito); avaliação opcional de 1 a 5 estrelas (inteiros).
  - Limpa `prazoAjustes`, altera status para `aprovado`, registra evento `aprovacao` em `historicoConsideracoes` e cria notificação local para o professor.
- **Solicitação de ajustes (`solicitarAjustes`):**
  - Permitida apenas ao papel `diretor` quando o planejamento estiver em `aguardando_revisao`.
  - **Comentário obrigatório** com no mínimo 10 caracteres válidos (`trim`), máximo 2.000 caracteres.
  - Define `prazoAjustes` (+2 dias a partir da revisão), altera status para `ajustes_solicitados`, registra evento `ajuste` no histórico e notifica o professor.
- **Comentário sem mudança de status (`adicionarComentarioDirecao`):**
  - Permitido ao papel `diretor` em planejamentos já enviados (`aguardando_revisao`, `ajustes_solicitados` ou `aprovado`).
  - Bloqueado em `rascunho` (o rascunho pertence à elaboração privada do professor na simulação).
  - Exige no mínimo 3 caracteres válidos e não altera o status do planejamento.

## 6. Indicadores e consistência

- Todos os indicadores do Painel do Professor, Painel da Direção e Modal de Perfil são calculados exclusivamente a partir dos registros do **ano selecionado** (`estado.configuracoes.anoAtual`).
- Nenhum número exibido na interface é fixo ou simulado por constante.
- Divisões por zero (ex.: ano sem planejamentos) retornam `0%` de forma explícita.

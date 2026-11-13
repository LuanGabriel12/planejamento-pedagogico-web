# Relatório de testes e riscos restantes

Data: 13/11/2026. Testes na cópia independente, com formulários preenchidos com dados fictícios; original preservado. Dependências instaladas localmente sem executar scripts de instalação (`npm install --ignore-scripts`). O aplicativo de produção foi servido apenas em 127.0.0.1; não houve deploy ou push.

| Cenário | Resultado observado |
|---|---|
| TypeScript e build | `npm run build` passou com verificações estritas mantidas; Vite 8.3.8 gerou `dist`. |
| Segurança de dependências | `npm audit --audit-level=low`: zero vulnerabilidades conhecidas no momento da consulta. Não prova ausência de falhas. |
| Acesso | Professor e direção selecionados sem senha; faixa informa simulação. |
| Validação | Envio incompleto apresentou erros e foi bloqueado. |
| Rascunho e recarga | Rascunho fictício salvo duas vezes no mesmo formulário e preservado após recarregar; painel da direção mostrou dois registros totais, contando o exemplo inicial, sem duplicata nesse cenário. |
| Edição e envio | Campos fictícios editados e envio mudou status para aguardando. |
| Filtros | Busca sem correspondência e filtro por outro professor ocultaram o registro; filtro por status mostrou ajustes. |
| Revisão | Solicitação de ajustes mudou contador para 1; posterior aprovação simulada mudou total de aprovados para 2. |
| Desktop | Painel da direção em 1280×800; largura de conteúdo 1272 px, sem rolagem horizontal medida nessa tela. |
| Celular | Painel da direção em 375×812; conteúdo 367 px, cartões em coluna e ano legível. Não foram percorridas todas as telas/tamanhos. |
| Console | Consulta após testes retornou nenhum erro ou aviso; não é monitoramento contínuo. |
| Recursos externos | Inspeção dos fontes não encontrou chamadas de rede externas, Google Fonts foi removido; política CSP restringe conexões à própria origem. Não foi feito teste de rede exaustivo nem controle sobre terceiros que hospedem ou modifiquem a página. |

## Riscos e limites

- A aplicação não tem login verdadeiro, controle de acesso, servidor ou banco compartilhado. O fluxo representa interação de perfis no mesmo armazenamento local, não comunicação real entre pessoas.
- As chaves `demo_pedagogica_v1_*` são separadas das chaves do original, mas localStorage pertence à origem: outras páginas/código nessa mesma origem ou pessoas com acesso ao navegador podem acessar esses dados. A CSP e ausência de chamadas no código não impedem extensões, alterações futuras ou coleta de metadados pela própria hospedagem. Não inserir dados reais.
- Backups diários estão no mesmo armazenamento e podem desaparecer junto dos dados; exclusão e recuperação não foram testadas. O armazenamento pode ficar cheio ou ser limpo pelo navegador.
- O teste de salvamentos repetidos foi manual; temporizador automático de 30 segundos, vários cliques concorrentes, múltiplas abas, todas as ações, acessibilidade por teclado/leitor de tela e ampla variedade de dispositivos/navegadores não foram exaustivamente verificados. Não há suíte automatizada.
- O checklist de revisão é visual e não foi comprovado como salvo. Alguns controles de formulário não possuem associação robusta entre rótulos e campos; não há certificação de acessibilidade. A autenticação e autorização precisam ser implementadas no servidor antes de uso real.
- Zero alertas de dependências é resultado pontual, sujeito a novas divulgações e dependente da base consultada. Atualizações de Vite/plugin foram uma mudança de versão principal, verificadas pelo build e fluxos manuais listados; não houve teste de regressão completo.

## Veredito

A cópia é apropriada para apresentação como demonstração educacional **com dados fictícios e limitações visíveis**, após uma última revisão do conteúdo e do ambiente de hospedagem. Não se recomenda inserção de dados pessoais reais, nem se declara prontidão para produção. Nenhum segredo conhecido foi encontrado na inspeção textual de fontes e nomes de arquivos; isso não é garantia absoluta.

Instalação reproduzível: após encerrar o servidor local, `npm ci --ignore-scripts --no-audit --no-fund` e o build passaram novamente. A primeira tentativa de reinstalação com o servidor aberto falhou porque um arquivo de dependência estava em uso no Windows; não foi necessária alteração global.

## Verificação adicional para portfólio — 13/11/2026

Após retirar `date-fns` não utilizado, uma cópia limpa de trabalho passou em `npm ci --ignore-scripts --no-audit --no-fund` e `npm run build`. A consulta `npm audit --audit-level=low` não encontrou alertas conhecidos. Foram repetidos seleção de perfis, rascunho, salvamento repetido, recarga, edição, validação, envio e busca; a tela de revisão foi aberta. A conexão do navegador de teste foi interrompida ao tentar repetir solicitação de ajustes e aprovação, portanto os resultados dessas duas ações nesta rodada permanecem inconclusivos. Os testes aprovados na rodada anterior estão preservados acima. Seis capturas usam dados fictícios.

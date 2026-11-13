# Estudo de caso — planejamento pedagógico

## Problema e proposta

A ideia era apoiar a organização de planejamentos pedagógicos quinzenais para uma necessidade familiar ligada à escola. A demonstração explora como uma professora poderia registrar um planejamento e como a direção poderia revisá-lo. Não foi comprovado uso real pela escola, tempo economizado ou impacto mensurável.

## Requisitos da demonstração

Exibir períodos do ano, permitir criar e editar planejamentos, validar campos antes do envio, demonstrar rascunho e estados de revisão, oferecer busca e filtros, simular aprovação e ajustes e manter dados de exemplo no navegador. Os perfis devem ser claramente fictícios e a interface deve alertar contra uso de dados reais.

## Decisões

React e TypeScript estruturam a interface; Vite gera arquivos estáticos. Context e localStorage mantêm uma demonstração local, sem infraestrutura de servidor, adequada para experimentar o fluxo em um só navegador. A cópia usa suas próprias chaves, sem importar automaticamente dados do projeto original. Remove fontes externas, dados de pessoas da versão anterior e documentos desnecessários. O salvamento mantém o identificador do novo rascunho, evitando criar outro registro em salvamentos repetidos no cenário testado. Identidade simulada e ausência de segurança foram explicitadas na interface.

Essa escolha limita o projeto: os perfis não são contas, informações não circulam entre dispositivos, localStorage não é privado entre perfis e as cópias no mesmo navegador não são backup independente. Para uso real, seria necessário projeto próprio de autenticação, autorização no servidor, banco compartilhado, proteção e recuperação de dados.

## Testes e resultados

Os testes locais da cópia cobriram build, rascunho repetido e recarga, edição e validação, envio, filtros da direção, solicitação de ajustes e aprovação. Ver relatório de testes para os cenários e limites. O teste em 375 px mostrou cartões organizados em coluna e ano legível; a inspeção não cobre todos os dispositivos ou acessibilidade. A auditoria de dependências retornou zero alertas conhecidos na data do teste, sem garantir ausência de falhas.

## Papel da IA

Segundo o autor, o original foi criado com assistência do Cursor. Não há histórico preservado que permita atribuir trechos à IA, quantificar autoria ou comprovar prompts usados. A ferramenta apoiou o processo de desenvolvimento segundo o relato; não foi integrada ao aplicativo. A cópia foi preparada após auditoria com correções e verificação local. Não reivindicar agentes ou API de IA neste projeto.


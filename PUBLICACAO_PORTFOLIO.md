# Preparação de publicação — 13/11/2026

> Atualização: o repositório tornou-se público e a demonstração foi publicada em https://planejamento-pedagogico-web.pages.dev/. O texto abaixo registra a situação anterior à publicação.

## Repositório

`LuanGabriel12/planejamento-pedagogico-web` — https://github.com/LuanGabriel12/planejamento-pedagogico-web. Criado privado para revisão. O conteúdo versionado inclui somente esta demonstração; a pasta do projeto original não foi usada nesta etapa. Não tornar público sem aprovação expressa. Nenhum deploy foi criado.

## Arquivos preparados

README em português com problema, funcionalidades, arquitetura, telas reais, instalação, testes, limitações e relato honesto sobre assistência do Cursor. Estudo de caso e relatório de testes e riscos; fontes React/TypeScript, arquivos de build, lockfile e seis capturas JPEG em `docs/imagens/` (aproximadamente 405 KiB no total). A lista exata pode ser consultada no Git. `.gitignore` exclui node_modules, dist, a cópia `.verificacao`, ambientes, caches e logs. `package-lock.json` é incluído para instalação reprodutível. `date-fns` foi removido por não ser utilizado.

## Auditoria e testes

Uma cópia limpa dentro de `.verificacao` recebeu apenas fontes e arquivos necessários. `npm ci --ignore-scripts --no-audit --no-fund` e `npm run build` passaram depois da remoção da dependência não utilizada; Node 24, Vite 8.3.8; saída `dist`. `npm audit --audit-level=low` retornou zero vulnerabilidades conhecidas em 13/11/2026. Isso não garante segurança nem cobre riscos futuros.

Na última rodada, executada em `127.0.0.1`, foram verificados acesso de professor/direção, criação de rascunho, salvamento repetido, recarga, edição, validação de envio incompleto, envio simulado, busca, visualização da direção e abertura de revisão. Foram capturadas telas em modo claro e escuro com exemplos fictícios. A ferramenta de navegador interrompeu a repetição dos testes de solicitação de ajustes e aprovação; ambos haviam passado na rodada anterior, conforme `RELATORIO_TESTES_E_RISCOS.md`. Não declarar repetição final concluída. A última inspeção em 375×812 e 1280×800 foi na rodada anterior; não houve auditoria completa de acessibilidade, navegadores ou dispositivos. Não há suíte automatizada.

Os arquivos de origem e os nomes dos arquivos elegíveis foram inspecionados em busca de credenciais, .env, conteúdo pessoal, URLs e integrações externas. Os usuários em `src/data/initialData.ts` são perfis fictícios com domínios `example.invalid`; não foram encontradas credenciais, .env sensíveis ou informações pessoais evidentes. Não há Google Fonts ou chamadas externas no código da aplicação examinada; não se garante ausência absoluta de segredos ou falhas. Os arquivos de dependências externas são baixados do registro npm na instalação, e o site hospedado pode gerar metadados normais de rede ao provedor.

## Cloudflare Pages — preparação, sem deploy

Integração futura com GitHub: selecionar o repositório e branch desejada, raiz do projeto, Node 24, comando `npm run build`, saída `dist`, sem variáveis secretas identificadas. A SPA usa uma URL principal e estados React; não exige regra própria de rotas nesta versão. O Pages normalmente oferece comportamento de SPA conforme https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/ . Antes de conectar, verificar que a integração tem acesso apropriado ao repositório privado. A publicação pode disponibilizar o site publicamente, inclusive em prévias; não execute agora. Os dados continuam no navegador, isolados apenas pela origem, sem sincronização ou autenticação real.

## Limitações, pendências e aprovações

- Perfis, envio e revisão são simulados; sem servidor, contas seguras, dados compartilhados ou backup independente. Não inserir informações escolares reais.
- Confirmar o fluxo de aprovação e ajustes novamente em uma próxima sessão de teste; avaliar acessibilidade e dispositivos adicionais.
- Revisar README, imagens e conteúdo antes de mudar a visibilidade.
- Tornar o repositório público depende de aprovação expressa do proprietário. Criar deploy público também depende de aprovação; uma integração com Cloudflare pode produzir URL pública ou prévias, portanto não deve ser criada nesta etapa.
- Não há link de demonstração online porque nenhuma foi publicada.

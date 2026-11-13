# Planejamento Pedagógico Quinzenal

Criei este projeto para ajudar minha mãe a organizar seus planejamentos pedagógicos. A partir dessa necessidade, desenvolvi, com ajuda do Cursor e de inteligência artificial, um protótipo web com áreas para professor e direção.

## Demonstração online

[Acessar o Planejamento Pedagógico Quinzenal](https://planejamento-pedagogico-web.pages.dev/)

> Esta é uma demonstração com perfis simulados. Use apenas dados fictícios.

## Sobre o projeto

A ideia surgiu da vontade de tornar mais simples a organização dos planejamentos por quinzena e explorar uma forma de acompanhar a revisão pedagógica. Fui conduzindo a construção a partir das funcionalidades que queria experimentar, desde o formulário até os painéis de acompanhamento.

Preparei esta versão para apresentar o fluxo no portfólio. Nela, é possível alternar entre perfis fictícios de professor e direção e simular a revisão no mesmo navegador.

## Funcionalidades

- **Área do professor:** calendário anual com 24 quinzenas e acompanhamento do status dos planejamentos.
- **Planejamentos:** criação, edição, validação e salvamento de rascunhos no navegador.
- **Painel da direção:** visualização dos planejamentos, busca por título e filtros por professor e status.
- **Revisão e feedback:** envio para revisão, comentários, solicitação de ajustes e aprovação simulados.
- **Interface:** modo claro e escuro, notificações locais e adaptação para telas menores.

Os perfis e a troca entre professor e direção são simulados. Os dados ficam no mesmo navegador e não são sincronizados entre pessoas ou dispositivos.

## Tecnologias utilizadas

- React e TypeScript para a interface e a organização da aplicação.
- Vite para desenvolvimento e build.
- Tailwind CSS e PostCSS para estilos.
- Lucide React para ícones e React Hot Toast para notificações.
- LocalStorage para armazenar os dados da demonstração no navegador.

## Imagens

Capturas da aplicação com dados fictícios:

| Entrada | Painel do professor |
| --- | --- |
| ![Tela de entrada com perfis fictícios](docs/imagens/01-entrada.jpg) | ![Painel do professor](docs/imagens/02-professor.jpg) |

| Formulário | Entrada da direção |
| --- | --- |
| ![Formulário de planejamento](docs/imagens/03-formulario.jpg) | ![Seleção do perfil da direção](docs/imagens/04-direcao.jpg) |

| Revisão | Modo escuro |
| --- | --- |
| ![Revisão de planejamento fictício](docs/imagens/05-revisao.jpg) | ![Painel no modo escuro](docs/imagens/06-modo-escuro.jpg) |

## Como executar

É necessário ter Node.js 24 e npm instalados. Na pasta do projeto, execute:

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

Abra no navegador o endereço exibido no terminal. Para gerar e testar a versão estática:

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

Para experimentar o fluxo, entre como Professor Exemplo 1, crie um planejamento e envie para revisão. Depois, saia e entre como Direção Exemplo no mesmo navegador para encontrar o planejamento.

## Como desenvolvi

Usei o Cursor e inteligência artificial como apoio na implementação do código e da interface. Fui direcionando o desenvolvimento a partir das necessidades que identifiquei e das funcionalidades que queria construir. Essa experiência me ajudou a transformar uma ideia próxima da minha realidade em uma aplicação web demonstrativa.

A assistência de IA foi usada no desenvolvimento; o sistema não possui integração com uma API de IA.

## Limitações atuais

Este é um protótipo demonstrativo, sem autenticação real. Os dados ficam armazenados no navegador e não devem incluir informações escolares reais.

## Próximos passos

Como possibilidades para uma evolução futura, gostaria de explorar:

- Autenticação de usuários.
- Banco de dados.
- Sincronização entre usuários.
- Melhorias na experiência de utilização.

## Documentação

Para conhecer mais sobre as escolhas e verificações do projeto, consulte o [estudo de caso](ESTUDO_DE_CASO.md), o [relatório de testes e riscos](RELATORIO_TESTES_E_RISCOS.md) e o [relatório de publicação](PUBLICACAO_PORTFOLIO.md). A publicação utiliza o [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).

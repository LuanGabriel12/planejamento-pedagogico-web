# Segurança e Privacidade — Planejamento Pedagógico Web V2

## 1. Classificação real da aplicação

Esta aplicação é uma **demonstração educacional client-side**. Ela **não** oferece segurança de produção, autenticação real ou proteção de dados confidenciais.

- **Perfis simulados não são autenticação:** escolher "Professor Exemplo 1" ou "Direção Exemplo" apenas altera o estado React/localStorage no mesmo navegador.
- **Regras de interface e domínio no frontend não são controle de acesso seguro:** qualquer pessoa com acesso ao navegador ou às Ferramentas do Desenvolvedor (DevTools) pode inspecionar ou alterar o `localStorage` localmente.
- **Sem servidor ou banco compartilhado:** nenhum dado é enviado a APIs externas pelo código da aplicação; ainda assim, hospedagens estáticas registram metadados normais de acesso HTTP.

## 2. Política de dados (Privacidade)

- **Use exclusivamente dados fictícios.**
- Não insira nomes reais de professores, estudantes, turmas identificáveis, endereços, telefones, diagnósticos, laudos ou informações escolares reais.
- Todos os perfis de exemplo utilizam nomes genéricos (`Professor Exemplo 1..4`, `Direção Exemplo`) e o domínio reservado `@example.invalid` (RFC 2606).
- As 6 capturas históricas em `docs/imagens/` foram auditadas e contêm apenas textos fictícios.

## 3. Verificações de segurança realizadas no código

| Aspecto inspecionado | Situação na V2 |
|---|---|
| Renderização de conteúdo do usuário | Todo texto informado é renderizado via JSX escapado pelo React; **zero** ocorrências de `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou `new Function`. |
| Content Security Policy (`index.html`) | Preservada: `connect-src 'self'; object-src 'none'; base-uri 'self'`. |
| Recursos externos / fontes externas | Nenhuma chamada `fetch`/`XMLHttpRequest`, nenhum Google Fonts ou CDN externo no código-fonte. |
| Credenciais e variáveis de ambiente | Nenhum segredo, token, chave de API ou arquivo `.env` no repositório. `.gitignore` bloqueia `.env` e `.env.*`. |
| Desserialização de `localStorage` | `JSON.parse` encapsulado em `try/catch` seguido de validação estrutural estrita (`normalizarEstadoBruto`), sem sobrescrita silenciosa em caso de corrupção. |
| Dependências (`npm audit --audit-level=low`) | Uma verificação pontual não garante ausência futura de vulnerabilidades; execute `npm audit` para consultar o estado atual. |

## 4. Requisitos mínimos para uma eventual versão real de produção

Caso o conceito um dia evolua para uso real por uma instituição de ensino, seria obrigatório projetar do zero:

1. Backend dedicado com autenticação robusta e sessões/tokens seguros.
2. Controle de acesso (RBAC) validado no servidor para cada rota e registro.
3. Banco de dados com backup independente, trilha de auditoria e criptografia em trânsito (HTTPS) e em repouso.
4. Adequação formal à LGPD (base legal, minimização de dados, retenção e descarte).

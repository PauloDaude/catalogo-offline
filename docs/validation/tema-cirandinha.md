# Primária Cirandinha — 20/10/2026

Usuário definiu #371383 como primária, substituindo o azul. Tema claro, logo
original e verde de desconto #04a650 preservados. Aplicados tokens para preço,
botões, abas, foco, ícones, progresso, sombras e fundos suaves; metadados HTML/PWA
atualizados. Hover #2c0f69 e pressionado #250b59, com texto branco.

- Contraste com branco: normal 13,26:1, hover 15,22:1, pressionado 16,53:1.
- Teste do preço falhou antes da troca (ainda azul) e passou com o roxo.
- 79 testes unitários/componentes e 12 E2E pertinentes passaram.
- Build, lint e formatação dos arquivos alterados passaram. Verificação global de
  formatação não inclui nesta tarefa a correção do pnpm-lock.yaml não rastreado.
- Conferido hover real de botão e captura mobile no preview local.
- Sem publicação online ou alteração do banco remoto.

Especificação administrativa aprovada; plano escrito para revisão antes de iniciar
banco/Storage/painel. Não confundir a alteração visual com implementação do backend.

## Escolha posterior — azul #143B84

O usuário rejeitou o roxo e definiu #143B84. Tokens, estados, fundos suaves,
preços, foco, botões e metadados HTML/PWA agora usam o azul. Hover #10306a,
pressionado #0d2757; contraste com branco de 10,56:1, 12,70:1 e 14,53:1.
O verde de ofertas foi preservado. Build e lint passaram; nove testes E2E de
interação e controles flutuantes passaram. Sem publicação online.

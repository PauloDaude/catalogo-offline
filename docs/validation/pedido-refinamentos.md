# Refinamentos do pedido — 24/10/2026

## Comportamentos implementados

- Cabeçalhos da tabela PDF em Noto Sans Bold local
- Carrinho retém nome, observações, arquivo PDF e imagem de prévia em memória ao
  voltar, fechar e reabrir; não solicita os dados nem gera outro arquivo enquanto
  a seleção e fotos permanecerem iguais
- Alterar a seleção/fotos invalida o arquivo, conservando dados para regenerar;
  esvaziar completamente o carrinho limpa os dados do atendimento
- Editar dados do pedido descarta o arquivo pronto e reabre o formulário preenchido
- Prévia real de primeira página, renderizada por PDF.js local com worker; altura
  recortada, nome do arquivo abaixo e total ao lado, inclusive no celular
- Botões de entrada/geração e download em #EB1000 com texto branco e ícone PDF
- Compartilhar PDF chama o menu nativo diretamente com File pronto; sem suporte,
  botão visível desabilitado e orientação, mantendo download e envio por texto
- WhatsApp secundário contém cliente, data, vendedor, produtos/códigos,
  quantidades, unitários/subtotais, total e observações, sem imagens
- Destino configurado exatamente como informado: 556296146244, sem adicionar dígitos
- Animação +1 no carrossel e nos detalhes, contador baseado na quantidade atual,
  limite999 e movimento reduzido; feedback é reiniciado ao trocar o produto

## Verificações

Resultado: **139 testes unitários e 65 testes de navegador passaram**, com
verificação adicional dos10 casos de pedido após o último ajuste visual.
Build de produção, lint, formatação dos arquivos alterados e diff --check passaram.

- Testes de sessão cobrem reabertura sem geração, comparação binária dos PDFs,
  invalidação por seleção e atualizações em outra aba e limpeza do atendimento
- PDF cabeçalhos bold verificados pela fonte das operações de desenho
- Prévia verificada com imagem renderizada e recortada nas telas 320×720,
  800×1100 e 800×360; nome do arquivo e total mantidos em colunas distintas
- Worker, módulo PDF.js e fontes incluídos no precache, geração e prévia testadas
  após fechar e reabrir offline sem carregar os módulos previamente
- Preview libera documento/worker e URLs de imagem, falha mantém arquivo compartilhável
- Compartilhamento nativo simulado preserva ativação de usuário e trata cancelamento
- Texto WhatsApp e destino verificados por URL decodificada, nenhuma mensagem enviada
- PDF.js acrescenta recursos locais à preparação offline: app shell aproximadamente
  5,3 MiB antes de baixar as fotos dos produtos
- npm audit de dependências de produção: nenhum alerta no momento da verificação

## Revisão independente

Sem bloqueios de integridade no fluxo de pedido. O feedback persistindo no próximo
produto foi tratado como relevante para a interpretação do carrinho e corrigido
com teste RED→GREEN de identidade do botão.

O ícone + mantém16 px ao aparecer o contador, com classe explícita e regressão
visual RED→GREEN; isso preserva o tamanho do botão durante a interação.

## Validação real pendente

No Samsung e no celular, preparar novamente o catálogo offline após atualizar a
aplicação. Gerar pedido, voltar/fechar/reabrir e conferir prévia, baixar e abrir PDF,
compartilhar pelo menu nativo e testar o link WhatsApp para o número fornecido.
Cancelamento não deve apagar arquivo nem carrinho. Quantidades e valores devem
coincidir no PDF e no texto. Testar também paisagem e movimento reduzido.

O suporte a compartilhamento de arquivos depende do navegador/HTTPS e do sistema,
não pode ser forçado pela aplicação. O WhatsApp pode exigir rede e o limite efetivo
para textos muito extensos depende do aplicativo. Não foi validada a existência
da conta do telefone informado nem entrega de mensagens.

Sem publicação online, alteração de backend, DNS, upload de pedido ou persistência
de dados do cliente. As alterações locais anteriores do usuário foram preservadas.

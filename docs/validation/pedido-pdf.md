# Pedido PDF — validação local em 24/10/2026

## Implementação

O carrinho oferece Gerar pedido em PDF, formulário com nome do cliente obrigatório
e observações opcionais, seguido de modal com arquivo pronto para compartilhar
ou baixar. Sem histórico, endpoint novo, upload de PDF ou cadastro de clientes.
Nome, observações e arquivo ficam em memória durante o fluxo, sem limpar o carrinho.

O documento usa logo da Cirandinha, vendedor Antônio Marcos Daúde, data no fuso
America/Araguaina, fotos, códigos, nomes, quantidades, preços, subtotais e total.
Fonte estática Noto Sans local, tabelas paginadas e margens A4 retrato.

## Evidências

Validação final: **131 testes unitários e 63 testes de navegador passaram**.
Build de produção, lint, formatação dos arquivos da entrega e diff --check passaram.

- Modelo testado para soma exata, limites dos campos, carrinho vazio, indisponíveis,
  revisão pendente e overflow numérico
- PDFs de 1, 100 e 500 produtos abertos por pdf-lib e Poppler; extração de texto
  confirma acentos, vendedor, códigos e totais
- PDF de 500 linhas: 63 páginas, aproximadamente 266 KB com fotos ausentes, todas
  renderizadas e conferidas em folhas de contato; esse tamanho não estima pedidos
  com 500 fotos diferentes
- Layout conferido com foto real da demo, logo, cliente de 120 caracteres, produto
  de 160 caracteres, observações de 1000 e valores máximos admitidos pelo banco
- Nome excepcionalmente maior que uma página continua sem desenhar abaixo do
  rodapé, com regressão automatizada dos limites de desenho
- Valores de todo o intervalo inteiro seguro aceito pela fonte pública são
  ajustados à largura das colunas sem alterar os centavos
- Compartilhamento simulado confirma arquivo application/pdf e ativação de usuário
  no evento de teclado, com cancelamento preservando download
- Fotos indisponíveis/corrompidas exibem Sem foto sem perder nomes ou valores
- Atualização de localStorage por outra aba durante geração e após arquivo pronto
  invalida o resultado; nova geração usa o valor atualizado
- Build demo isolada testa fechar/reabrir offline sem carregar o gerador antes,
  incluindo chunk PDF, fonte, logo e fotos locais
- Interface conferida em 320×720, 800×1100 e 800×360, sem overflow horizontal
- Dependências de produção conferidas por npm audit: nenhuma vulnerabilidade
  reportada no momento da implementação, sem garantia sobre versões futuras

## Revisão independente e decisões

Revisão final identificou linha maior que uma página, corrigida com teste RED→GREEN.
O intervalo monetário aceito pela fonte pública foi tratado como parte da mesma
integridade do documento e recebeu teste RED→GREEN de largura de coluna.

A fonte variável inicialmente testada produziu glifos ausentes no render e foi
substituída por Noto Sans TTF estática oficial, menor e visualmente verificada.
O checkout main foi reutilizado conforme autorização existente, sem mover ou
apagar as alterações locais do usuário. O commit do CSS preserva também o ajuste
de foco do select autorizado na etapa anterior, sem reconstruir seu conteúdo.

## Roteiro pendente em aparelhos reais

1. Atualizar/reabrir a aplicação, preparar o catálogo offline e adicionar produtos
2. Abrir carrinho → Gerar pedido em PDF, preencher nome e observações e gerar
3. Compartilhar PDF, selecionar WhatsApp e conferir anexo, cliente e valores
4. Cancelar o menu nativo e confirmar que ainda é possível compartilhar ou baixar
5. Baixar PDF e abrir no leitor do dispositivo, conferir foto e acentos
6. Fechar/reabrir offline e repetir geração e download, sem depender do WhatsApp
7. Testar no Samsung em retrato e paisagem com teclado virtual, inclusive pedido longo

Menu nativo Android/WhatsApp, desempenho em hardware de pouca memória e eventual
remoção dos dados pelo navegador não foram validados por testes desktop. Não há
promessa de entrega no WhatsApp nem de armazenamento local permanente. Geração
PDF funciona offline após preparação; o aplicativo de destino pode precisar de rede.

## Escopo preservado

Não houve publicação online, alteração DNS, configuração Cloudflare ou mudança no
banco remoto. Segurança Supabase e backup próprio seguem seu roteiro separado.
Paginação administrativa e link de acesso ao painel são entregas futuras.

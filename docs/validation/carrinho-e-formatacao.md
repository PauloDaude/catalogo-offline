# Carrinho, códigos e formatação — 15/10/2026

Extensão delimitada do catálogo existente, aprovada na conversa. Sem pagamento,
checkout ou envio de pedidos. Supabase e painel administrativo continuam na etapa 2.

## Entregue

- Adicionar pelo card ou pela foto ampliada, agrupar o mesmo produto e ajustar
  quantidades de 1 a 999, com remoção explícita.
- Subtotais e total em centavos inteiros; valores que excedem precisão segura são
  sinalizados sem exibir um total incorreto.
- Seleção local persistida por navegador/aparelho e disponível offline. Negação
  de armazenamento mantém o uso na aba com aviso visível.
- Limpeza com confirmação para novo atendimento.
- Revisão explícita antes de aplicar preços novos ou excluir indisponíveis do total.
- Botão fixo no canto inferior direito em celular, tablet e desktop; espaço no
  final da página evita sobreposição com o último conteúdo.
- Códigos `P001` a `P010` persistidos nos dados; validados quanto a formato e
  unicidade, visíveis discretamente no card, nos detalhes e no carrinho.
- Revisão do catálogo fictício incrementada para que dispositivos preparados
  recebam os códigos ao sincronizar, sem baixar novamente fotos inalteradas.
- Prettier local com versão fixada; scripts `format` e `format:check`, EditorConfig,
  extensão recomendada e format-on-save para VS Code/Cursor. Linhas em branco
  separam imports, declarações, funções e blocos lógicos; JSX multilinha usa um
  atributo por linha. Todos os arquivos compatíveis foram formatados.

## Verificação

- 60 testes de lógica e componentes passaram.
- 18 testes de navegador cobrem também botão flutuante, códigos, persistência do
  carrinho offline, mudança de preço, indisponibilidade e confirmação de limpeza.
- Build, lint e verificação Prettier sem erros.
- Testes no hardware Android real e com o vendedor continuam pendentes.

## Revisão independente

A revisão do carrinho encontrou um problema no tratamento de eventos de storage:
uma notificação atrasada podia ser persistida novamente e sobrescrever a seleção
mais recente. Corrigido com leitura do estado atualmente salvo e sem regravar
eventos recebidos. Dois testes de regressão falharam antes e passaram depois,
incluindo limpeza sem ressuscitar produtos antigos.

O carrinho não oferece transações distribuídas ou sincronização entre aparelhos.
Abas do mesmo navegador recebem notificações; ele não é um sistema de pedidos.

## Continuidade

Usar `npm run format` após mudanças e `npm run format:check` antes de finalizar.
No futuro gerenciamento, atribuir códigos no banco com unicidade e sem reutilizar
códigos de produtos ocultos; não gerar códigos pelo índice de renderização.

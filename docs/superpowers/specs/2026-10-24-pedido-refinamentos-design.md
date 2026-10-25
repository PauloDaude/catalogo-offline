# Refinamentos de pedido e feedback — aprovado em conversa

Usuário aprovou implementar a proposta apresentada após revisar o primeiro PDF.

- Cabeçalhos da tabela em negrito com Noto Sans Bold local
- Sessão do pedido vive no carrinho, mantendo nome, observações, PDF e prévia ao
  voltar/fechar/reabrir, somente em memória até recarregar a página
- Alterar seleção ou fotos invalida arquivo e prévia, mantém dados para nova geração;
  limpar completamente o carrinho descarta dados do atendimento
- Prévia renderizada da primeira página real do PDF, com altura recortada de 220px,
  nome do arquivo abaixo e total ao lado, sem iframe ou serviço externo
- Botões de gerar (inclusive entrada do carrinho) e baixar: vermelho #EB1000,
  texto branco, ícone de documento PDF; ações de compartilhamento mantêm identidade
- Compartilhar PDF abre diretamente menu nativo quando suportado, sem baixar;
  mostrar botão também sem suporte, desabilitado com orientação de compatibilidade
- WhatsApp secundário abre texto do pedido, sem imagens, para 556296146244,
  exatamente como informado pelo usuário, sem acrescentar dígitos ao telefone
- Texto inclui cliente, vendedor, data, códigos/produtos, quantidade, unitário,
  subtotal, total e observações; enviar somente após confirmação do usuário no app
- Adicionar nos detalhes e no carrossel mostra +1 subindo e contador de quantidade
  atual, inclusive reduções/remoção sincronizadas com o carrinho; máximo999 respeitado
- Reduced motion remove deslocamento da animação, mantendo feedback visual e acessível
- Biblioteca de prévia, worker, fontes e recursos necessários no precache offline
- Sem uploads, persistência de clientes/PDF, publicação, alterações DNS ou backend

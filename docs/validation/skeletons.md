# Skeletons — 30/10/2026

## Escopo

Primitivas LoadingSkeleton e LoadingImage, sem dependências novas. Placeholder do
catálogo acompanha a aba inicial escolhida, sem falso vazio ou contagem zero.
Categorias, autorização/abertura do painel, produtos administrativos, fotos e
preparação/prévia do PDF usam placeholders adequados ao conteúdo desconhecido.

Dados já prontos continuam visíveis ao atualizar. Nova consulta administrativa
(página/filtros) usa skeleton; refresh da mesma consulta preserva conteúdo e exibe
estado de atualização. Erro nesse refresh mantém a lista e o erro com retry. Erro
inicial ou de outra consulta não apresenta dados antigos como se fossem atuais.

Skeletons decorativos são ignorados por leitores de tela; estados de espera
mantêm descrição e aria-busy, anúncio público via SyncStatus para não duplicar a
mensagem. Animação de brilho desligada com prefers-reduced-motion.

LoadingImage preserva o próprio elemento img, classes, dimensões e callbacks.
Não gera wrappers que alterem grade, foto proporcional, carrinho ou modal. URLs
Blob são reutilizadas e fotos em cache não ficam presas em loading. Erros encerram
a animação e mantêm tratamento de erro existente. Prévia PDF reserva sua altura.

## Verificações

- Testes unitários: placeholder → vazio real, imagem carregada/alterada/falha/cache,
  painel com resposta pendente e refresh da mesma consulta com sucesso/falha
- Navegador: grade/folhear em celular/tablet, resposta lenta, falha, imagem lenta,
  reduced motion, ausência de rolagem horizontal, conteúdo real após carregamento
- Regressões do catálogo, carrossel, consulta offline e ampliação da foto
- Revisão independente: corrigida retenção da lista em erro de refresh e conferida
  altura reservada na prévia PDF
- Hardware real e fluxos remotos administrativos continuam sujeitos a validação
  prática, sem modificar backend nem usar conta real durante estes testes

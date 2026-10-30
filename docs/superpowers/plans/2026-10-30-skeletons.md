# Skeletons de carregamento

Execução direta solicitada pelo usuário em 30/10/2026.

**Objetivo:** apresentar placeholders proporcionais ao conteúdo enquanto leituras,
fotos e prévias ainda não estão prontas, sem confundir loading com lista vazia.

**Abordagem:** componentes reutilizáveis de skeleton acessível e imagem com
indicador no próprio elemento, layouts específicos para catálogo/painel, sem
novas dependências. Preservar offline, filtros, foco, dimensões e dados já prontos.

- [x] Criar primitivas e layouts de skeleton com aria-busy/status e reduced motion
- [x] Integrar catálogo em grade/folhear sem mostrar vazio durante carga inicial
- [x] Integrar painel: abertura, acesso, produtos e categorias, sem liberar ações
- [x] Integrar fotos, processamento de foto e geração/prévia do PDF
- [x] Testar respostas lentas, sucesso, falha, dados vazios e imagens em cache
- [x] Conferir responsividade, build, lint/formatação e publicar via main

Skeletons representam espera por conteúdo. Mutação e sincronização mantêm seus
textos/progresso, sem esconder formulário preenchido ou conteúdo público já salvo.
Alternância entre abas com dados prontos não provoca loading artificial.

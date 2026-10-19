# Logo no header — 19/10/2026

Logo fornecida pelo usuário: `public/logos/logo-cirandinha.png`, PNG transparente
1825×365 (proporção 5:1). Substitui o ícone e o título genéricos do header.
Imagem original preservada, com texto alternativo Cirandinha Variedades e URL
respeitando o BASE_URL do Vite.

- Conferida em 320, 800 e 1280 px: 240×48 no celular e 280×56 nas telas maiores,
  sem corte, distorção ou overflow.
- Preparação offline concluída; logo decodificada após reload com rede desativada.
  O PNG entrou no precache do Workbox, sem alterar política de cache dos produtos.
- Build e lint passaram; seis testes de CatalogPage/CatalogBook passaram.
- Formatação dos arquivos alterados passou. A verificação global apontou apenas
  `pnpm-lock.yaml` não rastreado, preexistente à tarefa; mantido sem alterações.
- Revisão estática independente sem problemas importantes. Captura de celular
  inspecionada. Não houve publicação online; teste em hardware Android real pendente.

Painel administrativo continua pendente. Pedido funcional registrado: alterar foto,
nome, preço e desconto e gerenciar categorias, com segurança no Supabase.

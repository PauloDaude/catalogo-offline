# Acesso ao painel e paginação — 27/10/2026

## Implementação

- Link Acessar painel no header público, rota /admin com autenticação existente
- Consulta administrativa em páginas de 20 itens, com total, intervalo e controles
- Busca por nome/código literal, sem distinção de caixa/acentos, combinada com
  categoria e Mostrar, que permanece inicialmente Todos
- Debounce de 300 ms, reset da página ao filtrar, descarte de respostas obsoletas,
  erro com repetição e correção de página fora do intervalo
- Edição mantém página/filtros, cadastro retorna à primeira página
- Categorias consultam vínculos separadamente, incluindo produtos ocultos, sem
  depender da página atual e sem truncamento do limite de linhas do PostgREST
- Snapshot público e cópia offline continuam integrais

## Evidências locais

- Testes de API novos falharam antes dos métodos e passaram após implementação
- Testes de paginação/estados e categorias falharam antes da integração e passaram
- Teste específico da remoção da última categoria reproduziu filtro preso e passou
  após correção para considerar carregamento concluído com lista vazia
- Teste de link no header falhou antes da implementação e passou depois
- Script scripts/test-admin-pagination-local.mjs falhou com PGRST202 antes da
  migration, passou após aplicação somente no Supabase local
- Script verifica 105 produtos em seis páginas, página fora do intervalo mantendo
  total, filtros, busca acentuada/literal e código, ordenação repetível, 1025 vínculos
  e chamadas diretas de ambas as RPCs como visitante, comum e administrador
- Testes administrativos de navegador: 11/11 passaram, com CRUD, categorias,
  conflito, offline, 105 produtos, filtros e edição preservando página
- Catálogo público: 68/68 testes de navegador passaram em build demo isolada
- Revisão independente identificou perda de foco ao desmontar a paginação durante
  carregamento; teste unitário RED→GREEN e teste real de teclado confirmaram a
  correção mantendo os controles montados e bloqueando novas ações enquanto carrega
- Teste administrativo final 11/11, mais paginação isolada 1/1 com imagem própria,
  edição na página 2, foco preservado e cadastro retornando à primeira página
- Build de produção com fonte Supabase, lint, Prettier dos arquivos alterados e
  git diff --check passaram
- Inspeção das capturas locais de paginação em celular e tablet e header de 320 px
- Uma execução da suíte encontrou oscilação de foco em teste existente do carrinho;
  ele passou isolado 9/9 e na repetição completa 154/154, sem mudanças no carrinho

- Suíte unitária final após correção do foco: **155/155** passaram

## Limites e aplicação

A migration 202610270004_admin_pagination.sql foi aplicada somente no banco local.
Aplicar no projeto real antes de publicar a build, conforme
[passo a passo](../deployment/paginacao-painel.md). Não houve publicação nem push.

Verificação automatizada usa Chromium local, não representa avaliação do vendedor
ou validação no Android real. Não revisa os avisos anteriores do Security Advisor,
backup ou hospedagem. Dados e contas dos testes locais são temporários e limpos.

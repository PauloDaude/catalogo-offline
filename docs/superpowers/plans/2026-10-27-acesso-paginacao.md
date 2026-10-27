# Acesso ao painel e paginação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para executar as tarefas diretamente nesta sessão

**Goal:** Expor o acesso ao painel e consultar seus produtos em páginas de 20 itens

**Architecture:** RPC administrativa SECURITY INVOKER retorna página e total, mantendo RLS e autorização explícita. Categorias consultam vínculos independentemente da página. O snapshot público/offline permanece integral

**Tech Stack:** React, TypeScript, Vite, React Aria, Supabase e testes Vitest/Playwright

**Spec:** docs/superpowers/specs/2026-10-27-acesso-paginacao-design.md

## Global Constraints

- Tema #143B84, React Aria, sem Radix, alvos de toque de pelo menos 48 px
- 20 produtos por página, Mostrar inicialmente Todos
- Não publicar online, aplicar migrations remotas ou alterar arquivos locais alheios
- Nenhuma mudança no snapshot público ou na preparação offline

## Review Focus

- Produto vinculado fora da página atual deve impedir remoção/arquivamento inválido
- Resposta atrasada não deve substituir dados de filtro mais recente
- Último item ocultado não deve deixar página inválida
- Pesquisa literal com acento ou pontuação não deve alterar a expressão da consulta
- Visitante e autenticado não administrador não podem consultar a RPC administrativa

### 1. Consulta paginada e vínculos

**Files:** nova migration em supabase/migrations/, src/admin/api.ts, src/admin/types.ts,
scripts/test-admin-local.mjs, novos testes unitários da API

**Interfaces:** listProducts({page, query, category, visibility}) retorna
{products: AdminProduct[], total: number}; listCategories() retorna AdminCategory[];
listCategoryProducts(id, activeOnly) retorna vínculos necessários à gestão

- [x] Escrever testes de página 1/2, limites, total e combinação de filtros, busca
      com acento e caracteres literais, ordenação estável e vínculos além de 20 itens
- [x] Executar testes e confirmar falha antes da implementação
- [x] Criar RPC com argumentos tipados, limite fixo de 20, busca literal normalizada,
      retorno de total inclusive quando a página estiver vazia, autorização explícita,
      RLS, search_path fixo e grants mínimos na mesma migration
- [x] Separar consultas de categorias e vínculos da lista paginada no cliente
- [x] Testar RPC diretamente como visitante, autenticado não administrador e
      administrador no ambiente local, sem escrever no projeto remoto

### 2. Lista administrativa paginada

**Files:** src/admin/Management.tsx, src/admin/categories/Categories.tsx,
src/admin/Management.test.tsx, src/admin/categories/Categories.test.tsx,
src/styles.css e testes de navegador em tests/admin/

**Interfaces:** consumir métodos da tarefa 1, preservando saveProduct e operações
existentes; categorias deixam de receber a página como lista completa de produtos

- [x] Adicionar testes de mais de 100 itens, próximo/anterior e limites, primeira
      página ao filtrar, pesquisa global, erro/repetição e resposta fora de ordem
- [x] Adicionar testes de edição mantendo página, cadastro voltando à primeira,
      ocultação do último item e vínculos fora da página atual
- [x] Confirmar falhas, então implementar estado de consulta, debounce de 300 ms,
      proteção contra respostas obsoletas e ajuste de página fora do intervalo
- [x] Acrescentar intervalo/total, Página X de Y e controles de toque acessíveis
- [x] Atualizar categorias para consultar vínculos na ação e manter suas confirmações
- [x] Executar testes unitários e navegador com falha de rede e teclado

### 3. Entrada pública e entrega local

**Files:** src/catalog/CatalogPage.tsx, src/styles.css, testes correspondentes,
AGENTS.md e novo relatório em docs/validation/

**Interfaces:** link público para /admin, reutilizando roteamento e Auth existentes

- [x] Testar link no header, destino correto, acesso por teclado e layout móvel
- [x] Implementar Acessar painel com texto/ícone, preservando logo e carrinho
- [x] Executar testes unitários limitando workers a 2, testes de navegador relevantes,
      build, lint, Prettier dos arquivos alterados e git diff --check
- [x] Inspecionar visualmente celular/tablet, revisar diff e registrar resultados,
      limitações reais e instrução de aplicação da migration pelo usuário
- [x] Atualizar AGENTS.md e fazer commit local somente dos arquivos desta entrega,
      sem push nem publicação online

Execução concluída localmente em 27/10/2026, evidências em docs/validation/acesso-paginacao.md

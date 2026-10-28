# Variantes de produto e caixas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para executar diretamente após aprovação do plano

**Goal:** Agrupar opções com preços distintos e unidades de venda explícitas,
preservar offline/carrinho/PDF e importar cinco produtos piloto após validação

**Architecture:** Products simples preservados, tabela filha product_variants para
pais com opções, preços canônicos por item vendável e snapshots V2 compatíveis com
cópias antigas. RPC transacional e importação idempotente com autorização real

**Tech Stack:** React/TypeScript/Vite, React Aria, Supabase, Dexie, pdf-lib, Node e
Vitest/Playwright; sem Radix e sem mudança da stack

**Spec:** docs/superpowers/specs/2026-10-28-variantes-design.md

## Global Constraints

- Primária #143B84 e verde #04a650, toque de 48 px e textos simples
- Um pai por card, opções com preço/oferta/foto próprios e seleção antes de adicionar
- Preço por caixa já informado não é multiplicado outra vez; somente und. × conteúdo
- Preservar IDs/códigos atuais, nunca reutilizar códigos, não apagar carrinho/IndexedDB
- Sem escrita remota até SQL aplicado, backup real e validação; cinco pais ocultos
  como único lote autorizado, sem publicação de frontend ou lote completo

## Review Focus

- Preço mínimo e desconto de opções diferentes não podem gerar oferta falsa
- Duas opções do mesmo pai não podem se fundir na mesma linha do carrinho
- Migração de modo não pode associar uma seleção antiga à opção errada
- Falha de foto/operação deve preservar snapshot anterior e evitar duplicação no retry
- RLS/RPC impedem leitura oculta e escrita cruzada/não autorizada, inclusive por API

### 1. SQL, autorização e dados legados

**Files:** supabase/migrations/202610280005_product_variants.sql,
scripts/test-variants-local.mjs, docs/deployment/variantes.md

**Interfaces:** save_product_v2(jsonb), list_admin_products_v2(filtros/página),
read_catalog_snapshot_v2(), importação idempotente, conforme a spec

- [x] Conferir schema/migrations 001 a 004 e autorização no ensaio local, com
      pré-checagem reproduzível para aplicação remota
- [x] Escrever testes locais de simples preservado, pai com dois preços, código
      imutável, oferta inválida, caixa inválida, filhos duplicados e filho de outro pai
- [x] Confirmar falhas antes de implementar tabelas/RPCs/triggers
- [x] Implementar migração transacional sem recriar produtos existentes, com campos
      de modo/venda, variantes e contador monotônico protegido no banco
- [x] Implementar RLS, grants, RPCs invoker, conflito de versões e garantia diferida
      de opção ativa, revisão pública e ledger privado de importação com hash
- [x] Preservar endpoints legados com leitura segura apenas de simples por unidade
      e bloqueio de escrita antiga sobre produtos convertidos
- [x] Testar API como visitante, autenticado comum e administrador, incluindo Storage,
      tentativa de falsificar dono/código/opção e cenário concorrente
- [x] Ensaiar migration em cópia local existente, entregar SQL integral e passo a
      passo de execução no Dashboard, sem aplicar no projeto remoto pelo agente

### 2. Contratos TypeScript e offline V2

**Files:** src/catalog/types.ts, validation.ts, supabase-source.ts, source.ts,
storage.ts, sync.ts, novo legacy-migration.ts, testes correspondentes e fixtures/demo

**Interfaces:** Product simples/com variantes, SellableProduct selecionado,
allImagePaths(snapshot), resolvedVariantImage(parent,variant), migrateLegacyCatalogOnce

- [x] Criar testes de parser V1/V2, preços opcionais coerentes com modo, códigos
      Pxxx-Vnn, nomes/rótulos inválidos, fotos repetidas e filho sem foto própria
- [x] Confirmar falhas, implementar tipos e adaptador V1 sem perder snapshot antigo
- [x] Separar versão do formato/revisão e forçar preparação V2 mesmo com revisão
      igual quando necessário; ler/ativar/podar todas as fotos dos pais e opções
- [x] Usar namespaces IndexedDB V2 por fonte/origem, copiar V1 uma vez com fotos/
      snapshot/marcador em transação, sem podar V1; testar quota insuficiente,
      interrupção e retry, além de abas V1/V2 simultâneas podando apenas seus bancos
- [x] Testar falha na segunda foto, concorrência de sincronização, reabertura sem
      rede, cache de foto compartilhada e migração sem limpar dados locais

### 3. Compra, carrinho e pedido

**Files:** src/cart/model.ts, useCart.ts, novo legacy-migration.ts, CartPanel.tsx, CartThumbnail.tsx,
src/orders/{model,pdf,whatsapp,useOrderSession}.ts e testes correspondentes

**Interfaces:** item vendável por UUID simples/variante, parentId, label, unidade
estruturada, preço por venda e assinatura da configuração selecionada

- [x] Testar duas variantes em linhas distintas, quantidade de caixas, totais em
      centavos, limite 999, nomes/códigos antigos e revisão de mudanças de unidade
- [x] Criar chave de carrinho V2 separada, migrar V1 por cópia única com marcador
      no mesmo envelope persistido, preservando V1 e não reimportando após limpar V2;
      testar abas antigas gravando V1, eventos storage, falha de persistência e reload
- [x] Confirmar falhas e implementar preservação de carrinho V1, sem escolha implícita
      quando um produto passa a exigir variante
- [x] Testar preço igual com conteúdo de caixa alterado e opção ocultada, exigindo
      revisão antes de aceitar alterações e gerar PDF
- [x] Atualizar descrição, miniatura, PDF e WhatsApp com opção, código e caixa/unidade
- [x] Testar PDF longo, quebra de páginas, total de caixas, prévia/compartilhamento
      e invalidação do arquivo em memória quando seleção/configuração/foto muda

### 4. Catálogo e painel de opções

**Files:** src/catalog/ProductDialog.tsx, ProductCard.tsx, CatalogBookProduct.tsx,
ProductPrice.tsx, CatalogPage.tsx, search.ts, src/admin/types.ts, api.ts,
Management.tsx, products/ProductForm.tsx, novos componentes VariantEditor.tsx e
VariantSelector.tsx, src/styles.css e testes Vitest/Playwright

**Interfaces:** componentes consomem pais/filhos da tarefa2 e itens selecionados da3,
painel usa RPCs da tarefa1, com expectedVersion para todo o conjunto

- [x] Testar um card por família, variante sem seleção, opção única, preço mínimo,
      oferta parcial, foto própria/fallback e contadores total/por opção
- [x] Confirmar falhas e implementar seletor React Aria, botões que abrem seleção,
      preço/offer da opção e busca por opção/código sem duplicar o pai
- [x] Implementar formulário simples/com variantes, característica e até 50 opções,
      unidade/caixa, fotos, oferta, arquivar/reativar e conversão com confirmação
- [x] Manter dirty guard, logout, confirmações, categoria compartilhada e paginação
      de 20 pais, com busca por filho e retorno do pai uma única vez
- [x] Testar 320/360/768/1024/1280 px, teclado, tablet em paisagem, seleção, edição,
      conflito, ocultação da última opção, operação sem rede e ausência de rolagem horizontal

### 5. Backup com variantes e recuperação

**Files:** scripts/backup/database.mjs, catalog-backup.mjs, manifest.mjs,
backup.test.mjs, test-restore-local.mjs e docs/deployment/backup-local.md

**Interfaces:** metadata.catalog.variants, inventário de todas as imagens e
manifesto V2, mantendo o verificador de pacotes V1 existentes

- [x] Testar referência de foto só de variante, mudança de opção durante backup,
      códigos/counter após restaurar e leitura de backup V1
- [x] Confirmar falhas e incluir variantes no inventário, contagens e concorrência
- [x] Restaurar pacote em destinos locais descartáveis e testar escolha/preço pela
      RPC pública, RLS, Auth, código da próxima opção e bytes das fotos

### 6. Preparação e importação piloto

**Files:** docs/produtos/piloto-variantes.json, mapa-familias.json,
scripts/import/catalog-import.mjs, helpers/testes, .env.import.example,
.gitignore, vite.config.ts, docs/deployment/importacao-produtos.md

**Interfaces:** --dry-run valida entrada sem escrita; --pilot limita cinco pais
exatos do manifesto; import-key/hash na RPC garante repetição segura

- [x] Gerar manifesto piloto com cinco pais/oito itens vendáveis, códigos atribuídos
      pelo banco, categorias explícitas e vínculos de imagem/fonte
- [x] Criar testes de conversão 265×12=3180, ausência de multiplicação duplicada,
      12x6 preservado, nome/categoria faltantes e agrupamento de modelos/marcas distintos
- [x] Testar falha antes/depois do upload e perda da resposta da RPC, retomada sem
      duplicar pai/filhos, hash divergente bloqueado e origem de foto faltante
- [x] Implementar JPEG até 1600 px/500 KB, upload antes da RPC, cache/journal privado
      sem tokens, sessão administrativa autorizada e dry-run sem rede de escrita
- [x] Criar e validar os cinco pais primeiro no ambiente local, com catálogo,
      carrinho/PDF, variantes e caixas, incluindo desconto demonstrativo oculto
- [ ] Após SQL aplicado pelo usuário, backup real conferido e credenciais locais,
      executar envio de cinco pais ocultos, conferir servidor e registrar IDs/códigos
- [x] Se pré-condição remota faltar, concluir código/testes/documentação e manter
      apenas o envio pendente, sem pedir senha/chave administrativa pelo chat

### 7. Entrega e verificação

**Files:** README.md, AGENTS.md, docs/validation/variantes.md e planos/spec

- [x] Rodar testes unitários, integração SQL, Playwright, PDF, backup/restore,
      lint, build, Prettier dos arquivos alterados e git diff --check
- [x] Revisão independente final com foco em preço/seleção incorreta, unidade de
      venda, dados antigos, RLS, restauração e idempotência; corrigir achados com RED→GREEN
- [x] Registrar resultados e separar validação local, SQL remoto aplicado e piloto
      enviado, sem declarar concluído um envio bloqueado por configuração externa
- [x] Commit local na main somente dos arquivos da entrega, sem publicar frontend,
      importar os demais itens ou ativar ofertas fictícias no catálogo público

## Resultado da execução

Implementação e ensaios locais concluídos, evidências em
`docs/validation/variantes.md`. Único envio pendente: piloto no projeto real,
aguardando usuário aplicar SQL 005, conferir backup V2 e configurar `.env.import`

Não houve migration remota, importação remota, ativação dos produtos ou publicação
A validação em hardware real continua pendente, como nas etapas anteriores

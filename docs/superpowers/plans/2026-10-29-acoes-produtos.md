# Ações administrativas de produtos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans, execução direta já escolhida neste projeto, acompanhando os checkboxes

**Goal:** Mostrar/ocultar seleções entre páginas, excluir produtos ocultos e manter filtros disponíveis durante a rolagem interna da lista

**Architecture:** Seleção explícita de IDs/versões em memória, com alterações de visibilidade em uma transação PostgreSQL. Exclusão individual protegida no banco e registro de importação preservado como excluído, interface React Aria reutilizando o painel atual

**Tech Stack:** React, TypeScript, React Aria, Supabase/PostgreSQL, Vitest e Playwright

**Spec:** docs/superpowers/specs/2026-10-29-acoes-produtos-design.md, aprovada em 29/10/2026

## Global Constraints

- Primária #143B84, controles de toque de 48 px, modais existentes e sem Radix
- Seleção mantida entre páginas, limpa ao mudar filtros, abrir edição, trocar aba ou sair
- Ocultar exige confirmação, Mostrar mantém ação direta, exclusão somente individual de ocultos
- Operação em lote é integral, nenhuma alteração parcial se houver conflito ou item inválido
- Preservar opções, preços, fotos, códigos, cópias offline antigas e dados preexistentes
- Exclusão apaga produto/variantes, preserva fotos compartilhadas e impede reimportação silenciosa
- SQL 006 remoto aplicado pelo usuário após ensaio local, sem apagar produtos reais ou publicar frontend
- Preservar alterações locais anteriores, commits na main com arquivos explícitos

## Review Focus

- Seleção de outras páginas deve constar no contador/modal, sem agir sobre produtos não marcados
- Mostrar um lote contendo categoria arquivada ou pai sem opção ativa deve falhar integralmente
- Alteração concorrente de qualquer selecionado deve impedir o lote e manter seleção para revisão
- Excluir produto importado não deve apagar o histórico nem permitir recriação por retry
- Lista com muitos controles, mensagens ou pouca altura deve rolar sem mover filtros nem cortar ações

## Mapa de arquivos

- Banco e API direta: migration 006 e scripts/test-product-actions-local.mjs
- Contratos/chamadas: src/admin/types.ts, api.ts e api.test.ts
- Estado de seleção: src/admin/products/selection.ts e selection.test.ts
- Controles/modais: novos ProductBulkActions.tsx e ProductActionDialog.tsx
- Composição/rolagem: Management.tsx, ProductListViewport.tsx e styles.css
- Regressão realista: tests/admin/product-actions.spec.ts e harness local existente
- Entrega: docs/deployment/acoes-produtos.md, docs/validation/acoes-produtos.md e AGENTS.md

### 1. Banco: alteração integral e exclusão protegida

**Files:** criar supabase/migrations/202610290006_product_actions.sql,
scripts/test-product-actions-local.mjs, ajustar scripts/import/catalog-import.mjs
e scripts/import/import.test.mjs somente para o retorno de produto excluído

**Interfaces:** public.set_products_visibility(p_items jsonb, p_active boolean)
retorna {updated: number}; p_items contém apenas {id, expected_version}.
public.remove_product(p_id uuid, p_expected_version bigint) retorna void

- [x] Escrever ensaio local com admin, autenticado comum e visitante, fixtures próprias:
      lote misto visível/oculto, versões corretas, versão antiga no último item,
      UUID repetido/ausente, categoria arquivada e pai oculto sem opção ativa
- [x] Rodar `node scripts/test-product-actions-local.mjs` antes do SQL, confirmar falha
      por RPC ausente, sem alterações em dados remotos
- [x] Implementar lote SECURITY INVOKER com search_path fixo, autorização explícita,
      payload de 1 a 1000 IDs distintos, locks de pais ordenados por UUID e validação
      de todo o conjunto antes de atualizar somente active quando houver mudança
- [x] Garantir conflitos SQLSTATE 40001, ausentes P0002, inválidos 23514 e negados 42501,
      sem alterar opções ou fotos e sem incrementar versões de itens já no estado pedido
- [x] Implementar exclusão por RPC invoker chamando helper privado SECURITY DEFINER
      restrito à remoção desse produto, justificativa: não conceder DELETE genérico
      de produtos/variantes ou UPDATE genérico do ledger a authenticated
- [x] Helper valida administrador, UUID/versão e estado oculto sob lock, remove filhos
      e pai na mesma transação, com revisão pública e sequência de códigos preservadas
- [x] Ledger de importação: tornar product_id anulável com ON DELETE SET NULL,
      guardar código/data de exclusão por trigger privado e preservar chave/hash;
      import_product_v2 detecta o registro excluído e retorna P0002 em vez de recriar
- [x] Testar exclusão de simples, pai com opções e importado, negar visível/versão
      antiga/DELETE direto como authenticated, confirmar ledger sem recriação,
      ausência pública, próximo código maior e bytes de fotos compartilhadas intactos
- [x] Ajustar mensagem do importador para P0002 sem editar manifesto ou journal existente,
      testar retry de produto excluído sem upload novo nem recriação
- [x] Rodar ensaio completo e testes Node do importador, ambos verdes, depois ensaiar
      migration integral em cópia descartável local pré-006, sem resetar dados atuais

### 2. API administrativa e seleção entre páginas

**Files:** modificar src/admin/types.ts, api.ts, api.test.ts, criar
src/admin/products/selection.ts e selection.test.ts

**Interfaces:** ProductSelectionItem={id,code,name,active,version}; seleção como
Map<string, ProductSelectionItem>. API setProductsVisibility(items, active)
retorna {updated:number}; removeProduct(id, expectedVersion) retorna Promise<void>

- [x] Testar seleção de dois produtos na página 1 e um na página 2, contador 3,
      desmarcar só a página atual preservando os demais, estado parcial e limpeza
- [x] Testar que refresh não troca silenciosamente versões capturadas, nem inclui
      produtos novos na seleção, e seleção não é persistida no armazenamento local
- [x] Confirmar falhas, implementar helpers puros toggleProduct, togglePage e pageSelection
      sobre IDs explícitos, sem opção implícita de selecionar todo resultado da busca
- [x] Testar payload exato das duas RPCs e mensagens específicas de ação para conflito,
      ausente, sem permissão e invalidez, sem reaproveitar texto de erro de categoria
- [x] Implementar wrappers da API sem chamar saveProduct por item, enviar apenas IDs/
      versões e active, sem fotos, dados do cliente ou credenciais em logs
- [x] Rodar `npx vitest run src/admin/products/selection.test.ts src/admin/api.test.ts`
      e confirmar aprovação dos cenários antigos e novos

### 3. Controles de lote e exclusão individual

**Files:** criar src/admin/products/ProductBulkActions.tsx,
ProductActionDialog.tsx, ProductBulkActions.test.tsx; modificar Management.tsx

**Interfaces:** ProductBulkActions recebe página atual, seleção e callbacks de
marcação/limpeza/mostrar/ocultar, sem executar chamadas ao banco por conta própria
ProductActionDialog recebe ação hide|delete e uma cópia congelada dos alvos,
busy/error/onConfirm/onCancel, reutilizando ConfirmDialog

- [x] Testar checkbox React Aria por produto, Selecionar página com estado parcial,
      contador global e ações por teclado, sem confundir marcar com Editar
- [x] Confirmar falhas e implementar barra N selecionados, Mostrar, Ocultar e Limpar
      seleção, incluindo nomes/códigos de outras páginas no modal de ocultação
- [x] Integrar seleção em Management, preservando ao paginar e limpando nos eventos
      definidos nas restrições, sem apagar o formulário nem alterar dados do catálogo
- [x] Ligar mostrar/ocultar à RPC única, desabilitar ações enquanto houver requisição,
      impedir duplo envio e explicar falha de conexão sem afirmar sucesso parcial
- [x] Em sucesso limpar seleção e atualizar lista/contagem/página, em conflito manter
      seleção e pedir nova revisão, sem substituir versões e repetir automaticamente
- [x] Exibir Excluir apenas no item oculto, com modal de nome/código e número de opções,
      botão vermelho Excluir definitivamente, confirmação não afeta outros produtos
- [x] Após exclusão atualizar a página, inclusive ao remover o último item, preservando
      fotos e o fluxo existente de revisão de indisponibilidade de carrinhos
- [x] Rodar testes de componentes e `npx tsc -b`, resultado sem falhas

### 4. Área rolável com filtros e paginação externos

**Files:** criar src/admin/products/ProductListViewport.tsx e teste correspondente,
modificar Management.tsx e src/styles.css

**Interface:** ProductListViewport recebe children e resetKey, contendo a lista numa
região identificada como Lista de produtos, com foco de teclado e ref interna

- [x] Criar teste de navegador que rola a lista e compara a posição de filtros/barra/
      paginação antes/depois, verificando scrollTop interno maior e posição externa igual
- [x] Confirmar falha no layout atual, implementar região overflow-y:auto, gutter
      estável e altura adaptada ao espaço disponível, sem alturas fixas por aparelho
- [x] Usar medição de viewport/elementos e ResizeObserver se CSS não cobrir altura
      variável de filtros, barra, mensagens e paginação, sem loops de resize
- [x] Manter controles e paginação fora da região, sem aplicar restrição a formulários
      ou categorias, nem forçar overflow:hidden global no body
- [x] Resetar scrollTop ao trocar página/filtro via resetKey, manter posição ao marcar
      itens e garantir que foco em botões abaixo da dobra role a região corretamente
- [x] Testar 320x720, 800x1100, 800x360 e 1280x900, incluindo mensagens longas,
      ausência de rolagem horizontal, toque e teclado com ações alcançáveis

### 5. Integração, regressão e entrega do SQL

**Files:** criar tests/admin/product-actions.spec.ts, docs/deployment/acoes-produtos.md,
docs/validation/acoes-produtos.md; atualizar AGENTS.md, spec e este plano

- [x] Usar fixtures locais com 25 produtos, opções e categorias ativas/arquivadas,
      testar seleção entre duas páginas, lote misto e limpeza ao trocar filtros/aba
- [x] Testar cancelamento da ocultação, confirmação única de lote, erro de conflito
      causado por outra sessão, sucesso e descarte da seleção, produto não marcado intacto
- [x] Testar Excluir somente após ocultar, cancelar sem remover, excluir importado com
      opções e confirmar que novo retry da importação falha sem produto duplicado
- [x] Rodar `node scripts/test-admin-local.mjs`, `node scripts/test-product-actions-local.mjs`,
      `npm test -- --maxWorkers=2`, `npm run test:import`, `npm run test:backup`,
      `npm run lint`, `npm run build`, Prettier dos arquivos da entrega e diff --check
- [x] Conferir comportamento público/carrinho após sincronização de produto removido,
      usando dados fictícios, sem exigir descarte de IndexedDB ou seleção antiga
- [x] Revisar autorização/atomicidade, seleção oculta por paginação, tombstone e
      rolagem de teclado, corrigir falhas com regressões verificadas antes de concluir
- [x] Entregar SQL 006 integral e guia Dashboard → SQL Editor, com backup V2 antes
      de aplicar e consulta de checagem de RPCs, sem executar a migration remota
- [x] Registrar testes reais e pendências de aparelho/SQL remoto, atualizar decisões
      e criar commit local explícito, sem incluir segredos, fotos originais ou publicação

## Revisão do plano

Cobertura: banco/exclusão/importação na tarefa 1, seleção/API na 2, fluxo visual na 3,
rolagem na 4 e integração/entrega na 5. Cada risco de Review Focus tem um cenário
correspondente, as interfaces mantêm UUID/versão como identidade da operação

As escolhas de helper privado, limite técnico de 1000 IDs e decomposição de
componentes são decisões de implementação, sem ampliar a exclusão para lote

## Resultado em 29/10/2026

Implementação local concluída, SQL 006 entregue sem aplicação remota, revisão
independente concluída e P2 de altura corrigido com teste RED→GREEN
Unitários173, painel22, cenário adicional de carrinho excluído1, importador3 e
backup14 aprovados, recuperação local restaurou186 fotos com hashes iguais
Detalhes em docs/validation/acoes-produtos.md, publicação não executada

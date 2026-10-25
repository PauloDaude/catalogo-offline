# Pedido em PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Gerar um pedido bonito a partir do carrinho e permitir compartilhar o arquivo pelo menu nativo ou baixá-lo

**Architecture:** Snapshot validado do carrinho, geração inteiramente no navegador e modal com arquivo pronto antes do compartilhamento. Modelo, renderização PDF e integração nativa separados, sem backend novo e sem persistência de clientes/pedidos.

**Tech Stack:** React, TypeScript, React Aria/shadcn, pdf-lib com @pdf-lib/fontkit, fonte Noto Sans TTF local licenciada, Workbox, Vitest e Playwright

**Spec:** `docs/superpowers/specs/2026-10-24-pedido-pdf-design.md`

## Global Constraints

- Status: aprovado pelo usuário, execução local em 24/10/2026
- Vendedor fixo: **Antônio Marcos Daúde**, primária **#143B84**, logo existente
- React Aria como base, sem Radix, tema claro e ações principais de pelo menos 48 px
- Sem histórico, upload de PDF, cadastro de cliente, checkout ou envio automático
- Nome obrigatório até 120 caracteres, observações opcionais até 1000
- Data DD/MM/AAAA no fuso America/Araguaina, sem número sequencial de pedido
- Preservar carrinho e exigir revisão das alterações pendentes antes da geração
- PDF A4 retrato com fotos, código, nome, quantidade, preço, subtotal e total
- Fonte, biblioteca e logo locais disponíveis após preparação offline
- Não publicar, configurar Cloudflare/DNS ou alterar Supabase nesta entrega
- Preservar alterações existentes em código, logo e documentos, sem staging amplo
- Execução direta nesta sessão, conforme preferência anterior, com commits delimitados

## Review Focus

- Carrinho alterado em outra aba durante geração, não compartilhar arquivo desatualizado
- Foto ausente, corrompida ou URL revogada, manter texto/valores e indicar Sem foto
- Muitos itens e nomes extensos, paginar sem recortar conteúdo ou exceder memória
- Cancelamento ou ausência de Web Share, preservar arquivo e alternativa de download
- Aparelho offline após reabrir, carregar também chunks, fonte e logo do gerador

## Arquivos e responsabilidades

- `src/orders/model.ts`: snapshot, validação e valores em centavos
- `src/orders/pdf.ts`: layout, paginação, fonte e imagens do PDF
- `src/orders/share.ts`: capacidade de compartilhamento, share e download
- `src/orders/OrderDialog.tsx`: formulário e estados gerando/pronto/erro
- `src/cart/CartPanel.tsx`: entrada do fluxo e disponibilidade do botão
- `src/styles.css`: modal responsivo, sem reformular o restante do catálogo
- `public/fonts/order-noto-sans.ttf` e licença: fonte local para o documento
- `vite.config.ts`: incluir TTF em precache, garantir chunks do gerador
- `package.json`, `package-lock.json`, `THIRD_PARTY_NOTICES.md`: dependências/licenças
- Testes junto de cada módulo e `tests/e2e/order-pdf.spec.ts`
- `docs/validation/pedido-pdf.md`: evidências e roteiro em aparelhos reais

## Task 1: Snapshot e regras do pedido

**Files:** Create `src/orders/model.ts`, `src/orders/model.test.ts`

**Interfaces:**

- Consumes: `CartItem` de `src/cart/model.ts`, estado `Cart` de `src/cart/useCart.ts`
- Produces: `OrderSnapshot` com `customerName: string`, `notes: string`,
  `generatedAt: string` (ISO), `sellerName: string`, `items: OrderLine[]`,
  `totalCents: number`; `OrderLine` tem id, code opcional, name, quantity,
  priceCents e subtotalCents
- `createOrderSnapshot(input: {customerName: string; notes: string; items: CartItem[]; pendingChanges: boolean; catalogReady: boolean; now: Date}): OrderSnapshot`
- `orderSelectionKey(items: CartItem[], pendingChanges: boolean): string`
  identifica campos/ordem que afetam documento e revisão, sem Blob URLs

- [x] Escrever testes para nome vazio/espaços, limites, itens vazios/indisponíveis,
      revisão pendente, catálogo ausente e overflow; 2 × 6500 + 1 × 2500 = 15500 centavos
- [x] Rodar `npx vitest run src/orders/model.test.ts`, observar falha anterior à implementação
- [x] Implementar validação, snapshot copiado e key estável; código ausente vira “—”
      no documento, nunca inventar código; não modificar CartItem ou localStorage
- [x] Testar imutabilidade, key alterada por quantidade/preço/nome/indisponibilidade,
      cliente com acentos e cálculo exato; repetir comando e exigir todos passando
- [x] Commit delimitado do modelo e seus testes

## Task 2: Gerador PDF e aparência

**Files:** Create `src/orders/pdf.ts`, `src/orders/pdf.test.ts`, fonte/licença em
`public/fonts/`; Modify `package.json`, `package-lock.json`,
`THIRD_PARTY_NOTICES.md`, `vite.config.ts`

**Interfaces:**

- Consumes: `OrderSnapshot` da Task 1, `ReadonlyMap<string,string>` com URLs das fotos
- Produces: `generateOrderPdf(order: OrderSnapshot, images: ReadonlyMap<string,string>): Promise<File>`
- Arquivo `application/pdf`, nome `pedido-cirandinha-AAAA-MM-DD-HHmmss.pdf`
  usando componentes de data/hora no fuso America/Araguaina

- [x] Escrever testes de arquivo PDF válido e conteúdo: vendedor/cliente com acentos,
      preços BRL, total exato, observações e 1/100/500 linhas; ler o PDF com pdf-lib
      e verificar texto extraído com Poppler em validação de integração
- [x] Rodar `npx vitest run src/orders/pdf.test.ts` e confirmar falha inicial
- [x] Instalar pdf-lib e @pdf-lib/fontkit via npm, registrar versões resolvidas no
      lockfile; obter fonte Noto Sans TTF de fonte oficial e incluir licença, sem CDN
- [x] Implementar layout da spec, medir/quebrar textos, reservar cabeçalhos/rodapés,
      limitar miniaturas a 160 px, processar fotos sequencialmente; fallback Sem foto
      para URL ausente/erro/decode, sem substituir preço/nome
- [x] Incluir fonte no precache e carregar gerador sob demanda com chunk precacheado;
      caractere sem glifo recebe substituição visível, sem quebrar geração
- [x] Repetir testes, gerar PDFs com dados fictícios e renderizar todas as páginas
      com `pdftoppm`; inspecionar logo, acentos, colunas, alinhamentos, quebras e totais
      em pedidos curtos, longos, imagens verticais e nomes/observações nos limites
- [x] Conferir reabertura pelo pdfinfo/pdftotext, tamanhos e memória no caso de 500
      linhas; registrar limitações reais, sem copiar dados do PDF de referência
- [x] Commit delimitado do gerador, dependências, assets e testes

## Task 3: Compartilhamento e download

**Files:** Create `src/orders/share.ts`, `src/orders/share.test.ts`

**Interfaces:**

- Consumes: `File` já preparado pela Task 2
- Produces: `canShareOrder(file: File): boolean`,
  `shareOrder(file: File): Promise<'shared' | 'cancelled'>`,
  `downloadOrder(file: File): void`

- [x] Escrever testes para API ausente, canShare false/lançando erro, compartilhamento
      com files contendo o PDF correto, AbortError, falha real e download sem Web Share
- [x] Rodar `npx vitest run src/orders/share.test.ts`, confirmar falha inicial
- [x] Implementar detecção conservadora, share sem geração/fetch anterior no handler;
      rejeições reais ficam para a interface tratar, cancelamento não produz alerta
- [x] Implementar download via URL temporária e anchor download, revogar após prazo
      suficiente para iniciar download, sem persistir URLs ou revogar antes do clique
- [x] Repetir os testes exigindo todos passando, incluindo duas tentativas sequenciais
- [x] Commit delimitado de adaptador e testes

## Task 4: Fluxo no carrinho

**Files:** Create `src/orders/OrderDialog.tsx`, `src/orders/OrderDialog.test.tsx`;
Modify `src/cart/CartPanel.tsx`, `src/cart/Cart.test.tsx`,
`src/catalog/CatalogPage.tsx`, `src/styles.css`

**Interfaces:**

- Consumes: Tasks 1–3; `OrderDialog` recebe `cart: Cart`,
  `catalogReady: boolean`, `productImages: Map<string,string>`, `onBack: () => void`
- Produces: fluxo de estados entrada/gerando/pronto/erro integrado ao dialog existente

- [x] Escrever testes de botão Gerar pedido em PDF, validação do cliente, observações,
      progresso, erro recuperável, resultado com Compartilhar PDF/Baixar PDF,
      cancelamento sem alerta e carrinho preservado
- [x] Rodar `npx vitest run src/orders/OrderDialog.test.tsx src/cart/Cart.test.tsx`,
      confirmar falhas dos novos casos sem alterar comportamento anterior
- [x] Manter um único modal ativo: alternar conteúdo do Dialog existente entre
      carrinho e OrderDialog, com título acessível e foco no primeiro campo ao entrar;
      Voltar ao carrinho restaura foco no botão de origem
- [x] Propagar catalogReady de CatalogPage para CartPanel, impedir exportação nas
      condições da Task 1 com orientação explícita, sem aceitar mudanças automaticamente
- [x] Gerar snapshot/arquivo em memória, invalidar resultado pela key da Task 1
      quando seleção/revisão mudar e ignorar conclusões tardias de geração cancelada;
      fechar/voltar limpa referências, sem setState tardio após desmontagem
- [x] Botão de share chama shareOrder diretamente no evento com File pronto;
      navegador sem suporte mostra orientação “Baixe o PDF para compartilhar” e download
- [x] Repetir testes, acrescentar alteração em outra aba durante geração/resultado,
      voltar/fechar/reabrir, cliques repetidos, teclado, alertas e erro de geração
- [x] Commit delimitado da integração e testes

## Task 5: Verificação em navegador e entrega

**Files:** Create `tests/e2e/order-pdf.spec.ts`, `docs/validation/pedido-pdf.md`;
Modify `AGENTS.md` e documentação do usuário pertinente

- [x] Escrever E2E de download real, parse do PDF gerado e valores iguais ao carrinho,
      cliente com acentos, nome longo, múltiplas páginas e imagens ausentes
- [x] E2E com Web Share simulado verifica o File, cancelamento e falta de suporte;
      não confundir essa simulação com teste real do menu nativo
- [x] E2E de preparar catálogo, fechar/reabrir offline e gerar/baixar PDF sem novas
      requisições à rede, garantindo fonte/logo/chunk locais
- [x] E2E em 320×720, 800×1100 e 800×360: teclado, foco, botões 48 px, rolagem
      interna, total/ações legíveis e ausência de overflow horizontal
- [x] Rodar unitários, lint, build, Prettier nos arquivos da entrega e diff --check;
      executar E2E usando build demo isolada, preservando .env.local e preview Supabase
- [x] Inspecionar PDFs renderizados finais; verificar que o build não contém
      credenciais privadas nem pedido de referência/dados de cliente
- [x] Documentar roteiro real em Android: gerar offline, compartilhar no WhatsApp,
      cancelar, baixar e abrir arquivo; registrar como pendente até teste em hardware
- [x] Atualizar AGENTS.md distinguindo decisões, implementação e validação real;
      registrar que cliente/PDF ficam apenas em memória e que não há histórico
- [x] Revisar o diff completo contra a spec, registrar resultados e commit delimitado
- [x] Entregar preview local para aprovação visual, sem publicar online

## Separação das próximas entregas

O pedido original também solicitou link Acessar painel e paginação de produtos.
Continuam registrados para plano administrativo separado, com paginação no servidor
(pesquisa/filtros antes de paginar) e sem limitar o snapshot público offline.
Hospedagem gratuita Cloudflare e domínio cirandinha.daude.dev terão roteiro próprio,
com publicação somente mediante autorização, assim como backup e revisão dos avisos.

## Aprovação

Plano e design aprovados pelo usuário em 24/10/2026, com execução direta.
Publicação online e teste físico Android continuam fora desta aprovação.

## Resultado da execução

Implementação local concluída em 24/10/2026, com revisão independente e correção
RED→GREEN de paginação de linhas excepcionais e largura monetária. Verificações:
131 testes unitários, 63 testes de navegador, build, lint e formatação aprovados.
Fonte TTF estática oficial substituiu a variável após falha de renderização.
Checklist acima registra implementação e testes locais, não valida hardware real.
Roteiro Android e limitações em `docs/validation/pedido-pdf.md`.

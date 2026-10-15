# Protótipo do catálogo offline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um catálogo público responsivo com dez produtos fictícios, consulta offline completa e atualização consistente para validar com o vendedor.

**Architecture:** React apresenta uma fonte HTTP fictícia ou uma cópia persistida. Dexie guarda produtos e fotos; a sincronização prepara arquivos antes de ativar o novo snapshot em uma transação. Workbox disponibiliza os arquivos essenciais do aplicativo, sem tratar fotos precacheadas como prova de que a sincronização funcionou.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui com React Aria Components, Dexie, Workbox via vite-plugin-pwa; Vitest, Testing Library, fake-indexeddb e Playwright para verificações relevantes.

**Spec:** `docs/superpowers/specs/2026-10-14-catalogo-mvp-design.md`, etapa 1; regras permanentes em `AGENTS.md`.

**Status:** Execução direta autorizada pelo usuário; tarefas 1–5 implementadas e verificadas, documentação da tarefa 6 entregue. Validação em hardware real e com o vendedor permanece pendente. O usuário autorizou vincular o repositório `https://github.com/PauloDaude/catalogo-offline.git` e realizar commits na `main`. Execução direta escolhida pelo usuário.

## Global Constraints

- Tablet Samsung com Android e celular, em retrato e paisagem, incluindo tela de 360 CSS px.
- Tema claro (light), com azul como cor primária; tom exato a definir com contraste adequado.
- shadcn/ui com React Aria Components e Tailwind CSS. Sem Radix UI.
- Uma foto e um preço por produto. Variações ficam fora do MVP.
- Catálogo público por link, sem login e sem obrigação de instalar o aplicativo.
- Consulta offline, incluindo fotos, após preparação em cada dispositivo.
- Controles principais com área de toque de pelo menos 48 × 48 CSS px.
- Sem carrinho, pagamentos, pedidos ou controle de estoque.
- Nenhum Supabase real, senha, conta administrativa ou serviço externo neste protótipo.
- Segurança do Supabase será executada na etapa 2; este protótipo não demonstra segurança do backend.
- Commits na `main`, conforme autorização; não criar worktree ou branch de feature para esta execução.

## Review Focus

1. Pesquisa com acentos, espaços e caixa diferente deve localizar o produto esperado — tarefa 1.
2. Resposta HTTP 200 contendo HTML ou foto corrompida não pode ser aceita como imagem offline — tarefa 3.
3. Fechamento durante download e erro de quota devem preservar o snapshot anterior — tarefas 2 e 3.
4. Duas abas atualizando juntas não podem misturar versões ou excluir fotos ainda necessárias — tarefas 3 e 5.
5. API indisponível ou armazenamento local negado na primeira visita deve produzir orientação clara, sem tela vazia — tarefas 4 e 5.

## Limites desta entrega e próximos planos

Este plano implementa apenas a etapa 1 da especificação. Não inclui login, CRUD,
upload, compressão de fotos pelo administrador, banco remoto, RLS, backup ou publicação.
Não apresentar o resultado como MVP completo de produção.

Etapa 2 terá plano próprio para Supabase e gerenciamento: migrations com grants,
RLS e constraints; autorização administrativa; Storage; Auth; testes diretos de API
nos três papéis; exportação e restauração. Etapa 3 terá hospedagem HTTPS e entrega
piloto. Nenhum produto real será cadastrado antes dos testes de segurança e backup.

## Arquivos e responsabilidades

| Arquivos | Responsabilidade |
| --- | --- |
| `package.json`, `package-lock.json`, `.gitignore`, `index.html`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js` | Build, lint, scripts e configurações |
| `components.json`, `src/components/ui/{button,input,dialog}.tsx`, `src/lib/utils.ts`, `src/styles.css` | Componentes React Aria e tokens do tema |
| `src/main.tsx`, `src/App.tsx` | Inicialização e composição da aplicação |
| `src/catalog/{types,validation,search,source}.ts` | Contrato público, validação e fonte HTTP |
| `public/demo/catalog.json`, `public/demo/photos/*.jpg`, `public/icons/*.png` | Dez produtos fictícios, fotos próprias/licenciadas e ícones |
| `src/catalog/storage.ts` | Banco Dexie, preparação, ativação e leitura consistente |
| `src/catalog/{image-download,sync,sync-lock}.ts` | Download validado e atualização exclusiva |
| `src/catalog/{useCatalog,CatalogPage,ProductCard,ProductDialog,SyncStatus}.tsx` | Interação, apresentação e estados |
| `src/pwa/{sw,register}.ts` | Precache, instalação e aviso de atualização do aplicativo |
| `src/test/setup.ts`, `src/**/*.test.{ts,tsx}` | Testes de lógica, persistência e UX crítica |
| `playwright.config.ts`, `tests/e2e/*.spec.ts` | Verificação da build de produção |
| `README.md`, `docs/validation/prototipo-offline.md` | Execução, limites e resultados de validação |

Os nomes acima são caminhos a criar, não arquivos existentes. Usar npm e um único
lockfile. No scaffold, confirmar requisitos de Node das versões oficiais vigentes;
fixar versões compatíveis no lockfile. Não instalar dependências por este plano sozinho.

## Contratos compartilhados

Definir em `src/catalog/types.ts`:

```ts
type Category = 'Cozinha' | 'Pesca' | 'Iluminação' | 'Ferramentas' | 'Outros';
type Product = { id: string; name: string; priceCents: number;
  category: Category; imagePath: string };
type CatalogSnapshot = { revision: number; updatedAt: string; products: Product[] };
type LocalCatalog = { snapshot: CatalogSnapshot; activatedAt: string;
  checkedAt: string; photos: Map<string, Blob> };
type CatalogSource = {
  getSnapshot(signal?: AbortSignal): Promise<CatalogSnapshot>;
  getRevision(signal?: AbortSignal): Promise<number>;
  getPhoto(path: string, signal?: AbortSignal): Promise<Blob>;
};
type SyncProgress = { phase: 'checking' | 'downloading' | 'activating';
  completed: number; total: number };
type SyncResult = { status: 'updated' | 'unchanged'; revision: number };
```

Fotos têm caminhos imutáveis. Apenas produtos ativos entram no contrato público;
ocultação simulada remove o item do snapshot seguinte. Revisão é inteiro seguro
não negativo, preço é inteiro seguro não negativo, ids são únicos, datas ISO
válidas e categoria pertence ao conjunto. Snapshot inválido não substitui o local.

Cada tarefa abaixo usa esses contratos. Nas funções de teste, `snapshotA` e
`snapshotB` são fixtures independentes: A contém dez produtos; B muda preço e
caminho da foto de um produto, remove outro e incrementa a revisão.

### Task 1: catálogo online utilizável e contratos

**Files:** Criar configurações, componentes UI, tema, fixtures, `src/catalog/{types,validation,search,source}.ts`, `src/{main,App}.tsx`, `src/catalog/{CatalogPage,ProductCard,ProductDialog}.tsx`, `src/test/setup.ts`, `src/catalog/search.test.ts`, `src/catalog/source.test.ts`.

**Interfaces:** Produzir `filterProducts(products: Product[], query: string, category: Category | 'Todas'): Product[]`, `parseSnapshot(input: unknown): CatalogSnapshot`, `createHttpSource(baseUrl: string): CatalogSource`. `CatalogPage` recebe produtos, pesquisa/categoria controladas e fonte das imagens. `ProductDialog` recebe produto selecionado e ação de fechar.

- [x] Criar scaffold Vite React TypeScript sem sobrescrever `AGENTS.md` ou `docs`; adicionar npm scripts `dev`, `build` (typecheck + Vite), `lint`, `test` (Vitest run), `test:e2e` e `preview`. Configurar teste DOM e alias `@/`.
- [x] Configurar shadcn para base React Aria, instalar somente button, input e dialog; conferir imports e `npm ls` para ausência de `radix-ui` e `@radix-ui/*`.
- [x] Escrever testes antes da lógica: `filterProducts([tesoura], '  TESOURA  ', 'Todas')` contém tesoura; `filterProducts([iluminacao], 'iluminacao', 'Todas')` ignora acento; pesquisa e categoria são cumulativas. Fonte rejeita ids duplicados, preço fracionário/negativo, categoria desconhecida e JSON inválido.
- [x] Executar `npm run test -- src/catalog/search.test.ts src/catalog/source.test.ts`; esperar falha pelas funções ainda não implementadas, não por configuração quebrada.
- [x] Implementar contratos, fonte com `fetch` e validação; fontes relativas respeitam `import.meta.env.BASE_URL`. Mensagens técnicas não devem ser exibidas cruas ao usuário.
- [x] Criar dez produtos fictícios e fotos JPEG próprias ou com licença registrada no README. Nenhum CDN remoto, segredo ou chave Supabase. Ícones podem ser desenhados como assets locais; não gerar fotos com código simulando fotografia.
- [x] Implementar grade, filtro e ampliação usando React Aria; cabeçalho “Catálogo”, preço `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`; tema light com azul de referência `#1D4ED8`, branco no botão e foco visível. Confirmar contraste e controles de 48 px.
- [x] Executar testes, `npm run build` e `npm run lint`; abrir a página a 360 px e em tablet, sem overflow horizontal, verificar fechamento do dialog e retorno do foco. Estado sem resultados contém “Nenhum produto encontrado”.
- [x] Commitar arquivos explícitos desta tarefa: `feat: add responsive demo catalog`.

### Task 2: persistência consistente de produtos e fotos

**Files:** Criar `src/catalog/storage.ts`, `src/catalog/storage.test.ts`; atualizar setup com fake-indexeddb.

**Interfaces:** Produzir `createCatalogStore(dbName: string): CatalogStore`. Métodos: `readActive(): Promise<LocalCatalog | null>`, `readPhoto(path: string): Promise<Blob | undefined>`, `stagePhoto(operationId: string, path: string, blob: Blob): Promise<void>`, `activate(operationId: string, snapshot: CatalogSnapshot, now: string): Promise<void>`, `markChecked(now: string): Promise<void>`, `discardOperation(operationId: string): Promise<void>`, `prune(): Promise<void>`, `close(): void`.

- [x] Escrever testes: reabrir banco recupera dez produtos e bytes das fotos; ativação sem uma foto obrigatória falha e preserva A; erro ao gravar metadados reverte fotos/dados; interromper preparação deixa A disponível; snapshot vazio válido remove todos os produtos.
- [x] Rodar `npm run test -- src/catalog/storage.test.ts`; confirmar falha funcional.
- [x] Implementar tabelas Dexie `catalog` (snapshot ativo e datas), `photos` (chave imagePath e Blob) e `stagedPhotos` (chave composta operationId/imagePath). Download acontece fora de transações; `activate` copia fotos necessárias da operação e troca snapshot/datas em uma única transação.
- [x] Implementar `readActive` lendo snapshot e fotos em uma única transação readonly. O retorno possui Blobs independentes para uma tela aberta continuar renderizando se outra aba ativar e limpar uma revisão nova. `prune` apaga apenas fotos não referenciadas pelo snapshot ativo; limpeza de staging respeita operationId.
- [x] Rodar os testes; todos passam, incluindo rollback e reabertura. Documentar que estimativa de espaço não garante sucesso de escrita.
- [x] Commit: `feat: persist complete catalog snapshots with Dexie`.

### Task 3: sincronização validada e exclusiva

**Files:** Criar `src/catalog/{image-download,sync,sync-lock}.ts` e seus `.test.ts`.

**Interfaces:** Produzir `validatePhoto(blob: Blob): Promise<void>`, `withSyncLock<T>(work: () => Promise<T>, signal?: AbortSignal): Promise<T>`, `syncCatalog(source: CatalogSource, store: CatalogStore, options: { now: () => string; signal?: AbortSignal; onProgress?: (value: SyncProgress) => void }): Promise<SyncResult>`.

- [x] Escrever testes: A→B altera preço/foto e remove produto juntos; revisão igual não baixa fotos; foto HTML/corrompida falha; quota, cancelamento e erro HTTP mantêm A; revisão muda durante download e só um snapshot consistente é ativado; revisão muda continuamente e a operação encerra após três tentativas.
- [x] Escrever teste de concorrência com adaptador de lock: segunda operação espera a primeira, depois releia a revisão ativa; nenhuma limpeza toca staging de outra operação.
- [x] Rodar `npm run test -- src/catalog/sync.test.ts src/catalog/image-download.test.ts src/catalog/sync-lock.test.ts`; observar falhas pelas funções ausentes.
- [x] Implementar exclusão por Web Locks (`catalog-sync`) em contexto seguro, liberada ao fechar aba. Se API ausente, preservar consulta online/local e explicar que preparar offline exige navegador compatível; nunca usar um lock apenas em memória como se protegesse duas abas. Validar Chrome e Samsung Internet reais na tarefa 6.
- [x] Implementar no máximo três downloads simultâneos, timeout por requisição de 30 segundos e operação cancelável. Reutilizar fotos com caminho presente no store; validar MIME JPEG e decodificação da imagem, não apenas status HTTP. Injetar decodificador para teste unitário e verificar o real em navegador.
- [x] Sob a trava, ler snapshot e comparar revisão, preparar somente fotos ausentes, conferir revisão novamente e ativar. Até três tentativas totais; em falha descartar apenas a operação atual. `markChecked` só após confirmação remota bem-sucedida. `prune` após ativação; falha de limpeza não deve reclassificar uma ativação bem-sucedida como falha de sincronização.
- [x] Rodar testes e build; confirmar nenhuma chamada de rede dentro de transação IndexedDB.
- [x] Commit: `feat: synchronize catalog atomically with validated photos`.

### Task 4: PWA e integração dos estados na interface

**Files:** Criar `src/pwa/{sw,register}.ts`, `src/catalog/{useCatalog,SyncStatus}.tsx`, `src/catalog/useCatalog.test.tsx`; modificar App/CatalogPage, estilos, vite.config e package.json.

**Interfaces:** Produzir `ensureOfflineShell(): Promise<void>`, `requestAppUpdate(): Promise<void>` e `useCatalog(source: CatalogSource, store: CatalogStore)`, retornando produtos, imagens, datas, estado (`loading | online | saved | syncing | error`), mensagem, progresso e `prepareOffline(): Promise<void>`. Registrar cleanup de listeners e URLs Blob.

- [x] Escrever testes: visita inicial não baixa dez fotos automaticamente; pedido explícito prepara todas; falha de rede com A mostra A e aviso; primeira visita sem rede mostra orientação; IndexedDB negado mantém consulta online; fonte demora e estado de carregamento permanece visível.
- [x] Rodar `npm run test -- src/catalog/useCatalog.test.tsx`; confirmar falhas funcionais.
- [x] Configurar vite-plugin-pwa em `injectManifest`, Workbox e registro com atualização por aviso. Precache apenas HTML/JS/CSS, ícones e fontes locais necessárias; excluir `demo/catalog.json` e `demo/photos/**`. Sem runtime cache genérico para APIs ou futuras rotas administrativas.
- [x] Implementar `ensureOfflineShell` esperando registro pronto e página controlada pelo SW; a UI só declara catálogo preparado quando shell e dados/fotos estiverem completos. Em localhost testar build/preview; HTTP por IP da LAN não basta para testar PWA em Android.
- [x] Integrar leitura local imediata, visita online sob demanda e download explícito. Usar os Blobs de `readActive`, revogando object URLs ao trocar de catálogo/desmontar. Verificar revisão ao abrir, recuperar conexão e voltar à aba; intervalo mínimo automático de 60 s, ação manual independente; evitar execução duplicada em React StrictMode.
- [x] Apresentar “Salvar catálogo para usar sem internet”, “Atualizar catálogo”, “Catálogo salvo para usar sem internet”, “Não foi possível atualizar. Você pode continuar usando o catálogo salvo” e “Não há espaço suficiente para atualizar o catálogo”, conforme contexto. Offline mostra data salva e “Os preços podem ter mudado”.
- [x] Solicitar persistência do storage quando disponível; negativa não impede uso e não gera promessa de armazenamento permanente. BroadcastChannel ou eventos equivalentes fazem outras abas relerem o snapshot após ativação.
- [x] Exibir “Nova versão disponível”; reload somente por ação explícita e sem sincronização em curso. Manifest light, nome provisório “Catálogo”, ícones 192/512 px e instalação opcional.
- [x] Rodar testes, lint e build; confirmar SW não inclui imagens do catálogo no precache. Protótipo não mostra botão de gerenciamento não funcional; documentar que o acesso será adicionado na etapa 2.
- [x] Commit: `feat: enable explicit offline preparation and PWA shell`.

### Task 5: verificação da build em navegador

**Files:** Criar `playwright.config.ts`, `tests/e2e/{catalog,offline,sync}.spec.ts`; atualizar scripts.

**Interfaces:** Usar build real com `npm run preview -- --host 127.0.0.1 --port 4173`. Playwright intercepta `/demo/catalog.json` e fotos para simular A/B/falhas, sem adicionar painel de testes ao produto.

- [x] Escrever testes: dez produtos consultáveis; busca e categoria; dialog fecha e restaura foco; viewport 360×800, 800×1280 e 1280×800 sem overflow; ações principais com 48 px.
- [x] Escrever caso offline: aguardar controle pelo SW, preparar A, tornar contexto offline, fechar página e abrir nova página no mesmo contexto; verificar dez imagens decodificadas (`naturalWidth > 0`), preço, filtro e ampliação. Reiniciar contexto com perfil persistente para verificar persistência entre sessões do navegador.
- [x] Escrever A→B e falha parcial: conferir ativação integral ou manutenção de A. Respostas de fotos passam por interceptor para comprovar que IndexedDB, e não precache, permite reabertura offline.
- [x] Escrever duas abas reais sincronizando B e leitura posterior consistente em ambas. Testar primeira visita com falha de API e armazenamento indisponível, sem apagar manualmente SW de uma instalação preparada.
- [x] Executar `npm run build` e `npm run test:e2e`; corrigir falhas com investigação, mantendo testes que representam requisitos. Não declarar mode avião real validado pelo Playwright.
- [x] Verificar dependencies/imports sem Radix, assets sem segredos e nenhuma requisição externa inesperada. Revisar segurança de texto: nome contendo markup aparece como texto, sem execução.
- [x] Executar uma vez `npm run test`, `npm run lint`, `npm run build` e `npm run test:e2e`, registrar resultados e limitações.
- [x] Commit: `test: verify production offline and synchronization flows`.

### Task 6: entrega do protótipo para validação real

**Files:** Criar `README.md`, `docs/validation/prototipo-offline.md`; atualizar AGENTS.md e o status deste plano.

**Interfaces:** Documento de resultados distingue testes automáticos feitos pelo agente, testes manuais no navegador e testes pendentes no hardware do usuário.

- [x] Documentar instalação, comandos, origem/licença dos assets, ausência de Supabase neste protótipo e comportamento de preparação por dispositivo.
- [ ] Registrar modelo/versão Android e navegador ao testar os aparelhos. Providenciar acesso HTTPS ou conexão de depuração segura; escolher publicação somente com autorização correspondente, sem presumir hospedagem existente.
- [ ] No tablet e celular, preparar o catálogo, ativar modo avião, fechar e reabrir a PWA; confirmar fotos, preços, pesquisa e ampliação. Testar retrato/paisagem e retomada após aparelho bloquear a tela durante o download.
- [ ] Pedir ao vendedor para encontrar três produtos sem ajuda contínua; registrar dificuldades observadas. Testes do usuário permanecem pendentes enquanto não houver evidência, sem inventar resultados.
- [ ] Se Web Locks faltar em algum navegador real, registrar compatibilidade e propor fallback seguro antes de expandir suporte; consulta não pode perder dados.
- [x] Atualizar continuidade em AGENTS.md e marcar checkboxes concluídos apenas para verificações realmente executadas. Limitação de hardware não bloqueia entrega local, mas bloqueia afirmar validação completa para uso em campo.
- [x] Commit: `docs: document prototype validation and next steps`.

## Git e execução

Vincular a pasta atual ao remoto autorizado, preservar commits remotos existentes
e trabalhar na `main`. Não usar force push. Inicialização e commit de documentação
fazem parte da etapa de planejamento; implementação só após revisão deste plano
e escolha do método, conforme writing-plans. Commits de tarefas incluem apenas
arquivos pertinentes, sem pastas locais `.agents`, `.codex`, `.aws` ou credenciais.

## Auto-revisão do plano

- Cobertura: contratos/apresentação (1), IndexedDB/rollback (2), sincronização/falhas (3),
  PWA/estados (4), build e duas abas (5), aparelho real/UX (6).
- Escopo adiado explícito: todos os itens de gerenciamento, Supabase, segurança remota,
  backup e hospedagem têm etapa posterior; não são esquecidos nem prometidos nesta entrega.
- Tipos e assinaturas usam o mesmo contrato público; nenhuma função depende de Supabase.
- Os cinco riscos de Review Focus possuem testes ou casos de validação associados.
- Configuração e documentação estão agrupadas com os entregáveis que precisam delas.

## Referências técnicas

- [shadcn/ui: React Aria como base](https://ui.shadcn.com/docs/changelog/2026-07-react-aria)
- [Vite PWA: precache](https://vite-pwa-org.netlify.app/guide/service-worker-precache)
- [Vite PWA: registro](https://vite-pwa-org.netlify.app/guide/register-service-worker)
- [MDN: Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)

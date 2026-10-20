# Plano — painel administrativo e integração Supabase

> Status: plano para revisão do usuário. Execução direta preservada da conversa;
> não iniciado. A especificação foi aprovada em 20/10/2026. Primária #143B84.

**Objetivo:** o vendedor gerencia produtos/fotos/preços/ofertas e categorias com
login restrito; o público mantém catálogo e seleção offline.

**Referência:** `docs/superpowers/specs/2026-10-20-painel-administrativo-design.md`.
**Stack:** React/TypeScript/Vite, React Aria, Supabase, Dexie/Workbox. Sem Radix.
**Fluxo Git:** main autorizada; commits pequenos, sem force push ou publicação automática.

## Limites e pré-requisitos

- Somente URL/chave publishable configuradas. Nenhuma migration remota aplicada.
- Não executar SQL de gestão via chave pública ou colocar segredo em VITE_*.
- Para validar banco local: Supabase CLI com runtime de containers disponível.
  Verificar ferramentas antes de instalar/iniciar; não presumir Docker existente.
- Aplicação remota: usuário executa SQL versionado pelo Dashboard ou fornece
  conexão administrativa por mecanismo apropriado, sem segredos no chat.
- Provisionamento do vendedor: usuário cria conta controlada no Auth e informa seu
  UUID para autorização. Sem cadastro público nem autorização por email no frontend.
- Não ativar fonte remota antes da aplicação/verificação do schema e políticas.

## Arquivos e responsabilidades

- `supabase/config.toml`, `supabase/migrations/`: banco, funções, grants, RLS e Storage.
- `supabase/tests/database/`: testes SQL de permissões e integridade transacional.
- `scripts/verify-supabase-access.mjs`: verificação HTTP permitida/negada por papel.
- `src/lib/supabase.ts`: cliente/configuração pública; sem segredo administrativo.
- `src/catalog/supabase-source.ts`: contrato CatalogSource remoto e validação de fotos.
- `src/catalog/types.ts`, `validation.ts`, `search.ts`: categorias dinâmicas e snapshots.
- `src/admin/api.ts`, `types.ts`: contratos de operações de gestão, sem UI.
- `src/admin/auth/`: sessão, autorização, login, recuperação e logout.
- `src/admin/products/`: lista, formulário, ocultar/reexibir, conversão de preços/fotos.
- `src/admin/categories/`: criar, renomear, arquivar e reativar categorias.
- `src/admin/AdminApp.tsx`: navegação e estados compartilhados da área administrativa.
- `src/App.tsx`, `main.tsx`: seleção explícita da fonte e entrada das rotas.
- `tests/e2e/admin*.spec.ts`: fluxos administrativos e efeitos no catálogo.
- `docs/deployment/supabase.md`, `docs/validation/painel-administrativo.md`:
  aplicação, provisionamento, verificação, restauração e limitações.

## 1. Modelo, autorização e revisão

- [ ] Escrever testes SQL: visitante não lê ocultos/admins; usuário comum não escreve;
      autorizado gerencia; ninguém se promove; preço inválido é recusado; código
      atribuído permanece único em cadastros concorrentes; alteração incrementa revisão.
- [ ] Confirmar falha inicial em banco vazio.
- [ ] Criar migration com categories/products/catalog_state/catalog_admins, sequência
      de códigos, limites de nome/preço e FK. Usar preços inteiros e preço anterior
      opcional maior que o atual. Controle de versão de edição por registro.
- [ ] Implementar helper mínimo de autorização em schema privado, se necessário,
      com search_path fixo e permissões revisadas. Nenhum bypass genérico exposto.
- [ ] Incluir RLS/grants mínimos na mesma migration. Visitante e autenticado comum
      leem somente público; escrita exclusiva de administrador explicitamente autorizado.
- [ ] Triggers atualizam a revisão na transação de mudanças públicas, inclusive categorias.
- [ ] Criar RPC `read_catalog_snapshot()` SECURITY INVOKER retornando revisão/data e
      produtos ativos com categoria ativa, no contrato existente. Grants EXECUTE explícitos.
- [ ] Rodar `supabase db reset` e `supabase test db`; repetir teste concorrente de códigos.
      Salvar migration e testes em commit após sucesso.

## 2. Fotos e operações transacionais de gestão

- [ ] Testar Storage com visitante, usuário comum e admin: leitura comercial permitida,
      upload/alteração/remoção indevidos negados; rejeitar MIME não JPEG, tamanho e
      caminhos fora do prefixo permitido. Validar também upload autorizado.
- [ ] Criar migration de bucket/políticas, sem bucket de backup público. Limite de
      upload 5 MiB; frontend envia JPEG otimizado, preferencialmente até 1 MiB.
- [ ] Adicionar RPCs SECURITY INVOKER para salvar produto com versão esperada e
      arquivar categoria. Comparar versão na mesma transação; conflito não sobrescreve.
- [ ] Arquivar categoria com produtos ativos deve falhar; reexibir produto exige
      categoria ativa. Constraint/trava protege contra corridas entre essas operações.
- [ ] Atualização de imagem usa caminho novo e mantém antiga. Erro limpa somente o
      upload novo conhecido, sem apagar fotos de terceiros/snapshots anteriores.
- [ ] Rodar testes de banco/Storage, incluindo conflitos e caminhos autorizados; commit.

## 3. Cliente e fonte pública remota

- [ ] Verificar documentação oficial e instalar cliente Supabase; preservar lockfile npm.
- [ ] Testar configuração ausente/inválida, sem aceitar secret/service_role no frontend.
- [ ] Implementar `getSupabaseClient()` e seleção `VITE_CATALOG_SOURCE=demo|supabase`,
      com demo como padrão explícito. Variáveis reais continuam em .env.local.
- [ ] Implementar `createSupabaseSource(client): CatalogSource`: snapshot pela RPC,
      revisão consistente, fotos JPEG com timeout/validação e caminhos restritos ao bucket.
- [ ] Generalizar Category para nome validado; derivar categorias públicas dos produtos
      recebidos, preservando ordem amigável e omitindo categorias sem produtos públicos.
- [ ] Atualizar parsers/testes: aceitar nomes novos e snapshots antigos, rejeitar campos
      inválidos e manter snapshot anterior se atualização falhar. Não relaxar validação
      de caminhos de imagens ou permitir fetch a origem arbitrária.
- [ ] Ajustar construção de URLs públicas e resolução de Blobs para as duas fontes.
      Snapshot remoto nunca inclui produtos ocultos ou respostas administrativas.
- [ ] Testar fonte remota simulada, nova categoria, renomeação e rollback offline;
      `npm test` e testes offline existentes verdes; commit.

## 4. Login, autorização e rotas administrativas

- [ ] Testar visitante redirecionado ao login, usuário comum sem acesso, admin autorizado,
      recuperação de senha e logout sem dados administrativos remanescentes.
- [ ] Implementar rotas `/admin`, `/admin/entrar`, `/admin/recuperar-senha`, com código
      administrativo carregado separadamente do catálogo público. Usar React Router
      para navegação e conexão com React Aria, verificando API oficial ao instalar.
- [ ] Implementar formulários React Aria de email/senha e recuperação, com mensagens
      simples e sem log de JWT/senha. Nenhum formulário público de cadastro.
- [ ] Verificar vínculo administrativo pela API/RLS. Bloqueio de rota serve à UX;
      permissões no banco/Storage continuam sendo a barreira de autorização.
- [ ] Logout limpa estado administrativo e sessão; não apagar catálogo público salvo.
- [ ] Sem rede, desabilitar envio e orientar retorno ao catálogo. Não cachear respostas
      administrativas no Workbox/IndexedDB público; preservar denylist de `/admin`.
- [ ] Rodar testes de autenticação/componentes e E2E de acesso; commit.

## 5. Produtos e imagens com formulário simples

- [ ] Testar entrada monetária brasileira, campos obrigatórios e ofertas: 65,00 e
      100,00 produzem 6500/10000 centavos e 35%; preço anterior inválido bloqueia envio.
- [ ] Implementar parse/format de preços sem conversão imprecisa para centavos.
- [ ] Implementar processamento de foto com limite de resolução 1600 px no maior lado,
      preservando proporção; saída JPEG. Prévia e seletor substituem o arquivo anterior.
      Rejeitar arquivo inválido; tratar orientação da câmera na decodificação.
- [ ] Criar lista com miniatura/nome/código/preço/categoria, pesquisa e filtro de ocultos.
- [ ] Criar formulário foto/nome/categoria/preço e opção de oferta com preço anterior;
      desconto calculado. Ações Adicionar produto, Salvar produto, Ocultar/Reexibir.
- [ ] Salvar com versão esperada, sem cliques duplicados. Em conflito, manter alterações
      locais e oferecer recarregar os dados; em falha de envio, preservar formulário.
- [ ] Confirmar saída com alterações não salvas. Mensagens de sucesso persistentes e
      erros junto ao campo, com rótulos e alvos de 48 px. Tema claro azul #143B84.
- [ ] Testar troca de imagem, conflito, falha de upload, ocultar/reexibir e uso em
      celular/tablet. Conferir alteração visível no catálogo e no carrinho após revisão.
- [ ] Rodar testes correspondentes e checks; commit.

## 6. Gerenciamento de categorias

- [ ] Testar criar/renomear, nome duplicado, arquivar com produtos ativos e reativar.
- [ ] Implementar lista e formulário curto, com Arquivar/Reativar e lista de produtos
      que impedem arquivamento. Não oferecer exclusão definitiva ou perda de vínculos.
- [ ] Produtos ocultos mantêm categoria. Ao reexibir, explicar necessidade de categoria
      ativa e permitir escolher uma ou reativar a existente.
- [ ] Verificar renomeação nos filtros públicos após sincronização, incluindo offline.
- [ ] Rodar testes de UI e API/constraints correspondentes; commit.

## 7. Aplicação e verificação no projeto real

- [ ] Documentar/aplicar migrations na ordem, sem correções exclusivas no Dashboard.
      Criar somente categorias iniciais; não importar produtos fictícios automaticamente.
- [ ] Orientar criação controlada da conta e autorização por UUID. Configurar redirects
      locais/produção específicos; sem wildcard amplo. Cadastro público continua desligado.
- [ ] Executar API direta como visitante, usuário comum e admin, inclusive RPC/Storage.
      Credenciais de teste em ambiente protegido, sem persistir tokens nos relatórios.
- [ ] Conferir Security Advisor, grants/EXECUTE, helpers/views/schemas e build sem segredos.
- [ ] Executar procedimento de exportação/restauração em ambiente de teste antes de usar
      dados reais; backups administrativos fora do bucket público.
- [ ] Ativar fonte remota localmente após validação; fluxo real cadastrar/editar/ocultar/
      categoria/trocar foto/sair e preparar/reabrir offline. Registrar evidências reais.
- [ ] Se não houver acesso/ferramentas necessários para validar, registrar bloqueio
      concreto e não declarar o backend pronto só porque testes simulados passaram.

## 8. Encerramento e piloto

- [ ] `npm test`, `npm run build`, `npm run lint` e formatação dos arquivos alterados.
- [ ] E2E público/offline e administrativo nos viewports 320/360/800/1280 e paisagem.
- [ ] Revisão independente de segurança e código; corrigir problemas relevantes.
- [ ] Atualizar AGENTS/README e relatório com implementado vs. testes pendentes no
      Supabase real e Android real. Registrar commits na main.
- [ ] Não publicar no Sites nem ativar dados reais em produção sem pedido explícito.
- [ ] Roteiro com vendedor: criar produto, mudar preço/foto, criar categoria e localizar
      item sem ajuda contínua. Resultado decide próximos refinamentos.

## Focos de revisão

- Autenticado comum não pode administrar; authorization helper não permite autopromoção.
- Conflitos de edição, arquivamento de categoria e incremento de revisão são transacionais.
- Falha entre upload e gravação não apaga foto publicada nem publica produto incompleto.
- Categoria dinâmica preserva snapshots antigos e carrinho; códigos não são reutilizados.
- Logout/cache e recuperação de senha não expõem respostas administrativas ou tokens.

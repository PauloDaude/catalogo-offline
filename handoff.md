# Handoff — Catálogo Cirandinha

Atualizado em 29/10/2026, para continuar em um novo chat

## Leia primeiro

- `AGENTS.md`: decisões, regras de segurança e fluxo do projeto
- Este arquivo resume a situação atual, não substitui as instruções do projeto
- Workspace: `/home/paulo/projetos/catalogo`
- Repositório: `https://github.com/PauloDaude/catalogo-offline.git`, trabalho na `main` autorizado
- Conversa muito longa, o usuário pediu este handoff para abrir um novo chat

**Não publicar automaticamente nem fazer push sem pedido**
**Não importar o lote completo nem limpar o banco**
O usuário disse que vai limpar o banco, antes da importação é obrigatório avisar
e aguardar sua confirmação explícita de que concluiu a limpeza

## Produto e decisões consolidadas

Catálogo público para o pai do usuário, vendedor Antônio Marcos Daúde,
marca Cirandinha Variedades, com painel administrativo autenticado
Dispositivo principal tablet Samsung Android, também celular
React + TypeScript + Vite, React Aria/shadcn, Tailwind, Supabase e Dexie/Workbox
Não usar Next.js nem Radix, não acrescentar tema escuro
Primária `#143B84`, ofertas verdes `#04a650` com texto branco
Logo em `public/logos/logo-cirandinha.png`

Implementados: catálogo com abas Folhear catálogo (padrão) e Ver grade,
pesquisa/categorias compartilhadas, foto proporcional com altura limitada pelo
viewport, setas e gesto esquerda→próximo, etiqueta branca sem dobra azul,
carrinho local com quantidades e feedback +1, variantes e caixas,
pedido PDF com logo/fotos/vendedor/cliente/observações, prévia e compartilhamento
nativo quando suportado, download e WhatsApp texto para `556296146244`
PDF e dados do cliente ficam em memória, sem histórico no servidor
Offline salva fotos de verdade no IndexedDB, preparação por aparelho

Painel: CRUD, fotos, ofertas, categorias com modais, arquivar/remover categorias
sem vínculos, ocultar/excluir produtos com confirmações e ações em lote
Seleção mantida entre páginas, 20 produtos por página, filtros globais
Modal de lote separa produtos já na condição e permite ocultar e excluir visíveis
Listagem com altura limitada e scroll interno, encadeamento para página nos limites

Supabase: RLS/grants/RPCs/Storage versionados, autorização por usuário permitido,
cliente público separado da sessão administrativa, chaves privadas fora do frontend
Usuário já testou CRUD remoto e informou ter aplicado migrations 007/008
Isso não equivale a uma auditoria independente completa do projeto remoto
Não registrar credenciais nem imprimir arquivos .env

Hospedagem desejada: Cloudflare gratuita, domínio `cirandinha.daude.dev`
Demonstração antiga Sites em `https://catalogo-paulo-demo.safereed9.chatgpt.site/`
Não presumir que a demo publicada contém a versão local atual
Usuário exige autorização para atualizar publicação

## Importação dos produtos reais

Fonte: `docs/produtos/conversa.txt`, fotos em `docs/produtos/imagens/`
Dados comerciais revisados em `docs/produtos/produtos-revisao.json`
Correções ortográficas aprovadas, exemplo “whast”→“watts”
`10x1`, `12x1` etc indicam caixa/pacote, preço da mensagem pode usar ponto decimal
Se há preço por unidade e quantidade da caixa, vender uma caixa com valor total
Exemplo R$ 4 por unidade e 10x1 → caixa com 10 por R$ 40
Não inferir novo preço nem multiplicar novamente preços já normalizados
Variações devem ser agrupadas em um produto com opções e preços próprios

Cinco produtos piloto foram efetivamente importados no Supabase remoto anteriormente
O usuário gostou e testou, não confundir com testes temporários locais
Manifesto `docs/produtos/piloto-variantes.json` e journals privados
`.catalog-import/` foram preservados nesta entrega
Importador atual atende o piloto fixo, não importar os 85 registros diretamente
85 são registros de origem, não a contagem final de produtos principais
Agrupamento final de variantes e manifesto de importação completa ainda pendentes

## Entrega local atual — WebP e categorias

Escopo confirmado: **fotos locais e próximos uploads**
**Não migrar fotos já online**

- 67 fotos reais convertidas: 6.936.215 → 4.480.384 bytes, redução de 35,4%
- 10 fotos demo: 858.513 → 434.186 bytes, redução de 49,4%
- Total 77: 7.794.728 → 4.914.570 bytes, redução de 36,95%
- Todos os originais mantidos, todas as saídas menores
- WebP com lado máximo 1600 px, até 500.000 bytes, sem ampliar
- Relatório com SHA-256, dimensões e parâmetros em `docs/produtos/conversao-webp.json`
- Conversor Python/Pillow: `scripts/images/convert_webp.py`
- Fotos reais em `docs/produtos/imagens-webp/`, locais, sem upload
- Demo passou a referenciar WebP, JPEGs antigos permanecem válidos

Novos uploads do painel geram WebP real, detectam/rejeitam fallback PNG do canvas
API deriva MIME/extensão do Blob, validações aceitam JPEG/WebP
Offline valida assinatura e decodificação de ambos, PDF conserva conversão interna
Backup e restauração aceitam ambos, preservam bytes e MIME

**Nova SQL pendente no remoto:**
`supabase/migrations/202610290009_webp_photos.sql`
Aplicada e testada apenas no Supabase Docker local
Guia: `docs/deployment/webp.md`
Altera constraints e políticas para UUID.jpg|webp, mantém limites e autorização
Antes de novos uploads WebP no remoto é necessário aplicar SQL e usar frontend atualizado
Publicar exige pedido do usuário, não fazer automaticamente

### Categorias preparadas

| Categoria                | Registros de origem |
| ------------------------ | ------------------: |
| Casa e cozinha           |                  24 |
| Beleza e higiene         |                  18 |
| Costura e papelaria      |                  21 |
| Elétrica e iluminação    |                  13 |
| Ferramentas e acessórios |                   4 |
| Lazer                    |                   5 |

Arquivos:

- `docs/produtos/categorias.json`: definições, vínculos, decisões limítrofes
- `docs/produtos/produtos-preparados.json`: 85 registros com referências WebP/categoria
- `docs/produtos/produtos-preparados.md`: tabela legível para revisão

Nomes, preços, caixas, IDs, origem e pendências preservados em relação à revisão
JSON preparado está marcado como não aprovado para importação e aguardando limpeza
Não é um manifesto pronto para o importador
Categorias ainda não foram criadas no remoto
Tubos de látex em Lazer são uma inferência registrada para conferir se necessário

## Backup

Comando roda na máquina do usuário e conecta ao Supabase, independentemente do host
Credenciais só em `.env.backup` ignorado, não ler/imprimir em logs
Backups em `backups/`, privados e fora do Git/publicação
Guia `docs/deployment/backup-local.md`

```bash
npm run backup:catalog -- --check
npm run backup:catalog
npm run backup:verify -- backups/NOME_DA_PASTA
```

Testes de restauração usam exclusivamente Docker local e dados fictícios
Não usar um dump local fictício como se fosse backup do Supabase remoto

## Próxima conversa — sequência sugerida

1. Ler este arquivo, AGENTS e git status, preservar alterações anteriores
2. Mostrar ao usuário as seis categorias e o JSON preparado se ainda não revisou
3. Orientar aplicação da migration 009, confirmar resultado sem presumir execução
4. Preparar agrupamento definitivo de variantes e manifesto, revisar preços/caixas
5. **Avisar antes da importação e aguardar confirmação da limpeza do banco**
6. Conferir backup apropriado e simulação, então importar somente com autorização
7. Revisar catálogo público e painel após importação, publicação só quando solicitada

Não reaproveitar cegamente journals do piloto em um banco limpo
Limpeza pode invalidar IDs/códigos registrados, revisar estratégia de novo lote
Não excluir fotos órfãs nem reconfigurar banco por conta própria

## Alterações anteriores no workspace

Existem mudanças anteriores a esta entrega que devem ser preservadas:
`docs/deployment/supabase.md`, logo, `src/catalog/useCatalog.tsx` e teste,
`src/pwa/register.ts`, novos testes de PWA/foco, `pnpm-lock.yaml`,
PDF em docs, conversa e imagens originais
Não reverter nem incorporar silenciosamente em commits desta entrega
Consultar git status real ao retomar, esta lista descreve o início desta tarefa

## Validação desta entrega

Ver resultados e limitações em `docs/validation/webp-categorias.md`
Experiência no tablet/celular físico e compartilhamento nativo seguem sujeitos
a validação real, testes automatizados de viewport não substituem hardware

Resultados finais: 190 testes unitários, 74 testes públicos de navegador,
25 administrativos, 4 Python, 15 de backup e 3 de importação aprovados
Restauração local recuperou 255 fotos com hashes iguais
TypeScript e build demo aprovados, lint e formatação conferidos
A execução unitária usou dois workers e timeout de 15 s devido à carga local

## Atualização após retomada — 29/10/2026

- Usuário confirmou que concluiu a limpeza dos produtos no remoto
- Agrupamento final/manifesto ainda pendentes, não houve nova importação
- Categorias continuam as seis propostas, podem ser criadas/reutilizadas pelo
  futuro importador, sem necessidade de criação manual prévia
- Estado vazio administrativo com espaçamento próprio, confirmações de produtos
  e categorias passam a toast de 5 segundos com fechar e pausa por foco/mouse
- Erros permanecem persistentes, alteração ainda local e sem publicação

## Importação concluída — retomar daqui em 30/10/2026

Esta seção substitui as pendências de envio do lote e agrupamento acima.

- Usuário confirmou limpeza dos produtos e categorias e autorizou envio completo
- Confirmou produtos visíveis e os quatro casos comerciais apresentados
- Lote de 29/10 concluído: 48 pais P009–P056, 85 itens vendáveis, 61 variantes,
  seis categorias e 67 fotos WebP, todos os pais visíveis no catálogo público
- Manifesto imutável docs/produtos/lote-completo-20261029.json e versão legível .md
- Executor scripts/import/full-import.mjs, modos --dry-run/--check/--full/--verify
- Não reenviar com novo manifesto ou apagar journal para contornar divergências
- Journal novo em .catalog-import/<hash-origem>/lote-completo-20261029-v1/, privado
- Conferência de 29/10 terminou às 20:56 UTC, mesmo com chat interrompido por limite
- Backup prévio real de 29/10 com 0 produtos e 9 fotos, Storage anterior preservado
- Casos aprovados: escovas Modelo 1/2, GD só em 5 W, pino unitário R$ 4,10,
  tesoura curva/reta única R$ 4,90, canivete comercial R$ 29,90 sem oferta fictícia
- Frontend continua sem publicação e alterações desta etapa ainda sem commit
- Revalidação remota em 30/10 às 09:46 local confirmou 48 pais, 85 escolhas e
  67 fotos, sem reenviar, evidências em docs/validation/importacao-completa.md

## Publicação pelo GitHub — decisão de 30/10/2026

- Usuário autorizou commit/push das pendências na main e escolheu deploy automático
  do Cloudflare Pages a cada atualização da main, substituindo publicação manual
- Domínio escolhido catalogo.daude.dev, sem configurar Cloudflare/DNS nesta etapa

## Skeletons e categorias compactas — 30/10/2026

- Skeletons implementados para catálogo inicial/grade/folhear, painel/autorização,
  listas, imagens, processamento inicial de foto e prévia PDF, sem novas dependências
- Preservar dados da mesma consulta no refresh, inclusive após falha com erro/retry
- Animação respeita reduced motion, imagem em cache/falha não fica presa em loading
- Usuário aprovou substituir chips por seletor único de categoria de 48 px abaixo
  da pesquisa, Todas as categorias por padrão e seleção compartilhada entre abas
- Menu React Aria com toque/teclado, nomes longos e retorno de foco, sem alterar API
- Validação final: 204 unitários e 36 cenários públicos de navegador aprovados,
  build, lint e formatação conferidos; hardware real continua pendente
- Skeletons em commit f65a498, seletor em commit separado, ambos via main/Cloudflare

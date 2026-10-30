# Instruções do projeto — catálogo digital

## Continuidade entre sessões

Leia este arquivo antes de trabalhar no projeto. Ele registra as decisões do
usuário e as regras para agentes; atualize-o quando novas decisões forem tomadas.
Não confunda requisitos confirmados com propostas ainda em revisão.

Contexto e documentos:

- `docs/contexto_catalogo_digital_vendedor.md`: contexto da conversa original.
- `docs/superpowers/specs/2026-10-14-catalogo-mvp-design.md`: proposta detalhada de arquitetura.
- `docs/superpowers/plans/2026-10-14-prototipo-catalogo-offline.md`: plano da etapa 1,
  autorizado para execução direta; acompanhar checkboxes e resultados de validação.
- Antes de implementar, conferir o status da especificação e a existência de um
  plano de implementação. O protótipo da etapa 1 foi implementado nesta sessão;
  integração Supabase e painel administrativo implementados em 20/10/2026, com
  validação local. Aplicação e validação no projeto remoto ainda pendentes.
- `README.md`: comandos de instalação, desenvolvimento e preview de produção.
- `docs/validation/prototipo-offline.md`: evidências automáticas e roteiro pendente
  para tablet/celular reais e validação com o vendedor.

## Objetivo e escopo confirmado

Criar uma vitrine digital simples para o pai do usuário, vendedor itinerante em
cidades do Tocantins. Catálogo inicial estimado em 50–100 produtos. Priorizar
baixo custo, facilidade de manutenção pelo vendedor e consulta offline confiável.

- Dispositivo principal: tablet Samsung com Android.
- Celular também usado para gerenciar produtos e apresentar o catálogo.
- Responsividade e usabilidade devem ser boas em ambos, em retrato e paisagem.
- Catálogo público por link, sem login; pode ser compartilhado com clientes.
- Gerenciamento com login e conexão à internet.
- MVP: código curto único, nome, categoria, uma foto e um preço por produto.
- Código de exibição no formato `P001`, único e persistido nos dados, sem depender
  da posição do produto na lista. Exibi-lo como `#P001`, sem o texto "Código";
  no card, à direita da categoria na mesma linha, e também no carrinho.
  Não reutilizar o código de um produto oculto nem alterar códigos ao reordenar.
  O identificador interno permanece separado do código público. No futuro Supabase,
  impor unicidade no banco, com atribuição transacional no cadastro.
- Cadastro, edição e ocultação reversível de produtos.
- Próxima etapa solicitada: painel simples para trocar imagens e alterar nome,
  preço, desconto e categorias dos produtos, incluindo gerenciar categorias.
  Isso substitui a proposta inicial de categorias fixas para o painel; integração
  Supabase e gerenciamento implementados e validados localmente em 20/10/2026.
  Aplicação das migrations e autorização da conta no projeto real ainda pendentes.
- Projeto Supabase já criado pelo usuário. URL e chave publishable configuradas
  localmente em `.env.local` usando prefixo `VITE_`, não `NEXT_PUBLIC_`.
  `.env.example` contém apenas placeholders. O catálogo ainda usa dados de
  demonstração; não confundir configuração de ambiente com integração concluída.
- Pesquisa, categorias, fotos grandes e preços destacados.
- Ofertas aprovadas: preço anterior opcional (`previousPriceCents`), inteiro em
  centavos e maior que o atual. Exibir preço anterior riscado, preço atual e
  percentual de desconto inteiro arredondado para baixo, no card e nos detalhes.
  Produtos sem preço anterior não recebem destaque de oferta. O carrinho usa
  somente o preço atual. Percentual em selo verde `#04a650` com texto branco.
  Selo "OFERTA IMPERDÍVEL" em azul com texto branco e ícone de desconto, conforme
  referências e preferências explícitas do usuário. Conteúdo centralizado
  verticalmente, fonte de peso moderado e ícone simples de etiqueta.
- Card inteiro clicável para abrir os detalhes, com suporte a teclado e foco visível.
  Na listagem, adicionar ao carrinho também por botão compacto com carrinho e +,
  contador no canto superior direito, sem abrir detalhes; o restante do card abre
  o modal. Nos cards, selo de oferta sobre a foto no canto superior esquerdo;
  preço atual próximo ao nome e alinhado entre produtos com e sem promoção.
  Percentual junto ao preço atual quando houver espaço e preço antigo menor abaixo.
  Não reservar linhas vazias para o selo e o preço anterior dos produtos sem oferta.
  Nos detalhes, o selo e o preço anterior permanecem no bloco de informações.
- Detalhes em duas colunas nas telas maiores (foto à esquerda, informações e ações
  à direita), adaptados ao celular e à paisagem com pouca altura. Evitar rolagem
  desnecessária; manter categoria e código na mesma linha.
- Carrinho simples solicitado em 15/10/2026: agrupar produtos selecionados pelo
  cliente, ajustar quantidades e somar o valor total, sem pagamento.
  Desenho aprovado: adicionar/remover, quantidades, subtotais e total, limpeza com
  confirmação, persistência local e uso offline. Mudanças de preço/disponibilidade
  exigem revisão explícita antes de atualizar a seleção e o total.
  Botão do carrinho fixo no canto inferior direito em celular, tablet e desktop,
  permanecendo visível durante a rolagem. Usar fundo azul em ambos os visuais.
  No carrinho mobile, quantidade -/+ junto ao item, sem deslocar os controles para
  uma linha isolada abaixo. Remoção por botão de ícone de lixeira ao lado do nome,
  com rótulo acessível e alvo de toque de 48 px; não exibir botão textual Remover.
  Cada item mostra uma miniatura da foto atual do catálogo, inclusive offline,
  com indicação visual quando a foto não estiver disponível. Reutilizar as URLs
  de imagem da sessão; não persistir Blob URLs no localStorage do carrinho.
- Sem variações, checkout, pagamentos, pedidos enviados ao servidor ou controle de estoque.
- Variações só serão consideradas depois da validação do MVP pelo vendedor.

## Stack definida

- React + TypeScript + Vite. Next.js não faz parte da stack do MVP.
- shadcn/ui com **React Aria Components** como base e Tailwind CSS para estilos.
- **Não usar Radix UI**, inclusive por dependências de componentes copiados.
  Conferir imports e dependências ao instalar componentes ou blocos.
- Supabase: Auth, Postgres e Storage.
- IndexedDB com Dexie para persistência local.
- Service Worker com Workbox para arquivos essenciais da aplicação.
- Não trocar essas escolhas sem discutir uma necessidade concreta com o usuário.

## Demonstração de catálogo para folhear

- Demonstração sem PDF: **Folhear catálogo** mostra um produto por vez;
  **Ver grade** oferece a listagem de cards. O usuário removeu o controle de
  quantidade de 1 a 5 produtos por tela por já existir a aba de grade.
- Página inicial abre Folhear catálogo por padrão, com abas React Aria para
  alternar entre Folhear catálogo e Ver grade. Não acrescentar terceira aba.
  Carrinho, pesquisa e categoria são compartilhados entre os visuais.
- Usar **um único filtro de categorias**, com o estilo arredondado da listagem,
  e **uma única pesquisa** acima dos painéis. Começar em Todas. Alternar abas
  mantém filtros; mudar pesquisa/categoria reinicia o carrossel no primeiro item.
- Pesquisa alinhada verticalmente às abas no desktop; no celular, logo abaixo
  delas, com a mesma largura e bordas alinhadas. Não repetir controles nos painéis.
- `?visualizacao=folhear` abre carrossel e `?visualizacao=cards` abre listagem.
  A seleção da aba atualiza o parâmetro; a URL sem parâmetro abre carrossel.
- Pedido mais recente corrige o sentido: arrastar da **direita para esquerda
  avança**; esquerda para direita retorna.
  Manter botões inferiores e setas grandes clicáveis nas laterais da foto,
  com fundo branco, alvo de 56 px no desktop e 48 px no celular. O centro de cada
  botão deve coincidir com a borda lateral da foto, metade para fora, também no
  celular; reservar espaço lateral para não cortar os botões. Sinalizar limites
  e preservar foco de teclado ao navegar. Manter contador do produto.
  Arrasto não deve abrir detalhes; toque/click simples e teclado devem abrir.
- Foto inteira preservando a proporção original (`object-fit: contain`), com
  largura adaptada às imagens verticais, quadradas e horizontais; na visualização
  individual limitar altura pelo viewport. Não voltar ao quadro largo fixo que recorta imagens verticais.
- Código, nome e preço em etiqueta branca saindo pela lateral esquerda,
  sobrepondo parcialmente a borda inferior da foto. A etiqueta também abre
  detalhes. Não cortar a faixa nem gerar rolagem horizontal no celular.
- No modo de folhear, botão azul com ícones de carrinho e “+” ao lado do preço
  adiciona diretamente uma unidade, sem abrir detalhes. Manter rótulo acessível,
  alvo de toque de 48 px e navegação por teclado.
- Escolha mais recente do usuário: etiqueta branca sobreposta com cantos
  arredondados e sombra suave. Remover a dobra azul, a borda azul lateral e o
  gradiente que simulava papel curvo; não reintroduzir esse efeito sem pedido.
- Usar os mesmos tokens de preço azul, selo azul OFERTA IMPERDÍVEL e percentual
  verde `#04a650` com texto branco da listagem. Carrinho flutuante também azul.
- Pesquisa combina com a categoria escolhida, incluindo Todas. Reaproveitar
  dados, fotos e consulta offline. Seleção preservada ao alternar os visuais. Sem animação de folha dobrando.
- Hero removido da listagem por pedido do usuário; abrir diretamente o catálogo,
  mantendo o header. Preparação offline em card compacto fixo no canto inferior
  esquerdo; texto pequeno e ações curtas (Salvar offline/Atualizar). No celular,
  manter botão offline e carrinho na mesma linha inferior, com altura de 56 px,
  espaço entre eles e total visível. Estado online comum fica compacto; mensagens
  de erro, progresso e confirmação aparecem acima dos botões e seguem acessíveis.
- Avaliação de usabilidade com o vendedor continua pendente. As regras de cards
  da listagem acima descrevem o visual anterior preservado.
- O PDF da empresa em `docs/` é apenas referência visual fornecida pelo usuário;
  não foi importado para o catálogo nem incluído na publicação.

## Aparência e UX

- **Tema claro (light), com azul `#143B84` como cor primária, por escolha do usuário.**
- Header usa a logo fornecida em `public/logos/logo-cirandinha.png`, Cirandinha
  Variedades, substituindo ícone/nome genéricos. Preservar proporção, transparência
  e leitura em celular/tablet; incluir o arquivo no app shell offline.
- Usar tokens de tema para o azul primário: normal #143B84, hover #10306a e
  pressionado #0d2757, com texto branco. Verificar contraste e foco; preservar o
  verde #04a650 das ofertas. Não retornar ao roxo anterior nem ao azul original.
- Não acrescentar tema escuro ou seletor de temas ao MVP sem necessidade acordada.
- Foco da pesquisa: borda azul fina com sombra discreta; evitar outline grosso
  combinado com ring. Preservar indicação de foco e acessibilidade por teclado.
- O vendedor não é um usuário experiente: textos simples e ações explícitas.
- Controles confortáveis para toque; referência de 48 × 48 CSS px para ações principais.
- Não depender de hover, gestos ocultos ou ícones sem rótulos para ações essenciais.
- Poucos campos no formulário, foto pela galeria/câmera e preço fácil de alterar.
- Mensagens claras de salvamento, falha, conexão e última sincronização.
- Validar acessibilidade e experiência real; componentes prontos não garantem UX.

## Requisito offline

- Após preparação, todos os produtos e fotos devem continuar disponíveis sem rede,
  inclusive após fechar e reabrir a aplicação.
- Cada aparelho precisa preparar sua própria cópia local.
- Guardar as fotos efetivamente, não somente suas URLs.
- PWA/Workbox isoladamente não garantem persistência dos produtos e das fotos.
- Proposta de arquitetura: produtos e fotos como Blob em IndexedDB; preparar uma
  nova versão e ativá-la integralmente em transação, mantendo a anterior em falhas.
- Consulta offline; criação e edição offline ficam fora do MVP.
- Exibir última conferência/sincronização e alertar que preços podem ter mudado.
- Limpeza dos dados pelo navegador exige nova preparação; backend e backup devem
  permitir recuperação. Não prometer armazenamento local permanente.

## Segurança obrigatória no Supabase

Segurança é requisito explícito do usuário. Não considerar o backend pronto apenas
porque login e CRUD funcionam. Aplicar defesa no banco, no Storage e nas funções;
ocultar botões ou proteger rotas no React não controla acesso à API.

### Banco e autorização

- RLS habilitada em todas as tabelas expostas pela Data API, com grants mínimos.
- Negar por padrão; conceder apenas operações necessárias a cada papel.
- Visitantes podem ler somente produtos ativos e metadados públicos necessários.
- Escrita e leitura administrativa somente para usuários explicitamente autorizados.
  Não conceder administração a qualquer usuário com papel `authenticated`.
- Usuários não podem se promover a administradores; proteger a tabela de autorização.
  Não confiar em metadados editáveis pelo usuário para privilégios.
- Não expor informações de conta, emails, dados internos ou backups no catálogo público.
- Definir constraints no banco para preço, campos obrigatórios e valores permitidos;
  validação do frontend serve à UX e não substitui validação no backend.
- Versionar schema, grants e políticas nas mesmas migrations. Não deixar correções
  exclusivas no Dashboard sem representação reproduzível no projeto.
- Não desabilitar RLS nem liberar escrita geral para resolver erros de permissão.

### Funções e views

- Preferir funções com `SECURITY INVOKER` e views que respeitem RLS.
- Revisar permissões `EXECUTE`, inclusive grants padrão a `PUBLIC`; limitar chamadas
  aos papéis necessários. Uma RPC também precisa de autorização.
- Se uma função com `SECURITY DEFINER` for indispensável, justificar e revisar seu
  escopo, fixar `search_path`, qualificar objetos e validar autorização. Helpers
  privilegiados devem ficar em schema não exposto; não oferecer bypass genérico.

### Chaves, sessão e Auth

- Frontend recebe apenas URL e chave publishable/anon com RLS corretamente configurada.
- Nunca colocar chave secret/service_role, senha do banco ou tokens administrativos
  no frontend, variáveis `VITE_*`, build, repositório, logs ou documentação.
- Não registrar senhas, JWTs ou cabeçalhos de autenticação em logs.
- Manter segredos em ambiente apropriado; exemplos usam placeholders; arquivos locais
  com segredos devem ser ignorados pelo Git quando o repositório for criado.
- Desabilitar cadastro público; provisionar administradores por processo controlado.
- Configurar URLs de redirecionamento de login/recuperação de forma restrita em produção.
- Usar HTTPS, política de senha adequada e revisar limites de autenticação.
  Avaliar recursos de proteção disponíveis no plano sem presumir gratuidade.
- Proteger conta de gestão do Supabase com MFA; avaliar MFA no aplicativo considerando
  recuperação e facilidade de uso pelo vendedor antes de exigir esse fluxo.
- Não guardar respostas administrativas ou backups no cache público do Service Worker.
  O catálogo offline contém apenas conteúdo destinado ao público.
- Evitar HTML não sanitizado; nomes e textos de produtos devem ser tratados como texto.

### Storage

- Bucket público apenas para fotos comerciais destinadas à divulgação.
- Público significa que a foto pode ser acessada por URL; ocultar o produto não torna
  a imagem privada nem revoga cópias que clientes já baixaram.
- Upload, alteração e remoção limitados a administradores autorizados por políticas.
- Restringir bucket, caminhos, tamanho e MIME permitido. No MVP, saída otimizada JPEG;
  não permitir HTML/SVG ou executáveis no bucket de produtos.
- Validar no backend/Storage o que for aplicável, além da compressão no frontend.
- Backups com produtos ocultos e dados administrativos não podem ficar em bucket público.

### Verificação antes de entregar o backend

- Testar API diretamente como visitante, usuário autenticado não administrador e
  administrador: leitura, insert, update, delete, RPC e operações de Storage.
- Confirmar negativas para leitura de produtos ocultos e dados administrativos,
  escrita não autorizada, upload indevido e tentativa de obter privilégio.
- Testar também os caminhos autorizados; testes de negação não bastam.
- Revisar views, funções, grants, exposição de schemas e Security Advisor do Supabase.
- Revisar o build para exposição de segredos e o comportamento de cache/logout.
- Registrar resultados e limitações reais; não afirmar ausência absoluta de riscos.
- Garantir exportação e restauração verificadas antes do uso de dados reais.

Referências oficiais para consultar conforme necessário:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/secure-data
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/deployment/going-into-prod

## Processo de trabalho

- Prettier instalado localmente com versão fixada, configuração em `.prettierrc.json`.
  Usar `npm run format` para formatar todos os arquivos compatíveis e
  `npm run format:check` para verificar. Não deixar código compactado/minificado
  nos fontes. Separar imports, tipos, funções e blocos lógicos com linhas em branco;
  o Prettier preserva essas separações. `.editorconfig` e `.vscode/` alinham formatação ao salvar na IDE;
  no VS Code/Cursor é necessária a extensão recomendada Prettier.
- Repositório autorizado: `https://github.com/PauloDaude/catalogo-offline.git`.
  O usuário autorizou vincular a pasta e fazer commits na `main` por enquanto.
  Não exigir branch/worktree para este fluxo. Preservar histórico remoto; sem force push.
- O usuário pediu o uso das skills **Superpowers**. Seguir as skills aplicáveis à
  fase atual: brainstorming, planejamento, implementação e verificação.
- Manter as decisões aprovadas ao retomar uma sessão; não repetir perguntas resolvidas.
- Distinguir proposta, implementação e validação em aparelhos reais.
- Ordem acordada: protótipo com dez produtos fictícios para apresentação e offline;
  depois integração do painel e Supabase; por fim entrega piloto.
- Testes relevantes: consistência da sincronização, falhas de download, permissões,
  upload e fluxos essenciais. Testar também modo avião no hardware real.
- Especificação do painel aprovada em 20/10/2026:
  `docs/superpowers/specs/2026-10-20-painel-administrativo-design.md`.
  Categorias agora gerenciáveis; substitui proposta anterior de categorias fixas.
  Plano `docs/superpowers/plans/2026-10-20-painel-administrativo.md` aprovado para
  execução direta. Login email/senha, autorização por UUID, sem cadastro público.
- Migrations em `supabase/migrations/`; RLS/grants/Storage versionados. Fonte
  `VITE_CATALOG_SOURCE=demo|supabase`, demo por padrão até validar backend remoto.
  Cliente público separado da sessão administrativa. Não ativar remoto implicitamente.
  IndexedDB separado por fonte/origem Supabase; preservar o nome legado da demo.
  Nunca comparar revisões de fontes diferentes como se fossem o mesmo catálogo.
- Setup remoto em `docs/deployment/supabase.md`; evidências locais e pendências
  em `docs/validation/painel-administrativo.md`. Não confundir local com produção.
- Em 15/10/2026, o usuário autorizou publicar uma demonstração compartilhável no
  Sites para mostrar ao pai. Projeto vinculado em `.openai/hosting.json`; reutilizar
  esse `project_id`. Publicação estática em checkout separado `.sites-preview/`,
  ignorado no repositório principal. Processo em `docs/deployment/sites-preview.md`.
  O link representa a build publicada e não acompanha automaticamente a `main`.
- **Decisão mais recente: não publicar automaticamente a cada alteração.** Manter
  alterações e preview locais; atualizar o link online somente quando o usuário
  confirmar/pedir publicação. Essa instrução substitui o padrão da skill Sites.
- Não publicar, criar recursos externos ou presumir contas/configurações existentes
  apenas porque estão citados nos documentos de planejamento.

## Etapa administrativa — 20/10/2026

- Usuário revisou e aprovou a especificação
  `docs/superpowers/specs/2026-10-20-painel-administrativo-design.md`.
- Identidade solicitada para toda a aplicação e o painel: primária #143B84.
- Próximo artefato: plano executável do painel; método de execução direta já
  escolhido pelo usuário. Banco remoto permanece inalterado até aplicação segura.

## Refinamentos do painel aprovados — 20/10/2026

- Selects do painel usam shadcn aria-vega/React Aria, sem Radix ou select nativo
- Sair da conta fica no header, preservando a confirmação de alterações não salvas
- Foto usa arrastar e soltar ou seletor acessível, com prévia, Trocar imagem e
  Remover imagem; salvar produto continua exigindo uma foto
- Criar/renomear categoria em modal; arquivar é reversível, depois aparece Remover
- Nova decisão substitui a proibição anterior de excluir categorias: remoção
  definitiva só de categoria arquivada sem nenhum produto vinculado, inclusive
  oculto, com confirmação e proteção no banco; nunca apagar produtos em cascata
- Ocultar produto exige modal de confirmação; Mostrar inicia em Todos
- Erro de login com texto vermelho, ícone e role=alert; separar erros de sucesso
- Textos curtos da interface evitam frases seguidas separadas por pontos, preferir
  reformulação, vírgula quando adequada ou quebra de linha entre as frases
- Nova migration `202610200003_remove_category.sql` deve ser aplicada no projeto
  remoto para habilitar a remoção; instruções em `docs/deployment/categorias-remocao.md`

## Próxima entrega planejada — pedido PDF — 24/10/2026

- Abordagem aprovada: gerar arquivo PDF diretamente do carrinho, com cliente,
  data, fotos, códigos, quantidades, preços, subtotais, total e observações opcionais
- Usar logo Cirandinha e vendedor fixo Antônio Marcos Daúde
- Após gerar, modal oferece Compartilhar PDF pelo sistema e Baixar PDF como alternativa
- Sem histórico ou armazenamento do PDF no servidor nesta etapa
- Design e plano escritos em docs/superpowers/{specs,plans}/2026-10-24-pedido-pdf*,
  aprovados pelo usuário para execução direta em 24/10/2026
- Acesso ao painel pelo catálogo e paginação administrativa continuam solicitados,
  em planejamento separado, sem alterar o carregamento completo do catálogo offline
- Domínio pretendido cirandinha.daude.dev, hospedagem Cloudflare gratuita ainda
  apenas proposta, sem autorização de publicação/configuração nesta etapa
- Usuário relata CRUD, políticas e migration 003 funcionando no remoto; confirmação
  relatada pelo usuário não substitui auditoria independente de API
- Security Advisor remoto reportou 2 avisos da função public.rls_auto_enable() e
  proteção contra senha vazada desativada; revisão da função ainda pendente
- Plano gratuito sem backup gerenciado, rotina própria de banco e fotos pendente

## Pedido PDF implementado localmente — 24/10/2026

- Carrinho → Gerar pedido em PDF → nome do cliente/observações → arquivo pronto
- Compartilhar PDF usa menu nativo quando suportado, Baixar PDF é alternativa
- Preservar o carrinho ao gerar/baixar/compartilhar; sem histórico ou upload de PDFs
- Cliente, observações e arquivo em memória, sem persistir dados do cliente
- Alterações relevantes no carrinho invalidam geração/resultado, exigindo nova geração
- PDF local com logo, vendedor Antônio Marcos Daúde, fotos, códigos e totais;
  fonte estática Noto Sans e gerador precacheados para uso offline após preparação
- Evidências e roteiro de aparelhos reais em docs/validation/pedido-pdf.md
- Compartilhamento WhatsApp e desempenho no tablet real ainda pendentes

## Refinamentos do pedido aprovados e implementados — 24/10/2026

- Substitui a decisão de descartar PDF/dados ao fechar o fluxo: manter nome,
  observações, PDF e prévia na memória do carrinho até recarregar ou limpar seleção
- Alterações de seleção/fotos invalidam PDF/prévia, preservando dados para regenerar
- Prévia real de primeira página por PDF.js local, recortada em altura, nome abaixo
  e total ao lado; worker e fonte Noto Sans Bold incluídos no precache offline
- Gerar/baixar usam vermelho #EB1000 com texto branco e ícone de documento PDF
- Compartilhar direto depende do navegador, botão visível desabilitado quando
  indisponível, com download e alternativa WhatsApp em texto
- Link WhatsApp solicitado para 556296146244, exatamente informado, sem acrescentar9
- Animação +1 e contador real no carrossel e detalhes, respeitando reduced motion
- Nenhuma mensagem enviada pelo agente, abrir texto no app requer confirmação humana
- Evidências e limitações em docs/validation/pedido-refinamentos.md

## Ajustes rápidos aprovados — 26/10/2026

- Confirmações de catálogo salvo/atualizado somem após 5 segundos, mantendo Atualizar
- Erros, progresso e avisos de consulta offline não somem automaticamente
- Botão do modal mostra apenas ícone de carrinho e Adicionar, contador superior direito
- Pedido mais recente substitui a restrição de adição somente no modal: grade também
  tem botão compacto carrinho/+ com contador e feedback +1, sem abrir detalhes ao adicionar
- Restante do card mantém abertura de detalhes, inclusive por teclado, limite999 preservado

## Acesso ao painel e paginação aprovados — 27/10/2026

- Link Acessar painel no header público, reutilizando autenticação e rota /admin
- Produtos administrativos em páginas de 20 no Supabase, filtros globais por nome/
  código, categoria e Mostrar (Todos por padrão), busca sem distinção de acentos
- Filtros reiniciam na página 1, edição mantém página, cadastro volta à primeira
- Categorias consultam vínculos independentemente da página, incluindo ocultos
- Nova migration 202610270004_admin_pagination.sql, com RPCs SECURITY INVOKER,
  autorização explícita e grants mínimos, aplicada somente no ambiente local
- Aplicação remota pendente, instruções em docs/deployment/paginacao-painel.md
- Catálogo público e preparação offline continuam completos, sem paginação pública
- Design e plano de 27/10 aprovados para execução direta, sem publicação online

## Altura de fotos no tablet — 28/10/2026

- No modo folhear, larguras de tela de 651 a 1024 px limitam a altura das fotos
  a min(44dvh, 460px), incluindo iPad mini em retrato e paisagem
- Preservar proporção e foto inteira, ajustando a largura junto com a altura
- Manter etiqueta e setas alinhadas à foto, sem alterar dimensões da grade/modal

## Backup local implementado — 28/10/2026

- npm run backup:catalog, modo --check e backup:verify, execução manual no PC
- Credenciais administrativas exclusivamente em .env.backup, ignorado e sem VITE_
- Pasta backups/ datada e privada, ignorada e bloqueada no Vite; falhas permanecem
  .incomplete, sem apagar cópias anteriores e sem publicar qualquer artefato
- Dump com Auth, grants, sequência e extensões, fotos de product-photos e manifesto
  de hashes; inventário SQL não depende do limite de mil linhas da API
- Ensaio fictício local restaurou banco, autorização/RLS, RPC de busca e 93 fotos
- Primeira exportação real ainda depende da configuração local pelo usuário
- Guia em docs/deployment/backup-local.md, evidências em docs/validation/backup-local.md
- Sem criptografia ou segunda cópia automática nesta etapa; orientar proteção antes
  de copiar para destino externo. Não restaurar automaticamente projeto remoto

## Preparação dos produtos do WhatsApp — histórico da revisão inicial

- Usuário forneceu docs/produtos/conversa.txt e 67 fotos locais
- Extração em docs/produtos/produtos-revisao.json: 67 mensagens, 85 itens com preço,
  incluindo variações, com texto/linha original e vínculo de imagem preservados
- Tabela e pendências em docs/produtos/revisao-produtos.md, aprovação humana pendente
- Não importar ou enviar fotos antes da revisão dos nomes, preços, unidade de venda,
  possíveis duplicatas, fotos compartilhadas e definição de categorias
- JSON de preparação não implementa variações no app; cada linha é candidata a item
  separado, modelagem final ainda sujeita à revisão
- Importação futura deve fazer upload no Storage antes de save_product, preservar
  códigos gerados pelo banco e começar com piloto de 2 ou 3 itens após aprovação
- Nenhuma requisição de cadastro/upload foi executada nesta etapa

## Variantes e regra de caixas — decisões aprovadas

- Usuário aprovou correções de ortografia e unidades do JSON do WhatsApp
- AxB representa caixa com A conjuntos de B unidades, preço já é da caixa; se o
  texto diz und., multiplicar o unitário pelo conteúdo da caixa uma única vez
- Coadores caixa de 12: grande 3180, médio 3060 e pequeno 2940 centavos
- Substitui a restrição anterior: usuário quer variantes reais com preços próprios,
  agrupadas por produto, com reflexo no painel, catálogo, carrinho, offline e pedido
- Design/plano em docs/superpowers/{specs,plans}/2026-10-28-variantes*,
  aprovados pelo usuário para implementação, incluindo migration SQL para o usuário
- Piloto solicitado após testes: cinco produtos principais do JSON, com cenários
  de oferta, variantes e caixa; manifesto proposto em docs/produtos/piloto-variantes.json
- Proposta de segurança do piloto: cinco pais ocultos, oferta de 10% demonstrativa
  no canivete isolada da tabela comercial, aprovada junto ao plano
- Nenhuma importação, upload, migration remota ou publicação foi executada

## Variantes implementadas localmente — 28/10/2026

- Migration 005 com variantes, preços/fotos/ofertas próprios, caixas e RPCs V2
- Um card por produto, escolha obrigatória de opção e carrinho por item vendável
- Código Pxxx-Vnn monotônico, edição atômica com conflito de versões e RLS administrativa
- Preço de caixa já é o total, não multiplicar novamente pelo conteúdo
- Catálogo/carrinho V2 separados dos antigos, cópia preserva V1 e fotos, migração
  não sobrescreve snapshot V2 existente nem perde seleção por quota de armazenamento
- Backup V2 inclui variantes e suas fotos, verificador mantém compatibilidade V1
- Cinco produtos/oito escolhas importados e conferidos apenas no ambiente local,
  incluindo repetição idempotente e oferta fictícia sempre oculta
- Envio remoto depende do SQL 005 aplicado pelo usuário, backup V2 real conferido
  e .env.import privado, nunca solicitar senha no chat ou usar service_role no frontend
- Guias em docs/deployment/{variantes,importacao-produtos}.md, evidências em
  docs/validation/variantes.md, sem publicação automática ou importação do lote completo

## Piloto remoto enviado e conferido — 29/10/2026

- Usuário informou SQL 005 aplicado, configurou .env.import e gerou backup real V2
- Importador conferiu backup do mesmo projeto e autorização administrativa
- Cinco pais ocultos enviados: P004 Canivete inox automático, P005 Processador de
  alimentos, P006 Pano de prato, P007 Coador para café, P008 Funil flexível
- Oito itens vendáveis, cinco opções sob dois pais e seis fotos JPEG conferidas
- Leitura administrativa independente confirmou nomes, preços e estado oculto;
  snapshot público confirmou ausência dos cinco produtos, sem publicação de frontend
- Canivete mantém oferta fictícia de teste, não ativar como preço comercial sem revisão
- Preservar .catalog-import privado e manifesto piloto sem editar, hash garante retry
- Não importar os demais registros nem ativar os cinco sem solicitação posterior

## Ações administrativas em lote — desenho aprovado em 29/10/2026

- Seleção de produtos mantida entre páginas, checkbox por item e Selecionar página
- Mostrar/ocultar seleção em transação única, ocultação com confirmação e conflito
  impede o lote inteiro, sem substituir versões capturadas automaticamente
- Limpar seleção ao mudar filtros, abrir edição, trocar aba ou sair do painel
- Excluir definitivamente somente produto oculto, individualmente e com modal,
  removendo suas variantes e preservando fotos potencialmente compartilhadas
- Ledger conserva exclusão de importados para impedir recriação em retries
- Lista administrativa com rolagem interna, filtros/barra acima e paginação abaixo
- Design aprovado em docs/superpowers/specs/2026-10-29-acoes-produtos-design.md
- Plano em docs/superpowers/plans/2026-10-29-acoes-produtos.md aguarda revisão,
  execução direta preservada, migration 006 será entregue para aplicação pelo usuário
- Nenhum produto real deve ser excluído durante implementação/testes, sem publicação

## Ações administrativas implementadas localmente — 29/10/2026

- Seleção por checkbox entre páginas, barra de mostrar/ocultar e confirmação do lote
- Excluir individual de ocultos remove pai/variantes, preserva fotos e tombstone da
  importação, impedindo reimportação silenciosa e reutilização de código
- Migration 006 com lote invoker e exclusão via helper privado definer restrito,
  nenhuma concessão de DELETE genérico aos clientes
- Lista rolável com filtros/feedback acima e paginação abaixo, altura por viewport;
  em pouca altura alinha controles na tela, mantendo header acessível acima
- Revisão final identificou e corrigiu P2 de altura, teste exige bounds dentro do viewport
- Unitários173 e painel22 aprovados, cenário extra de carrinho após exclusão1,
  importador3, backup14 e restauração local de186 fotos com hashes iguais
- Guia docs/deployment/acoes-produtos.md e evidências docs/validation/acoes-produtos.md
- SQL006 ainda depende de aplicação pelo usuário no remoto, sem exclusão real ou publicação
- Usuário perguntou sobre WebP, formato das fotos permanece JPEG, adaptação ainda não autorizada

## Correção da rolagem administrativa — 29/10/2026

- Decisão mais recente substitui o cálculo de altura pela posição no viewport
- Listagem cresce somente até max-height fixo: 560 px, ou 420 px até largura600 px
- Rolagem externa não muda altura nem posição interna da lista, sem listeners de
  scroll/resize, ResizeObserver ou scrollIntoView automático nesse componente
- Manter overflow-y:auto e reset somente por página/filtro
- Ajuste posterior confirmado: overscroll-behavior-y:auto permite continuar a rolagem
  na página ao atingir as bordas da lista, sem alterar sua altura máxima
- Filtros e paginação continuam fora da região rolável, sem exigir que toda a seção
  caiba simultaneamente na altura do dispositivo

## Estados e exclusão em lote implementados localmente — 29/10/2026

- Substitui ação direta de Mostrar selecionados: Mostrar/Ocultar em lote abrem modal
- Modal separa os elegíveis dos já visíveis/ocultos, sem repetir mudança de estado
- Botões da barra permanecem habilitados com seleção, confirmação fica desabilitada
  quando não há elegíveis, com mensagem explícita no modal
- Nova decisão substitui exclusão apenas individual: Excluir selecionados opera só
  nos ocultos, lista visíveis como fora da operação e não os oculta automaticamente
- Exclusão elegível em transação única via migration007, nenhuma exclusão parcial em
  conflito/indisponibilidade, fotos/tombstones/códigos preservados como na006
- Nenhuma exclusão real ou SQL remoto durante implementação, aplicação007 pelo usuário

- Validação desta etapa: 180 unitários e 24 cenários de navegador aprovados, teste SQL
  de lote indivisível/3 perfis/importado aprovado, revisão independente sem achados
- SQL007 integral ensaiado em cópia prévia, guia atualizado em docs/deployment/acoes-produtos.md

## Ocultar e excluir visíveis com confirmação explícita — 29/10/2026

- Modal de exclusão em lote inclui opção Ocultar e excluir também os produtos visíveis,
  desmarcada por padrão, não persiste após cancelar/fechar e fica bloqueada durante envio
- Ao ativar, itens visíveis entram na lista de exclusão, com aviso por item e botão
  Ocultar e excluir N produtos, sem ocultação automática antes da confirmação
- Nova RPC remove_products_v2 na migration008 requer flag explícita e faz ocultação/
  exclusão numa transação, valida versões antes de alterar e usa versões pós-update
- Falha na transação de exclusão desfaz a ocultação e mantém versão/estado anteriores, fotos,
  códigos e tombstones seguem as regras existentes, RPC007 continua só para ocultos
- SQL008 somente no local, aplicação remota pelo usuário depois da007, sem publicação

- Validação desta opção: 182 unitários, 8 cenários de navegador, API local com rollback
  de falha após ocultar e revisão independente aprovados, SQL008 ensaiado em cópia

## Hierarquia visual das confirmações de produto — 29/10/2026

- Refinamento visual solicitado: grupos com título/contador separados, nomes em
  destaque e códigos menores em linha própria, explicações com contraste secundário
- Opção de incluir visíveis em painel próprio, exclusão irreversível em aviso separado
- Cabeçalho e ações permanecem visíveis, somente conteúdo do modal rola quando preciso
- Estilos restritos ao modal de ações de produtos, sem alteração de SQL ou regras

## WebP e categorias do lote real — 29/10/2026

- Escopo confirmado: converter fotos locais e próximos uploads, sem migrar fotos
  já existentes no Supabase
- Preparadas 67 fotos reais e 10 da demo, mantendo originais, saída WebP até
  1600 px e 500.000 bytes, painel também gera WebP e rejeita fallback PNG
- Substitui a saída JPEG anteriormente definida para novas fotos, JPEG legado
  continua aceito em produtos, variantes, offline e backup
- Migration 202610290009_webp_photos.sql aplicada somente no Supabase local,
  aplicação remota pelo usuário ainda pendente, instruções em docs/deployment/webp.md
- Usuário informou aplicação remota das migrations 007/008, sem auditoria independente
- Seis categorias propostas para os 85 registros: Casa e cozinha, Beleza e higiene,
  Costura e papelaria, Elétrica e iluminação, Ferramentas e acessórios, Lazer
- Dados separados em docs/produtos/produtos-preparados.json, revisão legível no
  Markdown correspondente, agrupamento final em produtos/variantes ainda pendente
- Não alterar manifesto/journal do piloto JPEG para preservar retries
- **Antes do lote completo, avisar e aguardar confirmação explícita do usuário
  de que terminou de limpar o banco**, não limpar nem importar automaticamente
- Não houve publicação nem alteração remota nesta preparação
- Handoff da conversa em handoff.md, ler antes de continuar em novo chat

## Contagem na seleção administrativa — 29/10/2026

- Contagem de produtos alinhada à direita na mesma linha de Selecionar página
- Ações em lote ficam abaixo dessa linha quando há seleção

## Estado vazio e notificações administrativas — 29/10/2026

- Mensagem da lista vazia com espaçamento próprio e texto centralizado
- Sucessos de ações de produtos/categorias em toast temporário de 5 segundos,
  com fechamento manual e pausa enquanto houver foco ou mouse sobre a notificação
- Erros continuam persistentes, sem expiração automática
- Usuário confirmou que limpou os produtos, incluindo os itens anteriores
- Importação completa ainda depende de agrupamento/manifesto, revisão e autorização
  de envio, limpeza confirmada não autoriza importação imediata

## Aviso de demonstração removido — 29/10/2026

- Remover o rodapé Catálogo de demonstração · Fotos ilustrativas · Preços fictícios
  em todos os ambientes, independente da fonte de produtos

## Importação completa autorizada — 29/10/2026

- Usuário autorizou envio dos produtos e categorias após confirmar limpeza
- Confirmou todos visíveis e quatro casos comerciais: escovas como Modelo 1/2,
  GD somente na lanterna de 5 W, pino de quatro saídas unitário R$ 4,10, tesoura
  com ponta curva e reta mantida como uma opção de R$ 4,90
- Manifesto novo lote-completo-20261029.json: 48 pais, 85 itens, 67 fotos WebP,
  seis categorias, preços comerciais sem a oferta fictícia do canivete
- Journal/chaves do lote separados do piloto, preservar ambos nas retomadas

## Importação completa enviada — retomada em 30/10/2026

- Execução de 29/10 concluiu mesmo após interrupção do chat por limite de uso
- 48 produtos principais P009–P056, com 24 simples e 24 com variantes, 61 variantes
  e 85 itens vendáveis no total, todos visíveis, seis categorias criadas
- 67 fotos WebP conferidas publicamente por MIME e SHA-256, nove fotos anteriores
  preservadas, sem limpeza do Storage e sem reutilizar códigos do piloto excluído
- Conferência independente de produtos, preços, caixas, opções e visibilidade pública
  registrada no verification.json privado do journal do lote
- Backup real antes do envio em backups/2026-10-29T20-49-34.193Z-bf4acc5a
- Sem nova migration, sem push ou publicação de frontend, preservar manifesto/journal

## Domínio de produção escolhido — 30/10/2026

- Usuário escolheu catalogo.daude.dev para publicação no Cloudflare
- Substitui a proposta anterior cirandinha.daude.dev, configuração/publicação ainda
  pendentes, não executar push, criar hospedagem ou alterar DNS sem solicitação

## Integração Cloudflare com GitHub — 30/10/2026

- Usuário prefere vincular hospedagem ao repositório GitHub em vez de Direct Upload
- Publicação automática por push ainda não foi autorizada, manter controle explícito
- Antes da primeira publicação via Git, concluir commits e push das mudanças locais
  mediante solicitação, configurar fonte Supabase e variáveis públicas no build

## Publicação automática pela main autorizada — 30/10/2026

- Usuário autorizou commitar pendências e enviar a main ao GitHub nesta etapa
- Escolheu atualização automática do Cloudflare Pages a cada push na main
- Esta decisão substitui a preferência anterior de publicação somente manual
- Configurar main como branch de produção e manter automatic deployments ativo
- A integração, variáveis de build e domínio ainda serão configurados no Cloudflare

## Instalação no Cloudflare corrigida — 30/10/2026

- npm é o gerenciador do projeto, com package-lock.json como único lockfile
- pnpm-lock.yaml legado estava desatualizado e causou ERR_PNPM_OUTDATED_LOCKFILE
  no primeiro deploy, removido e ignorado para não alterar detecção do Cloudflare
- Não usar --no-frozen-lockfile para contornar divergências, manter instalação
  reproduzível com npm ci e build npm run build

## Foto completa nos detalhes — 30/10/2026

- Ações do modal usam grade, Fechar com mínimo de 96 px de largura e 48 px de altura
  no celular, sem ser comprimido pelo contêiner do botão Adicionar
- Foto nos detalhes tem botão Ampliar foto, abre visualização ocupando o viewport
  com object-fit:contain, fechamento por botão ou Escape e retorno de foco à foto
- Ampliação reutiliza a imagem da opção selecionada e URLs da sessão, sem novo
  armazenamento ou dependência, ausência de foto mantém indicação sem botão vazio
- Limite de altura em produtos com variantes é aplicado à imagem, evitando recorte
  causado por limitar só o contêiner, mantendo proporção e foto inteira

## Ampliação com overlay e zoom — 30/10/2026

- Substitui o fundo branco da ampliação: overlay preto com opacidade 78% e blur 8 px
- Tocar fora da foto fecha apenas a ampliação, toque na foto não fecha, Escape e
  retorno de foco preservados, botão Fechar removido somente da ampliação
- Título centralizado logo acima da imagem, com margem de 12 px
- Zoom de 100% a 400% por pinça ou botões, arrasto limitado à imagem ampliada e
  botão percentual para restaurar 100%, sem dependências adicionais
- Imagem completa e controles permanecem dentro do viewport, URLs/Blob existentes
  reutilizados, fechamento dos detalhes continua confortável e visível

## Skeletons de carregamento — 30/10/2026

- Skeletons na carga inicial do catálogo em grade/folhear, abertura/autorização do
  painel, listas administrativas, fotos, processamento inicial de foto e prévia PDF
- Não mostrar vazio/zero produtos enquanto a consulta inicial estiver pendente
- Trocar abas com dados prontos não cria espera artificial, dados públicos salvos
  e listas da mesma consulta permanecem visíveis durante atualização
- Falha ao atualizar a mesma consulta administrativa preserva a última lista junto
  ao erro/retry, nunca mostrar lista de um filtro anterior como resultado novo
- Skeletons discretos, sem controles falsamente interativos, respeitam reduced motion
- LoadingImage preserva classes/dimensões, callbacks e URLs, incluindo Blob/cache,
  e encerra skeleton ao carregar ou falhar, sem criar novas requisições
- Salvar/excluir/sincronizar mantêm textos/progresso explícitos, sem esconder formulários

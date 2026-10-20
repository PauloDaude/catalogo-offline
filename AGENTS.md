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
  Na listagem, adicionar ao carrinho somente no modal de detalhes; sem botão na
  listagem. Nos cards, selo de oferta sobre a foto no canto superior esquerdo;
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

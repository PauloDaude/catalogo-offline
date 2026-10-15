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
  integração Supabase e painel administrativo ainda não existem.
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
- Pesquisa, categorias, fotos grandes e preços destacados.
- Carrinho simples solicitado em 15/10/2026: agrupar produtos selecionados pelo
  cliente, ajustar quantidades e somar o valor total, sem pagamento.
  Desenho aprovado: adicionar/remover, quantidades, subtotais e total, limpeza com
  confirmação, persistência local e uso offline. Mudanças de preço/disponibilidade
  exigem revisão explícita antes de atualizar a seleção e o total.
  Botão do carrinho fixo no canto inferior direito em celular, tablet e desktop,
  permanecendo visível durante a rolagem.
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

## Aparência e UX

- **Tema claro (light), com azul como cor primária.**
- Definir o tom de azul usando tokens de tema e verificar contraste nos estados
  normal, foco, pressionado e desabilitado. O tom exato ainda não foi escolhido.
- Não acrescentar tema escuro ou seletor de temas ao MVP sem necessidade acordada.
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
- Categorias fixas, login por email/senha e detalhes de exportação/restauração estão
  descritos na especificação; conferir sua aprovação antes de tratá-los como definitivos.
- Não publicar, criar recursos externos ou presumir contas/configurações existentes
  apenas porque estão citados nos documentos de planejamento.

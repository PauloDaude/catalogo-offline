# Painel administrativo e Supabase

Data: 20/10/2026.
Status: aprovada pelo usuário em 20/10/2026; implementação pendente.
Continua a arquitetura do MVP de 14/10, substituindo sua proposta de categorias
fixas. Stack e regras de segurança do AGENTS.md permanecem obrigatórias.

## Identidade visual aprovada

Tema claro; primária roxa #371383, conforme a logo Cirandinha. Preços, botões,
abas, foco e destaques seguem o token primário. Verde #04a650 com texto branco
permanece exclusivo do selo de percentual de desconto.

## Objetivo

O vendedor deve conseguir cadastrar produtos, trocar fotos, alterar nome/preço e
ofertas e organizar categorias no celular ou tablet sem depender de ajuda técnica.
Visitantes continuam acessando o catálogo público, com seleção de carrinho e
consulta offline após preparação. Gerenciamento exige internet e login autorizado.

## Situação atual e limites de acesso

- Protótipo público e offline implementado; painel e backend ainda inexistentes.
- Logo Cirandinha já aplicada no header.
- Projeto Supabase criado pelo usuário; URL/chave publishable estão em .env.local,
  ignorado pelo Git. Exemplo versionado usa placeholders.
- Consulta pública ao Auth confirmou login por email, cadastro público desativado
  e login anônimo desativado. Essa consulta não verifica RLS nem privilégios do banco.
- Não há conexão administrativa Supabase disponível nesta sessão. A chave
  publishable não permite executar migrations ou autorizar administradores.
- Prepararemos migrations e instruções reproduzíveis. O usuário aplicará o SQL
  pelo Dashboard, ou usaremos conexão administrativa autorizada quando disponível.
  Não solicitar senha, chave secret/service_role ou token administrativo no chat.

## Fluxo aprovado

### Entrada e acesso

- Área `/admin`, com logo e formulário de email/senha. Sem cadastro público.
- Login válido não basta: verificar autorização administrativa no backend.
- Conta sem autorização recebe mensagem clara e nenhuma consulta de produtos ocultos.
- Recuperação de senha por email; URLs de retorno restritas aos endereços definidos.
- Botão Sair encerra a sessão e limpa dados administrativos mantidos na interface.
- Navegação pública continua disponível; autenticação administrativa não é requisito
  para consultar o catálogo ou usar seu carrinho.

### Produtos

- Lista com foto pequena, nome, código, preço, categoria e botão Editar.
- Pesquisa e filtros de categoria e visibilidade; ocultos claramente identificados.
- Botão Adicionar produto destacado, com formulário curto:
  - foto pela galeria ou câmera quando suportada;
  - nome;
  - categoria selecionável;
  - preço atual em reais, aceitando vírgula;
  - opção Produto em oferta, exibindo o campo Preço anterior quando ativada.
- Desconto percentual calculado automaticamente pelos dois preços, com a mesma
  regra já usada no catálogo. Não manter preço e percentual independentes.
- Código curto atribuído pelo banco no cadastro, sem possibilidade de editar ou
  reaproveitar; preservado ao alterar foto, categoria, nome ou preço.
- Salvar produto com indicação de envio e confirmação. Falhas preservam campos
  enquanto o formulário estiver aberto. Avisar antes de sair com alterações.
- Ocultar e Mostrar novamente são reversíveis; não oferecer exclusão definitiva.
- Nova foto é reduzida e convertida para JPEG antes do upload. Validar tamanho,
  formato e decodificação; permitir escolher novamente se inválida.
- Se houver edição concorrente, avisar antes de sobrescrever uma versão mais nova.

### Categorias

- Tela simples com lista e ações Criar, Renomear e Arquivar/Reativar.
- Nome obrigatório e único sem diferenças apenas de caixa ou espaços externos.
- Não permitir arquivar categoria com produtos ativos; mostrar esses produtos para
  o vendedor poder movê-los ou ocultá-los. Produtos ocultos preservam a referência.
- Ao reexibir produto de categoria arquivada, exigir uma categoria ativa ou sua
  reativação. Não apagar associações silenciosamente.
- Categorias iniciais: Cozinha, Pesca, Iluminação, Ferramentas e Outros.
- Alterações de categoria afetam filtros e informações públicas após sincronização.

### Estados e usabilidade

- Controles principais com pelo menos 48 px, rótulos explícitos e React Aria.
- Desabilitar envio sem rede e explicar que alterações exigem internet.
- Distinguir Salvo no servidor de Atualizado neste aparelho: o catálogo offline
  anterior continua válido até a preparação da nova revisão terminar.
- Mensagens de erro específicas sem expor detalhes internos, tokens ou senhas.

## Banco e autorização

### Tabelas

- `categories`: UUID, nome, ativo e datas; unicidade e limites de nome no banco.
- `products`: UUID, código público único, nome, categoria por FK, preço atual em
  centavos, preço anterior opcional, caminho da foto, ativo, datas e versão de edição.
- `catalog_state`: revisão pública crescente e data da última alteração.
- `catalog_admins`: vínculo de usuário Auth explicitamente autorizado.

Não derivar código da posição ou contagem de linhas. Atribuir por sequência em
transação; aceitar lacunas, impedir duplicação e reutilização. Manter formatos de
exibição curtos, com prefixo P e no mínimo três algarismos.

Preços inteiros não negativos, nome/categoria/foto obrigatórios, preço anterior
maior que o atual quando informado. Limites compatíveis com cálculos seguros do
frontend. Validação de formulário complementa as constraints, sem substituí-las.

### Políticas

- RLS em todas as tabelas expostas e grants mínimos explícitos nas migrations.
- Visitante lê somente produtos ativos em categorias ativas e metadados públicos.
- Usuário autenticado sem autorização conserva apenas acesso público necessário.
- Administrador autorizado pode ler ocultos e executar as operações de gestão.
- Nenhum usuário pode incluir seu próprio vínculo administrativo ou se promover.
- Helpers de autorização, se exigirem SECURITY DEFINER, ficam em schema não
  exposto, com search_path fixo, objetos qualificados e permissões restritas.
- RPC pública de snapshot usa SECURITY INVOKER e respeita RLS; permissões EXECUTE
  explícitas. Grants/políticas/funções e schema versionados juntos.
- Revisão atualizada na mesma transação das mudanças relevantes, inclusive renomear
  categoria e ocultar produto. Snapshot retorna revisão e produtos consistentemente.

## Fotos e publicação dos dados

- Bucket de fotos comerciais público, limitado a JPEG e tamanho definido na
  implementação. Sem HTML/SVG ou arquivos arbitrários.
- Upload apenas para administradores autorizados, com caminhos validados.
- Cada foto recebe caminho novo; não sobrescrever bytes da foto já publicada.
  Upload precede gravação do produto; falha não deve publicar registro incompleto.
- Limpeza de upload órfão é limitada ao caminho recém-enviado. Fotos antigas não
  são apagadas automaticamente nesta etapa, preservando snapshots em uso.
- Ocultar produto não torna privada uma foto antes pública nem revoga cópias offline.
- Nenhuma resposta administrativa entra no cache público ou no snapshot offline.

## Catálogo público e compatibilidade offline

- Preservar React/Vite, apresentação, carrinho, preços e mecanismos de preparação.
- Fonte Supabase implementa o contrato de snapshot/revisão/fotos existente.
- Categorias deixam de ser uma união fixa de nomes no frontend. Snapshot público
  inclui os nomes necessários aos filtros; categorias vazias não precisam aparecer.
- Atualizar validação e compatibilidade dos snapshots antigos sem perder uma cópia
  utilizável antes da preparação remota terminar.
- Manter um modo explícito de demonstração. Configurar URL/chave não deve trocar
  silenciosamente o catálogo por um backend sem schema ou produtos.
- Dados fictícios não serão publicados como produtos reais automaticamente.

## Aplicação no Supabase

1. Versionar schema, Storage, grants, políticas e funções como migrations.
2. Verificar localmente, incluindo testes de permissão, antes de orientar aplicação.
3. Aplicar no projeto criado, por SQL Editor ou conexão administrativa autorizada.
4. Criar a conta do vendedor por processo controlado no Auth e autorizar seu UUID.
   Não guardar sua senha no repositório ou solicitar que seja enviada no chat.
5. Configurar redirects e verificar leitura/escrita no projeto real.
6. Habilitar a fonte remota somente após verificar a integração e criar os produtos.

## Verificação necessária

- Testes de preços, campos, conversão de foto, categorias, edição concorrente,
  geração de códigos e manutenção da revisão/snapshot.
- API direta como visitante, autenticado sem autorização e administrador: caminhos
  permitidos e negados de tabelas, RPCs e Storage; tentativa de autopromoção.
- Ausência de leitura pública de ocultos e dados de conta; uploads indevidos negados.
- Login, recuperação, logout, CRUD reversível e categorias em celular/tablet.
- Foto/nome/preço/categoria atualizados no público e disponíveis offline após
  preparação; falha de rede/download preserva snapshot anterior.
- Security Advisor, grants/funções/views, segredos no build e cache administrativo.
- Exportação e restauração verificadas antes de usar dados reais.
- Distinguir testes locais, validação no Supabase remoto e avaliação no Android real.

## Fora desta etapa

Variações, pagamentos, pedidos, estoque, gestão de múltiplos vendedores,
criação/edição offline, exclusão definitiva e backup em bucket público.
Nenhuma publicação no Sites sem pedido explícito.

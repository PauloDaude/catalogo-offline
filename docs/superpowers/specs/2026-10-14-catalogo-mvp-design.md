# Catálogo digital — proposta de arquitetura do MVP

Status: etapa 1 implementada por execução direta autorizada e verificada em
navegador. Validação com o vendedor e nos aparelhos Android reais permanece
pendente. Etapas 2 e 3 ainda não foram implementadas.
Data: 14/10/2026.

## 1. Objetivo e decisões confirmadas

Criar um catálogo para um vendedor itinerante apresentar 50–100 produtos,
principalmente em um tablet Samsung com Android. Também deve funcionar bem
no celular, inclusive para cadastrar produtos e alterar preços.

O vendedor tem pouca familiaridade com gerenciamento de produtos. O sucesso
depende de encontrar produtos facilmente, ler fotos e preços e conseguir
atualizar o catálogo sem assistência técnica.

Decisões confirmadas na conversa:

- Catálogo público por link, sem login e sem obrigação de instalar o aplicativo.
- Painel administrativo protegido por login; edição exige internet.
- Uma foto e um preço por produto. Variações ficam fora do MVP.
- Consulta offline, incluindo fotos, após preparação em cada dispositivo.
- React + TypeScript + Vite; Supabase; Dexie/IndexedDB; Workbox.
- shadcn/ui com React Aria Components e Tailwind CSS. Sem Radix UI.
- Tema claro (light), com azul como cor primária; tom exato a definir com contraste adequado.
- Segurança do Supabase como requisito explícito, com permissões mínimas e testes de acesso.
- Primeiro validar apresentação e offline com dez produtos fictícios;
  depois integrar o painel e o backend.
- Sem carrinho, pagamentos, pedidos ou controle de estoque.

As decisões abaixo são propostas para revisão, não requisitos já aprovados.

## 2. Alternativas e recomendação

| Abordagem | Benefício | Custo ou limitação |
| --- | --- | --- |
| PWA com Supabase e fotos em IndexedDB | Mesmo link no celular e tablet; dados e fotos podem ser ativados em uma transação local | Precisa testar armazenamento e sincronização no Android real |
| PWA com dados em IndexedDB e fotos em Cache Storage | Cache de imagens acessível pelo Service Worker | Ativação envolve dois armazenamentos; recuperação fica mais complexa |
| Aplicativo Android nativo ou com empacotamento | Mais integração com o dispositivo | Acrescenta distribuição e manutenção; ainda requer uma experiência web para clientes |

Recomendação: primeira abordagem. Workbox guarda o aplicativo; Dexie guarda
as versões do catálogo e os arquivos das fotos. Não usar cache automático de
URLs como garantia de que o catálogo inteiro está pronto para uso offline.

## 3. Experiência e telas

### Catálogo público

- Tela inicial com nome do catálogo, pesquisa e categorias.
- Grade com foto, nome e preço em reais; quantidade de colunas definida pela
  largura disponível, sem reduzir os cartões a ponto de prejudicar leitura.
- Foto ampliada ao tocar no produto, com nome, preço e ação clara para fechar.
- Estados explícitos para carregamento, nenhum produto e nenhuma correspondência.
- Link discreto para entrar no gerenciamento.
- Ação “Salvar catálogo para usar sem internet”, com progresso e resultado.
- Dispositivo já preparado abre imediatamente a versão local e verifica
  atualizações quando tem conexão.

O cliente que visita pela primeira vez consulta o catálogo pela rede e carrega
as fotos conforme navega. Não precisa baixar todas as imagens para ver um produto.
Só prometer disponibilidade completa offline depois da preparação terminar.

### Gerenciamento

- Lista com miniatura, nome, preço e botão “Editar”, adaptada ao celular.
- Botão destacado “Adicionar produto”. Produtos ocultos em seção ou filtro próprio.
- Formulário: foto, nome, preço e categoria. Campos obrigatórios identificados.
- Foto pela galeria; câmera quando suportada pelo dispositivo/navegador.
- Teclado adequado ao preço, aceitando entrada brasileira e exibindo R$.
- Botão “Salvar produto”, bloqueado durante envio, e confirmação persistente
  na tela após sucesso; erros próximos ao campo correspondente.
- Ação “Ocultar do catálogo” reversível; sem exclusão definitiva na interface do MVP.
- Categorias iniciais: Cozinha, Pesca, Iluminação, Ferramentas e Outros.
  Gestão livre de categorias fica para depois; validar esses nomes com o vendedor.
- Sem internet, permitir consultar o catálogo e explicar que alterações exigem conexão.
- Falha de envio mantém o formulário preenchido enquanto a tela permanece aberta.
  Recuperação de rascunho após fechar o aplicativo fica fora do MVP.

### Regras de usabilidade

Controles principais com área de toque de pelo menos 48 × 48 CSS px, contraste
legível e rótulos de texto. Nenhuma ação essencial depende de hover, ícone
sozinho ou gesto oculto. Usar React Aria para comportamento acessível e testar
foco, teclado, toque e mensagens. A biblioteca não substitui a validação da UX.

## 4. Responsabilidades técnicas

| Parte | Responsabilidade |
| --- | --- |
| React + TypeScript | Telas e estados de catálogo, formulário e sincronização |
| Vite | Desenvolvimento e build estático |
| shadcn/ui + React Aria + Tailwind | Componentes e apresentação responsiva |
| Supabase Auth | Sessão do administrador |
| Supabase Postgres | Fonte oficial dos produtos e revisão do catálogo |
| Supabase Storage | Fotos otimizadas com caminhos imutáveis |
| Dexie + IndexedDB | Catálogo local, fotos como Blob e estado de sincronização |
| Workbox + Service Worker | Arquivos essenciais para abrir a aplicação offline |

Manter módulos distintos para catálogo, gerenciamento, acesso remoto,
persistência local e sincronização. O protótipo usa uma fonte fictícia através
da mesma interface de leitura que depois será implementada com Supabase.

Não acrescentar servidor próprio, mecanismo realtime ou biblioteca de estado
global antes de demonstrar necessidade. Hospedagem estática em HTTPS; provedor
e limites comerciais serão escolhidos antes da integração online.

## 5. Dados e acesso

### Modelo remoto proposto

- `products`: id UUID, nome, preço em centavos inteiros, categoria, caminho da
  foto, ativo, data de criação e data de atualização.
- `catalog_state`: uma linha com revisão crescente e data da última alteração.
- `catalog_admins`: usuários autorizados, provisionados fora da interface pública.

Preço deve ser não negativo. Nome, categoria e foto obrigatórios. Alterações
nos produtos atualizam a revisão na mesma transação do banco, inclusive ao ocultar.
Uma função de leitura devolve a revisão e todos os produtos ativos em um único
snapshot consistente. O protótipo simula esse contrato.

### Segurança

Visitantes leem apenas os produtos ativos e a revisão pública. Só usuários
explicitamente autorizados podem cadastrar, editar ou ocultar produtos e enviar
fotos. Estar autenticado, sozinho, não confere permissão administrativa.

Aplicar grants mínimos e políticas RLS no banco e no Storage. A função de leitura
deve respeitar as mesmas permissões; não introduzir um bypass com security definer.
Chave pública do Supabase no frontend; nenhuma chave secreta ou service role.
Cadastro público de administradores desabilitado. Login proposto por email e senha,
com recuperação de senha por email.

Bucket público para fotos comerciais, com escrita restrita ao administrador.
Ocultar um produto retira sua exposição nas consultas atuais, mas não torna uma
foto previamente pública privada nem remove imediatamente cópias offline antigas.

As regras permanentes estão em `AGENTS.md`, na raiz do projeto. Implementar RLS,
grants e constraints em migrations reproduzíveis; proteger a lista de administradores
contra autopromoção; revisar permissões de execução de RPCs e comportamento de views.
Funções privilegiadas exigem revisão específica de autorização e `search_path`.

Configurar Auth com cadastro público desabilitado, redirects restritos e limites
adequados. Proteger a conta de gestão do Supabase com MFA. Avaliar MFA no aplicativo
considerando a experiência do vendedor e recuperação. Restringir MIME, tamanho e
escrita no Storage. Não cachear dados administrativos ou backups no Service Worker.

Antes de entregar o backend, testar permissões diretamente pela API nos três
contextos (visitante, autenticado sem autorização e administrador), revisar Security
Advisor e build para exposição de segredos. Testes devem cobrir ações negadas e
permitidas, inclusive RPCs e Storage; RLS habilitada sozinha não demonstra segurança.

## 6. Fotos

Proposta inicial: redimensionar antes do upload, com lado maior de até 1.200 px,
saída JPEG e limite de 500 KB para o arquivo otimizado. Validar legibilidade
no tablet; qualidade pode ser ajustada conforme os produtos reais.

Cada troca gera um caminho novo. Enviar a nova foto antes de atualizar o registro
do produto; uma falha mantém o produto apontando para a foto anterior.
Arquivos sem referência podem ser removidos em manutenção controlada, evitando
exclusão imediata durante a troca. Importações inválidas devem ter erro claro.

Com 100 fotos no limite proposto, uma cópia usa até cerca de 50 MB em imagens.
Durante uma troca completa pode haver aproximadamente duas cópias, além dos
arquivos do aplicativo. São estimativas de projeto, não garantias de capacidade.

## 7. Sincronização offline

### Preparação inicial

1. Usuário pede para salvar o catálogo offline.
2. Confirmar disponibilidade do Service Worker e dos arquivos essenciais.
3. Buscar snapshot com revisão e todos os produtos ativos.
4. Baixar e validar as fotos com concorrência limitada.
5. Guardar fotos em armazenamento de preparação, sem alterar o catálogo ativo.
6. Verificar se a revisão remota continua igual. Se mudou, refazer a leitura;
   limitar tentativas e manter estado anterior em caso de mudanças contínuas.
7. Em uma transação IndexedDB, ativar os dados novos e as referências das fotos,
   registrar revisão e horário da conferência bem-sucedida.
8. Mostrar “Catálogo salvo para usar sem internet”.

A aba precisa permanecer aberta durante o download. Não prometer execução
contínua em segundo plano no Android. Falha, fechamento da aba ou falta de espaço
não ativa um catálogo incompleto. Sem cópia anterior, mostrar ação para tentar
novamente quando houver internet; sem rede na primeira visita, orientar a preparação.

### Atualizações

- Para dispositivos preparados, verificar ao abrir, voltar ao aplicativo,
  recuperar conexão e tocar em “Atualizar catálogo”.
- Evitar chamadas repetidas com intervalo mínimo e uma sincronização por vez.
- Se a revisão for igual, registrar apenas a última conferência bem-sucedida.
- Se mudou, obter todos os metadados; baixar só fotos com caminhos ainda ausentes.
- Ativar o snapshot inteiro somente quando estiver completo e consistente.
- Produtos ocultos deixam de aparecer após essa ativação.
- Limpar fotos sem referência depois do sucesso, protegendo downloads em andamento.
- Sincronização entre abas usa trava compartilhada; uma geração em preparação
  pertence a uma operação identificada, para não haver limpeza de arquivos de outra.
- Nenhum formulário administrativo é recarregado durante uma sincronização.

### Mensagens

- “Catálogo atualizado — conferido hoje às 10h”.
- “Sem internet — catálogo salvo em [data e hora]. Os preços podem ter mudado”.
- “Não foi possível atualizar. Você pode continuar usando o catálogo salvo”.
- “Não há espaço suficiente para atualizar o catálogo”.

Guardar separadamente data de mudança remota, última ativação local e última
conferência bem-sucedida. Sem conexão não é possível afirmar se o servidor mudou.
Indicar falta de conferência sem alegar conhecimento de uma atualização remota.

### Armazenamento e atualizações do aplicativo

Consultar estimativa de espaço e solicitar persistência quando disponível.
O navegador pode negar persistência; limpar dados do site remove a cópia local.
O backend permite baixar novamente. Offline só é garantido enquanto os dados
locais e os arquivos do aplicativo permanecerem disponíveis.

Atualizações do aplicativo devem oferecer “Nova versão disponível” e permitir
reabrir em momento seguro. Não forçar reload durante edição ou download.
Migrações de IndexedDB devem preservar um catálogo utilizável ou explicar a
necessidade de prepará-lo novamente.

## 8. Backup e recuperação

Dados online são a fonte oficial, mas isso não equivale a backup independente.
Antes de usar produtos reais, incluir exportação administrativa autenticada:
arquivo ZIP com JSON versionado e as fotos referenciadas, incluindo produtos ocultos.

A primeira versão pode restaurar esse arquivo por procedimento técnico documentado,
sem uma tela de importação. Validar restauração em ambiente separado antes da entrega.
Ao trocar de celular ou tablet, acessar o mesmo catálogo e prepará-lo novamente.

## 9. Etapas e critérios de aceite

### Etapa 1 — protótipo de apresentação e offline

Dez produtos fictícios e fotos locais servidas pela aplicação, componentes React
Aria, pesquisa, categorias, ampliação, persistência e sincronização simulada.
Serve para validar os módulos que depois serão conectados ao backend.

- Conferir celular e tablet em retrato e paisagem, incluindo tela de 360 CSS px.
- Abrir a build de produção, preparar o catálogo, ativar modo avião, fechar e
  reabrir; todas as fotos, preços, pesquisa e categorias devem funcionar.
- Simular mudança de preço, foto e ocultação; comprovar ativação completa.
- Interromper download; catálogo antigo permanece íntegro.
- Simular falta de espaço e abertura sem preparação anterior.
- Pai encontra três produtos e usa pesquisa e categorias sem orientação contínua.

### Etapa 2 — backend e gerenciamento

Criar banco, políticas, armazenamento e conta administrativa; integrar cadastro,
edição, ocultação e sincronização real. Validar com poucos produtos antes de importar
o catálogo completo.

- Alteração no celular aparece no tablet após sincronizar.
- Visitante não lê produtos ocultos nem consegue modificar dados ou enviar fotos.
- Usuário autenticado sem autorização também não consegue administrar.
- Upload ou salvamento com falha não produz produto com foto quebrada.
- Pai cadastra um produto, muda um preço e oculta um item com pouca ou nenhuma ajuda.
- Exportação e restauração verificadas.

### Etapa 3 — entrega piloto

Escolher hospedagem e verificar limites vigentes, configurar HTTPS e rotas,
testar o link compartilhado e instalação nos aparelhos reais. Documentar como
atualizar, verificar preparo offline, recuperar conta e exportar backup.

Testes automatizados focam transações e falhas de sincronização, permissões e
fluxos críticos. Testes de responsividade e modo avião no hardware real continuam
obrigatórios; emulação de navegador não os substitui.

## 10. Próxima revisão

O usuário autorizou e acompanhou o planejamento e a execução direta da etapa 1.
O próximo passo é validar o protótipo nos aparelhos reais e com o vendedor.
Detalhes do gerenciamento (categorias fixas, email e senha, exportação com
restauração inicialmente técnica) serão confirmados no planejamento da etapa 2.

O modelo exato dos aparelhos e navegador devem ser registrados antes da validação
real. Não bloqueiam a revisão de arquitetura. Marca e nome podem ser definidos
na etapa visual, com conteúdo provisório no protótipo. Tema claro e azul como
cor primária já estão definidos; o tom exato será validado visualmente.

Repositório: `https://github.com/PauloDaude/catalogo-offline.git`. O usuário autorizou
vincular a pasta e realizar commits na `main` por enquanto.

## 11. Referências oficiais consultadas

- [shadcn/ui — React Aria como base](https://ui.shadcn.com/docs/changelog/2026-07-react-aria)
- [React Aria — primeiros passos](https://react-aria.adobe.com/getting-started)
- [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — segurança no frontend](https://supabase.com/docs/guides/database/secure-data)
- [Supabase — permissões de Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase — funções de banco](https://supabase.com/docs/guides/database/functions)
- [Supabase — checklist de produção](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Dexie — API e armazenamento de Blob](https://dexie.org/docs/API-Reference)
- [Dexie — transações](https://dexie.org/docs/Transaction/Transaction.html)
- [Workbox — precache](https://developer.chrome.com/docs/workbox/precaching-with-workbox)
- [MDN — StorageManager](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager)

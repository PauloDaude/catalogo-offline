# Planejamento --- Catálogo digital offline para vendedor itinerante

## 1. Contexto do projeto

Quero desenvolver uma aplicação simples para meu pai, que trabalha como
vendedor itinerante de produtos variados em cidades pequenas do
Tocantins.

Ele vende mercadorias como: - Produtos de cozinha - Artigos de pesca -
Sombrinhas - Lanternas - Tesouras - Outros produtos diversos

Hoje, ele costuma pegar os produtos na caminhonete e mostrá-los
individualmente aos clientes. Isso toma tempo e acaba sujando os
produtos e o próprio vendedor. A ideia é permitir que ele apresente os
produtos pelo tablet, usando fotos e preços em um catálogo digital.

O objetivo não é criar uma loja virtual ou um sistema completo de
estoque. É uma vitrine digital simples, rápida e confortável de usar
durante visitas comerciais.

## 2. Requisitos e restrições já definidos

- **Quantidade inicial estimada:** 50--100 produtos.
- **Dispositivo principal:** tablet.
- **Usuário principal:** meu pai, que não deve precisar de
  conhecimentos técnicos para manter o catálogo.
- **Gestão de produtos:** pode exigir conexão com a internet.
- **Visualização do catálogo:** precisa funcionar mesmo quando não há
  sinal de internet.
- **Preferência:** solução própria e personalizável, gratuita ou de
  baixo custo.
- **Código:** preferência por GitHub/open source, mas a prioridade é
  ter uma solução simples e confiável.
- **Manutenção:** meu pai precisa conseguir, pelo tablet, cadastrar
  produtos, alterar preços e fotos sem editar código ou acessar o
  GitHub.

## 3. Fluxo de uso desejado

### Com internet

1.  Meu pai abre um painel administrativo no tablet.
2.  Cadastra um produto, incluindo nome, preço, categoria e foto.
3.  Pode editar informações, trocar o preço, ocultar produtos
    indisponíveis ou cadastrar novos itens.
4.  As mudanças são salvas em um backend online.
5.  O aplicativo sincroniza/baixa os dados e as imagens para o tablet.

### Sem internet

1.  Meu pai abre o catálogo instalado na tela inicial do tablet.
2.  Pesquisa por nome ou navega por categorias.
3.  Mostra fotos e preços aos clientes.
4.  Todos os produtos e imagens previamente sincronizados continuam
    disponíveis.
5.  O aplicativo deve continuar funcionando depois de ser fechado e
    reaberto, inclusive em modo avião.

### Quando a conexão voltar

- O aplicativo verifica se há atualizações e baixa a versão mais
  recente dos produtos e imagens.
- O sistema deve indicar quando o catálogo exibido está desatualizado,
  para reduzir o risco de apresentar preços antigos.

A edição/criação offline **não é necessária**. A gestão pode exigir
internet; o requisito offline se aplica principalmente à consulta e
apresentação dos produtos.

## 4. Funcionalidades previstas

### Catálogo público/de apresentação

- Grade visual de produtos, com fotos grandes e preços destacados.
- Nome do produto e categoria.
- Pesquisa rápida por nome.
- Filtros ou navegação por categoria, por exemplo:
  - Cozinha
  - Pesca
  - Iluminação
  - Ferramentas
  - Acessórios/outros
- Layout responsivo e otimizado para toque em tablet.
- Visualização ampliada de foto, se útil.
- Abertura rápida, sem carrinho, checkout, pagamento ou recursos de
  e-commerce desnecessários.
- Funcionar offline com todos os produtos e fotos já sincronizados.

### Painel administrativo

- Acesso protegido por login.
- Cadastro, edição e desativação/ocultação de produtos.
- Upload de foto pela galeria ou câmera do tablet.
- Campos simples: nome, preço, categoria, foto e, opcionalmente,
  descrição curta/código interno.
- Fluxo de edição fácil para alguém sem familiaridade técnica.
- Sincronização online.
- Indicador de última sincronização/estado do catálogo.

### Backup e recuperação

- Prever uma forma de backup dos dados.
- Considerar exportação/importação de catálogo e imagens, ou uma
  estratégia de restauração equivalente.
- Evitar depender exclusivamente do armazenamento local do tablet:
  limpar dados do navegador ou perder o dispositivo não deve
  significar perder o catálogo inteiro.

## 5. Arquitetura técnica sugerida

A recomendação preliminar foi construir uma aplicação pequena do zero,
reutilizando bibliotecas consolidadas em vez de adaptar um sistema
completo de estoque ou e-commerce.

### Stack candidata

- **Frontend:** React + TypeScript + Vite.
- **PWA:** permitir instalação na tela inicial do tablet.
- **Backend e banco de dados:** Supabase.
- **Armazenamento online das fotos:** Supabase Storage.
- **Persistência local/cache estruturado:** IndexedDB, usando Dexie
  para facilitar as operações.
- **Cache dos arquivos da aplicação:** Service Worker com Workbox.
- **Hospedagem:** GitHub Pages ou Vercel para os arquivos estáticos,
  avaliando a configuração e os limites gratuitos atuais.

Esta stack é uma hipótese inicial, não uma decisão irreversível. Antes
de começar a implementação, revisar compatibilidade, limites dos planos
gratuitos, autenticação, segurança e experiência no tablet.

### Separar claramente os tipos de armazenamento

1.  **Backend online:** fonte oficial dos produtos e preços; permite
    manutenção pelo painel.
2.  **IndexedDB local:** cópia dos dados dos produtos e metadados
    necessários à apresentação offline.
3.  **Cache local das imagens:** garantir que cada imagem utilizada no
    catálogo seja efetivamente baixada e armazenada localmente --- não
    basta guardar apenas a URL.
4.  **Service Worker:** disponibilizar os arquivos essenciais da
    aplicação sem conexão.

Não presumir que o uso de PWA ou a configuração do Workbox,
isoladamente, tornam os dados e imagens offline. É necessário
implementar explicitamente a sincronização e persistência dos produtos e
fotos.

## 6. Comportamento de sincronização a projetar

A estratégia ainda precisa ser definida durante o planejamento. Pontos a
decidir:

- Quando fazer a primeira carga dos produtos e imagens.
- Como detectar alterações nos produtos e preços.
- Como baixar apenas imagens novas/alteradas, evitando downloads
  desnecessários.
- Como tratar produtos desativados ou excluídos no servidor.
- Como sinalizar data e hora da última sincronização.
- O que mostrar se o usuário abrir o aplicativo offline antes da
  primeira sincronização.
- Como lidar com falta de espaço no dispositivo e falhas durante o
  download.
- Como evitar mostrar uma mistura inconsistente de dados novos com
  imagens antigas.
- Como oferecer backup e recuperação.

Como não há necessidade de editar produtos offline, não é preciso
resolver conflitos de edição entre dispositivos nesta primeira versão. A
sincronização principal é do servidor para o tablet.

**Importante:** dados e imagens podem consumir espaço. Com 50--100
produtos, é provável que seja administrável, mas o tamanho das imagens
deve ser otimizado e testado em um dispositivo real.

## 7. Projetos e referências discutidos

Foram considerados alguns projetos como referências, mas nenhum foi
confirmado como pronto para ser usado sem adaptações. A decisão atual é
construir uma aplicação própria e enxuta.

- **Catálogo Simples:**
  https://github.com/lucasbrcav/catalogo-simples\
  Catálogo com categorias, pesquisa e painel de produtos; foi
  considerado mais próximo do domínio comercial, mas não atende
  diretamente ao requisito offline sem alterações.

- **Ventorie / offline_dashboard:**
  https://github.com/EmekaNkwo/offline_dashboard\
  Referência discutida para UI e funcionamento offline. Antes de
  reutilizar código, verificar a licença e confirmar o estado atual do
  repositório e a implementação real.

- **Vestige Inventory / Inventory-App:**
  https://github.com/AmarjitBhuj/Inventory-App\
  Referência discutida para armazenamento local e PWA, mas tem foco em
  gestão de estoque e pode não oferecer a melhor experiência de
  catálogo visual. Verificar licença, recursos e funcionamento real
  antes de reutilizar.

- **Decap CMS:** https://github.com/decaporg/decap-cms\
  CMS open source que poderia servir para gestão de conteúdo em outra
  arquitetura, mas não é um catálogo pronto e não foi escolhido.

- **Vite:** https://vite.dev/

- **Supabase:** https://supabase.com/

- **Dexie:** https://dexie.org/

- **Workbox:** https://developer.chrome.com/docs/workbox/

Os nomes e recursos citados anteriormente devem ser verificados
diretamente nos repositórios/documentações antes de tomar decisões
técnicas. Não assumir que as descrições anteriores garantem a qualidade,
licença, manutenção ou segurança dos projetos.

## 8. Plataformas prontas consideradas

Foram mencionadas como alternativas para testar antes de desenvolver: -
Stoqui: https://www.stoqui.com.br/catalogo-digital - Meloja:
https://www.meloja.com.br/planos - Custy:
https://custy.com.br/catalogo-gratis

A limitação principal é que não foi confirmada a capacidade de
apresentar todo o catálogo offline, incluindo fotos, depois de fechar e
reabrir o aplicativo. Como o modo offline é requisito central, não
escolher uma plataforma pronta sem testar isso no tablet real.

## 9. Direção já escolhida

**Decisão atual:** construir do zero uma aplicação pequena, usando
bibliotecas consolidadas e referências de outros projetos, em vez de
adaptar um sistema de estoque/e-commerce com funcionalidades
desnecessárias.

Motivos: - Escopo relativamente pequeno (50--100 produtos). - Fluxo
muito específico de apresentação comercial. - Necessidade de uma
experiência extremamente simples para o pai. - Requisito explícito de
consultar catálogo offline. - Desejo de poder personalizar a aplicação
futuramente.

"Construir do zero" significa criar a aplicação e a lógica do negócio;
não significa reinventar armazenamento local, cache ou infraestrutura.

## 10. Primeiro protótipo recomendado

Antes de implementar tudo, montar uma prova de conceito com cerca de 10
produtos fictícios e testar:

1.  Grade de produtos legível e agradável no tablet.
2.  Pesquisa e navegação por categorias.
3.  Download e armazenamento local de todas as imagens.
4.  Abrir o catálogo, ativar modo avião, fechar e reabrir o app.
5.  Confirmar que todos os produtos e fotos continuam disponíveis.
6.  Simular mudança de preço e foto com internet e confirmar atualização
    após sincronização.
7.  Pedir ao pai para localizar um produto e navegar sem ajuda.
8.  Testar o comportamento no navegador e sistema operacional do tablet
    que será usado.

Só depois desses testes vale cadastrar todos os produtos e investir no
painel administrativo completo.

## 11. Perguntas em aberto para brainstorming no Codex

- Qual é o modelo/sistema operacional do tablet (Android ou iPadOS)?
- O catálogo deve ser acessível por link para outras pessoas ou
  somente no tablet do pai?
- A visualização pública pode ser acessada sem login?
- É necessário mostrar códigos, descrições ou apenas nome, foto e
  preço?
- Os produtos têm variações (tamanho, cor, modelo) que precisem
  aparecer?
- Qual o tamanho esperado das fotos e quantas fotos por produto?
- O catálogo terá apenas um tablet ou pode haver outros no futuro?
- Qual é o nível de familiaridade do pai com aplicativos e
  formulários?
- A prioridade é maximizar simplicidade ou deixar preparada uma futura
  expansão para estoque/pedidos?
- Qual é o orçamento aceitável caso os limites gratuitos dos serviços
  mudem?

## 12. Princípios para manter o projeto simples

- Não implementar carrinho, checkout, pagamentos, emissão de nota ou
  controle de estoque na primeira versão.
- Priorizar fotos e preços legíveis a distância.
- Minimizar os passos necessários para atualizar um preço.
- Manter a apresentação de produtos separada do painel administrativo.
- Fazer o modo offline ser explícito, testável e resiliente.
- Mostrar quando os dados podem estar desatualizados.
- Não depender de uma conexão para ler o catálogo depois que ele tiver
  sido sincronizado.
- Testar em hardware real e em modo avião, não apenas com ferramentas
  de desenvolvimento.
- Verificar licença e manutenção de qualquer código de terceiros antes
  de incorporá-lo.
- Confirmar limites e condições atuais dos planos gratuitos antes de
  decidir a hospedagem/backend.

## 13. Pedido para continuar o planejamento

Continue a partir deste contexto como parceiro de arquitetura e
brainstorming. Antes de gerar uma implementação completa, ajude a
esclarecer as perguntas em aberto, defina um MVP e proponha uma
arquitetura simples e testável. Priorize decisões práticas, baixo custo,
facilidade de uso pelo pai e confiabilidade da consulta offline.

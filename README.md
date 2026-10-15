# Catálogo offline

Protótipo de uma vitrine digital para apresentação de produtos no tablet e celular.
Interface em português, tema claro com azul, pesquisa, categorias e foto ampliada.
Depois da preparação, produtos e fotos podem ser consultados sem conexão.

Esta entrega implementa a **etapa 1**: dez produtos fictícios. Não contém painel
administrativo, login, Supabase nem produtos reais. Não é o MVP completo de produção.

## Executar localmente

Usar Node.js 24 LTS e npm. Há um único lockfile versionado.

```bash
npm ci
npm run dev
```

O servidor de desenvolvimento serve para trabalhar na interface. A preparação
offline deve ser testada na build de produção:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Abrir [o preview local](http://127.0.0.1:4173). Clicar em **Salvar catálogo para usar
sem internet**, manter a tela aberta e aguardar a confirmação. Desligar a conexão,
fechar a página e abrir novamente no mesmo navegador/perfil. A PWA pode ser instalada
na tela inicial, mas a instalação não substitui a preparação dos dados e fotos.

Cada aparelho precisa de sua própria preparação. Para testar no Android, usar HTTPS
ou depuração USB com encaminhamento para localhost. Um endereço HTTP da rede local
não fornece o contexto seguro necessário ao Service Worker e Web Locks.

## Comportamento offline

- Visitantes novos consultam online e carregam fotos sob demanda.
- O download completo é explícito; nenhum catálogo é declarado pronto antes de
  finalizar o armazenamento das fotos e dos arquivos essenciais do aplicativo.
- Produtos e fotos ficam no IndexedDB com Dexie. Workbox guarda o aplicativo.
- Fotos de uma nova revisão são preparadas antes da ativação atômica dos dados.
- Download inválido, cancelado ou sem espaço preserva a cópia anterior.
- Atualizações em duas abas usam uma trava compartilhada e notificam a outra aba.
- Dispositivos preparados verificam atualizações ao abrir e retomar, com limite
  de frequência; também há o botão **Atualizar catálogo**.
- Nenhuma atualização do aplicativo força reload durante o uso. Uma nova versão
  oferece ação explícita para reabrir, desabilitada durante sincronização.
- Consulta continua sem rede; preços podem estar desatualizados, como informa a tela.
- Limpar dados do navegador remove o catálogo local. Solicitar armazenamento
  persistente reduz risco de remoção, mas o navegador pode negar o pedido.

Navegadores sem Web Locks continuam permitindo consulta, mas a preparação offline
é recusada com orientação para usar um navegador atualizado. Chrome e Samsung
Internet nos aparelhos reais ainda precisam ser verificados.

## Dados de demonstração

`public/demo/catalog.json` contém um snapshot público com revisão, data e dez
produtos. Cada produto tem id, nome, categoria, preço em centavos e caminho de foto.
Só produtos ativos devem ser publicados nesse contrato. Alterações exigem incrementar
a revisão; troca de foto exige **novo caminho**, sem sobrescrever a foto antiga.

As fotos locais são ilustrativas e não representam necessariamente o produto descrito.
Fontes/licença em [docs/demo-images.md](docs/demo-images.md). Substituir por fotos
reais antes do uso comercial. Avisos dos componentes em
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Não adicionar segredos ou informações administrativas ao JSON público.

## Verificações

```bash
npm run test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

Playwright testa a build real, incluindo reinício de perfil com persistência,
fotos offline e troca de preço/foto/ocultação em duas abas. Não substitui modo
avião no tablet ou avaliação de usabilidade pelo vendedor.

Resultados e roteiro para os aparelhos reais em
[docs/validation/prototipo-offline.md](docs/validation/prototipo-offline.md).

## Segurança e próximos passos

Esta etapa não se conecta ao Supabase e não demonstra segurança de um backend.
Regras obrigatórias de Auth, RLS, grants, Storage e testes de acesso estão no
[AGENTS.md](AGENTS.md). A etapa 2 só deve cadastrar produtos reais depois de
validar essas permissões e a exportação/restauração.

Os componentes shadcn são incorporados ao código com base **React Aria**; o CLI
não é dependência do aplicativo. Para adicionar componentes, usar o CLI oficial
com versão revisada e conferir que `components.json` permanece `aria-vega`, sem
dependências Radix ou segredos. A geração pode exigir adaptar o import de `cn`
para `@/lib/utils`.

O desenvolvimento está autorizado na `main`. Planejamento e histórico de decisões
em `docs/superpowers/`. Não publicar o protótipo nem configurar recursos externos
sem a autorização correspondente.

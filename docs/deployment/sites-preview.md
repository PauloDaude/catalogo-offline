# Demonstração hospedada no Sites

O usuário solicitou em 15/10/2026 um link compartilhável para o vendedor avaliar.
O catálogo permanece React + TypeScript + Vite; a publicação usa somente a build
estática, sem Supabase, login administrativo ou alteração de stack.

Link público: [abrir demonstração](https://catalogo-paulo-demo.safereed9.chatgpt.site).
Primeira publicação confirmada pelo Sites em 15/10/2026.

## Identidade e origem

- Projeto Sites: `appgprj_6ad0df0dc2088191a7ed62dcf4a685cf`.
- Manifesto versionado: `.openai/hosting.json`; reutilizar esse projeto.
- Origem da build inicial: commit `7c274c3f45262dd1acff88aa8c9a16c21d49602f` do catálogo.
- Checkout de publicação local: `.sites-preview/`, ignorado no Git principal.
- Commit do repositório de publicação: `21a63079aed56d84b0acfb746a34972b174a4a99`.
- Versão salva: `appgprj_6ad0df0dc2088191a7ed62dcf4a685cf~appgver_bb49c2332f288191a488cd29756c489e`.
- Acesso público por link, conforme solicitação; sem conta ChatGPT para visitantes.
- Produtos, preços e fotos são fictícios/ilustrativos, como informa a interface.

A publicação é uma cópia estática: commits no GitHub e alterações locais não
atualizam automaticamente o link. Para uma nova versão, compilar, atualizar a cópia
estática e salvar/publicar novamente no mesmo projeto Sites.

## Atualização

1. Seguir a skill Sites e reutilizar o `project_id` do manifesto existente.
2. Rodar as verificações pertinentes e `npm run build` no projeto original.
3. Obter credencial temporária do repositório Sites por ferramenta nativa;
   manter em memória e enviar ao helper somente por stdin, sem arquivos ou logs.
4. Abrir o checkout de publicação com `site-workflow.mjs`, usando a credencial do
   mesmo projeto. Preservar o histórico e as fontes existentes.
5. Substituir o conteúdo de `dist/` do checkout de publicação pela nova build,
   incluindo as fotos e os dados de demonstração. Copiar o manifesto versionado
   para `.openai/hosting.json` desse checkout e atualizar a referência do commit
   original no README da cópia.
6. Usar o helper de fonte Sites para commit/push e empacotamento. A build já foi
   feita e verificada no projeto original; a cópia estática não exige outro build.
7. Salvar a versão com o SHA e o arquivo retornados pelo helper e publicar essa
   versão. Confirmar sucesso e conferir o acesso anônimo.

Não enviar `.env`, credenciais, `node_modules`, diretórios internos do Codex ou
bancos locais. A cópia de publicação contém apenas `dist/`, manifesto e README.
O código TypeScript original continua no repositório GitHub do projeto.

## Validação da publicação inicial

- Sites retornou `succeeded` para a publicação da versão 1.
- Navegador com contexto novo, sem login: HTTP 200 e dez produtos visíveis.
- Oferta de 35%, detalhes, adição ao carrinho, total de R$ 65,00 e decodificação
  da miniatura verificados no endereço público, em viewport de 360×800.
- A build e os fluxos offline foram verificados localmente antes da publicação;
  não foi repetido o roteiro completo de modo avião no domínio hospedado nem em
  dispositivos Android reais.

## Versão 2 — demonstração para folhear

Publicada em 15/10/2026 no mesmo projeto, preservando acesso público.

- [Abrir Cozinha por páginas](https://catalogo-paulo-demo.safereed9.chatgpt.site/?visualizacao=folhear).
- Build do catálogo: `48909c4`.
- Commit do repositório Sites: `7ea5640362a8fcd94c2505669b423f5983249230`.
- Versão salva: `appgprj_6ad0df0dc2088191a7ed62dcf4a685cf~appgver_86b3abfabb88819193e38859b6723fbf`.
- Deployment: `appgdep_6ad0e9587e588191a2a8128e476c796a`, status `succeeded`.
- Acesso anônimo HTTP 200, paginação, seleção de Garrafa térmica com total de
  R$ 48,00 e reabertura offline com decodificação das fotos verificados no domínio
  público, em viewport de 800×1280.

O endereço sem parâmetro preserva o visual anterior. Dispositivos com a versão
antiga do aplicativo em cache devem usar a ação **Reabrir atualizado** oferecida
pelo aplicativo para receber a nova apresentação.

## Versão 3 — carrossel e carrinho compacto

Publicada em 15/10/2026 no mesmo endereço, com acesso público preservado.

- Build do catálogo: `30e9961`.
- Commit do repositório Sites: `36e6b303bedf02c85c509cfff135a2dc4c48eae5`.
- Versão salva: `appgprj_6ad0df0dc2088191a7ed62dcf4a685cf~appgver_d609832e64d08191bb58de4dae4b008e`.
- Deployment: `appgdep_6ad11d7a4a6081919c8eab652b6d162b`, status `succeeded`.
- Hero removido da listagem, carrossel com foto de fundo, informações sobrepostas,
  gesto para a direita avançando e carrinho azul/compacto nos dois visuais.
- Link direto continua `?visualizacao=folhear`; sem parâmetro abre a listagem.

## Versão 4 — foto proporcional e faixa à esquerda

Publicada em 15/10/2026 no mesmo endereço, com acesso público preservado.

- Build do catálogo: `63b99dc`.
- Commit do repositório Sites: `46201c594d7522a17ed414fdabd4c3c90f7a1942`.
- Versão salva: `appgprj_6ad0df0dc2088191a7ed62dcf4a685cf~appgver_c5738945675481918ee1b075978a1edd`.
- Deployment: `appgdep_6ad12ab59a4081919bed43302aa76d68`, status `succeeded`.
- Fotos preservam a proporção original. Nome e preço em faixa saindo pela lateral
  esquerda e sobrepondo a parte inferior da imagem, conforme último pedido.
- Seis testes de proporção e clique na extensão lateral passaram em celular e
  desktop após inverter o lado; dez testes de carrossel/gestos também passaram.
- Evidências completas em `docs/validation/carrossel-fotos-proporcionais.md`.

## Versão 5 — dobra curva atrás da foto

Última publicação concluída antes do pedido de interromper atualizações automáticas.

- Build do catálogo: `adc9fa1`.
- Commit do repositório Sites: `57b1e27034f2d049fa8a20242df348c1032d8efb`.
- Versão salva: `appgprj_6ad0df0dc2088191a7ed62dcf4a685cf~appgver_88d5aeddf7388191bd00960ff1b7b01d`.
- Deployment: `appgdep_6ad12bbba5588191a12e15679974f4ba`, status `succeeded`.

## Pausa de publicações automáticas — registro histórico

Em 15/10/2026 o usuário pediu para não publicar a cada mudança: aguardar confirmação
explícita. Até novo pedido, os refinamentos ficaram no preview local
`http://127.0.0.1:4173/` e no GitHub. Arquivos preparados no checkout Sites não
equivalem a publicação. A versão 6 abaixo foi publicada após autorização explícita;
publicações futuras continuam dependendo de pedido.

## Versão 6 — abas, etiqueta branca e controles na mesma linha

Publicada em 15/10/2026 após autorização explícita do usuário para commitar e
atualizar o endereço online; acesso público preservado.

- Build do catálogo: `2a16b45`.
- Commit do repositório Sites: `57065ec90defc13b687a0aaf09a5896c359ce8ff`.
- Versão salva: `appgprj_6ad0df0dc2088191a7ed62dcf4a685cf~appgver_a88e0bcd68dc81919429dd50db86795a`.
- Deployment: `appgdep_6ad138b0386c8191be189bb2a3396736`, status `succeeded`.
- Folhear como visual padrão, aba Ver grade, filtros/pesquisa compartilhados,
  etiqueta branca sem dobra, setas nas bordas, adição direta ao carrinho e ação
  offline na mesma linha do carrinho no celular. Controle de 1–5 itens removido.
- Verificação local: 79 testes unitários/componentes e 54 E2E, build, lint e
  formatação passaram. PDF de referência permanece fora do repositório e da build.

Dispositivos com versão anterior em cache podem usar Reabrir atualizado quando
oferecido pelo aplicativo. O roteiro completo em Android real segue pendente.

Conferência anônima no domínio público, em 360×800: HTTP 200, carrossel padrão,
abas, filtro Cozinha compartilhado, avanço pela seta lateral, adição de Panela
com total de R$ 65,00 e controles flutuantes na mesma linha verificados. O roteiro
completo offline foi executado localmente, sem repetição integral nesta publicação.

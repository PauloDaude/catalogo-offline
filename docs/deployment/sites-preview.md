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

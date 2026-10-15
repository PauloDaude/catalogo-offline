# Fotos proporcionais e faixa lateral — 15/10/2026

Pedido do usuário: preservar fotos verticais e quadradas no modo de folhear e
experimentar uma etiqueta de nome/preço saindo da lateral, como na referência.

## Implementação

- Foto usa a proporção natural medida após decodificação, sem recorte. A largura
  acompanha essa proporção e a altura máxima acompanha o viewport.
- Faixa branca com detalhe azul sobrepõe a borda inferior e se projeta à esquerda;
  participa do fluxo para acomodar texto e ofertas sem cortar conteúdo.
- Área de abertura dos detalhes inclui a extensão lateral. Mantidos código,
  categoria, preços azuis, ofertas, carrinho e gestos de navegação.
- Não altera o visual da listagem nem os dados, downloads ou snapshots offline.

## Evidências

- Teste com JPEG vertical 600×900 falhou antes da mudança por proporção incorreta.
- Seis casos com JPEGs verticais, quadrados e horizontais, em larguras 360 e 1280,
  verificam proporção exibida, faixa sobreposta e projetada à esquerda, ausência de
  overflow horizontal e abertura de detalhes ao clicar na extensão lateral.
- Capturas com a foto ilustrativa de Garrafa térmica inspecionadas em 360×800 e
  1280×900. Foto inteira visível; faixa e navegação sem cortes.
- Verificação completa: 77 testes unitários/componentes e 38 testes E2E, incluindo
  gestos de toque/mouse, seleção compartilhada e reabertura offline.
- Build, lint e formatação verificados. Avaliação com o vendedor e aparelhos
  Android reais continua pendente.

## Acabamento da dobra

Após revisão visual do usuário, a dobra foi movida para trás da foto, com
contorno curvo e gradiente azul discreto. Capturas desktop/celular inspecionadas;
os dez testes de proporção, extensão clicável e gestos passaram novamente.

Refino solicitado: sombra interna na dobra, sombra projetada junto à lateral
e transição suave de cinza azulado para branco na superfície do card, dando
volume à curva. Build e captura visual verificadas após o ajuste de sombra.

## Adição direta no modo de folhear

Botão azul de carrinho e “+” na faixa, ao lado do preço, adiciona uma unidade
sem abrir o modal. Rótulo acessível por produto, foco por teclado e alvo de 48 px.
Teste unitário falhou antes da inclusão; 78 testes unitários/componentes passaram
após a mudança. Dezessete testes E2E de fotos, folhear e interação passaram,
incluindo adição por clique/Enter e total de R$ 130,00 para duas unidades.

## Grade controlável e direção corrigida

Pedido posterior inverte o gesto: da direita para a esquerda avança; o contrário
retorna. Controle de 1–5 produtos por página e filtros de todas as categorias.
Inicialmente Cozinha e um item; páginas agrupadas, última página sem duplicações.
Três colunas grandes, duas no tablet e uma no celular preservam legibilidade.

Testes: 79 unitários/componentes e 45 E2E passaram, incluindo quantidades 1–5,
filtros/pesquisa, páginas incompletas, seleção compartilhada e offline. Nove casos
JPEG verificam proporção e não sobreposição do preço/botão em 360, 1280 e 844×390.
Capturas de cinco itens no desktop e dois no tablet foram inspecionadas.
Build, lint e formatação passaram. Uso no hardware Android real segue pendente.

## Abas da página inicial

Página inicial abre Folhear catálogo por padrão. React Aria Tabs oferece duas
abas: Folhear catálogo e Ver em cards, com ícones/rótulos, foco e setas de teclado.
Query `visualizacao=cards` preserva acesso direto à listagem; `folhear` ao carrossel.
A troca mantém o carrinho e anuncia a aba ativa. Testes existentes da listagem
agora usam explicitamente seu parâmetro, sem depender do antigo padrão.

Por solicitação do usuário, alterações posteriores ao acabamento inicial da dobra
ficam locais até confirmação explícita para publicar. O link público não foi
atualizado com sombra refinada, botão de adicionar, grade e abas.

Validação final das abas: 79 testes unitários/componentes e 48 testes E2E passaram,
com testes específicos em 320, 800 e 1280 px para aba padrão, seleção explícita,
recarregamento do visual escolhido, troca por teclado e preservação do carrinho.
Build, lint e formatação passaram. Build registra aviso de chunk acima de 500 kB
(após incluir React Aria Tabs) e aviso existente de Workbox; não impedem a build.

## Simplificação dos filtros — decisão posterior

Removido controle de 1–5 itens: folhear exibe um produto; a aba Ver grade oferece
os cards. Pesquisa e categorias agora pertencem a CatalogPage, acima dos painéis,
com o mesmo estilo arredondado. Ambos os visuais usam exatamente os mesmos filtros.
Todas é o filtro inicial; a troca de aba preserva pesquisa/categoria/carrinho.
Alterar filtros volta ao primeiro produto, e Limpar filtros limpa pesquisa e categoria.

Pesquisa alinhada com abas no desktop e logo abaixo no celular, com mesma largura.
Capturas em 1280×900 e 360×800 inspecionadas. Testes de grade múltipla foram
substituídos por testes de filtros compartilhados, alinhamento e ausência de
controles duplicados em 360, 800 e 1280 px. Publicação segue dependente de confirmação.

Verificação desta simplificação: 79 testes unitários/componentes, build, lint e
formatação passaram. O teste offline foi atualizado para verificar a categoria
Cozinha preservada ao trocar de aba e então limpar para Todas; essa expectativa
substitui o comportamento antigo de reiniciar filtros. Demais 47 testes E2E
passaram na execução completa; fluxos de folhear, filtros e abas repetidos após
corrigir a expectativa do teste offline.

## Controles flutuantes, foco e setas laterais

Card offline compacto fixo à esquerda: Disponível online, Salvar offline e
Atualizar. Mantém progresso, confirmação e erros; no celular fica acima do carrinho
para não sobrepor os controles entre si. Espaço inferior e scroll-padding reservados
para permitir rolar o conteúdo acima dos controles. Pesquisa tem borda fina azul,
sem combinar outline e ring grossos.

Setas laterais brancas (56 px desktop, 48 px mobile) navegam sem abrir detalhes.
No início/fim usam aria-disabled e guardas de ação; continuam focáveis para não
perder foco ao alcançar o limite. O componente visual não é remontado a cada
produto, preservando foco; proporção continua associada à URL da foto.

Testes verificam posição fixa após rolagem, ausência de sobreposição entre aviso
e carrinho, foco da pesquisa, setas/limites e navegação por Enter. Capturas desktop
e mobile inspecionadas. Link online permanece sem atualização, conforme decisão.

Resultado final: 79 testes unitários/componentes e 53 E2E passaram, incluindo
preservação de foco das setas no último item. Build, lint e formatação passaram.

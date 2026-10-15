# Ofertas e novo layout de detalhes — 15/10/2026

Desenho aprovado em conversa: preço anterior opcional, riscado, preço atual e
percentual inteiro de desconto na listagem e nos detalhes. Duas colunas nas telas
maiores, com adaptação para celular e paisagem. Percentual em selo `#04a650` com texto branco; selo "OFERTA IMPERDÍVEL" em azul
com texto branco e ícone de desconto, por preferência explícita do usuário. Quatro ofertas fictícias na revisão 3.

## Verificação

- `npm test`: 72 testes passaram, incluindo preservação/validação do preço anterior,
  desconto arredondado para baixo, ausência de promoção sem preço anterior e soma
  do preço atual no carrinho.
- `npm run test:e2e`: 20 testes passaram, incluindo ofertas após reabertura offline,
  duas colunas no desktop, detalhes sem rolagem em 1280×800, 360×640 e 640×360,
  carrinho, sincronização e preservação do catálogo após falha de download.
- `npm run build`, `npm run lint` e `npm run format:check`: aprovados.
- Capturas em desktop e celular inspecionadas; botões permitem quebra de texto e
  altura automática para acomodar os rótulos.
- Revisão independente de código sem achados concretos. O revisor não executou
  navegador adicional por restrição do sandbox; a execução acima ocorreu no agente principal.

Validação em tablet Samsung/celular reais e com o vendedor continua pendente.
As ofertas e fotos de demonstração são fictícias. O painel administrativo ainda
não foi implementado; o preço anterior está no contrato público do catálogo.

## Ajuste dos cards após feedback do usuário

- Card inteiro abre os detalhes, com um único botão acessível, foco visível e
  retorno do foco ao fechar. A adição ocorre somente dentro do modal.
- Preços alinhados em cards com e sem oferta; removido botão de adicionar da lista.
- Selo azul com ícone de etiqueta, fonte de peso 550 e alinhamento vertical central.
- `npm test`: 73 testes passaram; `npm run test:e2e`: 21 testes passaram, incluindo
  clique na parte inferior do card e alinhamento dos preços em 360, 800 e 1280 px.

## Cards compactos — proposta visual aprovada em conversa

- Selo de oferta sobre a foto, no canto superior esquerdo.
- Removidas as linhas reservadas ao selo/preço anterior dentro do card; preço
  atual próximo ao nome e alinhado entre produtos com e sem oferta.
- Preço anterior menor abaixo do atual; percentual ao lado quando houver espaço.
  Em celular estreito, a linha de preço permite quebra sem overflow horizontal.
- A apresentação no modal de detalhes permanece com selo e preço anterior no
  bloco de informações.
- `npm test`: 75 testes passaram. `npm run test:e2e`: 22 testes passaram,
  incluindo posição do selo dentro da foto e distância entre nome/preço em
  360, 800 e 1280 px, além das regressões do carrinho e consulta offline.
- Build, lint, formatação e conferência visual em desktop/celular aprovados.
  Validação em aparelhos Android reais continua pendente.

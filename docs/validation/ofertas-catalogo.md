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

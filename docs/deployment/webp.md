# Fotos WebP e categorias do lote real

## Ativar novos uploads no Supabase

Antes de usar o painel atualizado para enviar fotos:

1. Abra o projeto correto no Supabase e entre em **SQL Editor → New query**
2. Cole todo o conteúdo de `supabase/migrations/202610290009_webp_photos.sql`
3. Execute com **Run** e confira se terminou sem erro
4. Use a nova versão do frontend para validar um upload e a consulta pública

A migration aceita `UUID.jpg` e `UUID.webp` em produtos e variantes, acrescenta
`image/webp` ao bucket e preserva permissões administrativas e o limite de tamanho
JPEGs atuais continuam válidos, nenhuma foto existente é convertida ou removida

**A migration 009 foi aplicada apenas no ambiente local nesta entrega**
O usuário informou que já executou as migrations 007 e 008 no projeto remoto
Publicar a nova versão do frontend exige autorização separada, clientes antigos
podem não reconhecer referências WebP

## Converter as fotos locais

Requer Python 3 e Pillow com suporte WebP

```bash
npm run test:images
npm run images:webp
```

O comando lê `docs/produtos/imagens/` e cria
`docs/produtos/imagens-webp/`, também prepara as dez fotos da demo
Os originais permanecem intactos, destinos com conteúdo diferente causam erro
Repetir com as mesmas entradas e versão do Pillow produz o mesmo resultado

Saída com orientação corrigida, sem ampliação, lado máximo de 1600 px,
qualidade inicial 82 e limite de 500.000 bytes, com redução de qualidade se necessária
O painel aplica os mesmos limites e rejeita fallback PNG do navegador
O relatório `docs/produtos/conversao-webp.json` registra dimensões, bytes e SHA-256

## Conferir os produtos

- `docs/produtos/categorias.json`: seis categorias e vínculos dos 85 registros
- `docs/produtos/produtos-preparados.json`: dados comerciais preservados, novas
  referências WebP e categorias
- `docs/produtos/produtos-preparados.md`: tabela legível para revisão

85 registros de origem ainda precisam ser agrupados em produtos com variantes
O JSON preparado **não é o manifesto final aceito pelo importador**
O manifesto e o journal do piloto JPEG permanecem intactos para permitir retries

**Não importar o lote completo nem criar as categorias remotas agora**
Avisar o usuário e aguardar sua confirmação explícita de que concluiu a limpeza
Depois, revisar o agrupamento, preparar o manifesto e simular antes de importar
Nenhuma operação desta preparação modifica o Supabase online

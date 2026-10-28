# Ativar variantes e caixas no Supabase

A implementação foi validada no Supabase local, o projeto remoto ainda precisa
receber o SQL abaixo. Não publique a nova build antes dessa etapa

1. Faça e confira uma cópia com `npm run backup:catalog` e
   `npm run backup:verify -- backups/NOME_DA_COPIA`, conforme
   [backup-local.md](backup-local.md)
2. Abra o projeto correto no Dashboard do Supabase, entre em **SQL Editor**
   pela barra lateral e clique em **New query**
3. Copie o conteúdo completo de
   [202610280005_product_variants.sql](../../supabase/migrations/202610280005_product_variants.sql)
   para o editor e clique em **Run**

O arquivo começa uma transação e verifica pré-requisitos das migrations anteriores,
incluindo remoção de categorias e paginação administrativa, não execute só trechos
isolados. Se faltar uma migration anterior, aplique-a primeiro pelos guias do projeto

4. Confira o resultado com esta consulta de leitura:

```sql
select to_regclass('public.product_variants') as tabela_variantes,
       public.read_catalog_snapshot_v2()->>'schemaVersion' as versao;
```

O resultado esperado é `product_variants` e `2`. A lista pode estar vazia se todos
os produtos estiverem ocultos, isso não indica falha

5. Faça uma nova cópia e confira-a, agora no formato V2, antes do piloto
6. Reinicie o preview local e teste o painel: produto simples, caixa e produto com
   duas opções de preços diferentes, depois confira seleção e total no carrinho

## Comportamento esperado

- Produtos existentes mantêm UUID, código, preço e foto, começando como unidade
- Um produto com variantes aparece uma vez no catálogo, cada opção tem código,
  preço, oferta e foto próprios, com foto do produto como alternativa
- A seleção da opção é obrigatória antes de adicionar, o carrinho separa opções
- O preço de caixa é o preço total informado, sem multiplicar novamente o conteúdo
- Ocultar a última opção exige também ocultar o produto
- Conversões de tipo e mudanças de preço/unidade exigem revisão de carrinhos antigos
- As cópias offline e o carrinho usam armazenamento V2 separado, preservando o V1

O SQL inclui RLS e autorização administrativa, RPCs transacionais, conflito de
edição e proteção contra importação duplicada. Endpoints antigos deixam de listar
caixas/produtos com variantes, evitando interpretação de preço incorreta em versões
antigas do site. Aparelhos antigos devem atualizar e preparar novamente o offline

Aplicar a migration não importa nem ativa produtos, não altera o frontend publicado
e não substitui a validação no tablet real

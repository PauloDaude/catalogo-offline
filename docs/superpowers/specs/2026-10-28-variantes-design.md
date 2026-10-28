# Produtos com variantes e venda em caixas

Status: aprovado e implementado localmente, SQL e piloto remotos pendentes
Data de referência: 28/10/2026

## Objetivo e decisões confirmadas

Agrupar opções de tamanho, potência, capacidade ou modelo sob um único produto,
com preço e oferta próprios. O usuário aprovou as correções do JSON e explicou:
notações como 12x1 são caixas; o preço já é da caixa, exceto quando há und., caso
em que o preço unitário deve ser multiplicado pelo total de unidades da caixa.

Coadores grande/médio/pequeno: 265×12=3180, 255×12=3060 e 245×12=2940 centavos.
Não multiplicar novamente os demais preços de caixa. 12x6 e 12x4 preservam a
composição como 12 conjuntos de 6/4 unidades, com valor original da caixa.

Após implementação, SQL aplicado e testes, o usuário pediu cadastro de cinco
produtos piloto do material fornecido, cobrindo desconto, variantes e caixas.
Isso não autoriza importar os 85 registros nem publicar uma nova build online.

## Abordagem proposta

Usar produto principal e tabela relacional de variantes. Outra opção seria manter
um produto completo para cada tamanho, que repete os cards, ou guardar opções em
JSON, que dificulta constraints, códigos e autorização individual. A tabela filha
é a recomendação para cumprir a decisão de ter variantes reais com valores distintos.

Preservar produtos simples existentes como simples, com o mesmo UUID, código e
preço, sem criar uma variante artificial para cada cadastro antigo.

## Experiência no catálogo

- Um card ou página do carrossel por produto principal
- Produto simples mantém adição direta e feedback +1/contador
- Produto com opções abre os detalhes para escolher uma variante antes de adicionar
- No modal, seletor React Aria com nome da opção e preço, acessível por toque/teclado
- Sem seleção automática em produto com várias opções; quando houver uma única
  opção pública, ela pode iniciar selecionada, mantendo identificação explícita
- Foto da opção, preço atual/anterior, selo e percentual mudam com a seleção
- Card mostra A partir de quando os valores das opções diferem; quando iguais,
  mostra o preço comum e a indicação de opções
- Não juntar preço mínimo de uma opção com preço anterior/desconto de outra;
  card pode dizer Opções em oferta, percentual somente de uma opção identificada
- Contador do card soma opções do produto, contador do modal é da opção escolhida
- Categoria e busca compartilhadas continuam, pesquisa inclui nomes/códigos das opções
- Cada opção usa foto própria opcional, com fallback para foto principal

## Experiência no painel

Adicionar escolha Produto simples / Produto com variantes no formulário existente.
No segundo modo: nome de característica (Tamanho, Capacidade, Potência ou Modelo)
e uma lista de opções com rótulo, preço, oferta, foto opcional e visibilidade.

Uma característica por produto nesta etapa, sem matrizes ou combinações cartesianas.
Rótulos podem descrever um modelo completo quando necessário. Rótulos únicos por
produto sem distinção de caixa/espaços externos, até 80 caracteres; até 50 opções
cadastradas por produto, incluindo as arquivadas, como limite inicial de implementação.

Salvar o conjunto em transação. Remover da venda significa ocultar reversivelmente
uma opção, com confirmação; não oferecer exclusão definitiva nem reutilizar códigos.
Ocultar a última opção disponível de um pai visível exige confirmar a ocultação do
produto inteiro e salvar ambos os estados na mesma transação.
Conversão entre simples e com variantes exige confirmação, preço/configuração do
modo de destino e aviso sobre seleções antigas; não apagar registros anteriores.

A lista administrativa permanece paginada em 20 produtos principais, com indicação
da quantidade de opções. Pesquisa por uma opção retorna o pai uma única vez.
Ocultar o pai oculta todas suas opções no público. Categoria é compartilhada pelo pai.

## Unidade de venda

No item simples ou em cada variante, gravar tipo unidade/caixa, quantidade de
apresentações e unidades por apresentação. Campos inteiros positivos, total máximo
100000 unidades por venda e multiplicação validada sem overflow.

O preço do banco sempre corresponde a UMA unidade de venda: uma peça ou uma caixa.
A multiplicação de preço unitário por conteúdo da caixa ocorre na preparação dos
dados, com fórmula auditável, não no carrinho a cada adição.

Exibir Caixa com 12 unidades ou Caixa com 12 conjuntos de 6 unidades. Quantidade 2
no carrinho significa duas caixas e soma duas vezes o preço da caixa. Não dividir
valores por unidades físicas e não transformar uma caixa em 12 linhas do carrinho.

## Banco e contratos

Migration prevista: supabase/migrations/202610280005_product_variants.sql.
O SQL completo será produzido na implementação e entregue pronto para SQL Editor
após ensaio local; este documento define seu contrato, não é uma migration parcial.
Validar previamente migrations 001 a 004 e autorização administrativa, informando
requisitos ausentes antes de alterar o schema.

### Estrutura

- products mantém campos comuns, código Pxxx, versão e visibilidade
- Acrescentar has_variants, variant_attribute e contador interno monotônico de opções
- Campos de preço/unidade em products continuam canônicos para simples; devem ser
  nulos no modo com variantes, evitando duas fontes concorrentes de preço
- product_variants: UUID, product_id FK sem cascata destrutiva, código persistente,
  rótulo, preço atual/anterior em centavos, imagem opcional, unidade de venda,
  visibilidade, versão e timestamps
- Opções recebem sufixos imutáveis como P123-V01, P123-V02; códigos atuais Pxxx
  continuam válidos. Contador atribuído no banco sob lock, sem reutilização
- Constraints de preço, oferta, caminhos JPEG, unidade de venda, nome único e modo
- Produto visível com variantes precisa ter ao menos uma opção ativa; validar no
  commit com constraint trigger diferida, permitindo salvar pai/filhos juntos
- Alterações de variante ou caixa incrementam revisão pública na mesma transação

### Segurança e operações

RLS e grants versionados no SQL, negar escrita a visitante e usuário sem autorização.
Leitura pública de variante somente se pai, categoria e variante estiverem ativos.
RPCs SECURITY INVOKER com search_path fixo, autorização explícita e EXECUTE mínimo.
Triggers privilegiados somente se necessários à atribuição de código/revisão, em
schema privado com escopo restrito, conforme o padrão atual do projeto.

- save_product_v2(p_payload jsonb): pai, modo, expectedVersion e lista de opções
  com IDs/expectedVersion, em uma transação; rejeitar filhos de outro pai e conflitos
- list_admin_products_v2: filtros e paginação dos pais, agregados e opções para edição
- read_catalog_snapshot_v2: snapshot consistente com schemaVersion 2 e opções públicas
- Consulta administrativa de vínculos de categoria continua considerando os pais
- Operação de importação idempotente com chave estável e hash do payload; ledger
  em schema privado com autorização, impedindo duplicação em repetição/perda de resposta

Manter endpoints antigos para clientes antigos, retornando apenas simples vendidos
por unidade. Escrita antiga em produto já convertido deve falhar pedindo atualização,
sem aceitar alterações que desconfigurem opções/caixas. O endpoint novo não depende
de a Data API retornar todos os filhos em uma consulta paginada comum.

## Carrinho, offline e pedido

Identidade de compra: UUID do produto simples ou UUID da variante. Guardar também
pai, rótulo e unidade de venda, preservando carrinhos existentes sem apagar seleção.
Mudanças de preço, rótulo, unidade/conteúdo ou disponibilidade exigem revisão explícita.
Produto convertido que exija escolha não é associado silenciosamente a uma opção.

Adaptar validação de códigos para Pxxx e Pxxx-Vnn, incluindo mais de três algarismos
no código base. Totais continuam em centavos inteiros seguros e quantidade até 999.

PDF, prévia e WhatsApp mostram produto, opção escolhida, código e caixa/unidade,
quantidade de vendas, preço dessa venda e subtotal. Alterações relevantes invalidam
PDF em memória, preservando nome/observações para regenerar. Ajustar paginação do PDF
para descrições maiores, sem perder imagens/valores ou repetir preço incorretamente.

Snapshot local antigo continua consultável e é adaptado em memória para simples.
Usar chave de carrinho e bancos IndexedDB V2 separados dos V1: uma aba antiga não
pode interpretar/apagar uma seleção nova nem podar fotos novas. Migrar por cópia
única e idempotente, na mesma fonte/origem, preservando o original V1. Carrinho V2
grava itens e marcador de migração juntos; seleção V2 vazia não reimporta o V1.
No IndexedDB V2, fotos/snapshot/marcador são ativados atomicamente, repetindo em
falha sem marcar migração concluída antes da cópia integral. Nunca podar o banco V1.
Preparação V2 baixa capas e fotos de variantes, reutiliza fotos repetidas, ativa tudo
em transação e preserva cópia anterior se qualquer foto falhar. Versão do formato é
separada da revisão do catálogo, migração não apaga o IndexedDB ou carrinho V1.
Se faltar espaço para a cópia, preservar V1 e explicar que a preparação V2 não
concluiu, sem prometer disponibilidade offline nova.

## Backup e importador

O dump já cobre a tabela nova por schema, mas o inventário, comparador de alterações,
verificador e ensaio precisam incluir variantes e referências das fotos de opções.
Manter leitura de backups V1 e criar manifesto V2 quando houver variantes. Testar
restauração e atribuição do próximo código de opção sem reutilização.

Importador usa JSON revisado, mapa de famílias e categorias explícito, dry-run e
lote piloto fixo. Otimiza JPEG com o padrão do painel, sobe no Storage e só então
chama RPC. Não usar service_role para contornar autorização: sessão administrativa
autorizada, credenciais locais protegidas, sem senha/token no chat ou logs.

Usar chaves estáveis por família/lote e hash de payload no banco. Registrar caminhos
antes do upload em journal local privado ignorado no Git e bloqueado pelo Vite.
Perda de resposta não pode criar outra família nem outra opção; reconferir registro
pelo ledger. Upload ambíguo não é apagado automaticamente. Reusar imagens por hash
quando comprovado, sem sobrescrever caminhos publicados nem apagar fotos anteriores.

## Piloto proposto e proteção da tabela comercial

Cinco pais, oito opções de compra, inicialmente ocultos no projeto real para conferir
pelo painel. Os mesmos dados entram primeiro nos testes locais visíveis de catálogo.

| Produto                  | Tipo                                  | Preços de venda                |
| ------------------------ | ------------------------------------- | ------------------------------ |
| Canivete inox automático | Simples com oferta demonstrativa      | de R$ 29,90 por R$ 26,91       |
| Processador de alimentos | Capacidade 500/900 ml, fotos próprias | R$ 14,90 / R$ 21,90            |
| Pano de prato            | Caixa com 12 unidades                 | R$ 48,90                       |
| Coador para café         | Grande/médio/pequeno, caixa de 12     | R$ 31,80 / R$ 30,60 / R$ 29,40 |
| Funil flexível           | Simples por unidade                   | R$ 8,90                        |

O desconto de 10% do canivete é EXCLUSIVAMENTE uma configuração fictícia do piloto
oculto; não altera o preço original no JSON comercial nem é publicado como oferta
real sem confirmação. Publicação/ativação dos pilotos é uma decisão posterior.

Pré-condições do envio: plano aprovado, testes locais verdes, SQL aplicado pelo
usuário no projeto certo, backup real conferido e credenciais administrativas locais
configuradas. A autorização existente cobre apenas esse envio de cinco pais.

## Critérios de aceite e fora do escopo

Não duplicar card por opção, não adicionar opção errada, preço de caixa explícito,
PDF/carrinho corretos, variantes offline após reabrir, permissões testadas diretamente,
edição atômica com conflito, backup restaurável e piloto repetível sem duplicatas.

Não inclui estoque, tamanhos×cores, checkout, pedidos no servidor, lote completo de
85 registros, atualização automática do link online ou exclusão definitiva.

# Importação completa — 29/10/2026, retomada em 30/10/2026

## Escopo e autorização

Usuário confirmou banco limpo, autorizou categorias/produtos e confirmou todos
visíveis. Aprovou as escovas como Modelo 1/2, GD só na lanterna de 5 W, pino de
quatro saídas unitário por R$ 4,10 e tesoura curva/reta como uma opção de R$ 4,90.

Manifesto: `docs/produtos/lote-completo-20261029.json`, com tabela legível em `.md`.
SHA-256 do JSON canônico: `37dfa26f81b391765a2851b76d57d32425ad603dad7b2a3e258b5a6c602a0e3a`.

## Resultado remoto

- 48 produtos principais, códigos P009–P056, todos visíveis
- 24 produtos simples e 24 pais com variantes, 61 variantes, 85 itens vendáveis
- Seis categorias: Casa e cozinha, Beleza e higiene, Costura e papelaria,
  Elétrica e iluminação, Ferramentas e acessórios, Lazer
- 67 fotos WebP enviadas, hashes e MIME conferidos pelo acesso público
- Conferência administrativa independente compara nome, categoria, preço,
  preço anterior nulo, venda por caixa/unidade, conteúdo da caixa, opções e fotos
- Snapshot público confirmou os 48 pais importados visíveis
- Canivete R$ 29,90, sem a oferta fictícia do piloto

Backup anterior ao envio: `backups/2026-10-29T20-49-34.193Z-bf4acc5a`, V2 real,
mesmo projeto, integridade conferida, 0 produtos e 9 fotos. Nenhuma foto anterior
foi removida. Não foi feita restauração desse backup de produção nesta etapa.

Execução terminou em 29/10 às 20:56 UTC, após interrupção do chat. Journal e
`verification.json` privados preservam resultados e permitem verificação sem
reenviar. Chaves/journal do piloto JPEG permanecem intactos e separados.

## Validação automatizada

Oito testes de importação aprovados: cobertura exata das 85 origens, preços e
caixas preservados, validação das fotos, retry sem duplicação, categorias
criadas/reutilizadas sem reativação implícita, MIME WebP/JPEG, compatibilidade do
piloto e bloqueio do retry de produto excluído. Lint e formatação conferidos.
Revisão independente sem achados bloqueantes, diagnóstico de erros e cobertura
das categorias aprimorados após observações.

## Limites

Não houve publicação de frontend, nova migration, remoção de fotos antigas ou
reset de sequência. Esta conferência não substitui auditoria completa de RLS nem
testes de consulta offline, carrinho e PDF no tablet real com o catálogo novo.

## Nova conferência em 30/10/2026

`node scripts/import/full-import.mjs --verify` concluiu às 09:46 no horário local,
sem reenviar produtos: 48 pais, 85 escolhas, 67 fotos verificadas e 48 pais no
snapshot público, total administrativo 48. Hash do manifesto permaneceu igual.

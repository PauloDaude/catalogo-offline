# Variantes e caixas — validação local em 28/10/2026

Implementação autorizada pelo plano de 28/10, sem publicação do frontend nem
aplicação do SQL no projeto real

## Implementado

- Produto simples ou com até 50 opções, característica, preço/oferta e foto por opção
- Venda por unidade ou caixa, preservando composição como 12 conjuntos de 6 unidades
- Um card por pai, preço mínimo sem combinar ofertas de opções diferentes e seleção
  explícita antes de adicionar, busca por nome e código da opção
- Painel com edição atômica, conflitos, ocultação/reativação e conversão confirmada
- Carrinho por UUID vendável, revisão de mudanças e descrição de caixa/opção no pedido
- Snapshots, fotos e carrinho V2 isolados, cópia única dos dados V1 preservados
- Backup V2 com variantes, fotos e contador, leitura de pacotes V1 mantida
- Piloto limitado e idempotente com cinco pais ocultos e oito escolhas

## Evidências

| Verificação                | Resultado                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Vitest completo            | 44 arquivos, 167 testes aprovados                                                                                                    |
| API SQL local              | Simples, variantes, caixas, conflito, filhos alheios, identidade/counter, preços, RLS de três perfis e importação repetida aprovados |
| Migration integral         | Aplicada em cópia descartável pré-005, dois produtos antigos com UUID/código/preço preservados, snapshot V2 e grant anon conferidos  |
| Painel completo Playwright | 14 testes aprovados, incluindo paginação com 105 produtos e três larguras de variantes                                               |
| Variantes adicionais       | 320, 360, 768, 800, 1024 e 1280 px, carrinho separado, fotos e reabertura offline                                                    |
| Catálogo público           | Regressão de abas, gestos, filtros, foco, carrinho, offline e pedido, incluindo 100 produtos                                         |
| PDF de variantes           | Duas opções, uma caixa com 12, total R$ 36,80, prévia real e texto do arquivo baixado conferidos                                     |
| Backup unitário            | 14 testes aprovados, incluindo foto exclusiva de opção e compatibilidade V1                                                          |
| Recuperação local          | Dump, Auth, autorização, RLS, sequências e 99 fotos com hashes iguais, variante em caixa e próximo código conferidos                 |
| Importador unitário        | Dois testes aprovados, preços da caixa e resposta perdida sem duplicação                                                             |
| Piloto local               | Cinco pais/oito escolhas com JPEGs reais da pasta local, preços e repetição conferidos, dados de teste limpos ao final               |
| Simulação                  | Validação dos cinco pais/oito escolhas, nenhuma escrita ou upload remoto                                                             |
| Limite do servidor         | Backups e journal privado bloqueados com HTTP 403, por URL normal e @fs                                                              |

Os testes de integração usam exclusivamente Supabase em 127.0.0.1 e contas de teste
temporárias, nenhum segredo é incluído na documentação ou nas saídas

## Correções verificadas durante a revisão

Dois testes de regressão falharam antes da correção e passaram depois:

- Falta de espaço no localStorage durante a cópia V1 mantém os itens em memória,
  indica persistência indisponível e permite gravar a seleção inteira após recuperar
- Cópia V1 atrasada não substitui snapshot V2 já ativado por outra aba, com decisão
  dentro da transação IndexedDB e preservação das datas anteriores

Também foram conferidos código de opção não reutilizável, colisão entre UUID de pai
e filho e rolagem horizontal com categoria longa. O teste de 100 produtos normaliza
nomes como o parser, sem mascarar o aviso de revisão por alteração real de nome

## Pendências externas

1. Usuário aplicar migration 005 no Supabase real pelo guia de variantes
2. Gerar e conferir backup V2 real, configurando as credenciais apenas no PC
3. Configurar .env.import privado e executar os cinco pais ocultos autorizados
4. Conferir os produtos no painel antes de ativar, retirar/revisar oferta fictícia
5. Validar toque, preparação offline e PDF/compartilhamento no Samsung real

Sem auditoria independente do Supabase remoto nesta entrega, o teste local não
substitui a conferência das permissões e configurações reais. O restante dos 85
registros ainda exige agrupamento e revisão, não foi importado

Guias: [variantes](../deployment/variantes.md),
[importação](../deployment/importacao-produtos.md) e
[backup](../deployment/backup-local.md)

## Envio remoto autorizado — 29/10/2026

Após o usuário aplicar SQL 005 e configurar os arquivos privados, o importador
aceitou o backup V2 do mesmo projeto e cadastrou os cinco pais ocultos

| Código | Produto                  | Opções / apresentação                                         |
| ------ | ------------------------ | ------------------------------------------------------------- |
| P004   | Canivete inox automático | R$ 26,91, anterior R$ 29,90, oferta fictícia oculta           |
| P005   | Processador de alimentos | V01 500 ml R$ 14,90, V02 900 ml R$ 21,90                      |
| P006   | Pano de prato            | Caixa com 12 R$ 48,90                                         |
| P007   | Coador para café         | V01 G R$ 31,80, V02 M R$ 30,60, V03 P R$ 29,40, caixas com 12 |
| P008   | Funil flexível           | R$ 8,90                                                       |

Leitura administrativa separada confirmou os cinco pais e preços, download das
seis fotos confirmou JPEG e tamanho permitido, leitura pública confirmou que
nenhum dos cinco aparece no catálogo. As etapas 1 a 3 das pendências acima foram
atendidas, continuam pendentes revisão/ativação pelo usuário e teste no aparelho real

Nenhuma alteração de frontend foi publicada, o restante dos registros não foi
importado. IDs/códigos e hashes ficam no journal privado, preservar esse registro
e o manifesto usado no envio para permitir repetição segura

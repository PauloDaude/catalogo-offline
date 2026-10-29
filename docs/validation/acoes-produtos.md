# Ações administrativas — validação de 29/10/2026

Escopo aprovado: seleção entre páginas, mostrar/ocultar em lote, exclusão individual
de ocultos e rolagem interna da listagem. Nenhuma exclusão ou migration remota
foi executada nesta entrega

## Regras implementadas

- Seleção em memória por UUID/versão, mantendo páginas e limpando ao mudar contexto
- Selecionar página marca somente a página atual, com estado parcial acessível
- Modal de ocultação lista nomes/códigos de todas as páginas selecionadas
- Lote transacional, somente active muda, versão antiga ou item inválido impede tudo
- Excluir aparece somente para ocultos, confirmação remove pai/opções na mesma transação
- Registro de importação mantém código/data de exclusão e bloqueia recriação por retry
- Fotos são preservadas, códigos não são reutilizados e revisão pública é incrementada
- Região rolável com filtros, feedback e seleção acima, paginação abaixo
- Em pouca altura, o painel alinha os controles na tela e calcula o espaço da lista,
  preservando o header acima e acesso por rolagem normal do documento

## Evidências locais

- Testes SQL falharam com RPC ausente antes da implementação, depois passaram com
  lote integral, estado misto, versão antiga, IDs repetidos/ausentes e limite de lote
- Testadas categorias arquivadas, pai sem opção ativa e autorização de visitante,
  autenticado comum e administrador, com negativas de DELETE direto
- Exclusão de simples, com variantes e importado conferida, ledger preservado e
  próxima sequência de código maior, importação repetida retorna produto excluído
- Migration 006 integral aplicada numa cópia descartável pré-006, preservando os
  produtos existentes e verificando ausência de DELETE genérico para authenticated
- Unitários completos: 47 arquivos, 173 testes aprovados
- Testes Node do importador: três aprovados, incluindo mensagem de produto excluído
- Testes Node do backup: 14 aprovados, incluindo compatibilidade V1/V2 e fotos de opções
- Navegador completo do painel: 22 testes aprovados, incluindo CRUD/categorias,
  paginação com 105 produtos e variantes
- Cenário adicional aprovado: excluir um produto de teste, sincronizar e exigir
  revisão antes de retirá-lo do total do carrinho, com foto compartilhada preservada
- Recuperação local restaurou 186 fotos com hashes iguais, Auth, RLS e sequências,
  com o SQL 006 presente no dump, sem operar sobre o projeto remoto
- Build, lint, Prettier da entrega e diff --check aprovados
- Navegador: seleção entre duas páginas com 25 produtos, cancelamento/ocultação,
  mostrar novamente, exclusão de importado com opções e conflito de edição
- Rolagem: 320×720, 800×1100, 800×360 e 1280×900, com seleção e controles efetivamente
  dentro do viewport, sem deslocamento dos filtros ao rolar a lista

## Revisão e regressões

A revisão independente encontrou um P2: altura mínima da lista em telas baixas
colocava a região e a paginação fora do viewport. O teste anterior só comparava
coordenadas após alterar scrollTop, sem exigir posição dentro da tela

O teste reforçado falhou antes da correção e passou depois, incluindo barra de
seleção ativa. O cálculo agora considera posição, paginação, espaçamento, resize e
rolagem do documento, com fallback quando ResizeObserver não está disponível

O posicionamento do input oculto do checkbox foi isolado na sua área de toque,
os testes de navegador clicam o label visível e verificam o estado acessível
Os testes antigos de confirmação/paginação usam a nova RPC e o texto sem ponto final

## Pendências externas

- Aplicar o SQL 006 no Supabase real com backup anterior conferido, conforme
  [guia de ativação](../deployment/acoes-produtos.md)
- Validar toque/teclado, paisagem e disponibilidade offline no Samsung real
- A versão publicada não acompanha a build local, publicação somente por solicitação

As fotos continuam no Storage, remoção do produto não revoga downloads ou cópias
offline existentes. A validação local não representa auditoria do projeto remoto

## Correção posterior solicitada pelo usuário — 29/10/2026

O usuário rejeitou o crescimento da região conforme a página principal rolava
Esta decisão substitui o cálculo/autoalinhamento descrito na revisão anterior

A lista agora usa somente CSS, max-height de 560 px, ou 420 px até largura de 600 px,
com overflow automático ao atingir o limite. Foram removidos listeners de scroll/
resize, ResizeObserver, cálculo pela posição na página e scrollIntoView automático

O teste de regressão falhou com altura inline calculada antes da correção e passou
após removê-la. A regressão de navegador verifica os limites fixos, altura e
scrollTop internos inalterados após scroll externo, seleção e paginação
Não se exige mais que toda a seção caiba simultaneamente no viewport

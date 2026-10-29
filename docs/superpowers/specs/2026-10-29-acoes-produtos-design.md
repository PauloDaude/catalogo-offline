# Seleção em lote, exclusão e rolagem da lista administrativa

Status: desenho aprovado pelo usuário em 29/10/2026, plano de execução em revisão, sem implementação ou alteração remota

## Pedidos confirmados

- Selecionar vários produtos para mostrar ou ocultar juntos
- Manter a seleção ao trocar de página, escolha expressa do usuário
- Produto oculto pode ser excluído definitivamente, seguindo o padrão de categorias
- Rolagem interna da listagem, mantendo os filtros disponíveis acima

## Abordagens

Foram apresentadas seleção restrita à página e seleção entre páginas, o usuário
escolheu manter a seleção entre páginas. Proposta técnica: enviar o lote em uma
transação no banco, evitando que parte dos produtos mude e outra parte falhe

## Desenho proposto

### Seleção e visibilidade

- Checkbox acessível em cada produto e Selecionar página para os 20 itens exibidos,
  com estado parcial quando apenas parte da página estiver marcada
- Barra acima da lista com N selecionados, Mostrar, Ocultar e Limpar seleção
- Seleção mantida entre páginas somente durante a sessão do painel
- Proposta: trocar pesquisa, categoria, Mostrar ou abrir edição limpa a seleção,
  evitando ações em itens que ficaram fora do contexto atual
- Ocultar abre um modal com quantidade e nomes/códigos, mostrando que o lote pode
  conter produtos de outras páginas, Mostrar segue a ação direta atual
- Alterar somente a visibilidade dos pais, preservando opções, fotos e preços
- Validar autorização, versões e condições para mostrar antes de mudar o lote,
  incluindo categoria ativa e ao menos uma opção ativa em produtos com variantes
- Conflito ou item inválido impede todo o lote, com mensagem para atualizar a lista
- Após sucesso, limpar seleção, atualizar contagem e ajustar a página se necessário

### Exclusão definitiva

- Botão Excluir disponível individualmente somente em produtos ocultos
- Modal com nome/código e aviso de remoção definitiva do produto e suas variantes,
  botão destrutivo e cancelamento, sem exclusão em lote nesta etapa
- Banco confirma que o produto continua oculto e na versão exibida, com autorização
  administrativa real e proteção contra exclusão direta de produtos visíveis
- Remover variantes e produto na mesma transação, códigos não são reutilizados
- Preservar o registro de importação como produto excluído, impedindo que repetir
  o importador recrie silenciosamente o mesmo produto
- Preservar arquivos de fotos nesta etapa, pois podem ser compartilhados por outros
  produtos/opções, a limpeza de arquivos sem vínculo fica para manutenção separada
- Carrinhos antigos seguem a revisão de disponibilidade existente, cópias offline
  são atualizadas na próxima sincronização, sem prometer revogar cópias já salvas

### Rolagem interna

- Somente a área de produtos rola, filtros e barra de seleção ficam acima,
  paginação fica abaixo, ambos fora dessa área rolável
- Altura ajustada à área disponível em celular, tablet e desktop, com acesso por
  toque, mouse e teclado, sem criar rolagem horizontal ou cortar controles
- Mudança de página ou filtro retorna a lista ao início
- Cadastro e edição mantêm seu comportamento atual, sem prender formulários nessa área

## Implementação e validação previstas

Nova migration 006 versionando funções transacionais, permissões e proteção da
importação, aplicação remota pelo usuário após ensaio local. Reutilizar React Aria,
modais e tokens existentes, sem alterar o catálogo público

Testar lote entre páginas, filtros, estados mistos, conflitos, categoria arquivada,
última opção inativa, exclusão de simples/variantes/importados, negativas de API,
fotos compartilhadas e rolagem responsiva com os controles fora da área rolável

Não inclui apagar os produtos atuais durante o desenvolvimento, importar novos
produtos, ativar ofertas fictícias ou publicar o frontend

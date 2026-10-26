# Confirmação temporária e adição direta na grade — 26/10/2026

A mensagem de sucesso salvo/atualizado desaparece após 5 segundos, com limpeza do
timer ao mudar estado/desmontar. Atualizar permanece disponível. Erros, progresso
e aviso offline permanecem, sem ocultação automática.

No modal, texto visual reduzido para Adicionar, com ícone e contador no canto.
Rótulo acessível continua descritivo, com quantidade na descrição do botão.
Na grade, o botão compacto reutiliza o mesmo componente do carrossel, recebe a
quantidade real do carrinho e fica acima do trigger de detalhes, sem aninhamento
ou propagação para a abertura do modal. Teclado e limite999 preservados.

Testes específicos cobrem tempo de 4999/5000 ms, nova confirmação, mensagens
persistentes, adição por clique/Enter na grade sem abrir diálogo, contador
compartilhado entre grade/modal/carrinho e posição superior direita no modal.

A primeira suíte unitária executada junto da build esgotou timeout em testes de
interação e deixou um teste subsequente com estado contaminado. Reexecução com
paralelismo limitado e sem alterar os timeouts é usada para verificar o resultado.
O comando `npm test -- --maxWorkers=2` passou nos 145 testes, sem alterar timeouts.
Cards estreitos passam o botão para a linha inferior para preservar preço e
desconto, com teste de regressão RED→GREEN para impedir sobreposição.
Não houve alteração remota, publicação ou envio de mensagens.

Resultado final: **145 testes unitários e 66 testes de navegador passaram**, além de
build de produção, lint, formatação e verificação de whitespace.

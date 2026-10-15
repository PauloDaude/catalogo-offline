# Revisão final da etapa 1

Revisão independente do intervalo `4bd75a7..4c30b47`, seguida de uma rodada de
correções com testes de regressão. Não houve achados críticos nem achados menores
adiados. Esta revisão não valida o Supabase, que ainda não foi implementado.

## Correções

1. Fotos em `stagedPhotos` podiam ficar abandonadas se o navegador encerrasse antes
   da limpeza. Adicionado `CatalogStore.clearAbandonedStaging()`, chamado apenas
   dentro da trava de sincronização, antes de iniciar qualquer operação nova.
   O teste `nova tentativa limpa fotos abandonadas após encerramento abrupto`
   primeiro observou uma foto abandonada e falhou; após a correção observou zero.
   A suíte completa passou com 41 testes.
2. Uma mensagem do BroadcastChannel podia mudar o estado para concluído enquanto
   a operação local continuava. Agora a revisão de outra aba é incorporada mantendo
   estado, mensagem e progresso da operação local. O teste `notificação de outra aba
   preserva sincronização local pendente` primeiro recebeu `saved` quando esperava
   `syncing`; depois passou, incluindo conclusão da revisão posterior. A suíte
   completa passou com 42 testes.

## Decisões registradas durante a execução

- Cabeçalhos de tarefas foram traduzidos para `Task`, pois os scripts Superpowers
  não reconheciam `Tarefa`. Sem mudança de comportamento do produto.
- Mantido oxlint do scaffold oficial vigente em vez de adicionar ESLint. Se regras
  específicas forem necessárias depois, será preciso configurar ou ampliar a análise.
- Fotos de demonstração são ilustrativas do Unsplash, com fontes/licença registradas.
  Não representam necessariamente a mercadoria; ignorar o aviso pode confundir a
  avaliação visual, por isso precisam ser substituídas antes do uso comercial.
- Removido o CLI shadcn depois da geração, pois introduzia uma cadeia vulnerável
  sem necessidade no aplicativo. Os componentes React Aria continuam incorporados;
  futuras adições usam CLI com versão revisada. Adaptador `cn` usa clsx/tailwind-merge.

## Pontos considerados e mantidos fora da correção

- Supabase, painel, permissões remotas e backup: excluídos da etapa 1 pelo plano.
  Custo de usar este protótipo como produção: não há gestão nem segurança remota validada.
- Android real e experiência do vendedor: precisam de aparelhos e observação real.
  Custo de presumir validação: diferenças de navegador ou dificuldades de uso podem
  aparecer em campo; roteiro permanece pendente.
- Fotos ilustrativas, oxlint e remoção do CLI: decisões documentadas, sem achado
  adicional. Custos e limites estão descritos acima.
- Metadados ativos com um Blob apagado externamente: o código não cria esse estado
  pela ativação ou limpeza transacional. Não foi acrescentada recuperação específica
  de corrupção externa neste protótipo; se ocorrer, poderá exigir limpar e preparar
  novamente o armazenamento do site, mantendo a fonte online intacta.
- Sem Web Locks, modo de desenvolvimento sem SW e HTTP por IP: condições previstas
  pelo plano. Consulta continua possível; preparo offline exige build de produção,
  navegador compatível e contexto seguro.
- Intervalo automático de 60 segundos: mantido para limitar requisições, conforme
  plano. Pode atrasar uma conferência após reconectar; o botão manual permite atualizar.

# Categorias compactas — 30/10/2026

Usuário aprovou seletor único após comparar com chips em uma faixa horizontal.
Controle com altura de 48 px, logo abaixo da busca, exibindo Todas as categorias
ou o nome escolhido. Reusa os componentes Select de React Aria do projeto.

Menu com altura limitada ao viewport e opções de pelo menos 48 px. Nomes longos
podem quebrar linha no menu; margem direita reserva o indicador de seleção.
Valor continua visível após fechar. Menu fecha ao selecionar e restaura o foco.

Estado e dados não mudaram: uma seleção compartilhada entre grade/folhear, busca
combinada, categoria da cópia offline, filtros reiniciam o carrossel e remoção da
categoria ativa retorna a Todas. Sem backend novo, dependências ou multisseleção.

Verificações: componente de seleção única/limpeza, filtros compartilhados e
renomeação, navegador com seis categorias reais em 360/800/1280 px, teclado,
controle em uma linha, alvos de toque e ausência de rolagem horizontal. Testes
anteriores de navegação, carrossel, feedback e offline atualizados para o seletor.

Hardware real continua sujeito à validação do vendedor.

Resultado final: 204 testes unitários e 36 cenários de navegador aprovados,
além de build, lint e formatação. Revisão independente sem achados confirmados;
ajustado preventivamente o espaço do checkmark para nomes longos no menu.

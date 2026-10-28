# Backup local do catálogo

Data: 28/10/2026
Status: plano aprovado pelo usuário, implementado e validado localmente em 28/10/2026

## Objetivo e abordagem

Um comando local deve salvar o banco e os arquivos do bucket product-photos,
com relatório de integridade, antes do cadastro do catálogo real. O usuário escolheu
começar pelo comando local em vez de automação externa. Usar Node e ferramentas
oficiais PostgreSQL/Supabase, sem adicionar funções ao frontend ou mudar o banco.

O script verify-local-restore.mjs é referência de ensaio, não um backup remoto:
usar --no-acl perde grants e o limite de mil fotos não cobre catálogos maiores.
Não tratá-lo como prova de recuperação do projeto real.

## Uso proposto

- npm run backup:catalog gera uma pasta datada em backups/, ignorada pelo Git
- Configuração administrativa em .env.backup, ignorada, sem prefixo VITE_; exemplo
  separado com placeholders e instruções para obter/configurar credenciais localmente
- Modo de checagem identifica ferramentas/configuração ausentes sem expor segredos
- Diretórios 0700 e arquivos 0600 no Linux, nenhum segredo em argumentos/logs,
  artefatos públicos ou metadados do backup
- Saída final informa destino, contagens e resultado; saída diferente de zero em falha

## Conteúdo e consistência

Exportar schema, dados, funções, políticas, grants e sequência de códigos, incluindo
produtos ocultos, categorias arquivadas, catalog_state e catalog_admins. Preservar o
necessário para recuperar a conta administrativa, com tratamento explícito de Auth
em vez de presumir que um dump padrão da CLI cobre os schemas gerenciados.

Incluir migrations e informações de versão do aplicativo/ferramentas; registrar
configurações de bucket necessárias para recuperação. Copiar os bytes de todas as
fotos com caminhos originais, incluindo fotos antigas/sem vínculo ainda existentes
no bucket, sem truncamento em mil itens. Nunca tratar URLs como backup das fotos.

Usar snapshots consistentes do banco. Se houver alterações relevantes durante a
exportação/download, falhar com instrução de repetir sem edições simultâneas.
Não remover dados ou fotos na origem, não executar migrations e não restaurar nada
no projeto remoto como parte do comando de exportação.

## Integridade e retenção

Gerar manifesto com hashes SHA-256, tamanhos e inventário; verificar fotos referidas
pelos produtos, contagens e arquivos obrigatórios. Criar em pasta marcada como
incompleta e só finalizar após todas as verificações. Falha preserva cópias anteriores
e identifica claramente o resultado incompleto, sem apagar backups automaticamente.

Disponibilizar npm run backup:verify -- <pasta> para detectar arquivos ausentes,
corrompidos ou manifestos inválidos localmente, sem usar credenciais do projeto.
Verificação de hashes não equivale a teste de restauração.

## Recuperação e alcance

Testar recuperação do mesmo formato em destinos locais descartáveis, incluindo
produtos, códigos/sequência, preços, ocultos, categorias, fotos e permissões.
Documentar como recuperar a autorização administrativa e eventuais configurações
que precisam ser reaplicadas no Dashboard. Testar com dados fictícios primeiro.

A primeira cópia real exige configuração local das credenciais pelo usuário;
nenhuma senha/chave administrativa deve ser enviada ao chat. Exportação real é
somente leitura e depende de credenciais/ferramentas disponíveis.

Não inclui agendamento, upload externo, retenção automática, restauração destrutiva
em produção ou interface de backup no painel. O backup local terá permissões
restritas, mas não será criptografado nesta primeira etapa; orientar criptografia
antes de copiar para um destino externo e recomendar segunda cópia independente.

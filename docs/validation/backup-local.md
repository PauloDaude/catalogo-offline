# Backup local — 28/10/2026

## Entrega

- Comandos backup:catalog, backup:catalog -- --check e backup:verify -- <pasta>
- Configuração administrativa exclusiva em .env.backup, com exemplo sem segredos
- Snapshot PostgreSQL custom com ACLs, dados públicos/ocultos, Auth, sequência,
  políticas, funções e extensões necessárias, além de definição de roles sem senhas
- Cópia dos bytes de todas as fotos do bucket product-photos, com inventário SQL
  sem o truncamento de mil linhas da Data API
- Inventário, hashes e contagens; pasta .incomplete em falha, finalização somente
  após conferência completa, sem sobrescrever/apagar cópias anteriores
- Configurações e backups ignorados no Git, fora do build e bloqueados no Vite

## Evidências

- Testes iniciais falharam antes dos módulos, depois 12/12 casos Node passaram
- Cobrem configuração ausente/insegura, projeto divergente, argumentos sem senha,
  ferramenta ausente, 1005 fotos, referências ausentes, caminho inseguro, download
  parcial/falha, corrupção, alteração concorrente, preservação de cópia anterior,
  symlink e pasta incompleta
- Ensaio de recuperação restaura o mesmo pacote em banco local descartável,
  mantendo contas Auth e UUID administrativo, produtos/preços/categorias,
  código seguinte sem reutilização, grants/RLS para três perfis e políticas Storage
- 93 fotos locais recuperadas em bucket privado temporário com caminhos e hashes
  iguais, incluindo imagem sem vínculo e produto oculto de categoria arquivada
- O primeiro ensaio encontrou schema public vazio no destino; o preparo do banco
  descartável foi corrigido, sem modificar o dump ou a origem
- Revisão independente encontrou ausência da extensão unaccent no dump seletivo:
  novo teste RED reproduziu falha da busca no banco recuperado, depois passou
  incluindo explicitamente as extensões dos schemas exportados
- Suíte de backup final: 13/13, ensaio final passou incluindo RPC do painel com
  busca sem acento para nome com acento
- Teste do Vite reproduziu leitura indevida de arquivo fictício em backups (200),
  depois comprovou bloqueio 403 tanto por URL normal quanto por /@fs, preservando
  os bloqueios padrão atuais para configuração, certificados e arquivos Git
- Verificador CLI conferiu uma cópia fictícia local já gerada, sem credenciais
- Suíte da aplicação: 155/155 passaram
- Build de produção, lint, Prettier e diff check passaram
- Inspeção do dist confirmou ausência de arquivos de backup, SQL/dumps, nomes das
  variáveis administrativas e credenciais fictícias usadas nos testes

## Decisões de implementação

- Inventário de fotos por agregação SQL em vez de paginação da API: evita limite
  PostgREST e permite comparar estado antes/depois, exige leitura de storage.objects
- Ferramentas PG17 na imagem oficial Supabase disponível localmente, com alternativa
  native; versões incompatíveis falham, não é feita atualização automática do banco
- Somente arquivos do bucket product-photos são copiados, outros buckets exigem
  processo próprio. Auth, políticas e dados administrativos tornam a cópia sensível

## Limites

Nenhuma exportação real foi executada, nenhuma credencial remota foi solicitada e
nenhum recurso externo foi criado. O usuário precisa configurar .env.backup e fazer
a primeira cópia do seu projeto conforme docs/deployment/backup-local.md.

O ensaio utiliza Supabase local existente, banco descartável e bucket privado
separado. Verifica acesso no banco com papéis/claims, não faz login pelo serviço Auth
apontando ao banco descartável. Os papéis internos já existem no cluster de teste;
roles.sql é exportado sem senhas, não é aplicado cegamente sobre o cluster gerenciado.
Recuperação de um projeto remoto precisa de plano próprio, ajustes do Dashboard e
validação dos serviços de Auth/Storage no destino antes de usar os dados reais.

SHA-256 identifica corrupção acidental, não adulteração coordenada do manifesto.
Permissões locais não são criptografia, segunda cópia criptografada ainda fica sob
responsabilidade do usuário. Sem retenção automática, agendamento ou envio externo.
As cópias fictícias locais permanecem ignoradas em backups/, para conferência.

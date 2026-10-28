# Backup local de produtos e fotos

O comando roda no seu computador e acessa o Supabase pela internet. Cloudflare
hospeda somente o frontend e não participa desse processo. É manual, sem agendamento.

## 1. Preparar as ferramentas

Na pasta do projeto, execute `npm install` se as dependências não estiverem instaladas.
Use Node 22 ou superior e Docker em execução. No Linux, a opção padrão usa a rede do
host para conectar as ferramentas PostgreSQL ao banco, sem instalar PostgreSQL no PC.

A imagem padrão é a mesma família oficial usada pelo Supabase local:

```bash
docker pull public.ecr.aws/supabase/postgres:17.11.0.004
```

Se já tem pg_dump, pg_dumpall e psql no PATH, pode usar `BACKUP_PG_TOOLS=native`.
A versão major das ferramentas deve ser igual ou superior à versão do servidor.
O Docker padrão deste comando usa `--network host` e foi validado no Linux;
para outro sistema, use as ferramentas nativas compatíveis ou adapte a rede.

## 2. Criar a configuração privada

```bash
cp .env.backup.example .env.backup
chmod 600 .env.backup
```

Abra `.env.backup` somente no editor local e preencha:

| Campo                 | Onde obter                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `BACKUP_DATABASE_URL` | Dashboard Supabase → botão **Connect** → conexão PostgreSQL **Session pooler**, porta **5432** |
| `BACKUP_SUPABASE_URL` | URL do mesmo projeto, no formato `https://PROJECT_REF.supabase.co`                             |
| `BACKUP_STORAGE_KEY`  | Settings → API Keys → Secret key ou chave legada service_role, exclusiva desse comando local   |

A chave publishable do site não tem as permissões necessárias para exportar tudo.
Não coloque essas credenciais em `.env.local`, variáveis `VITE_*`, mensagens do
chat ou no Git. O arquivo `.env.backup` é ignorado e bloqueado pelo servidor Vite.

Na URL de conexão, substitua o marcador de senha **no editor**, usando percent-encoding
nos caracteres especiais da senha, por exemplo `@` vira `%40` e `#` vira `%23`.
Não use Transaction pooler na porta 6543. Conexão direta também funciona quando o
computador consegue alcançar o endereço IPv6. A conexão remota exige TLS.
O comando confere que a referência do projeto da URL do banco corresponde à do Storage.

Não é necessário me enviar senha, chave secret ou service_role. Eles ficam no seu PC.

## 3. Conferir acesso antes de exportar

```bash
npm run backup:catalog -- --check
```

Essa checagem verifica ferramentas, versão, conexão de leitura do banco e acesso
ao bucket. Não gera cópia nem altera o projeto. Em falha, confira Docker, conexão,
versão PostgreSQL e credenciais no arquivo local; erros não imprimem respostas com
segredos. A configuração não é buscada automaticamente do frontend.

## 4. Fazer a cópia

Feche a edição de produtos/categorias e aguarde outros administradores terminarem
uploads, depois execute:

```bash
npm run backup:catalog
```

Uma pasta datada é criada em `backups/`, com acesso restrito no Linux:

- `database.dump`: dump PostgreSQL consistente em formato custom, com schema,
  dados, políticas, grants, funções, sequências e extensões dos schemas public, private,
  auth, storage, supabase_migrations e extensions
- `roles.sql`: definição dos papéis, sem senhas de papéis PostgreSQL
- `photos/products/`: bytes de todas as fotos do bucket product-photos, incluindo
  fotos antigas/sem vínculo ainda existentes, preservando nomes e caminhos
- `metadata.json`: inventário de produtos/variantes/categorias/autorizações, revisão,
  sequência, bucket e objetos, incluindo produtos ocultos e categorias arquivadas
- `migrations/`: SQL local versionado para referência
- `manifest.json`: versão do formato, origem pública, versões das ferramentas,
  commit local, contagens, tamanhos e hashes SHA-256

O arquivo do banco contém tabelas Auth, inclusive hashes de senha e dados de conta;
é material administrativo sensível. Nenhuma credencial de conexão, chave Storage
ou senha PostgreSQL é adicionada aos metadados ou manifestos.

Enquanto trabalha, o nome da pasta termina em `.incomplete`. Se algo falhar,
a pasta mantém esse sufixo e não deve ser usada como backup concluído. As cópias
anteriores não são removidas nem sobrescritas. Gere nova cópia após corrigir a causa.
Mudança de produtos ou inventário das fotos durante a execução invalida a cópia.

## 5. Conferir uma cópia depois

Use o caminho exato informado ao concluir o comando:

```bash
npm run backup:verify -- backups/NOME_DA_PASTA
```

Essa conferência funciona sem internet ou credenciais. Detecta arquivos ausentes,
corrompidos, referências sem foto e inventário inconsistente. Os hashes detectam
corrupção acidental, não provam autenticidade contra adulteração de todo o pacote.
Ela não substitui um teste de restauração.

## 6. Testar recuperação com dados fictícios

Com o Supabase **local** em execução, o comando abaixo cria dados de teste,
produz uma cópia no mesmo formato e restaura o banco em um banco descartável.
As fotos são recuperadas em um bucket privado temporário da instalação local.

```bash
npm run test:backup:restore
```

O ensaio só aceita Supabase em 127.0.0.1 e usa o container supabase_db_catalogo.
Confere produtos/preços/categorias, contas Auth, autorização do vendedor, sequência
sem reutilização de códigos, RLS de visitante/usuário comum/administrador, políticas
Storage e hashes das fotos. Limpa dados, contas, banco e bucket temporários ao final;
a cópia fictícia local fica em backups/ para permitir testar o verificador.

Esse ensaio não lê `.env.backup` e nunca restaura o projeto remoto. Login pelo
serviço Auth e upload sob RLS no projeto remoto recuperado exigem validação separada;
o ensaio verifica contas e autorização no banco, e bytes em Storage local.

## Recuperação de um projeto real

Restaurar primeiro em projeto separado, com ferramentas/versões compatíveis, e
conferir tudo antes de mudar o endereço do catálogo. Não existe comando automático
para sobrescrever produção nesta entrega.

- O dump foi validado em banco vazio, com papéis Supabase já existentes no cluster
- Um novo projeto hospedado já tem schemas e objetos gerenciados, por isso não se
  deve simplesmente executar pg_restore sobre ele sem um plano de migração
- `roles.sql` preserva definições para revisão, não execute cegamente contra o
  cluster gerenciado; papéis internos já existem e senhas de papéis não são copiadas
- Auth inclui contas e referências UUID, preservando catalog_admins; sessões,
  configurações de email, URLs de recuperação, provedores, JWT e MFA do projeto
  precisam de revisão/reconfiguração, sem prometer continuidade de sessões
- Restaurar fotos no bucket product-photos com caminhos originais e configurações
  documentadas em metadata.json, usando a API Storage em vez de apenas inserir linhas
- As migrations preservam também as políticas customizadas do Storage
- Somente os arquivos do bucket product-photos são copiados; bytes de outros
  buckets ficam fora do escopo, mesmo que suas tabelas de metadados estejam no dump
- Configurações do Dashboard, OAuth/SMTP, secrets externos, Edge Functions e schemas
  fora da lista exportada não são cobertos por esse backup do catálogo

## Frequência e proteção

Durante o cadastro inicial, faça uma cópia ao terminar cada sessão. Depois, ajuste
a frequência à quantidade de alterações que aceita perder, mantendo várias datas.

Os arquivos são privados por permissões locais, mas **não são criptografados**.
Antes de copiar para Drive, HD compartilhado ou outro destino, criptografe o pacote
com uma ferramenta de confiança e guarde a senha separadamente. Mantenha uma segunda
cópia fora desse computador; backups/ é ignorada pelo Git e não entra na publicação.

O botão Salvar offline do catálogo não substitui esse backup. Downloads também
consomem transferência do projeto Supabase; a rotina não contrata serviços nem cria
agendamento, e a exportação real depende das credenciais configuradas pelo usuário.

## Compatibilidade com variantes

Após a migration 005, novas cópias usam manifesto V2 e incluem preços, unidades,
contador de códigos e fotos exclusivas das opções. Alterações de variantes durante
uma exportação também invalidam a cópia, evitando inventário misturado

O verificador continua aceitando cópias V1 anteriores, sem inventar variantes que
não existiam nelas. Para executar o piloto de importação, gere e confira uma cópia
V2 do projeto correto após aplicar o SQL, uma cópia V1 não cobre a nova estrutura

O ensaio local também restaura um produto com variante em caixa e confere preço,
conteúdo, foto e geração do próximo código de opção sem reutilização

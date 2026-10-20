# Ativar o painel no Supabase

Implementação local em 20/10/2026. O projeto remoto **ainda não recebeu as migrations**.
Nenhuma senha administrativa precisa ser enviada pelo chat. Não publicar antes da
verificação remota. A primária aprovada é `#143B84`.

## 1. Aplicar o banco e o Storage

No Dashboard do projeto correto, abra **SQL Editor → New query**. Execute uma vez,
na ordem, o conteúdo completo destes arquivos versionados:

1. `supabase/migrations/202610200001_catalog.sql`
2. `supabase/migrations/202610200002_operations_storage.sql`

Não execute novamente migrations já aplicadas. Salve os resultados e confirme que
ambas terminaram sem erro. Se usar Supabase CLI com conexão administrativa por
ambiente protegido, prefira `supabase db push` com histórico de migrations.
Não tente aplicar DDL usando a chave publishable.

Serão criadas cinco categorias iniciais, mas **nenhum produto fictício**. As
políticas já vêm junto das tabelas e do bucket. Mantenha o schema `private` fora
dos schemas expostos pela Data API. Não habilite permissões gerais no Dashboard
para contornar erros. `catalog_admins` não é acessível aos usuários da aplicação.

## 2. Criar a conta do vendedor

Em **Authentication → Users → Add user**, crie a conta com o email e uma senha
forte, guardada pelo vendedor. Copie o **User UID** dessa conta. No SQL Editor,
substitua somente o UUID abaixo e execute:

```sql
insert into public.catalog_admins (user_id)
values ('UUID-DO-USUARIO-CRIADO');
```

Isso autoriza uma conta específica. Fazer login sem esse vínculo não dá acesso
administrativo. Para revogar, remova o vínculo por SQL administrativo e encerre
as sessões pelo Auth. Não use metadata editável pelo usuário para autorização.

## 3. Configurar o Auth

- Mantenha cadastro público e login anônimo desativados.
- Confirme login por email/senha; senha com mínimo de 12 caracteres e política adequada.
- Em **URL Configuration**, use a origem exata da aplicação como Site URL.
- Cadastre apenas retornos necessários, por exemplo:
  `http://127.0.0.1:4173/admin/recuperar-senha` e
  `http://127.0.0.1:5173/admin/recuperar-senha` para desenvolvimento.
- Em produção, adicione `https://SEU-DOMINIO/admin/recuperar-senha` exato;
  sem wildcard amplo. Confirme envio/entrega dos emails e SMTP antes do piloto.
- Ative MFA na conta do Dashboard Supabase. MFA do vendedor requer avaliar
  recuperação e facilidade de uso antes de exigir esse fluxo.

A recuperação usa PKCE. Abra o link no mesmo navegador em que o solicitou.

## 4. Configurar a aplicação

O `.env.local` ignorado pelo Git já contém a URL e a chave pública fornecidas.
As variáveis são de **Vite**, não `NEXT_PUBLIC_*`:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
VITE_CATALOG_SOURCE=demo
```

`demo` permanece como padrão até validar o backend. `/admin` usa o Supabase
configurado mesmo durante a demonstração. Depois de aplicar as migrations,
autorizar a conta e testar as permissões, altere para:

```dotenv
VITE_CATALOG_SOURCE=supabase
```

Reinicie `npm run dev` ou gere nova build com `npm run build` e `npm run preview`.
Acesse `/admin`, entre e cadastre os produtos reais. No catálogo público, use
**Salvar offline/Atualizar** para preparar a nova revisão neste aparelho.
Salvar no servidor não atualiza automaticamente uma cópia offline já preparada.
O cliente público não compartilha a sessão administrativa, mesmo com admin logado.

## 5. Verificar antes do uso real

- Teste visitante, usuário autenticado sem vínculo e administrador.
- Confira produtos ocultos, tentativas de escrita/autopromoção, RPCs e Storage.
- Bucket `product-photos`: público para imagens comerciais, JPEG até 5 MiB,
  escrita restrita; o painel otimiza a foto até 1600 px e 500 KB.
- Trocar foto cria caminho novo. Fotos antigas são mantidas para snapshots anteriores.
  Ocultar produto não torna privada uma foto já publicada.
- Confira **Security Advisor**, grants e funções. Não exponha `private` pela API.
- Verifique logout, recuperação real de senha, HTTPS, redirects e emails.
- Confirme que apenas URL/chave pública entram no build; nunca service_role/secret.
- Valide exportação/restauração em ambiente separado, incluindo fotos e códigos.
- Faça o roteiro de tablet/celular real em `docs/validation/painel-administrativo.md`.

Verificação por HTTP (cria categoria/produtos de teste reversíveis no projeto
indicado, sem criar usuários remotamente):

```bash
node scripts/verify-supabase-access.mjs
```

Configure `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY`,
`SUPABASE_TEST_ADMIN_EMAIL`, `SUPABASE_TEST_ADMIN_PASSWORD`,
`SUPABASE_TEST_USER_EMAIL`, `SUPABASE_TEST_USER_PASSWORD` por ambiente protegido,
com contas de teste previamente criadas. Não salve esses valores em arquivos
versionados ou logs. Faça isso em projeto de teste antes do projeto real.

## Desenvolvimento e reprodução local

Requer Docker. O CLI está no `devDependencies` e usa configuração versionada:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
npx supabase db lint
node scripts/verify-supabase-access.mjs --local
node scripts/test-admin-local.mjs
node scripts/verify-local-restore.mjs
```

`db reset` apaga **o banco local**; não use flags de remoto nesse comando.
Os scripts com `local` só provisionam contas usando a chave administrativa do
ambiente `127.0.0.1`; ela nunca entra no frontend ou no repositório. Os testes do
painel geram uma build isolada, sem substituir o preview público na porta 4173.
Resultados/backup ficam em `.superpowers/`, ignorado pelo Git. Backups usam
permissões restritas e podem conter contas, ocultos e outros dados administrativos;
não envie para Sites nem bucket público. Encerre os containers com `npx supabase stop`.

## Exportação e restauração

Para operação real, mantenha backup Postgres (schema, dados, grants, funções,
sequência de códigos e autorização) e exportação dos bytes do Storage. Um dump do
Postgres **não contém os arquivos das fotos**. Metadados do bucket não bastam.
Proteja e criptografe o destino, restrinja acesso e defina retenção fora da aplicação.

Restaure primeiro em projeto separado, com os papéis/extensões compatíveis;
restaure as fotos no mesmo bucket/caminhos imutáveis e confira hashes, códigos,
revisão, vínculos e acesso dos três papéis. Não sobrescreva o banco em uso para
ensaiar. O script local demonstra esse processo com banco descartável e bucket
privado temporário; a validação no projeto remoto continua necessária.

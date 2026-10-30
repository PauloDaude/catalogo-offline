# Importação piloto da conversa

O JSON comercial revisado está em `docs/produtos/produtos-revisao.json`, o lote
limitado está em `docs/produtos/piloto-variantes.json`. As fotos originais ficam
em `docs/produtos/imagens/`, sem edição ou exclusão pelo importador

## Lote autorizado

| Produto                  | Opções e preço de venda                                  |
| ------------------------ | -------------------------------------------------------- |
| Canivete inox automático | R$ 26,91, anterior R$ 29,90, oferta demonstrativa oculta |
| Processador de alimentos | 500 ml R$ 14,90, 900 ml R$ 21,90                         |
| Pano de prato            | Caixa com 12 unidades R$ 48,90                           |
| Coador para café         | Caixa com 12, G R$ 31,80, M R$ 30,60, P R$ 29,40         |
| Funil flexível           | Unidade R$ 8,90                                          |

São cinco produtos principais e oito itens vendáveis, todos **ocultos**. O desconto
do canivete serve apenas ao teste, o preço comercial original continua R$ 29,90 no
JSON principal. Não mostrar essa oferta ao público sem revisar o preço comercial

## Preparação

1. Aplique a migration 005 conforme [variantes.md](variantes.md)
2. Gere e confira um backup V2 real do mesmo projeto, o comando rejeita uma cópia
   V1 ou de outra origem como autorização para esse piloto
3. Garanta Node 22+, Python 3 e Pillow, usado para preparar JPEG com até 1600 px e
   500 KB, mantendo as imagens originais
4. Crie o arquivo privado e preencha-o **somente no editor local**:

```bash
cp .env.import.example .env.import
chmod 600 .env.import
```

Use a URL e chave publishable do mesmo projeto, email/senha da conta já autorizada
como administradora e o caminho da cópia V2 em `IMPORT_BACKUP_DIR`. Não precisa de
service_role para importar, nunca envie a senha pelo chat ou use variáveis VITE

## Executar

```bash
npm run import:catalog -- --dry-run
```

Confere o manifesto, preços, imagens e limites sem credenciais, upload ou escrita
remota. Com os pré-requisitos atendidos, execute o lote:

```bash
npm run import:catalog -- --pilot
```

O comando entra com a conta configurada, confere autorização, categorias e backend
V2, prepara e envia as fotos antes de cadastrar os produtos pela RPC transacional
As categorias Cozinha e Ferramentas devem existir e estar ativas

## Repetir após falha

O registro privado `.catalog-import/` guarda caminhos, hashes, UUIDs e resultado,
sem tokens ou senhas. Preserve-o para retomar, repetir `--pilot` confere os registros
no servidor e não cria outros cinco produtos. Conteúdo diferente com a mesma chave
é bloqueado, não apague o registro para contornar a divergência

O banco também guarda a chave/hash de importação, protegendo o caso em que a
requisição conclui, mas a resposta não chega ao computador. Fotos são enviadas sem
sobrescrever arquivos existentes e conferidas por hash em uma retomada

Confira no painel **Mostrar → Todos** os códigos, nomes, fotos e preços retornados,
além das opções e do conteúdo das caixas. O comando não publica a build nem importa
os demais registros da conversa, a ativação dos produtos exige revisão posterior

## Lote completo — 29/10/2026

Preparação em `docs/produtos/lote-completo-20261029.json`: 48 pais, 85 escolhas,
67 fotos WebP e seis categorias. Preços comerciais preservados, canivete R$ 29,90,
sem oferta fictícia. O usuário confirmou todos visíveis e aprovou os quatro casos comerciais antes
do primeiro envio, conforme a revisão legível do lote completo.

O novo executor é separado do piloto:

```bash
node scripts/import/full-import.mjs --dry-run
node scripts/import/full-import.mjs --check
node scripts/import/full-import.mjs --full
node scripts/import/full-import.mjs --verify
```

`--dry-run` confere cobertura, fotos e hashes sem rede. `--check` autentica e
confere por leitura o banco e o backup V2. `--full` cria/reutiliza categorias ativas,
envia WebP antes de cada produto e confere o resultado. `--verify` só lê os dados
remotos e baixa fotos para conferir hashes e MIME, sem cadastrar/alterar registros.

Chaves `lote-completo-20261029-v1:*` e subpasta de journal exclusiva não modificam
o piloto. O manifesto fica imutável após o início: não trocar visibilidade, nomes,
preços ou agrupamento para contornar conflito. Ajustes posteriores usam o painel.
Retries com o mesmo manifesto/journal conferem conteúdo, não duplicam o lote.
Categorias arquivadas com o mesmo nome bloqueiam a operação para revisão.

Não apaga fotos antigas, não reinicia sequência de códigos, não publica frontend.
Backend precisa da migration009 e frontend atualizado para mostrar fotos WebP.

# Validação — WebP e categorias, 29/10/2026

## Escopo e dados

Preparação local e futuros uploads, sem migração de fotos online
Nenhum produto/categoria criado no remoto, nenhuma publicação ou limpeza
Lote completo aguarda confirmação explícita do usuário após limpar o banco

67 fotos comerciais: 6.936.215 → 4.480.384 bytes (35,4% de redução)
10 fotos demo: 858.513 → 434.186 bytes (49,4%)
Total 77: 7.794.728 → 4.914.570 bytes (36,95%), nenhuma saída maior
Originais preservados, todos os pares de hashes conferidos, repetição reproduzível
Inspeção visual comparativa da lanterna preservou leitura da embalagem

85 registros categorizados em seis grupos, ainda sem agrupamento final de variantes
Campos comerciais preservados por comparação com o JSON revisado
Manifesto piloto idêntico ao HEAD anterior, journals não alterados

## Verificações

- Python: 4 testes, conversão real, orientação, dimensões, colisões e repetição
- Backup Node: 15 testes, incluindo JPEG/WebP e rejeição de SVG
- Importador: 3 testes, piloto e idempotência preservados
- Supabase local: JPEG/WebP, foto própria de variante, permissões de visitante,
  autenticado comum e administrador, bloqueio de MIME/caminhos indevidos
- Painel no navegador: 25 testes aprovados
- Catálogo no navegador: 74 testes aprovados, incluindo offline, reabertura,
  falha de sincronização, carrinho, PDF com fotos WebP e viewports responsivos
- Restauração local: 255 fotos com hashes iguais, Auth, autorização, sequência
  e RLS conferidas em três perfis, inclui JPEG e WebP real

A revisão independente identificou um guard HTTP da demo restrito a JPEG
Teste reproduziu a falha, correção centralizou o guard e os 19 testes da fonte
passaram, incluindo bloqueio de caminho remoto/externo na fonte demo
O decoder offline também passou a conferir assinatura RIFF/WEBP e decodificação
Arquivos apenas rotulados como WebP continuam rejeitados

- Vitest: 190 testes em 49 arquivos aprovados com dois workers e timeout de 15 s
- Build de produção demo e TypeScript aprovados
- Suítes iniciais concorrentes excederam o timeout padrão de 5 s, repetição completa
  com concorrência limitada e margem de tempo passou sem alterar código de produção

## Limites reais

Migration 009 executada apenas localmente, aplicação no projeto remoto pendente
Teste de navegador usa emulação de viewport, não substitui tablet/celular físico
Compartilhamento nativo depende de navegador e sistema operacional
Teste de restauração usa banco e bucket descartáveis locais, não restaura produção
Backups fictícios dos testes em backups/ não substituem o backup remoto do usuário
O importador do piloto continua JPEG, o manifesto final WebP é trabalho posterior
Não considerar o JSON preparado como autorização de importação

# Backup local — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para execução direta após aprovação

**Goal:** Criar comando local verificável para exportar banco e fotos do catálogo

**Architecture:** Orquestrador Node separado do frontend usa ferramentas oficiais
para dump PostgreSQL e cliente Storage para fotos, com credenciais locais protegidas.
Manifesta hashes e só finaliza o backup quando banco e fotos estiverem completos

**Tech Stack:** Node, PostgreSQL/Supabase CLI, Supabase Storage, node:test e Docker
para teste isolado de recuperação, sem dependências de frontend novas

**Spec:** docs/superpowers/specs/2026-10-28-backup-local-design.md

## Global Constraints

- Somente leitura da origem, sem migrations ou restauração remota
- Credenciais locais sem VITE_, sem log e sem argumentos visíveis dos subprocessos
- backups/ e .env.backup fora do Git e das builds públicas
- Preservar códigos, ocultos, fotos, permissões e autorização administrativa
- Não publicar online ou criar automação externa

## Review Focus

- Mais de mil objetos ou fotos ocultas não podem ser ignorados
- Arquivo faltante/corrompido e download parcial impedem conclusão
- Edição concorrente deve invalidar a cópia em vez de misturar versões
- Segredos não podem aparecer em erros, manifestos ou argumentos de processos
- Restaurar dados sem grants/conta/sequência não comprova recuperação

### 1. Configuração e exportação do banco

**Files:** scripts/backup/catalog-backup.mjs, scripts/backup/config.mjs,
scripts/backup/database.mjs, scripts/backup/backup.test.mjs,
.env.backup.example, .gitignore e package.json

**Interfaces:** npm run backup:catalog e modo --check; módulos recebem configuração
validada e destino privado, retornam inventário sem credenciais

- [x] Criar testes de configuração ausente, destino seguro, sanitização de erros,
      falha de subprocesso e indisponibilidade das ferramentas
- [x] Confirmar falhas antes de implementar
- [x] Escolher invocação oficial compatível com ferramentas locais; testar passagem
      de credenciais por ambiente/arquivo protegido, nunca por argumento com senha
- [x] Implementar dump restaurável com roles/schema/data e tratamento explícito
      de Auth, Storage, grants e sequência; guardar versões e migrations no pacote
- [x] Testar contra banco local, incluindo dados ocultos, categoria arquivada e
      conta administrativa, sem usar credenciais remotas

### 2. Fotos e verificação de integridade

**Files:** scripts/backup/storage.mjs, scripts/backup/manifest.mjs,
scripts/backup/verify.mjs, scripts/backup/backup.test.mjs e package.json

**Interfaces:** downloader inventaria bucket completo e grava caminhos validados;
backup:verify -- <pasta> valida manifesto/arquivos sem rede ou credenciais

- [x] Criar testes de mais de 1000 objetos, caminhos inválidos, download parcial,
      arquivo corrompido, referência de produto ausente e alteração durante execução
- [x] Confirmar falhas antes de implementar
- [x] Baixar fotos com paginação completa e conferir SHA-256, tamanho e referências
- [x] Criar manifesto versionado, estado incompleto e finalização somente após
      sucesso; preservar backups anteriores sem sobrescrita ou remoção automática
- [x] Implementar verificação offline de pacote e mensagens simples, sem segredos
- [x] Executar testes e comprovar falha correta nos cenários de corrupção

### 3. Ensaio de restauração e documentação

**Files:** scripts/backup/test-restore-local.mjs, docs/deployment/backup-local.md,
docs/validation/backup-local.md, README.md e AGENTS.md

**Interfaces:** ensaio aceita somente destinos locais descartáveis; jamais usa a
origem como destino e nunca altera o projeto remoto

- [x] Restaurar o formato gerado em ambiente local separado e conferir contagens,
      preços, códigos, nova atribuição de código sem reutilização e vínculo de categorias
- [x] Recuperar fotos com caminhos/bytes iguais e verificar permissões/RLS com
      visitante, autenticado comum e administrador, além do acesso do vendedor
- [x] Documentar dados/configurações incluídos e excluídos, setup de credenciais
      pelo usuário e limites reais; backup:verify não substitui restauração
- [x] Documentar primeira execução real, frequência sugerida, proteção local e
      segunda cópia criptografada, sem configurar serviço externo
- [x] Rodar testes Node, ensaio local, lint, Prettier, build e inspeção de artefatos
      para garantir que os backups/segredos não entram no frontend
- [x] Revisão independente final, registrar evidências e commit local somente dos
      arquivos desta entrega, sem push/publicação e preservando alterações existentes

Execução direta concluída localmente, evidências em docs/validation/backup-local.md.
Primeira exportação do projeto real depende de configuração local das credenciais pelo usuário.

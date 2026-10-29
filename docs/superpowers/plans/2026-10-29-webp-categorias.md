# Preparação WebP e categorias — plano de execução

**Goal:** Entregar imagens WebP e JSON categorizado para revisão, habilitando novos
uploads WebP sem perder JPEGs existentes ou antecipar o lote completo

**Spec:** docs/superpowers/specs/2026-10-29-webp-categorias-design.md
**Método:** execução direta solicitada pelo usuário, dados locais e SQL de ativação
**Stack:** Pillow local, React/TypeScript, Supabase, Dexie, Vitest/Playwright

## Restrições

- Preservar originais, preços, nomes, caixas, IDs e manifesto/journal do piloto
- Nenhum upload real, limpeza, criação remota de categorias ou publicação
- Avisar antes do lote completo e aguardar usuário confirmar limpeza concluída
- JPEG legado continua válido, não permitir PNG/SVG/HTML no bucket comercial

## Tarefas

1. [x] Conversor reproduzível em scripts/images/convert_webp.py, testes Python antes
       da implementação: formato/dimensões, origem intacta, colisão e repetição
       Executar sobre 67 fotos de docs/produtos e 10 da demo, conferir relatório e visual
2. [x] Criar docs/produtos/categorias.json e produtos-preparados.json com vínculos dos 85
       registros, revisar fronteiras de uso e validar preços/IDs/caixas contra origem
3. [x] Testar e adaptar src/admin/products/photo.ts para WebP real, detecção de fallback
       PNG do canvas, 1600 px/500000 bytes, src/admin/api.ts deriva extensão/MIME do Blob
       Atualizar caminho/parser e backup para jpg|webp, mantendo legado e fotos demo
4. [x] Migration 009: constraints de products/product_variants, MIME do bucket e políticas
       de insert/delete com UUID.jpg|webp, autorização e demais grants preservados
       Testar API local em 3 perfis, MIME indevido, foto de variante e caminho inválido
5. [x] Atualizar demo para WebP com revisão maior, manter URLs JPEG antigas; validar
       navegador/admin/offline/PDF, backup/verificação e recuperação com WebP real
6. [x] Documentar SQL009 e resultado/categorias/economia, revisão independente final,
       unitários, lint/build/format/diff, commit local apenas dos arquivos desta entrega

## Review Focus

- WebP deve ser bytes WebP de verdade, não extensão sobre PNG/JPEG retornado pelo canvas
- Produtos e variantes atuais, cópias V1/V2, PDF e backups JPEG continuam funcionando
- Manifesto piloto/journal imutáveis, catálogo completo continua aguardando limpeza
- Nenhuma informação comercial muda ao anexar categoria ou trocar referência de foto
- Storage continua negando não administradores e formatos fora da lista permitida

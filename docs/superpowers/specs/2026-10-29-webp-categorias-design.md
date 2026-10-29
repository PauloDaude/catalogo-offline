# WebP e categorias do lote real

Escopo confirmado pelo usuário em 29/10/2026: converter fotos locais, usar WebP nos
próximos uploads e classificar todos os produtos em categorias coerentes
O usuário limpará o banco antes do lote completo, avisar e aguardar confirmação
antes de qualquer importação, sem limpeza ou migração das fotos já no Supabase

## Dados e imagens

- Gerar WebP das 67 fotos do vendedor e 10 imagens da demo, mantendo todos os JPEGs
- Parâmetros técnicos: até 1600 px, qualidade inicial 82, limite 500000 bytes por imagem,
  orientação corrigida e sem ampliação, reduzir qualidade se o limite exigir
- Relatório reproduzível com caminhos, dimensões, bytes e hashes, sem sobrescrever originais
- JSON preparado separado com 85 registros, referências WebP e categorias, preservando
  IDs, nomes, preços, caixas, origens e pendências do JSON revisado
- Não mudar manifesto/journal do piloto importado, retry deve continuar compatível

## Próximos uploads e consulta

- Painel gera WebP com MIME correspondente, novas fotos usam UUID.webp
- Caminhos e Storage aceitam JPEG legado e WebP, preservando autorização e restrições
- Demo passa a referenciar WebP, mantém JPEGs para compatibilidade de URLs/cópias antigas
- Fotos WebP permanecem offline, carrinho e PDF; PDF converte a foto localmente para
  o formato interno já utilizado, sem mudar o formato das fotos do catálogo
- Backup aceita os dois formatos e conserva bytes/MIME na recuperação
- Migration 009 entregue para aplicação pelo usuário, sem alterações remotas automáticas

## Categorias

Seis grupos por finalidade comercial, evitando uma categoria para cada família:
Casa e cozinha, Beleza e higiene, Costura e papelaria, Elétrica e iluminação,
Ferramentas e acessórios e Lazer. Lista e vínculos completos em JSON para revisão
Contagens são dos 85 registros, antes de agrupar variantes em produtos principais

## Fora desta entrega

Nenhuma importação completa, exclusão de dados reais, criação remota de categorias,
conversão do Storage existente, publicação do frontend ou descarte dos originais

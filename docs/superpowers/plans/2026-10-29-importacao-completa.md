# Importação completa dos produtos

Execução direta solicitada pelo usuário em 29/10/2026, após confirmar limpeza.

**Objetivo:** enviar as seis categorias e os 85 registros comerciais com variantes,
preços normalizados e fotos WebP, incluindo os antigos produtos do piloto.

**Arquitetura:** manifesto novo, chaves e journal separados do piloto, reuso da
RPC import_product_v2 e da autenticação administrativa existente, sem mudar banco.

**Restrições:** sem publicar frontend, sem apagar fotos ou resetar códigos, sem
oferta fictícia, credenciais somente no arquivo privado, conferir backup V2 real.
Usuário confirmou todos visíveis e aprovou os quatro casos comerciais em 29/10/2026.

- [x] Gerar manifesto agrupado, com rastreabilidade dos 85 IDs e fotos/preços mantidos
- [x] Testar cobertura, caixas, imagens WebP, retry e compatibilidade do piloto
- [x] Ampliar importador para novo modo --full, criar/reutilizar categorias por nome
- [x] Conferir backup e backend remoto, testar sem escrita antes do envio
- [x] Após respostas comerciais, enviar lote, com idempotência conferida em testes de repetição
- [x] Ler produtos/variantes/fotos de forma independente e registrar evidências

# Pedido em PDF e compartilhamento — Cirandinha

Status: design e plano aprovados pelo usuário, implementação local em 24/10/2026, validação Android pendente

## Objetivo e decisões confirmadas

O vendedor monta o carrinho, informa o cliente, gera um PDF bonito e compartilha
pelo menu nativo do celular/tablet, com WhatsApp entre os destinos instalados.
Não haverá histórico de pedidos nem armazenamento de PDFs no servidor nesta etapa.
Vendedor fixo: **Antônio Marcos Daúde**. Usar a logo existente da Cirandinha e
primária **#143B84**, preservando o tema claro e React Aria.

Referência visual lida: `/home/paulo/Downloads/Pedido_112007097-1.pdf`, duas páginas
A4 paisagem com identificação, tabela de produtos com fotos e total. A referência
não será copiada para public/ nem publicada, nem seus dados comerciais reutilizados.

## Fluxo proposto para aprovação

1. Carrinho com itens apresenta **Gerar pedido em PDF**
2. Um formulário pede **Nome do cliente** (obrigatório) e **Observações** (opcional)
3. **Gerar PDF** captura os itens e valores revisados, mostra progresso e produz arquivo
4. O mesmo modal passa a **Pedido pronto**, com resumo do cliente/total,
   **Compartilhar PDF**, **Baixar PDF** e **Voltar ao carrinho**
5. Compartilhar abre o menu do sistema, nunca envia automaticamente para alguém
6. Baixar funciona como alternativa quando compartilhar arquivos não é suportado

O carrinho não será limpo ao gerar, baixar, compartilhar ou cancelar. Cliente,
observações e arquivo ficam somente em memória enquanto o fluxo está aberto.
Fechar o fluxo descarta o arquivo e retorna ao carrinho; não apagar downloads do usuário.
Não haverá cadastro de clientes. Modificar o carrinho ou receber uma atualização
relevante durante geração/resultado invalida o arquivo para nova geração, sem
reutilizar silenciosamente preços anteriores. Mudanças de preço/disponibilidade
pendentes continuam exigindo a confirmação já existente no carrinho.

## PDF proposto

- A4 retrato, margens de 15 mm, layout claro com azul Cirandinha e linhas alternadas suaves
- Cabeçalho com logo proporcional, “Pedido de venda” e vendedor Antônio Marcos Daúde
- Bloco com cliente e data DD/MM/AAAA, no fuso America/Araguaina, capturada ao gerar
- Tabela: foto, código (#P001), produto, quantidade, preço unitário e subtotal
- Valor atual efetivo do carrinho, sem preço riscado ou promoção duplicada
- Rodapé com página X de Y e “Documento comercial, não é nota fiscal”
- Total geral em destaque ao fim da tabela, seguido das observações se preenchidas
- Repetir cabeçalho da tabela nas páginas seguintes, sem cortar linhas/fotos
- Logo e fotos em proporção original, sem distorção; imagem ausente usa espaço
  identificado como “Sem foto”, sem impedir o pedido
- Nomes e observações quebram linhas; fonte local com acentos portugueses
- Sem número sequencial de pedido, assinatura, NCM, endereço ou dados bancários

Propostas técnicas do implementador, sujeitas à aprovação: cliente até 120 caracteres,
observações até 1000, data não editável; nome do arquivo
`pedido-cirandinha-AAAA-MM-DD-HHmmss.pdf`, sem nome do cliente no arquivo.
Não alegar que compartilhar entregou a mensagem ao destinatário.

## Consistência, privacidade e offline

Bloquear geração se carrinho vazio, catálogo ainda não disponível, alterações
pendentes, item indisponível ou total inválido. Orientar revisar/remover itens.
Totais calculados em centavos inteiros seguros, conferidos contra o carrinho.
A geração utiliza snapshot imutável e URLs de fotos da sessão; nenhuma Blob URL
vai para armazenamento persistente. Não adicionar endpoint ou tabela Supabase.

Gerar PDF offline após preparação do catálogo: biblioteca, fonte, logo e código
necessários devem entrar no precache Workbox, fotos vêm da cópia local já existente.
Sem fonte remota, CDN de bibliotecas ou serviço externo de geração. Processar
imagens uma por vez, com tamanho de miniatura limitado, para conter uso de memória.
Compartilhar no WhatsApp pode exigir internet no aplicativo de destino.

Web Share exige HTTPS/navegador compatível e ação explícita. O arquivo estará pronto
antes de habilitar o botão; chamar navigator.share diretamente no clique sem
aguardar geração ou fetch. Consultar navigator.canShare({files}) e oferecer download
quando indisponível. Cancelamento do menu nativo não é erro, falhas reais mostram
orientação e preservam arquivo/alternativa de download.

## Limites desta entrega

Somente geração e compartilhamento de PDF, documentação e testes associados.
Link de acesso ao painel e paginação administrativa permanecem no próximo plano
próprio. A migração de hospedagem para `cirandinha.daude.dev` também é separada,
sem publicação, alteração DNS ou configuração remota nesta entrega.
Backup próprio e análise de public.rls_auto_enable() continuam pendências independentes.
Texto para WhatsApp fica como possível evolução, sem duplicar o escopo agora.

## Referências técnicas verificadas

- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- https://pdf-lib.js.org/docs/api/classes/pdfdocument

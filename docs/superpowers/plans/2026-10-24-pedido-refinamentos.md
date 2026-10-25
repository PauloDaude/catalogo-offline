# Refinamentos do pedido — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans, execução direta aprovada

**Goal:** Melhorar reconhecimento do PDF, reuso da sessão, compartilhamento e feedback do carrinho

**Spec:** docs/superpowers/specs/2026-10-24-pedido-refinamentos-design.md

## Task 1: Documento, prévia e envio em texto

- [x] Testar fonte bold usada nos headers e arquivo mantido válido
- [x] Acrescentar Noto Sans Bold oficial, licença e precache
- [x] Adicionar pdfjs-dist, renderizador local da primeira página com worker e cleanup,
      imagem de prévia limitada em resolução e todos os recursos precacheados
- [x] Testar formatação WhatsApp (valores, nome, acentos, notas, destino exato)
- [x] Implementar mensagem em src/orders/whatsapp.ts, sem envio automático ou upload

## Task 2: Sessão de pedido e interface

- [x] Escrever testes de fechar/voltar/reabrir sem gerar novamente, invalidação ao
      mudar seleção e limpeza total do carrinho; sessão somente em memória
- [x] Elevar estado de draft/arquivo/preview para CartPanel via useOrderSession
- [x] Integrar preview real recortada, metadados, botões vermelhos com PdfIcon
- [x] Manter share nativo direto com arquivo pronto, botão explicativo sem suporte
- [x] Adicionar ação secundária WhatsApp via link codificado e texto revisado
- [x] Testar erro de preview sem impedir download/compartilhamento, retomada,
      cancelamento, foco, ausência de suporte e alterações de outra aba

## Task 3: Feedback ao adicionar e validação

- [x] Testar componente AddToCartButton: contador real, limite999 e feedback +1
- [x] Integrar no carrossel e detalhes, sem botão extra na grade
- [x] Estilizar animação e reduced motion, evitar overflow e cliques indevidos
- [x] Verificar geração/preview offline após reabrir, sessão preservada, screenshots
      mobile/tablet e PDF com cabeçalhos bold; WhatsApp apenas interceptado em teste
- [x] Rodar unitários, E2E, build, lint, formatação; revisão final independente
- [x] Documentar evidências e limitações físicas, commitar somente arquivos da entrega

## Restrições

Não publicar nem enviar mensagem real, preservar as alterações anteriores locais.
Telefone mantido exatamente como fornecido, compartilhamento de arquivos depende
realmente do navegador. Sem alteração de preço para contornar atualização pendente.

## Conclusão local

139 testes unitários e 65 testes de navegador passaram. Os10 testes de pedido
foram repetidos após o ajuste do ícone + com contador. Revisão independente sem
bloqueios restantes, detalhes cosméticos próprios corrigidos com regressões.
Preview/worker/fontes conferidos offline e PDF renderizado com ambos os pesos.
Menu nativo Samsung/WhatsApp e mensagens muito extensas continuam no roteiro real.
Sem publicação online ou envio real de mensagens.

# Validação do protótipo offline

Entrega da etapa 1, com dados fictícios. Data de referência: 14/10/2026.

## Evidências verificadas nesta sessão

| Verificação                        | Resultado                                                     |
| ---------------------------------- | ------------------------------------------------------------- |
| `npm run test`                     | 42 testes passaram                                            |
| `npm run lint`                     | Sem erros                                                     |
| `npm run build`                    | TypeScript, frontend e Service Worker compilados              |
| `npm run test:e2e`                 | 12 testes passaram no Chromium                                |
| Auditoria de dependências          | Sem vulnerabilidades conhecidas após remover o CLI de geração |
| Dependências Radix                 | Não instaladas                                                |
| Requests externos no fluxo inicial | Nenhum no caso automatizado                                   |

O build emite um aviso de depreciação `inlineDynamicImports` originado pelo
vite-plugin-pwa ao compilar o Service Worker. A compilação termina com sucesso.
Playwright emite avisos de configuração de cores do terminal, sem falha nos testes.

## Casos cobertos

- Pesquisa tolera acentos, caixa e espaços e combina com categoria.
- Snapshots inválidos não substituem os dados válidos.
- Reabertura de IndexedDB recupera produtos e bytes das fotos.
- Foto ausente, rollback por quota e preparação interrompida mantêm a cópia anterior.
- JPEG inválido, HTML com MIME de imagem e falha de decodificação são rejeitados.
- Revisão instável encerra após três tentativas, sem ativação incompleta.
- Primeiro acesso online não baixa todas as fotos por conta da sincronização.
- Armazenamento negado permite continuar com consulta online.
- Interface verificada em 360×800, 800×1280 e 1280×800, sem overflow horizontal.
- Ações principais verificadas com altura mínima de 48 CSS px.
- Foto ampliada fecha e devolve foco ao botão de origem.
- Fechar/reabrir página offline mantém os dez produtos, fotos, pesquisa e ampliação.
- Reiniciar o navegador com perfil persistente offline mantém as dez fotos.
- Cache Storage não contém `/demo/`: o teste offline depende de IndexedDB para dados/fotos.
- Duas abas ativam a mesma nova revisão, com preço, foto e ocultação coerentes.
- Fotos de preparação abandonada por encerramento abrupto são limpas antes de
  uma nova operação, sob a trava exclusiva.
- Uma notificação atrasada de outra aba incorpora a revisão disponível sem
  declarar concluída uma sincronização local que ainda está pendente.
- Foto corrompida impede atualização; versão anterior continua disponível offline.
- Texto com markup é apresentado como texto, sem interpretar HTML.

Capturas de tela foram inspecionadas em celular e desktop durante a implementação.
Fotos são ilustrativas: essa verificação não valida correspondência entre foto e mercadoria.

## Validação pendente nos aparelhos reais

Não há evidência nesta sessão de teste no tablet Samsung, no celular do vendedor
ou com o próprio vendedor. Não considerar este protótipo validado para uso em campo.

Preencher ao testar:

| Aparelho       | Modelo        | Android       | Navegador/versão | Web Locks | Resultado |
| -------------- | ------------- | ------------- | ---------------- | --------- | --------- |
| Tablet Samsung | Não informado | Não informado | Não informado    | Pendente  | Pendente  |
| Celular        | Não informado | Não informado | Não informado    | Pendente  | Pendente  |

- [ ] Abrir em HTTPS ou localhost via depuração USB.
- [ ] Salvar o catálogo e aguardar a confirmação das dez fotos.
- [ ] Ativar modo avião, fechar e reabrir a PWA; conferir todos os produtos e fotos.
- [ ] Pesquisar um produto, mudar categoria e ampliar foto sem rede.
- [ ] Testar retrato e paisagem, com teclado virtual aberto na pesquisa.
- [ ] Bloquear a tela no meio do download e retomar: não deve declarar preparo incompleto como sucesso.
- [ ] Voltar à rede e atualizar uma revisão nova do catálogo fictício.
- [ ] Confirmar funcionamento no Chrome e no Samsung Internet utilizado pelo vendedor.
- [ ] Pedir ao vendedor para localizar três produtos sem ajuda contínua e registrar dificuldades.

Depois desses testes, ajustar a experiência conforme observações e planejar a
integração de Supabase e gerenciamento. Não coletar credenciais em documentos de validação.

## Revisão independente final

Uma revisão de código encontrou dois problemas relevantes: Blobs abandonados após
fechamento abrupto e notificação entre abas sobrescrevendo o estado de sincronização.
Ambos receberam testes que falharam antes da correção e passaram depois, com a suíte
completa novamente verde. Detalhes e decisões em `final-review.md` nesta pasta.

# Validação — painel administrativo

20/10/2026. Fonte remota não ativada no projeto real. Sem publicação no Sites.

## Implementado

- Login por email/senha, recuperação PKCE, autorização explícita por UUID e logout.
- `/admin` separado do catálogo; sessão administrativa não é usada pela fonte pública.
- Produtos: criar, editar nome/preço/oferta/categoria/foto, ocultar e reexibir.
- Código automático único imutável por sequência; edição com versão esperada.
- Fotos JPEG até 1600 px/500 KB; caminho novo a cada troca, sem apagar antigas.
- Categorias: criar, renomear, arquivar/reativar; banco impede arquivar com ativos
  e reexibir sob categoria arquivada, com trava transacional.
- RLS/grants mínimos, helper privado, snapshot público SECURITY INVOKER,
  bucket público comercial com escrita restrita e sem sobrescrita de objetos.
- Fonte demo explícita, categorias dinâmicas e compatibilidade com snapshot antigo.

## Evidências locais

- Testes SQL vistos falhar em banco vazio e passar após migrations: **20/20**.
- API HTTP real local: visitante, comum e administrador. Leitura pública/ocultos,
  autopromoção, criação/edição, conflito, snapshot, upload JPEG válido, MIME/tamanho/
  caminho indevidos e sobrescrita recusados; remoção comum não apaga os bytes.
  DELETE definitivo negado inclusive ao administrador; RPCs de gestão negadas
  ao usuário comum e edição de produto público não autorizada recusada.
- Cadastros paralelos geram códigos distintos; corrida entre arquivar e reexibir
  não permite estado ativo em categoria arquivada.
- `supabase db lint`: sem erros de schema.
- Unitários/componentes: **96/96**. Build TypeScript/Vite e lint aprovados.
- Navegador administrativo com backend local real: criar categoria/produto, oferta,
  trocar foto, editar, ocultar/reexibir, bloquear arquivamento e logout nos tamanhos
  320×720, 360×800, 800×1100, 1280×900, 800×360; conflito conserva os campos.
- Recuperação: envio no Mailpit e retorno PKCE autenticado ao formulário da nova senha.
  Confirmado login por email ativo e cadastro público bloqueado.
- Backup: dump completo restaurado em banco descartável, contagens/revisão/códigos
  conferidos; dez fotos exportadas e restauradas em bucket privado com hashes iguais.
- Regressão pública/offline: **54/54**; painel e integração Supabase: **8/8**.
  Inclui preparar snapshot remoto e reabrir offline com Blobs JPEG.

Os primeiros ensaios do navegador falharam porque o teste buscava texto de label
nativo incluindo opções e tentava clicar no input oculto do React Aria; seletores
corrigidos para combobox e rótulo visível, sem force click.

## Pendências de ativação remota

Não há conexão administrativa remota nesta sessão. A chave publishable não executa
migrations. Siga `docs/deployment/supabase.md` para aplicar SQL e criar/autorizar o
vendedor. Ainda pendem API dos três papéis no projeto remoto, Security Advisor,
redirects/SMTP, restauração remota e uso de dados reais. Testes locais não provam
que o projeto real já possui essas proteções.

## Roteiro de piloto no Samsung e celular

1. Entrar, criar uma categoria e um produto com foto da câmera/galeria sem ajuda.
2. Trocar foto, nome e preço; ativar oferta e conferir o percentual calculado.
3. Ocultar/reexibir; tentar arquivar uma categoria com ativos e resolver o bloqueio.
4. Preparar catálogo público, ativar modo avião, fechar/reabrir e conferir fotos,
   categorias, preços e carrinho. Conferir aviso/revisão após mudança de preço.
5. Voltar ao painel sem rede: envio deve ser impedido e orientar reconexão.
6. Sair; conferir que dados administrativos não ficam visíveis e o catálogo offline
   continua disponível. Testar recuperação com o email real em HTTPS.
7. Repetir em retrato/paisagem com teclado virtual. Registrar dificuldades do vendedor.

Resultados no hardware real e usabilidade pelo vendedor continuam pendentes.

## Revisão independente

Revisão estática única com contexto novo identificou três problemas relevantes,
corrigidos com testes que falharam antes da alteração e passaram depois:

- IndexedDB separado por fonte e origem do projeto: números de revisão iguais
  entre demo e Supabase não reaproveitam produtos de outra fonte. A cópia anterior
  permanece no banco local original; trocar de fonte exige nova preparação.
- Confirmação de saída no próprio `onPress`, inclusive teclado; cancelar preserva
  formulário e sessão. Navegação SPA e Voltar também pedem confirmação.
- Campos de produto e categoria ficam bloqueados enquanto o envio está em andamento,
  evitando que uma alteração posterior ao envio seja descartada no sucesso.

Melhoria menor adiada: se uma categoria for salva e somente o recarregamento da
lista falhar, a mensagem ainda é genérica de falha ao salvar. O dado salvo permanece
no servidor; atualizar a lista confirma o resultado.

## Decisões de execução e seus limites

- Saída JPEG limitada a 500 KB para continuar compatível com a validação offline;
  pode exigir mais compressão em fotos complexas.
- Validação em Docker local porque não há conexão administrativa remota; aplicar
  SQL e verificar o projeto real continuam necessários antes do piloto.
- Testes de contrato e UI preparados enquanto as imagens Docker baixavam; etapas
  compartilham intervalos de commits, com verificação conjunta ao final.
- Recuperação depende de sessão Auth válida, sem depender de observar novamente o
  evento PASSWORD_RECOVERY; o SDK pode concluí-lo antes da montagem da tela.
  Quem já tem sessão também consegue trocar sua própria senha nessa URL.
- Cópias IndexedDB isoladas por fonte/origem; mudar de fonte/projeto exige salvar
  offline novamente e a cópia anterior continua ocupando armazenamento local.
- Remoto e hardware não foram julgados pela revisão; permanecem pendentes.
  Logo, PDF e lockfile pnpm do usuário foram preservados fora dos commits, portanto
  a alteração prévia da logo continua local. A revisão foi estática; a execução
  dos testes foi conferida separadamente pelo implementador, com os limites acima.

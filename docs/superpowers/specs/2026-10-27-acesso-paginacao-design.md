# Acesso ao painel e paginação administrativa

Data: 27/10/2026
Status: aprovada pelo usuário em 27/10/2026, execução direta autorizada

## Objetivo e abordagem

Facilitar o acesso do vendedor ao painel e administrar mais de 100 produtos sem
carregar toda a lista em cada consulta. O usuário aprovou link no header,
paginação de 20 produtos no Supabase, pesquisa/filtros globais e retorno à primeira
página ao alterar filtros.

Consideramos dividir a lista inteira no navegador, que reduz apenas o conteúdo
visível, e consultar páginas no servidor, que também reduz os dados transferidos.
A segunda abordagem foi recomendada e aprovada. A implementação mantém a stack
existente, React Aria, tema #143B84 e controles de toque com pelo menos 48 px.

## Experiência

- Link textual **Acessar painel** com ícone no header público, utilizável por toque
  e teclado, sem prejudicar a proporção da logo no celular
- Destino /admin, reutilizando o controle de sessão existente: login para quem
  precisa entrar e painel para administrador conectado
- Lista de produtos com 20 itens por página, total filtrado, intervalo exibido,
  Anterior, Próxima e Página X de Y, com limites desabilitados
- Pesquisa por nome ou código combinada com categoria e Mostrar, inicialmente Todos
- Busca no conjunto completo, preservando a busca sem distinção de caixa/acentos;
  texto da pesquisa tratado literalmente, inclusive %, vírgulas e parênteses
- Digitação com espera curta de 300 ms antes da consulta, filtros imediatos;
  qualquer mudança de filtro ou pesquisa reinicia na primeira página
- Carregamento e erro identificados, sem permitir ações sobre resultados antigos
  como se correspondessem ao novo filtro; resposta antiga não substitui a atual
- Erro permite tentar novamente, sem perder filtros
- Edição mantém página e filtros; cadastro retorna à primeira página
- Quando ocultação/edição deixa a página fora do intervalo, voltar à última válida

Valores de 300 ms, ordenação por created_at descendente e id descendente como
critério de desempate, e comportamento após edição/cadastro são decisões de
implementação propostas para tornar a navegação previsível.

## Integração e segurança

A lista administrativa passa a retornar itens e total em consulta consistente,
com limite de 20 e ordenação estável. Uma RPC SECURITY INVOKER, com search_path
fixo, verificação explícita de administrador e EXECUTE restrito a authenticated,
permite pesquisa normalizada parametrizada sem interpolar filtros PostgREST.
Schema e permissões serão versionados em migration, sem alterar o remoto nesta etapa.

Categorias não podem usar apenas a página atual para verificar vínculos. Consultar
os produtos da categoria ao tentar arquivar/remover, incluindo ocultos quando
necessário, e apresentar os impedimentos. As RPCs existentes continuam responsáveis
por impedir operações inválidas no banco, inclusive em alterações concorrentes.
A consulta desses vínculos não pode ser truncada silenciosamente pelo limite da API.

Nenhum dado administrativo entra no cache público. O snapshot público e a
preparação offline continuam carregando todos os produtos e fotos; sua API não muda.

## Validação e limites

Testar mais de 100 produtos, páginas completas/parciais/vazias, filtros globais,
busca com acentos e caracteres especiais, respostas fora de ordem, falha/repetição,
edição e ocultação na última página e vínculos fora da página atual. Verificar
negação da nova RPC a visitantes e contas sem autorização, além do administrador.

Verificar link e paginação no celular/tablet via navegador, navegação por teclado,
formatação, lint, testes e build. Distinguir validação local de aplicação remota.

Não inclui hospedagem, backups, auditoria dos avisos antigos do Supabase,
paginação pública ou publicação online. Migration remota e teste no Android real
permanecem etapas explícitas posteriores.

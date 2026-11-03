# WP REST Cache + WooCommerce Store API — relatório de validação

Data: 29/10/2026. Branch preservada: `main`. Entrega preparada localmente, **sem commit, push, merge, deploy, instalação ou alteração no WordPress remoto**. React, Worker, DNS, WoodMart, checkout e plugins remotos não foram modificados.

## Código e decisões

[MU-plugin independente](../../wordpress/store-api-cache/000-pratika-store-api-cache.php) e [instalação/remoção](../../wordpress/store-api-cache/README.md). Apenas esse PHP deve ir para MU-plugins; os testes ficam fora do servidor público.

A auditoria inicial foi feita no WP REST Cache 2026.4.0. Na retomada, a API oficial informou **2026.4.1**. O ZIP dessa versão foi baixado, comparado e utilizado na bateria final. A mudança relevante inclui registros `deleted=1` na limpeza mesmo quando já marcados `cleaned=1`. Assinaturas de interceptação e exclusão por endpoint permanecem iguais. Hashes dos fontes/ZIP e leituras públicas estão em [source-audit.json](source-audit.json).

Pontos confirmados no código oficial:

- `sources/wp-rest-cache.php` chama `Endpoint_Api::get_api_cache()` durante o carregamento do MU-plugin. Em hit, envia JSON e executa `exit` antes dos plugins comuns. Por isso o guard da integração precisa carregar antes dele.
- O cadastro de endpoint usa comparação por prefixo/regex. Apenas registrar `products` não restringe subrotas. A integração combina `allowed_endpoints` com guard antecipado de **rota exata**, GET, ausência de cookies, sessão, credenciais e nonce.
- Um miss registra `save_cache_headers` em `rest_pre_serve_request` e `save_cache` em `rest_pre_echo_response`. **A Store API passa por esse caminho real**: houve armazenamento e hits HTTP no laboratório, não apenas chamada isolada de filtro ou mock.
- `Caching::delete_cache_by_endpoint()` é a API oficial usada. `FLUSH_PARAMS` cobre `path?%`, mas não o path sem query. Para cada uma das duas coleções, executamos `FLUSH_STRICT` e `FLUSH_PARAMS`, com exclusão forçada. Nenhuma invalidação usa SQL próprio.
- O plugin normaliza a ordem dos parâmetros antes de gerar sua chave. Páginas, filtros, ordenação e buscas têm respostas próprias, e a exclusão por endpoint alcança todas essas entradas.
- `timeout=0` no filtro oficial resulta em transients nativos sem expiração e registro “Unlimited”. O cache não depende de TTL curto nem de consultas periódicas. Transients ainda podem ser eliminados por manutenção/limpeza/evicção.
- `delete_caches_immediately=true` usa a limpeza síncrona oficial. A regeneração fica desabilitada e nenhum Cron foi acrescentado pela integração. O teste confirmou ausência dos dois eventos do WP REST Cache no laboratório; não foram desabilitados agendamentos normais do WooCommerce.

As notificações marcam um booleano por requisição; a limpeza é realizada no `shutdown`, depois das escritas intermediárias. Isso evita limpar uma única vez cedo demais e deixar a última alteração sem invalidação. As invalidações automáticas internas do WP REST Cache permanecem habilitadas: o teste de deduplicação mede as chamadas desta integração, não promete eliminar o trabalho interno do fornecedor.

## Hooks e cobertura efetivamente exercitada

| Evento | Hooks considerados na implementação | Teste real local |
|---|---|---|
| Criar/editar produto e variação | `woocommerce_new_product`, `woocommerce_update_product`, equivalentes `_variation`, `save_post_product*`, metadados | Produtos simples/variáveis criados; preço e variação alterados |
| Publicação/despublicação/exclusão | `transition_post_status`, `before_delete_post`, `deleted_post`, hooks WC de delete/trash | Rascunho criado, publicado e excluído; produto removido da resposta |
| Preço e estoque | CRUD WC, `woocommerce_product_object_updated_props`, `_set_stock`, `_set_stock_status`, `woocommerce_updated_product_price/stock` | Preço 10 → 12,34; estoque 10 → 0 e reposição; preço/atributo de variação alterados |
| Baixa por pedido | `woocommerce_reduce_order_stock` e hooks de estoque produto/variação | Pedido sintético local + `wc_reduce_stock_levels`, estoque 10 → 9 |
| Categoria/associações/metadados | `set_object_terms`, `created_term`, `edited_term`, `delete_term`, metadados de termo | Categoria reassociada, renomeada e excluída; filtro e contagens refeitos |
| Atributos globais, taxas/configurações | Hooks WC de atributo/taxa e opções comerciais selecionadas | Fontes auditados; não houve teste funcional individual de todas essas opções |

Os testes comprovam os cenários combinados com os hooks reais ativos. Não afirmamos que cada hook foi isoladamente necessário/suficiente. Despublicação, lixeira/restauração, reposição por cancelamento de pedido, promoção agendada, edição de taxas e atributos globais ainda precisam de matriz complementar na homologação da instalação real. As proteções adicionais nesses caminhos não substituem esse teste.

## Bateria final

Ambiente real local: PHP **8.5.12**, WordPress **7.1.4**, WooCommerce **11.2.1**, WP REST Cache **2026.4.1**, SQLite Database Integration **3.1.2** apenas como banco descartável de laboratório. Não é reprodução dos plugins/tema/MySQL da KingHost. Não foi instalado SQLite na loja nem incluído como dependência de produção.

**17 cenários aprovados**, com **293 requisições de Store API registradas**, além de validações auxiliares de autenticação. Evidência completa: [local-results.json](../../wordpress/store-api-cache/tests/local-results.json). Fixtures limpas ao final (`cleanup=true`). Cookies/nonces válidos não foram gravados.

1. Primeira chamada MISS e repetida HIT em nove variantes das duas coleções, incluindo URLs sem query, paginação, ordenação, categoria e busca.
2. Registros persistentes com expiração ilimitada, contador incrementado e regeneração/eventos de limpeza ausentes.
3. Cem notificações consolidadas em quatro updates por endpoint; uma segunda limpeza sem alterações não executa consultas.
4. Preço alterado, todos os caches invalidados e preço novo retornado.
5. Estoque alterado, invalidação e disponibilidade nova retornadas.
6. Redução de estoque via ciclo nativo de pedido WooCommerce, sem gateway/cobrança.
7. Criação de rascunho e publicação invalidando ambas as coleções.
8. Exclusão de produto, inclusive resposta vazia para filtro pelo ID excluído.
9. Mudança de categoria refletida na consulta por categoria nova.
10. Renomeação e exclusão de categoria, com reconstrução de todas as variantes.
11. Preço/atributo de variação alterado e produto pai atualizado.
12. Cookie de login/sessão/analytics, Authorization, Cart-Token, nonces e override de método não servem hit público.
13. Cliente autenticado real validado em `/wp/v2/users/me`; chamadas de catálogo com seu cookie e nonce não usam cache compartilhado.
14. Carrinho, detalhe de produto, collection-data, detalhe de categoria e `?rest_route=` permanecem sem hit público.
15. Credenciais por query, contexto edit e POST excluídos.
16. Modo de geolocalização excluído; retorno ao modo base permite reconstrução normal.
17. Mesmos parâmetros em ordem diferente reutilizam a chave normalizada do plugin.

Medianas descritivas desta bateria local: miss público HTTP 200 sem cabeçalhos personalizados **345 ms**; hit **155 ms**. São múltiplos cenários e um banco de laboratório, não benchmark de ganho esperado na KingHost. O sinal de hit foi o cabeçalho real `X-WP-Cached-Call: served-cache`, acompanhado de igualdade de corpo, preservação de totais e registros do plugin. As variantes foram reaquecidas após cada alteração, exigindo MISS antes do HIT.

Linter PHP (`php -l`) aprovado para integração e helper. Typecheck React/Worker, ESLint e 27 testes existentes aprovados. Build Vite/Worker validado sem publicação. Não foi necessário alterar dependências, lockfile ou wrangler.

## Inspeção remota somente leitura

Em 29/10 foram feitas duas leituras de cada endpoint público: produtos com `per_page=1` (11 totais) e categorias com `per_page=100` (3 itens). Todas HTTP 200, sem `X-WP-Cached-Call` observado. Isso **não prova ausência do plugin** nem valida invalidação remota. Nenhum produto, preço, estoque, categoria, pedido, configuração ou plugin da loja remota foi alterado.

## Pendências e limites reais

- **Cache não declarado operacional na Pratika.** Instalar somente após autorização, confirmar a ordem dos MU-plugins e repetir a matriz no WordPress real. A suite local demonstra compatibilidade técnica; não substitui o teste com MySQL, WoodMart e extensões da loja.
- O pedido do teste foi um registro sintético no banco local usando a função nativa de redução de estoque. Não foi uma compra pelo checkout, confirmação de gateway, pagamento ou pedido remoto. Teste ponta a ponta deve usar ambiente seguro e sem cobrança real.
- Não há lock/generation/infraestrutura própria para linearizar um GET em voo com uma escrita concorrente. Um GET iniciado antes da alteração pode competir com a invalidação do fornecedor; validar esse limite sob concorrência em homologação. A integração não promete consistência transacional distribuída.
- Escritas SQL diretas que ignoram hooks WP/WC não são cobertas. Subdiretórios, multisite, prefixos customizados e personalizações de preço/moeda não foram homologados funcionalmente nesta bateria, apesar de o código considerar prefixo/caminho de instalação na exclusão.
- O guard conservador desabilita cache com qualquer cookie ou geolocalização nativa. Extensões que personalizam resposta anônima por IP/cabeçalho precisam de avaliação adicional antes de ativar cache compartilhado.
- A atualização é no backend; uma aba React que já carregou o catálogo continua com seus dados até nova carga. Carrinho e checkout continuam validando condições comerciais no WooCommerce. A ponte de checkout tem a pendência anterior independente desta integração.

## Fontes oficiais

- [WP REST Cache: instalação, MU-loader e endpoints customizados](https://wordpress.org/plugins/wp-rest-cache/).
- [Código do WP REST Cache 2026.4.1](https://plugins.trac.wordpress.org/browser/wp-rest-cache/tags/2026.4.1), especialmente `sources/wp-rest-cache.php`, `includes/api/class-endpoint-api.php` e `includes/caching/class-caching.php`.
- [Código oficial de estoque do WooCommerce](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/wc-stock-functions.php) e data stores de produto/variação, conferidos também no pacote estável do laboratório.

## Publicação do código no GitHub

Em 03/11/2026 o usuário autorizou publicar os arquivos locais restantes diretamente na main do GitHub. Incluídos código, instruções e evidências históricas do pacote WP REST Cache; sem instalação, configuração ou nova homologação remota nesta publicação.

A pendência de checkout citada no relatório histórico foi resolvida para os produtos simples testados; resultados atuais em `../handoff/real-validation.md`. As validações de cache acima permanecem datadas de 29/10/2026.

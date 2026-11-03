# Pratika Amollar — WP REST Cache / Store API

Integração independente, em **um único MU-plugin PHP**, sem alterações no tema, WooCommerce, React ou Worker. **Não instalada na loja remota.**

## Arquivos

- `000-pratika-store-api-cache.php`: único arquivo que deve ser instalado.
- `tests/run-local.mjs` e `tests/site-operation.php`: testes de laboratório, **não enviar ao servidor público**.
- `../../docs/store-api-cache/report.md`: auditoria, resultados e limites.

## Requisitos e escopo

- PHP 8.1+; WordPress e WooCommerce compatíveis entre si, com Store API ativa.
- **WP REST Cache gratuito 2026.4.1**, versão auditada atual. A 2026.4.0 foi testada inicialmente; a 2026.4.1 corrige a limpeza de registros marcados como excluídos. Reauditar atualizações futuras.
- URLs REST amigáveis `/wp-json/wc/store/v1/...` (prefixo REST customizado é lido das opções do WP REST Cache). `?rest_route=...` é deliberadamente excluído.
- Instalação como MU-plugin, carregado **antes** do MU-loader `wp-rest-cache.php`. Não instalar este arquivo como plugin comum: hits do WP REST Cache podem encerrar a requisição antes de plugins comuns serem carregados.
- Banco/transients nativos do WordPress; não instalar Redis nem outra infraestrutura. Retenção sem TTL configurada pelo filtro oficial `wp_rest_cache/timeout`, com valor zero para as duas coleções. Limpezas administrativas/evicções ainda podem causar um novo miss.
- O filtro `allowed_endpoints` desta integração retorna **somente** `wc/store/v1 => products, products/categories`, substituindo a lista do WP REST Cache, inclusive seus endpoints padrão do WordPress. Nenhuma outra API deve depender do cache desse plugin nesta instalação.
- Cookies de qualquer tipo, Authorization, credenciais em query, Cart-Token, nonces, usuários autenticados, métodos diferentes de GET e geolocalização WooCommerce não usam o cache compartilhado. Cookies de analytics também causam bypass, por decisão conservadora. O Worker atual consulta catálogo sem credenciais/cookies.
- Preços por IP/geolocalização, moeda por visitante, personalização anônima por extensões e regras de terceiros exigem homologação específica. O modo nativo `geolocation` do WooCommerce desabilita o cache por segurança; não alterar esse modo somente para obter hits sem avaliar impostos/preços.

## Instalação manual, após autorização

1. Faça backup e homologue em cópia isolada da loja. Confira as versões e os plugins que alteram preços, moeda, impostos e disponibilidade. Não atualizar o WordPress/WooCommerce só para igualar as versões do laboratório.
2. Se WP REST Cache já estiver ativo, desative-o antes de mexer no carregamento dos MU-plugins. Se houver caches antigos, limpe-os pela interface oficial do plugin durante a instalação autorizada.
3. Envie **somente** `000-pratika-store-api-cache.php` para `wp-content/mu-plugins/000-pratika-store-api-cache.php`. Crie a pasta se necessário. Preserve o nome; confira que nenhum loader do WP REST Cache vem antes dele na ordem alfabética.
4. Instale e ative WP REST Cache 2026.4.1 como plugin normal. Em **Plugins → Obrigatórios**, confira tanto esta integração quanto **WP REST Cache — Must-Use Plugin**. Se o loader oficial não tiver sido criado, siga a instrução do fornecedor: copiar `wp-rest-cache/sources/wp-rest-cache.php` para `wp-content/mu-plugins/wp-rest-cache.php`. Não editar o arquivo oficial.
5. Acesse uma página do painel após ativar para que o plugin grave as opções filtradas no `init`. Confirme que a lista efetiva possui apenas as duas coleções. Uma primeira chamada antes dessa inicialização pode não ser armazenada; não é evidência suficiente de incompatibilidade.
6. Em **Configurações → WP REST Cache**, deixe **Enable cache regeneration desmarcado**. Não definir `WP_REST_CACHE_REGENERATE=true` nem modos de Memcache. A integração usa exclusão síncrona pelo filtro oficial `delete_caches_immediately`, sem depender do Cron de limpeza do plugin. Não desabilite o Cron geral do WordPress/WooCommerce.
7. Se houver eventos antigos desse plugin, inspecione-os com `wp cron event list` e, sob autorização, remova **somente** `wp_rest_cache_regenerate_cron` e `wp_rest_cache_cleanup_deleted_caches`. A integração não cria esses eventos nem modifica agendamentos de pedidos/estoque do WooCommerce.
8. Execute os testes abaixo no backend diretamente. O Worker mantém o proxy atual; não há alteração/deploy Cloudflare necessário. O cabeçalho `X-WP-Cached-Call` não é repassado pelo proxy atual, portanto valide na URL WordPress.

## Aceite HTTP e invalidação na instalação autorizada

Faça as chamadas sem login, cookies, Authorization, nonce ou Cart-Token. Não use `skip_cache=1` no teste de hit.

```sh
curl -i 'https://SEU-WORDPRESS/wp-json/wc/store/v1/products?per_page=100&page=1'
curl -i 'https://SEU-WORDPRESS/wp-json/wc/store/v1/products?per_page=100&page=1'
curl -i 'https://SEU-WORDPRESS/wp-json/wc/store/v1/products/categories?per_page=100'
curl -i 'https://SEU-WORDPRESS/wp-json/wc/store/v1/products/categories?per_page=100'
```

Após limpar essas entradas, a primeira resposta deve ser **MISS**, sem `X-WP-Cached-Call: served-cache`; a repetida deve ter esse cabeçalho. Confira também o contador no painel, corpo JSON, `X-WP-Total`/`X-WP-TotalPages` quando presentes e Cache-Control `no-store`. Esse cabeçalho HTTP impede outra camada de cache; não impede a persistência interna do plugin, verificada no laboratório.

Aqueça também URLs sem query e variantes com `page`, `per_page`, `order`, `orderby`, `category`, `include` e `search`. Faça **uma alteração por vez**, sempre conferindo que **todas** as variantes de ambas as coleções ficam MISS, devolvem dados novos e voltam a HIT na repetição:

| Operação em homologação | O que conferir |
|---|---|
| Preço normal/promocional | Preço novo, ordenação e filtros de valor |
| Estoque/estado de estoque | Quantidade/estado, disponibilidade e filtros |
| Pedido de teste que reduz estoque | Baixa real pelo WooCommerce, sem cobrança real; repetir também reposição/cancelamento |
| Criar, publicar, despublicar, excluir produto | Entrada/saída da listagem, totais e páginas |
| Vincular/remover categoria; renomear/excluir categoria | Associação, nome, contagens e filtros |
| Preço, estoque ou atributo de variação | Produto pai, opções e faixa de preço |
| Parâmetros em ordens diferentes | Mesmos parâmetros reutilizam a mesma chave normalizada |

Repita com cliente realmente autenticado, cookie de sessão, Cart-Token e nonce: nunca deve haver hit público nem criação de entrada personalizada. Confira `/cart`, detalhes individuais, checkout/conta e outros endpoints: ficam fora da allowlist. O PHP não muda sessões, pagamentos nem checkout.

## Testes locais automatizados

O laboratório usado nesta entrega está em `node_modules/.cache/wp-rest-cache-audit/`, ignorado pelo Git. Usa PHP portátil, WordPress real e SQLite apenas para teste, WooCommerce e WP REST Cache oficiais. O servidor PHP de teste usa a porta 4191; os testes não acessam a loja remota. A suíte cria e apaga produtos/categorias/usuário sintéticos e um pedido local sem checkout/pagamento. Não reutilizar dados reais de clientes.

Com o laboratório já preparado, inicie o servidor em um terminal separado e mantenha-o aberto durante o teste:

```powershell
$dir = (Resolve-Path 'node_modules/.cache/wp-rest-cache-audit').Path
& "$dir/php/php.exe" -c "$dir/php.ini" -S 127.0.0.1:4191 -t "$dir/lab/wordpress" "$dir/router.php"
```

Em outro terminal PowerShell:

```powershell
$dir = (Resolve-Path 'node_modules/.cache/wp-rest-cache-audit').Path
$env:PA_CACHE_TEST_WP_ROOT = "$dir/lab/wordpress"
$env:PA_CACHE_TEST_ALLOW_MUTATIONS = '1'
$env:PA_CACHE_TEST_PHP = "$dir/php/php.exe"
$env:PA_CACHE_TEST_PHP_INI = "$dir/php.ini"
node wordpress/store-api-cache/tests/run-local.mjs
```

O runner só aceita host loopback; o helper também exige `WP_ENVIRONMENT_TYPE=local`/`staging`, opt-in explícito e recusa o domínio real Pratika. Para outro laboratório, forneça raiz/runtime próprios e instale a integração conforme acima. Evidências ficam em `tests/local-results.json`; cookies e nonces válidos não são gravados.

## Remoção

1. Desative **WP REST Cache** primeiro, para impedir que seu loader continue servindo entradas antes de filtros de plugins comuns. Confirme a remoção/inatividade do loader oficial em MU-plugins.
2. Remova `wp-content/mu-plugins/000-pratika-store-api-cache.php`. MU-plugin não possui botão de desativação; não basta remover só este arquivo enquanto o cache oficial permanece ativo.
3. Remova WP REST Cache pela interface normal se não for mais necessário. Não apagar manualmente tabelas do WooCommerce. Se for reutilizar WP REST Cache para outra API, configure e valide uma nova allowlist antes de reativá-lo.

## Consistência e limitações

A invalidação é consolidada no fim da requisição de escrita, depois de todos os hooks, em vez de limpar apenas no primeiro estado intermediário. O plugin oficial pode executar suas próprias invalidações de relações; elas não foram desligadas. Nenhuma garantia de transação global/linearizabilidade entre um GET já em voo e uma escrita concorrente foi adicionada: esse é um limite do mecanismo oficial, a homologar sob concorrência. Escritas SQL diretas que não disparam hooks WordPress/WooCommerce não são cobertas. Alterações no catálogo já carregado em uma aba React só aparecem após nova carga; o carrinho continua validando preço/estoque dinamicamente.

**Não considerar o cache operacional na Pratika antes de instalar e repetir os testes na instalação real, sob autorização.**

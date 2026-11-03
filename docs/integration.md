# Ponte React → checkout WooCommerce — instalação e homologação

Preparada localmente em 03/11/2026. **Não instalada nem configurada na loja remota.** Não publicar somente o Worker: receptor PHP e segredo compartilhado precisam ser homologados juntos.

## Contrato e fluxo

1. React bloqueia cliques repetidos e alterações de quantidade durante a transferência. Aguarda a sincronização e obtém o snapshot final do carrinho.
2. POST same-origin `/api/handoff` recebe somente chaves de linha, IDs e quantidades esperados. O Worker consulta novamente `/wc/store/v1/cart` usando o Cart-Token do cookie HttpOnly `pa_cart`. Não encaminha cookies WordPress nem recebe preços do cliente.
3. Ausência/expiração da sessão, divergência entre snapshots ou erros de estoque impedem a assinatura. O React mantém o carrinho e mostra erro; a conferência da sessão é uma ação explícita. Se a sessão de origem realmente expirou, conferir pode revelar um carrinho vazio; os produtos precisarão ser selecionados novamente, sem recuperação silenciosa de preços ou disponibilidade antigos.
4. O Worker assina HMAC-SHA256 um envelope v2, audience fixa, origem, UUID de uso único, emissão e validade de 90 segundos. Inclui IDs, quantidades e atributos recebidos do WooCommerce. Não inclui Cart-Token, credenciais, dados pessoais, preços ou endereço.
5. O navegador envia um **formulário POST em navegação principal** para `https://loja.pratikaamollar.com.br/wp-admin/admin-post.php`. Não há fetch cross-origin, CORS adicional ou dependência de cookies compartilhados/third-party. O PHP estabelece o cookie WooCommerce no domínio da loja.
6. O PHP confere assinatura, origem, prazo, versão, audience e uso único, trava a sessão contra transferências sobrepostas, valida produtos/atributos/quantidades/estoque e aplica os filtros de validação do WooCommerce. Somente produtos simples e variações são aceitos; produtos compostos/bundles/add-ons exigem homologação específica e não são reconstruídos silenciosamente.
7. O carrinho nativo é **substituído**, não somado. IDs, atributos e quantidades finais precisam coincidir exatamente. Preços e totais são recalculados pelo WooCommerce; frete, impostos e pagamento continuam no checkout. Cupons não são transferidos pelo React; aplicação exclusivamente no checkout nativo.
8. Somente após validar e gravar a sessão, o PHP responde **303 para `wc_get_checkout_url()`**. Página de checkout configurada e publicada é requisito. Falha no receptor mostra erro e link para voltar ao carrinho React, sem redirecionar ao checkout. Falha antes do POST é exibida no próprio React. Não há segunda página de checkout.
9. Tickets repetidos são recusados (409); ticket novo substitui o carrinho sem duplicação. Falha parcial restaura linhas completas, metadados, cupons e totais anteriores do carrinho nativo. O carrinho Store API de origem não é esvaziado.

Os registros `pa_transfer_*` e `pa_handoff_lock_*` são controles de segurança efêmeros em options não autoload, **não cache de catálogo**. Limpeza oportunista de tickets expirados no próprio receptor; sem Cron, webhooks, KV, Redis ou mudanças no cache existente. Lock residual por interrupção expira em 180s e é removido na próxima tentativa da sessão. Configurar limite de execução PHP/proxy menor que 180s (recomendado até 120s), para não permitir sobreposição com um processo antigo ainda executando.

## Instalação posterior, mediante autorização

1. Fazer backup e usar primeiro uma homologação HTTPS com WooCommerce e checkout nativo configurados. Preservar gateway, frete, fiscal e tema.
2. Criar `wp-content/plugins/pratika-cart-handoff/` e copiar **somente** `wordpress/pratika-cart-handoff.php` para `wp-content/plugins/pratika-cart-handoff/pratika-cart-handoff.php`. Não subir `wordpress/tests/`, fixtures, relatórios ou o laboratório. Ativar o plugin independente no WordPress. PHP mínimo 7.4; WooCommerce ativo.
3. Gerar um segredo exclusivo aleatório, por exemplo `openssl rand -hex 32`, em ambiente seguro. Não reutilizar o segredo descartável dos testes. Adicionar no `wp-config.php`, antes de carregar `wp-settings.php`:

```php
define('PA_HANDOFF_SECRET', 'SEGREDO_ALEATORIO_EXCLUSIVO');
define('PA_FRONTEND_ORIGIN', 'https://pratikaamollar.smartlocal.workers.dev');
```

A origem precisa corresponder exatamente à usada pelo visitante (esquema, hostname e porta, sem caminho ou barra final). Para futura origem aprovada, ajustar essa constante antes da homologação. Não adicionar origem curinga. HTTP é recusado, exceto no laboratório loopback com `WP_ENVIRONMENT_TYPE=local`.

4. No projeto, configurar o **mesmo valor** via entrada interativa: `pnpm exec wrangler secret put HANDOFF_SECRET --name pratikaamollar`. Esta ação altera o ambiente remoto e **não foi executada**. Para teste local Worker, usar `.dev.vars` ignorado pelo Git. Nunca colocar segredo em `wrangler.jsonc`, bundle, documentação, comando com segredo literal ou Git.
5. Garantir que POST para `/wp-admin/admin-post.php` não seja bloqueado, redirecionado ou armazenado por host/CDN/WAF. Não incluir receptor, carrinho, checkout, sessões ou respostas autenticadas em cache. Nenhuma alteração da solução de cache foi feita nesta tarefa; se a infraestrutura bloquear o receptor, a correção depende de autorização separada.
6. Homologar PHP v2 e Worker/React v2 juntos: envelopes da ponte antiga v1 são rejeitados. Depois da autorização de publicação, gerar build novo e publicar no Worker existente, mantendo o `wrangler.jsonc` do usuário.
7. Executar a matriz abaixo no ambiente real autorizado. Não declarar o checkout integrado apenas porque `/checkout/` retorna 200 ou `/api/handoff` retorna um envelope assinado.

Para remover: desativar/excluir somente o plugin, retirar as duas constantes e o secret `HANDOFF_SECRET` mediante autorização. O Worker sem segredo recusa a transferência e mantém o carrinho. Não alterar WooCommerce/tema. Os options residuais de prefixos exclusivos podem ser removidos por administrador após não haver transferências ativas; nenhum dado de produto/pedido é criado pela ponte.

## Testes e pendências

Relatório objetivo: `docs/handoff/report.md`; evidências automatizadas: `wordpress/tests/handoff-local-results.json`.

No ambiente real autorizado, repetir: simples, múltiplos itens, quantidades, variável quando existir, alteração/remoção, sessão nova/expirada, duplo clique/replay, estoque mudando entre leitura e POST, falha parcial, usuário autenticado com carrinho anterior, retornar pelo botão Voltar, mobile/desktop e cookies/regras WAF da KingHost. Conferir igualdade de itens/atributos/quantidades no checkout e recalcular frete/impostos com endereço de homologação.

**Pagamento sandbox não foi executado.** Requer ambiente e credenciais de teste confirmados, sem configurar o Mercado Pago/checkout de produção nem cobrar valores reais. O laboratório não possui gateway e não cria pedidos. A aparência/campos do checkout, CPF, CEP e configurações fiscais continuam fora do escopo.

## Laboratório reproduzível

O código de teste exige loopback e `PA_HANDOFF_TEST_ALLOW_MUTATIONS=1`. Não apontar esses helpers para a loja. Laboratório usado: `node_modules/.cache/handoff-lab/wordpress`, uma cópia isolada do WordPress local anterior, banco SQLite separado, sem MU-plugins de cache e sem alterações no laboratório de cache original. Runtime PHP portátil em `node_modules/.cache/wp-rest-cache-audit/php/`.

```powershell
$runtime = (Resolve-Path node_modules/.cache/wp-rest-cache-audit).Path
$lab = (Resolve-Path node_modules/.cache/handoff-lab).Path
# Terminal 1: servidor WordPress loopback
& "$runtime/php/php.exe" -c "$runtime/php.ini" -S 127.0.0.1:4193 -t "$lab/wordpress" "$lab/router.php"
# Terminal 2: testes (cria/remove apenas fixtures locais)
$env:PA_HANDOFF_TEST_ALLOW_MUTATIONS = '1'
$env:PA_HANDOFF_TEST_WP_ROOT = "$lab/wordpress"
$env:PA_HANDOFF_TEST_PHP = "$runtime/php/php.exe"
$env:PA_HANDOFF_TEST_PHP_INI = "$runtime/php.ini"
node wordpress/tests/handoff-local.mjs
```

O laboratório exige no wp-config as constantes descartáveis usadas pelo runner e origem `http://localhost:4183`, ambiente local, URL `http://127.0.0.1:4193`. Não são credenciais de produção. O helper CLI recusa ambiente/hostname diferentes de local loopback. Para remontar do zero, instalar WordPress/WooCommerce oficiais e SQLite Integration apenas no laboratório; copiar o plugin e configurar essas constantes. O runner prepara fixtures, checkout e habilita visualização da loja **somente no laboratório**.

Para QA do build: gerar `pnpm build` e executar `node wordpress/tests/handoff-preview.mjs` com o mesmo opt-in. Esse adaptador de teste serve `dist/client` em localhost:4183 e troca o upstream fixo pelo WordPress loopback, inclusive o destino POST/validação do cliente. Isso permite exercitar React + função real do Worker + PHP sem enviar mutações remotas. Não é código de produção nem uma segunda ponte. O código publicado continua apontando exclusivamente para `loja.pratikaamollar.com.br`.

## Preview e SEO

`pnpm dev` e `pnpm preview` executam o Worker local independente. `pnpm deploy` aponta somente para nome `pratikaamollar`, sem routes/DNS. Publicação workers.dev exige autenticação Cloudflare. PREVIEW=true adiciona noindex em HTML, cabeçalho e robots. Antes de lançamento aprovado, alterar PREVIEW e verificar PUBLIC_ORIGIN.

Worker injeta title, description, canonical, Open Graph e JSON-LD de produto no HTML entregue, inclusive sem execução JS. Páginas individuais recebem também título, fotografia e descrição factual como conteúdo HTML no servidor; o React substitui esse conteúdo ao iniciar. Catálogo e Home ainda renderizam o corpo no cliente: indexação integral dessas listagens exige SSR/prerender adicional. Não declarar SEO de catálogo integralmente concluído. Sitemap usa slugs reais. Plano de migração: mapear permalinks antigos `/shop/...` e `/product-category/...` para rotas novas com 301 após aprovação; nenhum redirect foi aplicado ao domínio original.

Políticas legais e horários não foram inventados. Conta, rastreamento e checkout continuam no WordPress. Fotos vêm do WooCommerce. Falhas da API são exibidas com opção de repetir.


Atualização de homologação: o usuário informou instalação do PHP e configuração dos segredos e autorizou publicação na prévia. O fluxo real foi validado para produtos simples em duas transferências, com os resultados e limites em `docs/handoff/real-validation.md`. Os procedimentos acima continuam sendo a referência para instalação/remoção e futuras homologações.

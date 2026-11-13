# Preços e envio de avaliações pelo React — 13/11/2026

Implementação concluída localmente na branch `codex/store-six-improvements`. Instalação e homologação remotas pendentes. Nenhum commit, push, merge, deploy, instalação remota ou avaliação fictícia na loja.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/components/ReviewForm.tsx` | Formulário inline, estrelas com teclado, campos, validações, foco, estados e bloqueio de envio duplo |
| `src/components/ReviewContext.tsx` | Consulta única das permissões no detalhe, abertura compartilhada e atualização pública do resumo após aprovação |
| `src/components/ProductRating.tsx` | Resumo sob o título com link aos comentários ou convite condicionado à permissão real |
| `src/lib/review-submission.ts` | Contratos tipados, validação e transporte direto ao AJAX WordPress |
| `src/components/ProductReviews.tsx` | Leitura paginada preservada, depoimentos estáticos e formulário integrado; releitura após envio aprovado |
| `src/pages/Product.tsx` | Provider e resumo na página existente |
| `src/product-presentation.css` | Preços, estados acessíveis e layout do formulário |
| `wordpress/product-reviews/pratika-product-reviews.php` | Adaptador pequeno e isolado, ainda não instalado remotamente |
| `wordpress/product-reviews/README.md` | Instalação, limites, origem, cookies, homologação e rollback |
| `tests/review-submission.test.mjs` | Validação, contratos, transporte, replay e falhas |
| `tests/fixtures/review-form.html`, `review-form.tsx`, `vite.config.ts` | QA isolado dos componentes, sem inclusão no bundle da loja |
| `wordpress/tests/reviews-local.php` | Matriz com WordPress/WooCommerce reais locais |
| `wordpress/tests/reviews-http-router.php`, `reviews-http-site.php`, `reviews-http.mjs` | HTTP restrito a loopback, fixture temporária e restauração |
| `docs/product-reviews-native-results.json`, `product-reviews-http-results.json` | Evidência sem tokens, cookies ou credenciais |

Também atualizados `docs/project.md`, `docs/store-reviews.md` e `docs/store-six-improvements.md`. Alterações locais anteriores e arquivos Infixs existentes foram preservados.

## Comportamento

Original riscado em 16px, cor #59544b; preço principal do detalhe em 28px, Oferta discreto e espaçamento com quebra responsiva. Cards usam a mesma legibilidade do original. Não foram alterados cálculo de preço, promoção programada, on_sale, faixas variáveis ou consulta da opção selecionada.

O resumo fica imediatamente abaixo do título. Média e contagem só usam dados WooCommerce; 4,3/5 preenche 86% das estrelas. Cards continuam sem nota fictícia. O convite aparece apenas com contagem zero e produto habilitado pela resposta do WordPress. Com avaliações existentes, o resumo liga à seção de comentários. Uma restrição de login/compra é explicada ao abrir a área, sem envio indevido.

“Avaliar este produto” e “Seja o primeiro a avaliar” abrem o formulário na página atual, sem modificar URL ou navegar. A área recebe scroll com reduced-motion e foco inicial nas estrelas. Radios nativos permitem teclado; erros são associados aos campos, sucesso é anunciado e fechar devolve foco ao botão da seção. Textos permanecem após erro e ao fechar/reabrir. Usuário autenticado utiliza a identidade da sessão e não recebe campos de nome/e-mail. Visitante informa nome e e-mail conforme as regras retornadas.

O status pending mostra a mensagem de aprovação e não injeta comentário nem altera média/contagem/fallback. Approved mostra confirmação, relê comentários e resumo públicos. Sem avaliações aprovadas, os três depoimentos estáticos são preservados; quando há comentários próprios aprovados, os depoimentos não aparecem. Nenhum dado da loja entra nas médias ou no JSON-LD dos produtos. Não há API Google.

## Auditoria e integração

Fontes: [wp_handle_comment_submission](https://developer.wordpress.org/reference/functions/wp_handle_comment_submission/), [hooks WC_Comments](https://woocommerce.github.io/code-reference/files/woocommerce-includes-class-wc-comments.html) e [configuração nativa de avaliações](https://woocommerce.com/document/product-reviews/). Auditada também a implementação WooCommerce do laboratório e a fonte extraída do backup da loja. Não usamos a REST administrativa autenticada por chaves nem tratamos a Store API de leitura como escrita pública.

O AJAX administrativo mantém os cookies WordPress e permite resposta JSON sem redirecionamento. A nota é validada no servidor e fornecida aos hooks nativos em `$_POST['rating']`/`comment_post_ID`. Como is_admin() é true no AJAX e o conversor público do WooCommerce ignora esse contexto, um filtro estritamente temporário define comment_type=review. O WordPress valida acesso, comentário, duplicidade/flood e publicação; hooks nativos gravam rating e verificação de compra. A moderação obrigatória preserva pendência sem sobrescrever spam/trash ou WP_Error de plugins. Filtros temporários são removidos em finally.

Defesas: origem exata, desafio HMAC ligado ao produto/usuário/rede/navegador, prazo e tempo mínimo, honeypot, limites de tamanho, lock atômico, intervalo e teto por IP, idempotência temporária, sanitização e proteção nativa. CORS/desafio público isolados não são considerados proteção suficiente. Erros internos não são devolvidos. Falha após possível gravação recebe resultado incerto e não é repetida como novo insert. A tela não faz retry automático de escrita.

Configuração remota já observada em consulta somente leitura: avaliações ativadas; estrelas ativadas e obrigatórias; rótulo de comprador verificado ativado; exigência de comprador verificado desativada. **Moderação, require_name_email e comment_registration remotos permanecem pendentes**: a inspeção anterior da página Discussão foi interrompida por falha na confirmação segura da URL. Não houve nova tentativa nem inferência desses valores. O adaptador lê e aplica as opções efetivas em tempo de execução; não as modifica.

## QA executado

- Typecheck, ESLint, 74 testes Node sem falhas/skips e build de produção aprovados.
- Sintaxe dos quatro arquivos PHP desta entrega aprovada.
- 35 verificações em WordPress 7.1.4 + WooCommerce 11.2.1 + PHP 8.5.12/SQLite locais: nota, campos, desafios adulterados/precoces/expirados, honeypot, anonimato, sessão autenticada, identidade nativa, moderação ligada/desligada, reviews desativadas, restrição de login, compradores verificados, sanitização, rating meta, tipo review, duplicidade, replay, rate limit, lock, anti-flood nativo, rejeição de plugin e resultado incerto. A elegibilidade de comprador foi exercitada pelo filtro oficial WooCommerce; nenhum pedido foi criado.
- HTTP real loopback: CORS com origem exata/credenciais/no-store, origens inválidas e método incorreto recusados, envio pending, replay sem duplicata e alteração do mesmo desafio recusada. Banco nativo confirmou uma review pendente com rating=5.
- Ponta a ponta no navegador: React em 127.0.0.1:5183 → PHP/WordPress em 127.0.0.1:4197, cookies/credentials e CORS reais, visitante anônimo, clique duplo gerando somente um envio. Resposta pending, depoimentos presentes e nenhum comentário pendente exibido. Banco confirmou a segunda review pendente com rating=5. As duas reviews e o produto de laboratório foram removidos; opções restauradas.
- UI simulada nos componentes reais: envio aprovado, comentário próprio e exclusão do fallback; falha de rede com texto preservado; validação de campos; formulário indisponível com retry; usuário autenticado sem nome/e-mail; produto desabilitado sem convite/botão; restrição de comprador; média fracionada 4,3/7; abertura sem navegação, foco inicial, ArrowRight selecionando segunda estrela e retorno de foco ao fechar.
- Desktop 1440×1000 e mobile 375×812, sem overflow horizontal; formulário respectivamente 680px e 316px. Medidas computadas do preço original/promocional: 16px/28px. Foco visível e textos completos conferidos.
- Suíte existente de catálogo, carrinho, handoff, Hero, vídeos e demais funcionalidades passou. Checkout, pedidos, pagamentos, DNS e configuração do Worker não foram alterados. Não houve nova compra/handoff remota nesta etapa.

## Reproduzir localmente

Exige laboratório WordPress/WooCommerce descartável, com WP_ENVIRONMENT_TYPE=local, URL loopback, HTTP externo e e-mail bloqueados. Os helpers recusam outra instalação. Nunca apontar para produção.

```powershell
$env:PA_REVIEW_TEST_WP_ROOT = (Resolve-Path node_modules/.cache/handoff-lab/wordpress).Path
$env:PA_REVIEW_TEST_ALLOW_MUTATIONS = '1'
& node_modules/.cache/wp-rest-cache-audit/php/php.exe -c node_modules/.cache/wp-rest-cache-audit/php.ini wordpress/tests/reviews-local.php
pnpm exec vite --config tests/fixtures/vite.config.ts --port 5183
# Em terminais separados, para o teste HTTP:
& node_modules/.cache/wp-rest-cache-audit/php/php.exe -c node_modules/.cache/wp-rest-cache-audit/php.ini wordpress/tests/reviews-http-site.php setup
& node_modules/.cache/wp-rest-cache-audit/php/php.exe -c node_modules/.cache/wp-rest-cache-audit/php.ini -S 127.0.0.1:4197 wordpress/tests/reviews-http-router.php
node wordpress/tests/reviews-http.mjs
# Ao terminar, sempre restaurar:
& node_modules/.cache/wp-rest-cache-audit/php/php.exe -c node_modules/.cache/wp-rest-cache-audit/php.ini wordpress/tests/reviews-http-site.php cleanup
```

Abrir `/tests/fixtures/review-form.html` para cenários simulados. O modo native-local exige query `local_product=ID` retornado pelo setup e usa exclusivamente os hosts loopback fixos da fixture. Esses desvios não existem no código de produção.

## Pendências para a loja

Autorizar instalação do único PHP e publicação do frontend; confirmar Discussão sem alterar configurações; validar versão/plugins instalados, CORS, cookies de cliente autenticado nos domínios reais, REMOTE_ADDR confiável, regras KingHost/WAF/cache e aprovação administrativa refletida na Store API. Os testes locais não comprovam esses itens de infraestrutura remota. Até instalar o adaptador, a página React preserva conteúdo/depoimentos e informa indisponibilidade do formulário, sem fallback para redirecionamento.

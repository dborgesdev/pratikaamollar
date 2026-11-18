# Padronização de linguagem de pagamento

Implementação local em 18/11/2026, branch `main`. Sem commit, push, merge, deploy, instalação PHP ou alteração de configuração remota. Alterações anteriores em `docs/project.md`, relatórios de APIs e arquivos Infixs preservados.

## Redação revisada

| Antes | Depois | Local |
| --- | --- | --- |
| Frete e condições de pagamento serão calculados no checkout da loja. | Frete e condições de pagamento serão calculados ao finalizar a compra. | Produto e carrinho |
| Continuar para checkout | Ir para o pagamento | Botão do carrinho |
| Preparando seu checkout… | Preparando o pagamento… | Carregamento do botão |
| Você continuará no checkout da Pratika Amollar. | Você continuará na página de pagamento da Pratika Amollar. | Orientação do carrinho |
| Aguarde a conclusão do checkout. | Aguarde a finalização da compra. | Bloqueio de adição durante transferência |
| Não foi possível abrir o checkout. Seu carrinho está preservado. Tente novamente. | Não foi possível prosseguir para o pagamento. Seu carrinho está preservado. Tente novamente. | Erro padrão da transferência |
| Checkout nativo indisponível. | A página de pagamento está indisponível no momento. | Erro da ponte PHP |

São oito ocorrências de sete frases. Revisão contextual, sem substituição global. Nenhuma mudança em dados de produtos, valores, avaliações ou configurações operacionais.

## Auditoria e limites

Busca sem distinção de caixa em componentes, páginas, lógica, mensagens, atributos de acessibilidade, SEO, conteúdo público, Worker, PHP e templates do tema filho. Após os ajustes, as ocorrências restantes nos arquivos de aplicação são técnicas ou comentários internos. Nenhuma ocorrência nos textos de `shared`, assets públicos ou `index.html`. A consulta somente leitura ao catálogo público retornou 11 produtos sem o termo em nome, descrição e descrição curta; esse conteúdo continua sob controle do WooCommerce e pode mudar.

Permanecem intactos `/checkout`, endpoints, URLs de retorno, `wc_get_page_id('checkout')`, `wc_get_checkout_url()`, `checkoutTransfer`, `beginCheckout`, `lockForCheckout`, `checkoutLocked`, `checkoutInFlight`, `.checkout-note`, `pratika-checkout`, ação `pa_handoff`, assinatura HMAC e respectivos testes. Não há mudanças no Worker, processamento de pedidos, pagamentos ou sessão. O diff da ponte PHP contém somente a mensagem de erro.

No backup local do WoodMart, o catálogo de traduções distingue `Checkout` com contexto `Page title` do identificador `checkout` com contexto `Page slug`. No WooCommerce local, `templates/cart/proceed-to-checkout-button.php` usa `Proceed to checkout` no domínio `woocommerce`. Não foram alterados arquivos originais. No backup do Mercado Pago foi confirmado o domínio `woocommerce-mercadopago`; isso não confirma quais textos aparecem na sessão real do comprador.

## WordPress: solução preparada

`wordpress/payment-language/pratika-payment-language.php` é um complemento opcional, não instalado. Usa os filtros oficiais [gettext](https://developer.wordpress.org/reference/hooks/gettext/) e [gettext_with_context](https://developer.wordpress.org/reference/hooks/gettext_with_context/), com domínio/frase/contexto específicos. Traduz os rótulos confirmados `Checkout` para `Pagamento` e `Proceed to checkout` para `Prosseguir para o pagamento`, preservando traduções portuguesas existentes, slugs e outros contextos. Instruções completas e rollback em `wordpress/payment-language/README.md`.

Pendências externas: conferir títulos armazenados de página/menu/breadcrumb/Elementor, traduções oficiais pt_BR, rótulo público do método Mercado Pago e idioma de SDK/iframe. Conteúdo de banco ou provedor pode não passar por gettext. Traduzir somente após identificar a origem, sem editar tema pai/plugins, URLs, IDs ou associação da página. A mensagem local da ponte também depende de atualização autorizada do arquivo instalado; publicar React não a atualiza.

## Verificação

- Typecheck, ESLint, 77 testes automatizados e build de produção aprovados.
- Sintaxe PHP aprovada no complemento e na ponte; teste PHP com 12 invariantes de tradução aprovado, incluindo preservação de URL, HTML, slug, contexto, idioma e outros domínios.
- Fixture `tests/fixtures/payment-language.html`: componentes reais com dados de catálogo existentes e respostas de rede simuladas. Formulário de transferência interceptado, sem POST na loja.
- Conferidos carrinho, erro recuperável com carrinho preservado, botão desabilitado com “Preparando o pagamento…” e continuação simulada. Catálogo e produto conferidos em 375px; carrinho também em 1440px. Nenhum “checkout” no texto renderizado das três páginas; sem overflow horizontal em 375px. Viewport restaurado.
- Acesso somente leitura à URL pública `https://loja.pratikaamollar.com.br/checkout/` redirecionou ao carrinho React vazio. Não foi possível confirmar visualmente página nativa, gateway, confirmação real ou seus estados de erro em desktop/mobile com sessão preenchida. Nenhum pedido, pagamento ou mudança remota foi realizado.

Arquivos de aplicação modificados: `src/pages/Cart.tsx`, `src/pages/Product.tsx`, `src/lib/cart-sync.ts`, `src/lib/checkout.ts`, `wordpress/pratika-cart-handoff.php`. Arquivos de apoio: este relatório, atualização de `docs/project.md`, complemento e README em `wordpress/payment-language/`, `wordpress/tests/payment-language.php`, `tests/payment-language.test.mjs` e fixture HTML/TSX. Os arquivos anteriores não relacionados permanecem fora deste escopo.

## Publicação React autorizada

O responsável autorizou commit, push e publicação somente do React e seus testes/documentação. Base `main` sincronizada com `origin/main`; fluxo existente usa push direto e deploy Wrangler, sem workflow GitHub Actions no repositório. Escopo do commit: quatro arquivos React/lógica acima, `tests/handoff.test.mjs`, fixture HTML/TSX e este relatório. Sete das oito ocorrências pertencem ao React; a oitava é a mensagem da ponte PHP e não será publicada nesta etapa. Teste existente ampliado para verificar o erro padrão em português e preservação do carrinho.

PHP, teste do complemento, alterações anteriores em `docs/project.md`, relatórios de APIs e pacotes Infixs ficam locais. A instalação do complemento e homologação posterior de WooCommerce/Mercado Pago não estão autorizadas nesta etapa. Caminho de origem: `D:\_dev-projects\pratikaamollar\wordpress\payment-language\pratika-payment-language.php`. Após autorização futura, copiar somente esse arquivo para `wp-content/mu-plugins/pratika-payment-language.php`; rollback: remover somente esse arquivo. Não modificar configuração, tema pai, plugins originais ou banco. Ver README local para os limites de tradução.

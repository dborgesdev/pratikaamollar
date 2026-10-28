# Integração e validação V1

O Worker atende assets e proxy restrito à Store API. O token do carrinho fica em cookie HttpOnly SameSite=Lax (Secure em HTTPS), nunca em localStorage/URL. POST exige Origin do próprio frontend. Respostas de carrinho não têm cache. Não existem chaves WooCommerce no cliente.

## Ponte isolada (não instalada remotamente)

1. Em ambiente de homologação, instalar `wordpress/pratika-cart-handoff.php` como plugin próprio.
2. Gerar segredo aleatório de pelo menos 32 bytes. Configurar `PA_HANDOFF_SECRET` e `PA_FRONTEND_ORIGIN` no wp-config.php. Origin deve ser a origem exata da prévia, sem caminho.
3. Configurar o mesmo segredo no Worker com `pnpm exec wrangler secret put HANDOFF_SECRET`. Nunca colocar o segredo em vars, Git ou no cliente.
4. Excluir admin-post.php?action=pa_handoff do cache/CDN. HTTPS obrigatório. Não alterar checkout, gateway ou tema.
5. A assinatura HMAC cobre itens/quantidades/cupons obtidos no servidor pela Store API, expira em 90s e tem identificador de uso único. O formulário POST estabelece a sessão no domínio WordPress antes do redirect 303. Preços não são transportados. WordPress revalida produtos, estoque, quantidades e cupons. Carrinho nativo anterior é substituído; erro de inserção tenta restaurá-lo. Nova tentativa exige nova transferência.
6. Validar simples, múltiplos itens, quantidades, cupons, estoque alterado, assinatura adulterada, replay, expiração, origem errada e sessão existente. Variável exige produto variável real em homologação; nenhum foi retornado no catálogo auditado. Não criar pedido nem executar pagamento.

Sem o segredo, checkout retorna mensagem explícita de integração pendente e preserva o carrinho React. Instalar plugin/configurar remoto requer autorização específica.

## Preview e SEO

`pnpm dev` e `pnpm preview` executam o Worker local independente. `pnpm deploy` aponta somente para nome `pratikaamollar-v1-preview`, sem routes/DNS. Publicação workers.dev exige autenticação Cloudflare. PREVIEW=true adiciona noindex em HTML, cabeçalho e robots. Antes de lançamento aprovado, alterar PREVIEW e verificar PUBLIC_ORIGIN.

Worker injeta title, description, canonical, Open Graph e JSON-LD de produto no HTML entregue, inclusive sem execução JS. Páginas individuais recebem também título, fotografia e descrição factual como conteúdo HTML no servidor; o React substitui esse conteúdo ao iniciar. Catálogo e Home ainda renderizam o corpo no cliente: indexação integral dessas listagens exige SSR/prerender adicional. Não declarar SEO de catálogo integralmente concluído. Sitemap usa slugs reais. Plano de migração: mapear permalinks antigos `/shop/...` e `/product-category/...` para rotas novas com 301 após aprovação; nenhum redirect foi aplicado ao domínio original.

Políticas legais e horários não foram inventados. Conta, rastreamento e checkout continuam no WordPress. Fotos vêm do WooCommerce. Falhas da API são exibidas com opção de repetir.


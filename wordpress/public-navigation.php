<?php
/** Paste into child functions.php (without <?php), OR an existing PHP snippets tool. */
add_action('template_redirect', function () {
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', array('GET', 'HEAD'), true) ||
        strtolower($_SERVER['HTTP_HOST'] ?? '') !== 'loja.pratikaamollar.com.br' ||
        wp_parse_url(home_url('/'), PHP_URL_HOST) !== 'loja.pratikaamollar.com.br' ||
        is_admin() || wp_doing_ajax() || wp_doing_cron() || wp_is_json_request() ||
        (defined('REST_REQUEST') && REST_REQUEST) || (defined('WP_CLI') && WP_CLI) ||
        is_feed() || is_trackback() || is_preview() ||
        !empty($_SERVER['HTTP_X_REQUESTED_WITH']) || !empty($_SERVER['HTTP_AUTHORIZATION']) ||
        !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) || !empty($_SERVER['HTTP_X_WP_NONCE'])) return;

    // Unknown parameters may belong to callbacks, nonces or extension actions.
    // Keep them native; advertising parameters are discarded, never forwarded.
    foreach ($_GET as $key => $value) {
        if (!preg_match('/^(utm_(source|medium|campaign|term|content)|gclid|fbclid)$/iD', (string) $key) || !is_scalar($value)) return;
    }
    $path = (string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (preg_match('~(?:^|/)(?:wp-admin|wp-json|wp-content|wp-includes|wc-api|wc-ajax)(?:/|$)|\.[^/]+(?:/|$)~i', $path)) return;
    if (!function_exists('is_checkout') || is_checkout() || is_account_page() || is_wc_endpoint_url()) return;
    $policies = array_filter(array((int) get_option('wp_page_for_privacy_policy'), (int) wc_get_page_id('terms')),
        function ($id) { return $id > 0; });
    if (($policies && is_page($policies)) || is_page(array('rastrear-encomenda',
        'politica-de-privacidade', 'termos-e-condicoes-de-compra',
        'trocas-devolucoes-e-reembolsos', 'entrega-e-frete'))) return;

    // WP resolves configured permalink bases. No per-product/category mappings.
    $destination = null;
    if (is_front_page()) $destination = '/';
    elseif (is_shop()) $destination = '/produtos';
    elseif (is_cart()) $destination = '/carrinho';
    elseif (is_product() || is_product_category()) {
        $object = get_queried_object();
        $slug = is_product() ? ($object->post_name ?? '') : ($object->slug ?? '');
        if ($slug !== '') $destination = (is_product() ? '/produto/' : '/categoria/') . rawurlencode(rawurldecode($slug));
    } elseif (is_page('contato')) $destination = '/contato';
    // Unknown pages, deleted objects and other taxonomies remain native.
    if ($destination === null) return;
    nocache_headers();
    if (wp_redirect('https://pratikaamollar.com.br' . $destination, 302, 'Pratika Public Navigation')) exit;
}, 1);

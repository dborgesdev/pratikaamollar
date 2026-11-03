<?php
/**
 * Plugin Name: Pratika Amollar — ponte de carrinho
 * Description: POST assinado para estabelecer a sessão do checkout nativo. Instalação manual.
 * Version: 2.0.0
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 */
if (!defined('ABSPATH')) exit;
add_action('admin_post_nopriv_pa_handoff', 'pa_handoff');
add_action('admin_post_pa_handoff', 'pa_handoff');
function pa_handoff_fail($message, $status = 400) {
    $back = defined('PA_FRONTEND_ORIGIN') ? rtrim(PA_FRONTEND_ORIGIN, '/') . '/carrinho' : '';
    wp_die(esc_html($message) . ($back ? '<p><a href="' . esc_url($back) . '">Voltar ao carrinho e tentar novamente</a></p>' : ''), 'Transferência do carrinho', ['response' => $status]);
}
/** Resolve Store API display labels, including attributes of "any" variations. */
function pa_handoff_attributes($product, $selected) {
    if (!$product->is_type('variation')) {
        if ($selected) throw new RuntimeException('Atributos inesperados.');
        return [];
    }
    $parent = wc_get_product($product->get_parent_id());
    if (!$parent || !$parent->is_type('variable') || $parent->get_status() !== 'publish') throw new RuntimeException('Produto pai indisponível.');
    $resolved = []; $used = [];
    foreach ($parent->get_variation_attributes() as $name => $options) {
        $key = 'attribute_' . sanitize_title($name);
        $fixed = $product->get_variation_attributes()[$key] ?? '';
        $matches = [];
        foreach ($selected as $index => $entry) {
            if (!is_array($entry) || !isset($entry['attribute'], $entry['value']) || !is_string($entry['attribute']) || !is_string($entry['value'])) throw new RuntimeException('Atributo inválido.');
            if (in_array($entry['attribute'], [$name, $key, wc_attribute_label($name, $parent)], true)) {
                $value = $entry['value'];
                if (taxonomy_exists($name)) {
                    $term = get_term_by('slug', $value, $name);
                    if (!$term) $term = get_term_by('name', html_entity_decode($value, ENT_QUOTES, 'UTF-8'), $name);
                    if (!$term) throw new RuntimeException('Opção de variação indisponível.');
                    $value = $term->slug;
                } else $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
                $matches[] = $value; $used[$index] = true;
            }
        }
        if (count($matches) !== 1 || !in_array($matches[0], $options, true) || ($fixed !== '' && $fixed !== $matches[0])) throw new RuntimeException('Seleção de variação inválida.');
        $resolved[$key] = $matches[0];
    }
    if (count($used) !== count($selected)) throw new RuntimeException('Atributos não reconhecidos.');
    return $resolved;
}
function pa_handoff() {
    nocache_headers(); header('Referrer-Policy: no-referrer'); header('X-Robots-Tag: noindex, nofollow');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') pa_handoff_fail('Método não permitido.', 405);
    if (!defined('PA_HANDOFF_SECRET') || strlen(PA_HANDOFF_SECRET) < 32 || !defined('PA_FRONTEND_ORIGIN') || !function_exists('wc_load_cart')) pa_handoff_fail('Ponte indisponível.', 503);
    if (wc_get_page_id('checkout') < 1 || get_post_status(wc_get_page_id('checkout')) !== 'publish') pa_handoff_fail('Checkout nativo indisponível.', 503);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!hash_equals(rtrim(PA_FRONTEND_ORIGIN, '/'), $origin)) pa_handoff_fail('Origem inválida.', 403);
    if (!is_ssl() && !(wp_get_environment_type() === 'local' && in_array(wp_parse_url(home_url(), PHP_URL_HOST), ['localhost', '127.0.0.1', '::1'], true))) pa_handoff_fail('HTTPS obrigatório.', 503);
    $payload = isset($_POST['payload']) ? wp_unslash($_POST['payload']) : '';
    $signature = isset($_POST['signature']) ? wp_unslash($_POST['signature']) : '';
    if (!is_string($payload) || strlen($payload) > 60000 || !preg_match('/^[A-Za-z0-9_-]+$/D', $payload) || !is_string($signature)) pa_handoff_fail('Transferência inválida.');
    $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, PA_HANDOFF_SECRET, true)), '+/', '-_'), '=');
    if (!hash_equals($expected, $signature)) pa_handoff_fail('Assinatura inválida.', 403);
    $data = json_decode(base64_decode(strtr($payload, '-_', '+/'), true), true); $now = time();
    if (!is_array($data) || ($data['v'] ?? null) !== 2 || ($data['aud'] ?? '') !== 'pratika-checkout' || ($data['origin'] ?? '') !== $origin || !isset($data['iat'], $data['exp'], $data['jti'], $data['items']) || !is_int($data['iat']) || !is_int($data['exp']) || $data['iat'] > $now + 5 || $data['exp'] <= $now || $data['exp'] > $data['iat'] + 90 || !is_string($data['jti']) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $data['jti']) || !is_array($data['items']) || !count($data['items']) || count($data['items']) > 100) pa_handoff_fail('Transferência expirada ou inválida. Volte ao carrinho e tente novamente.');
    global $wpdb;
    // One-use security records, not catalogue cache. No cron or synchronization.
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name LIKE %s AND CAST(option_value AS UNSIGNED) < %d", $wpdb->esc_like('pa_transfer_') . '%', $now));
    if (!add_option('pa_transfer_' . $data['jti'], $data['exp'], '', false)) pa_handoff_fail('Transferência já utilizada. Volte ao carrinho e tente novamente.', 409);
    wc_load_cart();
    $lock = 'pa_handoff_lock_' . hash('sha256', WC()->session->get_customer_id());
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND CAST(option_value AS UNSIGNED) < %d", $lock, $now));
    wp_cache_delete($lock, 'options'); wp_cache_delete('notoptions', 'options');
    if (!add_option($lock, $now + 180, '', false)) pa_handoff_fail('Outra transferência está em andamento. Volte ao carrinho e tente novamente.', 409);
    $previous = WC()->cart->get_cart(); $coupons = WC()->cart->get_applied_coupons(); $notices = wc_get_notices();
    $persistent_key = '_woocommerce_persistent_cart_' . get_current_blog_id();
    $persistent = get_current_user_id() ? get_user_meta(get_current_user_id(), $persistent_key, true) : null;
    $removed = WC()->cart->get_removed_cart_contents(); $previous_totals = WC()->cart->get_totals();
    $changed = false; $failure = null;
    try {
        $validated = []; $seen = [];
        foreach ($data['items'] as $item) {
            if (!is_array($item) || !isset($item['id'], $item['quantity']) || !is_int($item['id']) || !is_int($item['quantity']) || !is_array($item['variation'] ?? null)) throw new RuntimeException('Item inválido.');
            $id = $item['id']; $qty = $item['quantity']; $p = wc_get_product($id);
            if (!$p || !in_array($p->get_type(), ['simple', 'variation'], true) || $p->get_status() !== 'publish' || !$p->is_purchasable() || !$p->is_in_stock() || $qty < 1 || $qty > 999 || !$p->has_enough_stock($qty) || ($p->is_sold_individually() && $qty !== 1)) throw new RuntimeException('Produto ou quantidade indisponível.');
            $attributes = pa_handoff_attributes($p, $item['variation']); $identity = $id . ':' . wp_json_encode($attributes);
            if (isset($seen[$identity])) throw new RuntimeException('Item repetido.');
            $seen[$identity] = true; $validated[] = [$p, $qty, $attributes];
        }
        $changed = true; WC()->cart->empty_cart(false);
        foreach ($validated as [$p, $qty, $attributes]) {
            $variation = $p->is_type('variation'); $product_id = $variation ? $p->get_parent_id() : $p->get_id();
            if (!apply_filters('woocommerce_add_to_cart_validation', true, $product_id, $qty, $variation ? $p->get_id() : 0, $attributes)) throw new RuntimeException('A loja recusou um dos produtos.');
            if (!WC()->cart->add_to_cart($product_id, $qty, $variation ? $p->get_id() : 0, $attributes)) throw new RuntimeException('Não foi possível adicionar um produto.');
        }
        $actual = WC()->cart->get_cart();
        if (count($actual) !== count($validated)) throw new RuntimeException('O carrinho recebido diverge da seleção.');
        foreach ($validated as [$p, $qty, $attributes]) {
            $found = false;
            foreach ($actual as $row) if (($row['variation_id'] ?: $row['product_id']) === $p->get_id() && $row['quantity'] === $qty && $row['variation'] == $attributes) $found = true;
            if (!$found) throw new RuntimeException('As quantidades recebidas divergem da seleção.');
        }
        WC()->cart->calculate_totals();
        if (wc_notice_count('error') > count($notices['error'] ?? [])) throw new RuntimeException('A loja recusou a transferência.');
        WC()->session->set_customer_session_cookie(true); WC()->cart->set_session(); WC()->session->save_data();
    } catch (Throwable $e) {
        $failure = $e;
        if ($changed) {
            WC()->cart->set_cart_contents($previous); WC()->cart->set_applied_coupons($coupons); WC()->cart->set_removed_cart_contents($removed);
            if (get_current_user_id()) update_user_meta(get_current_user_id(), $persistent_key, $persistent);
            WC()->cart->set_totals($previous_totals); WC()->cart->set_session(); WC()->session->save_data();
        }
        wc_set_notices($notices);
    } finally { delete_option($lock); }
    if ($failure) pa_handoff_fail('Não foi possível transferir: ' . $failure->getMessage() . ' Seu carrinho React está preservado.');
    // Redirect only after exact item validation and persistence on the native domain.
    wp_safe_redirect(wc_get_checkout_url(), 303); exit;
}

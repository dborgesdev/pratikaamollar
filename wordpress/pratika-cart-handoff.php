<?php
/**
 * Plugin Name: Pratika Amollar — ponte de carrinho
 * Description: Recebe transferência assinada do frontend e redireciona ao checkout nativo. Instalação manual, somente após autorização.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;
add_action('admin_post_nopriv_pa_handoff', 'pa_handoff');
add_action('admin_post_pa_handoff', 'pa_handoff');
function pa_handoff_decode($value) {
    return base64_decode(strtr($value, '-_', '+/'), true);
}
function pa_handoff() {
    nocache_headers();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !defined('PA_HANDOFF_SECRET') || !defined('PA_FRONTEND_ORIGIN')) wp_die('Ponte indisponível.', '', ['response'=>503]);
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? rtrim($_SERVER['HTTP_ORIGIN'], '/') : '';
    if (!hash_equals(rtrim(PA_FRONTEND_ORIGIN, '/'), $origin)) wp_die('Origem inválida.', '', ['response'=>403]);
    $payload = isset($_POST['payload']) ? wp_unslash($_POST['payload']) : '';
    $signature = isset($_POST['signature']) ? wp_unslash($_POST['signature']) : '';
    if (!is_string($payload) || strlen($payload)>12000 || !is_string($signature)) wp_die('Payload inválido.', '', ['response'=>400]);
    $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, PA_HANDOFF_SECRET, true)), '+/', '-_'), '=');
    if (!hash_equals($expected, $signature)) wp_die('Assinatura inválida.', '', ['response'=>403]);
    $data = json_decode(pa_handoff_decode($payload), true);
    if (!$data || !isset($data['exp'],$data['jti'],$data['items']) || $data['exp']<time() || $data['exp']>time()+120 || !preg_match('/^[a-f0-9-]{36}$/', $data['jti']) || !is_array($data['items']) || count($data['items'])>100) wp_die('Transferência expirada ou inválida.', '', ['response'=>400]);
    // Atomic unique option prevents concurrent replay. Expired records are cleaned daily.
    if (!add_option('pa_transfer_'.$data['jti'], $data['exp'], '', false)) wp_die('Transferência já utilizada. Volte ao carrinho e tente novamente.', '', ['response'=>409]);
    if (!wp_next_scheduled('pa_handoff_cleanup')) wp_schedule_event(time()+DAY_IN_SECONDS, 'daily', 'pa_handoff_cleanup');
    wc_load_cart();
    $validated=[];
    foreach ($data['items'] as $item) {
        $id=absint($item['id'] ?? 0); $qty=absint($item['quantity'] ?? 0); $product=wc_get_product($id);
        if (!$product || !$product->is_purchasable() || !$product->is_in_stock() || $qty<1 || $qty>999 || !$product->has_enough_stock($qty) || ($product->is_sold_individually() && $qty!==1)) wp_die('Produto ou quantidade indisponível. Volte à loja para atualizar o carrinho.', '', ['response'=>400]);
        $validated[]=['product'=>$product,'qty'=>$qty];
    }
    if (!$validated) wp_die('Carrinho vazio.', '', ['response'=>400]);
    $previous=WC()->cart->get_cart();
    $previous_coupons=WC()->cart->get_applied_coupons();
    WC()->cart->empty_cart();
    try {
        foreach ($validated as $item) {
            $p=$item['product']; $variation=$p->is_type('variation');
            $added=WC()->cart->add_to_cart($variation?$p->get_parent_id():$p->get_id(),$item['qty'],$variation?$p->get_id():0,$variation?$p->get_variation_attributes():[]);
            if (!$added) throw new Exception('Não foi possível adicionar um produto.');
        }
        foreach (array_slice($data['coupons'] ?? [],0,20) as $coupon) WC()->cart->apply_coupon(wc_format_coupon_code($coupon));
        WC()->cart->calculate_totals();
        WC()->session->set_customer_session_cookie(true);
        WC()->cart->set_session();
        wp_safe_redirect(wc_get_checkout_url(),303); exit;
    } catch (Throwable $e) {
        WC()->cart->empty_cart();
        foreach ($previous as $item) WC()->cart->add_to_cart($item['product_id'],$item['quantity'],$item['variation_id'],$item['variation']);
        foreach ($previous_coupons as $coupon) WC()->cart->apply_coupon($coupon);
        wp_die('Não foi possível transferir o carrinho. Tente novamente.', '', ['response'=>400]);
    }
}
add_action('pa_handoff_cleanup', function() {
    global $wpdb;
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name LIKE %s AND CAST(option_value AS UNSIGNED) < %d", $wpdb->esc_like('pa_transfer_').'%', time()));
});
register_deactivation_hook(__FILE__,function(){wp_clear_scheduled_hook('pa_handoff_cleanup');});

<?php
/**
 * Plugin Name: Pratika — Native product review submissions
 * Description: Isolated, credentialed AJAX adapter for the React product review form.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) { exit; }

final class PA_Review_Rejection extends RuntimeException {}

function pa_review_error($code, $message, $status = 400, $field = '') {
    return new WP_Error($code, $message, array('status' => $status, 'field' => $field));
}

function pa_review_product($id) {
    $product = wc_get_product($id);
    return $product && 'product' === get_post_type($id) && 'publish' === $product->get_status() && !get_post_field('post_password', $id) ? $product : false;
}

function pa_review_policy($id) {
    $product = pa_review_product($id);
    $enabled = $product && 'yes' === get_option('woocommerce_enable_reviews', 'yes') && $product->get_reviews_allowed() && comments_open($id);
    $logged_in = is_user_logged_in();
    $verified_only = 'yes' === get_option('woocommerce_review_rating_verification_required');
    $reason = !$enabled ? 'disabled' : '';
    if ($enabled && !$logged_in && (get_option('comment_registration') || $verified_only)) { $reason = 'login_required'; }
    if ($enabled && $logged_in && $verified_only && !wc_customer_bought_product('', get_current_user_id(), $id)) { $reason = 'verified_owner_required'; }
    return array(
        'enabled' => (bool) $enabled, 'can_submit' => $enabled && !$reason, 'reason' => $reason,
        'authenticated' => $logged_in, 'email_required' => !$logged_in && (bool) get_option('require_name_email'),
        'rating_enabled' => wc_review_ratings_enabled(), 'rating_required' => wc_review_ratings_required(),
    );
}

function pa_review_actor() {
    // Never trust arbitrary X-Forwarded-For/CF headers. Configure REMOTE_ADDR correctly at the trusted web server.
    return hash_hmac('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . (string) ($_SERVER['HTTP_USER_AGENT'] ?? '') . '|' . get_current_user_id(), wp_salt('nonce'));
}

function pa_review_challenge($id) {
    $payload = $id . '.' . time() . '.' . bin2hex(random_bytes(16));
    return $payload . '.' . hash_hmac('sha256', $payload . '|' . pa_review_actor(), wp_salt('nonce'));
}

function pa_review_check_challenge($id, $token) {
    if (!is_string($token) || !preg_match('/^([1-9][0-9]*)\.([0-9]{10})\.([a-f0-9]{32})\.([a-f0-9]{64})$/D', $token, $m)) { return false; }
    $payload = $m[1] . '.' . $m[2] . '.' . $m[3];
    return (int) $m[1] === $id && time() - (int) $m[2] >= 3 && time() - (int) $m[2] <= 1800 && hash_equals(hash_hmac('sha256', $payload . '|' . pa_review_actor(), wp_salt('nonce')), $m[4]);
}

function pa_review_submit($id, $input) {
    $policy = pa_review_policy($id);
    if (!$policy['can_submit']) { return pa_review_error('not_allowed', 'Este produto não está disponível para sua avaliação.', 403); }
    if (!pa_review_check_challenge($id, $input['challenge'] ?? '') || !empty($input['website'])) { return pa_review_error('invalid_challenge', 'Reabra o formulário e tente novamente.', 403); }
    $comment = is_string($input['comment'] ?? null) ? trim($input['comment']) : '';
    $author = is_string($input['author'] ?? null) ? sanitize_text_field($input['author']) : '';
    $email = is_string($input['email'] ?? null) ? trim($input['email']) : '';
    $rating = $input['rating'] ?? '';
    if (!is_scalar($rating)) { return pa_review_error('invalid_rating', 'Selecione de 1 a 5 estrelas.', 400, 'rating'); }
    if (!$comment || strlen($comment) > 10000 || !trim(wp_strip_all_tags($comment))) { return pa_review_error('invalid_comment', 'Escreva um comentário de até 10.000 bytes.', 400, 'comment'); }
    if (!$policy['authenticated'] && (!$author || strlen($author) > 200)) { return pa_review_error('invalid_author', 'Informe seu nome (até 200 bytes).', 400, 'author'); }
    if (!$policy['authenticated'] && (($policy['email_required'] && !$email) || ($email && (!is_email($email) || strlen($email) > 100)))) { return pa_review_error('invalid_email', 'Informe um e-mail válido.', 400, 'email'); }
    if ($policy['rating_enabled'] && (($policy['rating_required'] && !$rating) || ($rating !== '' && !preg_match('/^[1-5]$/D', (string) $rating)))) { return pa_review_error('invalid_rating', 'Selecione de 1 a 5 estrelas.', 400, 'rating'); }

    $fingerprint = hash_hmac('sha256', $id . '|' . $comment . '|' . $author . '|' . $email . '|' . $rating, wp_salt('nonce'));
    $key = 'pa_review_result_' . hash('sha256', $input['challenge']);
    $previous = get_transient($key);
    if ($previous) { return hash_equals($previous['fingerprint'], $fingerprint) ? $previous['result'] : pa_review_error('used_challenge', 'Reabra o formulário para enviar outra avaliação.', 409); }
    // Atomic per-network lock serializes requests; rate limits cannot be bypassed by minting new challenges/users.
    $network = hash_hmac('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? ''), wp_salt('nonce'));
    $lock = 'pa_review_lock_' . $network;
    $now = time();
    $old = (int) get_option($lock, 0);
    if ($old && $old < $now - 120) { delete_option($lock); }
    if (!add_option($lock, $now, '', false)) { return pa_review_error('busy', 'Um envio está em andamento. Aguarde antes de tentar novamente.', 429); }
    // Cleanup also covers fatal errors/wp_die from third-party hooks.
    register_shutdown_function(function () use ($lock) { delete_option($lock); });
    try {
        $previous = get_transient($key);
        if ($previous) { return hash_equals($previous['fingerprint'], $fingerprint) ? $previous['result'] : pa_review_error('used_challenge', 'Reabra o formulário para enviar outra avaliação.', 409); }
        $rate_key = 'pa_review_rate_' . $network;
        $rate = get_transient($rate_key) ?: array('start' => $now, 'last' => 0, 'count' => 0);
        if ($now - $rate['start'] >= 3600) { $rate = array('start' => $now, 'last' => 0, 'count' => 0); }
        if ($now - $rate['last'] < 20 || $rate['count'] >= 10) { return pa_review_error('rate_limited', 'Aguarde antes de enviar outra avaliação.', 429); }
        $rate['last'] = $now; $rate['count']++;
        set_transient($rate_key, $rate, 3600);
        // Reserve before the native write. A crash/ambiguous outcome cannot create a second comment on retry.
        set_transient($key, array('fingerprint' => $fingerprint, 'result' => pa_review_error('uncertain', 'O envio já foi processado ou está em análise. Consulte as avaliações antes de tentar novamente.', 409)), 1800);
        $die_filter = function () { return function () { throw new PA_Review_Rejection(); }; };
        add_filter('wp_die_ajax_handler', $die_filter, PHP_INT_MAX);
        $moderation_filter = function ($approved) { return !is_wp_error($approved) && get_option('comment_moderation') && !in_array($approved, array('spam', 'trash'), true) ? 0 : $approved; };
        add_filter('pre_comment_approved', $moderation_filter, PHP_INT_MAX);
        // admin-ajax runs is_admin()=true; WC's public-form type conversion deliberately skips it.
        $type_filter = function ($data) use ($id) { if ((int) $data['comment_post_ID'] === $id) { $data['comment_type'] = 'review'; } return $data; };
        add_filter('preprocess_comment', $type_filter, 2);
        $saved_post = $_POST;
        // WooCommerce hooks read these exact native fields to set type/rating/verified and clear aggregates.
        $_POST = wp_slash(array('comment_post_ID' => $id, 'rating' => $policy['rating_enabled'] ? $rating : '', 'comment' => $comment, 'author' => $author, 'email' => $email));
        try {
            $result = wp_handle_comment_submission(array('comment_post_ID' => $id, 'comment' => wp_kses_post($comment), 'author' => $author, 'email' => $email, 'url' => '', 'comment_parent' => 0));
        } catch (PA_Review_Rejection $e) {
            $result = pa_review_error('native_rejected', 'A loja não aceitou esta avaliação. Confira os dados e tente novamente.', 400);
        } catch (Throwable $e) {
            $result = pa_review_error('uncertain', 'Não foi possível confirmar o resultado do envio. Consulte as avaliações antes de tentar novamente.', 409);
        } finally {
            $_POST = $saved_post;
            remove_filter('wp_die_ajax_handler', $die_filter, PHP_INT_MAX);
            remove_filter('pre_comment_approved', $moderation_filter, PHP_INT_MAX);
            remove_filter('preprocess_comment', $type_filter, 2);
        }
        if (is_wp_error($result)) {
            $code = $result->get_error_code();
            if ('comment_duplicate' === $code) { $result = pa_review_error('duplicate', 'Esta avaliação já foi enviada.', 409); }
            elseif ('comment_flood' === $code) { $result = pa_review_error('rate_limited', 'Aguarde antes de enviar outra avaliação.', 429); }
            elseif ('uncertain' !== $code) { $result = pa_review_error('native_rejected', 'A loja não aceitou esta avaliação. Confira os dados e tente novamente.', 400); }
        } else {
            // Never expose a spam/trash classification or mark a held review as published.
            $result = array('status' => '1' === (string) $result->comment_approved ? 'approved' : 'pending');
        }
        set_transient($key, array('fingerprint' => $fingerprint, 'result' => $result), 1800);
        return $result;
    } finally { delete_option($lock); }
}

function pa_review_ajax($submit = false) {
    nocache_headers();
    header('Vary: Origin', false);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $origins = defined('PA_REVIEW_ORIGINS') ? PA_REVIEW_ORIGINS : array('https://pratikaamollar.com.br');
    if (!in_array($origin, $origins, true)) { wp_send_json(array('message' => 'Origem não autorizada.'), 403); }
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('X-Content-Type-Options: nosniff');
    if (($submit ? 'POST' : 'GET') !== ($_SERVER['REQUEST_METHOD'] ?? '')) { wp_send_json(array('message' => 'Método inválido.'), 405); }
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 40000) { wp_send_json(array('message' => 'Avaliação muito extensa.'), 413); }
    if (!function_exists('wc_get_product')) { wp_send_json(array('message' => 'Avaliações indisponíveis.'), 503); }
    $input = wp_unslash($submit ? $_POST : $_GET);
    $id = $input['product_id'] ?? '';
    if (!is_scalar($id) || !preg_match('/^[1-9][0-9]{0,9}$/D', (string) $id)) { wp_send_json(array('message' => 'Produto inválido.'), 400); }
    if ($submit) {
        $result = pa_review_submit((int) $id, $input);
        if (is_wp_error($result)) {
            $data = $result->get_error_data();
            wp_send_json(array('code' => $result->get_error_code(), 'message' => $result->get_error_message(), 'field' => $data['field'] ?? ''), $data['status'] ?? 400);
        }
        wp_send_json($result);
    }
    $policy = pa_review_policy((int) $id);
    if ($policy['can_submit']) { $policy['challenge'] = pa_review_challenge((int) $id); }
    wp_send_json($policy);
}
foreach (array('wp_ajax_', 'wp_ajax_nopriv_') as $prefix) {
    add_action($prefix . 'pa_review_context', function () { pa_review_ajax(false); });
    add_action($prefix . 'pa_review_submit', function () { pa_review_ajax(true); });
}

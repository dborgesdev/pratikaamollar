<?php
// Disposable loopback WordPress only; never install this test helper on a remote site.
$root = getenv('PA_REVIEW_TEST_WP_ROOT');
if (PHP_SAPI !== 'cli' || !$root || getenv('PA_REVIEW_TEST_ALLOW_MUTATIONS') !== '1') { throw new RuntimeException('Local opt-in required'); }
define('DOING_AJAX', true); define('WP_ADMIN', true);
define('WP_DISABLE_FATAL_ERROR_HANDLER', true);
$_SERVER['HTTP_HOST'] = '127.0.0.1:4193'; $_SERVER['REQUEST_URI'] = '/wp-admin/admin-ajax.php';
$_SERVER['REQUEST_METHOD'] = 'POST'; $_SERVER['REMOTE_ADDR'] = '127.0.0.1'; $_SERVER['HTTP_USER_AGENT'] = 'Pratika-local-QA';
require $root . '/wp-load.php';
if ('local' !== wp_get_environment_type() || !in_array(wp_parse_url(home_url(), PHP_URL_HOST), array('127.0.0.1', 'localhost'), true)) { throw new RuntimeException('Loopback only'); }
require __DIR__ . '/../product-reviews/pratika-product-reviews.php';
add_filter('pre_wp_mail', '__return_true');
// Native flood is tested separately; avoid minute-long waits between independent local fixture scenarios.
add_filter('comment_flood_filter', '__return_false');
add_filter('pre_http_request', function () { return new WP_Error('local_offline', 'External requests disabled in lab'); });
$options = array('woocommerce_enable_reviews', 'woocommerce_enable_review_rating', 'woocommerce_review_rating_required', 'woocommerce_review_rating_verification_required', 'require_name_email', 'comment_registration', 'comment_moderation', 'comment_previously_approved', 'comment_max_links');
$saved = array(); foreach ($options as $key) { $saved[$key] = get_option($key, null); }
$checks = array(); $id = 0; $user = 0;
function review_check($condition, $label) { if (!$condition) { throw new RuntimeException($label); } $GLOBALS['checks'][] = $label; }
function review_token($id, $age = 4) {
    $payload = $id . '.' . (time() - $age) . '.' . bin2hex(random_bytes(16));
    return $payload . '.' . hash_hmac('sha256', $payload . '|' . pa_review_actor(), wp_salt('nonce'));
}
function review_input($id, $comment = 'Comentário sintético exclusivo de QA local.') { return array('challenge' => review_token($id), 'rating' => '5', 'comment' => $comment, 'author' => 'QA local', 'email' => 'qa@example.test', 'website' => ''); }
function review_clear_rate() { delete_transient('pa_review_rate_' . hash_hmac('sha256', $_SERVER['REMOTE_ADDR'], wp_salt('nonce'))); }
try {
    foreach (array('woocommerce_enable_reviews', 'woocommerce_enable_review_rating', 'woocommerce_review_rating_required') as $key) { update_option($key, 'yes'); }
    update_option('woocommerce_review_rating_verification_required', 'no'); update_option('require_name_email', 1); update_option('comment_registration', 0); update_option('comment_moderation', 1); update_option('comment_previously_approved', 0); update_option('comment_max_links', 99);
    wp_set_current_user(0);
    $p = new WC_Product_Simple(); $p->set_name('QA local reviews ' . uniqid()); $p->set_status('publish'); $p->set_regular_price('10'); $p->set_reviews_allowed(true); $id = $p->save();
    review_check(pa_review_policy($id)['can_submit'], 'anonymous allowed without verified purchase');
    foreach (array('', '0', '6', '2.5', array(5)) as $rating) {
        $input = review_input($id); $input['rating'] = $rating; $result = pa_review_submit($id, $input);
        review_check(is_wp_error($result) && 'invalid_rating' === $result->get_error_code(), 'invalid rating ' . json_encode($rating));
    }
    foreach (array('comment' => '', 'author' => '', 'email' => 'invalid') as $field => $value) {
        $input = review_input($id); $input[$field] = $value; $result = pa_review_submit($id, $input);
        review_check(is_wp_error($result) && 'invalid_' . $field === $result->get_error_code(), 'validation ' . $field);
    }
    foreach (array(0, 1900) as $age) { $input = review_input($id); $input['challenge'] = review_token($id, $age); review_check(is_wp_error(pa_review_submit($id, $input)), 'challenge age ' . $age); }
    $input = review_input($id); $input['website'] = 'spam'; review_check(is_wp_error(pa_review_submit($id, $input)), 'honeypot rejected');
    $input = review_input($id); $input['challenge'] .= 'x'; review_check(is_wp_error(pa_review_submit($id, $input)), 'tampered token rejected');
    $input = review_input($id, '<p>QA local <strong>seguro</strong><script>alert(1)</script><img src=x onerror=alert(2)></p>');
    review_clear_rate(); $before = get_comments(array('post_id' => $id, 'count' => true, 'status' => 'all'));
    $result = pa_review_submit($id, $input);
    review_check(!is_wp_error($result) && 'pending' === $result['status'], 'moderated result pending');
    $comments = get_comments(array('post_id' => $id, 'status' => 'all')); $comment = $comments[0];
    review_check('review' === $comment->comment_type && '0' === $comment->comment_approved, 'native product review type and moderation');
    review_check(5 === (int) get_comment_meta($comment->comment_ID, 'rating', true), 'native rating meta');
    review_check(!str_contains($comment->comment_content, '<script') && !str_contains($comment->comment_content, 'onerror'), 'server HTML sanitization');
    review_check($result === pa_review_submit($id, $input) && get_comments(array('post_id' => $id, 'count' => true, 'status' => 'all')) === $before + 1, 'same challenge replay creates no duplicate');
    $input['comment'] = 'Changed'; review_check(is_wp_error(pa_review_submit($id, $input)), 'reused token with changed data rejected');
    review_check('rate_limited' === pa_review_submit($id, review_input($id))->get_error_code(), 'network frequency limit');
    $hour_key = 'pa_review_rate_' . hash_hmac('sha256', $_SERVER['REMOTE_ADDR'], wp_salt('nonce')); set_transient($hour_key, array('start' => time(), 'last' => time() - 30, 'count' => 10), 3600);
    review_check('rate_limited' === pa_review_submit($id, review_input($id))->get_error_code(), 'hourly limit');
    $lock = 'pa_review_lock_' . hash_hmac('sha256', $_SERVER['REMOTE_ADDR'], wp_salt('nonce')); add_option($lock, time(), '', false);
    review_check('busy' === pa_review_submit($id, review_input($id))->get_error_code(), 'concurrent request lock'); delete_option($lock);
    update_option('comment_moderation', 0); review_clear_rate();
    $approved_input = review_input($id, 'Outra avaliação de QA local aprovada.');
    $result = pa_review_submit($id, $approved_input); review_check(!is_wp_error($result) && 'approved' === $result['status'], 'native approval when moderation not required');
    review_clear_rate(); $approved_input['challenge'] = review_token($id);
    $result = pa_review_submit($id, $approved_input); review_check(is_wp_error($result) && 'duplicate' === $result->get_error_code(), 'native duplicate detection across challenges');
    review_clear_rate(); remove_filter('comment_flood_filter', '__return_false');
    $result = pa_review_submit($id, review_input($id, 'Flood nativo de QA local.'));
    review_check(is_wp_error($result) && 'rate_limited' === $result->get_error_code(), 'native anti-flood retained');
    add_filter('comment_flood_filter', '__return_false');
    $p->set_reviews_allowed(false); $p->save(); review_check(!pa_review_policy($id)['can_submit'], 'product reviews disabled');
    $p->set_reviews_allowed(true); $p->save();
    update_option('comment_registration', 1); review_check(!pa_review_policy($id)['can_submit'], 'anonymous registration restriction');
    $user = wp_insert_user(array('user_login' => 'review_qa_' . uniqid(), 'user_pass' => wp_generate_password(), 'user_email' => 'review_' . uniqid() . '@example.test', 'role' => 'customer', 'display_name' => 'Cliente QA local'));
    if (is_wp_error($user)) { throw new RuntimeException('Could not prepare local customer'); }
    wp_set_current_user($user); review_check(pa_review_policy($id)['can_submit'] && pa_review_policy($id)['authenticated'], 'authenticated customer allowed');
    review_clear_rate(); $result = pa_review_submit($id, review_input($id, 'QA local cliente autenticado.'));
    review_check(!is_wp_error($result), 'authenticated native submission');
    $row = get_comments(array('post_id' => $id, 'user_id' => $user, 'status' => 'all'))[0];
    review_check((int) $row->user_id === $user && $row->comment_author_email === get_userdata($user)->user_email, 'identity from session not submitted email');
    update_option('woocommerce_review_rating_verification_required', 'yes');
    review_check(!pa_review_policy($id)['can_submit'], 'non-buyer blocked when verified-only enabled');
    $buyer_filter = function () { return true; }; add_filter('woocommerce_pre_customer_bought_product', $buyer_filter);
    review_check(pa_review_policy($id)['can_submit'], 'verified buyer eligibility through native Woo filter'); remove_filter('woocommerce_pre_customer_bought_product', $buyer_filter);
    update_option('woocommerce_review_rating_verification_required', 'no'); update_option('comment_moderation', 1); review_clear_rate();
    $result = pa_review_submit($id, review_input($id, 'QA local cliente com moderação obrigatória.'));
    review_check(!is_wp_error($result) && 'pending' === $result['status'], 'authenticated submission respects mandatory moderation');
    review_clear_rate(); $before = get_comments(array('post_id' => $id, 'count' => true, 'status' => 'all'));
    $reject_filter = function () { return new WP_Error('qa_reject', 'Private plugin error never exposed'); }; add_filter('pre_comment_approved', $reject_filter, 999);
    $result = pa_review_submit($id, review_input($id, 'QA local rejection from native hook.')); remove_filter('pre_comment_approved', $reject_filter, 999);
    review_check(is_wp_error($result) && !str_contains($result->get_error_message(), 'Private') && get_comments(array('post_id' => $id, 'count' => true, 'status' => 'all')) === $before, 'moderation preserves plugin rejection and hides internal details');
    review_clear_rate(); $crash = function () { throw new RuntimeException('Private post-write hook failure'); }; add_action('comment_post', $crash, 999);
    $input = review_input($id, 'QA local simulated post-write failure.'); $result = pa_review_submit($id, $input); remove_action('comment_post', $crash, 999);
    $count = get_comments(array('post_id' => $id, 'count' => true, 'status' => 'all')); $retry = pa_review_submit($id, $input);
    review_check(is_wp_error($result) && 'uncertain' === $result->get_error_code() && is_wp_error($retry) && get_comments(array('post_id' => $id, 'count' => true, 'status' => 'all')) === $count, 'ambiguous native outcome is not retried as a second insert');
    echo json_encode(array('wordpress' => get_bloginfo('version'), 'woocommerce' => WC_VERSION, 'checks' => $checks), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} finally {
    wp_set_current_user(0);
    if ($id) { foreach (get_comments(array('post_id' => $id, 'status' => 'all')) as $comment) { wp_delete_comment($comment->comment_ID, true); } wp_delete_post($id, true); }
    if ($user && !is_wp_error($user)) { require_once ABSPATH . 'wp-admin/includes/user.php'; wp_delete_user($user); }
    foreach ($saved as $key => $value) { null === $value ? delete_option($key) : update_option($key, $value); }
    review_clear_rate();
}

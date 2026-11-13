<?php
$root = getenv('PA_REVIEW_TEST_WP_ROOT');
if (PHP_SAPI !== 'cli' || !$root || getenv('PA_REVIEW_TEST_ALLOW_MUTATIONS') !== '1') { throw new RuntimeException('Local opt-in required'); }
$_SERVER['HTTP_HOST'] = '127.0.0.1:4193'; $_SERVER['REQUEST_URI'] = '/'; $_SERVER['REQUEST_METHOD'] = 'GET';
require $root . '/wp-load.php';
if ('local' !== wp_get_environment_type() || !in_array(wp_parse_url(home_url(), PHP_URL_HOST), array('127.0.0.1', 'localhost'), true)) { throw new RuntimeException('Loopback only'); }
add_filter('pre_wp_mail', '__return_true');
$file = __DIR__ . '/../../.wrangler/review-http-state.json';
$action = $argv[1] ?? '';
if ('setup' === $action) {
    if (file_exists($file)) { throw new RuntimeException('Clean up previous lab first'); }
    $options = array('woocommerce_enable_reviews' => 'yes', 'woocommerce_enable_review_rating' => 'yes', 'woocommerce_review_rating_required' => 'yes', 'woocommerce_review_rating_verification_required' => 'no', 'comment_registration' => 0, 'require_name_email' => 1, 'comment_moderation' => 1);
    $saved = array(); foreach ($options as $key => $value) { $saved[$key] = get_option($key, null); }
    $p = new WC_Product_Simple(); $p->set_name('QA HTTP local review'); $p->set_status('publish'); $p->set_regular_price('10'); $p->set_reviews_allowed(true); $id = $p->save();
    file_put_contents($file, json_encode(array('id' => $id, 'options' => $saved)));
    foreach ($options as $key => $value) { update_option($key, $value); }
    echo json_encode(array('product_id' => $id));
} else {
    $state = json_decode(file_get_contents($file), true); $id = $state['id'];
    $rows = get_comments(array('post_id' => $id, 'status' => 'all'));
    if ('inspect' === $action) {
        echo json_encode(array('count' => count($rows), 'reviews' => array_map(function ($row) { return array('type' => $row->comment_type, 'approved' => $row->comment_approved, 'rating' => get_comment_meta($row->comment_ID, 'rating', true)); }, $rows)));
    } elseif ('cleanup' === $action) {
        foreach ($rows as $row) { wp_delete_comment($row->comment_ID, true); } wp_delete_post($id, true);
        foreach ($state['options'] as $key => $value) { null === $value ? delete_option($key) : update_option($key, $value); }
        delete_transient('pa_review_rate_' . hash_hmac('sha256', '127.0.0.1', wp_salt('nonce')));
        unlink($file); echo 'Local fixture removed; settings restored.';
    }
}

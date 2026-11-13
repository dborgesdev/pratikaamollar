<?php
// Loopback-only HTTP lab. NEVER upload this router to a remote WordPress.
$root = getenv('PA_REVIEW_TEST_WP_ROOT');
if (PHP_SAPI !== 'cli-server' || !$root || getenv('PA_REVIEW_TEST_ALLOW_MUTATIONS') !== '1' || !in_array($_SERVER['HTTP_HOST'] ?? '', array('127.0.0.1:4197', 'localhost:4197'), true)) { http_response_code(403); exit; }
define('DOING_AJAX', true); define('WP_ADMIN', true);
define('PA_REVIEW_ORIGINS', array('http://127.0.0.1:5183'));
require $root . '/wp-load.php';
if ('local' !== wp_get_environment_type() || !in_array(wp_parse_url(home_url(), PHP_URL_HOST), array('127.0.0.1', 'localhost'), true)) { http_response_code(403); exit; }
require __DIR__ . '/../product-reviews/pratika-product-reviews.php';
add_filter('pre_wp_mail', '__return_true');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ('/context' === $path) { pa_review_ajax(false); }
if ('/submit' === $path) { pa_review_ajax(true); }
http_response_code(404);

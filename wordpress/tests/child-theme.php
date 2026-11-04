<?php
/** Component-only harness. These stubs are NOT a WordPress/WoodMart integration. */
define('ABSPATH', __DIR__ . '/');
$root = dirname(__DIR__) . '/pratika-amollar-child';
$callbacks = array();
function add_action($hook, $callback, $priority = 10) { global $callbacks; $callbacks[$hook][] = $callback; }
function add_filter($hook, $callback) { add_action($hook, $callback); }
function get_stylesheet_directory() { global $root; return $root; }
function get_stylesheet_directory_uri() { return '../../wordpress/pratika-amollar-child'; }
function get_template_directory() { return __DIR__ . '/missing-parent-fixture'; }
function did_action($name) { return $name === 'wp' ? 1 : 0; }
function is_admin() { return false; }
function esc_html($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function esc_url($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
require $root . '/functions.php';
if (($argv[1] ?? '') === 'check') {
    if (pa_child_adapter_ready()) { throw new Exception('Missing parent must not enable integration'); }
    $classes = $callbacks['body_class'][0](array('original'));
    if ($classes !== array('original')) { throw new Exception('Fallback changed body classes'); }
    // Would fail on undefined enqueue functions if guard did not work.
    pa_child_enqueue_assets();
    if (count(pa_child_navigation()) !== 2) { throw new Exception('Navigation must be static'); }
    if (count(pa_child_policies()) !== 4) { throw new Exception('Missing policies'); }
    if (pa_child_url('/my-account/', true) !== 'https://loja.pratikaamollar.com.br/my-account/') { throw new Exception('Operational URL mismatch'); }
    if (pa_child_url('/produtos') !== pa_child_config()['frontend_origin'] . '/produtos') { throw new Exception('Frontend URL mismatch'); }
    echo "PASS: disabled adapter, no partial assets, static navigation, policies, central URLs\n";
    exit;
}
?><!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pratika — componentes isolados, sem WordPress</title><link rel="stylesheet" href="../../wordpress/pratika-amollar-child/assets/css/identity.css"><link rel="stylesheet" href="../../wordpress/pratika-amollar-child/assets/css/woocommerce.css"><style>body{margin:0}main{max-width:900px;margin:auto;padding:64px 22px;min-height:260px}h1{font:400 48px 'DM Serif Display',serif}</style></head><body class="pa-child"><?php pa_child_render_header(); ?><main id="pa-content" tabindex="-1"><h1>Prévia dos componentes</h1><p>Header e footer reais do tema filho, renderizados em PHP. Esta prévia não contém WordPress, WoodMart, checkout ou pagamentos.</p></main><?php pa_child_render_footer(); ?><script src="../../wordpress/pratika-amollar-child/assets/js/navigation.js"></script></body></html>

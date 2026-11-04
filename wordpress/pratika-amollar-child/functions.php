<?php
/** No activation mutations, redirects, session or checkout filters. */
defined('ABSPATH') || exit;
require_once __DIR__ . '/inc/config.php';
require_once __DIR__ . '/inc/components.php';
require_once __DIR__ . '/inc/compatibility.php';
require_once __DIR__ . '/inc/chrome.php';

function pa_child_enqueue_assets() {
    // No partial makeover when the parent template contract has not been audited.
    if (!pa_child_shell_enabled()) {
        return;
    }
    $base = get_stylesheet_directory_uri() . '/assets/';
    $dir = get_stylesheet_directory() . '/assets/';
    // The parent remains responsible for its own styles/scripts and WooCommerce assets.
    $deps = wp_style_is('woodmart-style', 'registered') ? array('woodmart-style') : array();
    wp_enqueue_style('pa-child-identity', $base . 'css/identity.css', $deps, (string) filemtime($dir . 'css/identity.css'));
    wp_enqueue_style('pa-child-woocommerce', $base . 'css/woocommerce.css', array('pa-child-identity'), (string) filemtime($dir . 'css/woocommerce.css'));
    wp_enqueue_script('pa-child-navigation', $base . 'js/navigation.js', array(), (string) filemtime($dir . 'js/navigation.js'), true);
}
add_action('wp_enqueue_scripts', 'pa_child_enqueue_assets', 10020);
add_filter('body_class', function ($classes) {
    if (pa_child_shell_enabled()) {
        $classes[] = 'pa-child';
    }
    return $classes;
});
add_action('admin_notices', function () {
    if (!current_user_can('switch_themes') || pa_child_adapter_ready()) {
        return;
    }
    echo '<div class="notice notice-warning"><p>' . esc_html('Pratika Amollar: os arquivos do WoodMart diferem da versão 8.1.1 auditada ou o pacote está incompleto. O header/footer do pai foram preservados. Revalidar o adaptador antes de atualizar o contrato, conforme README.md.') . '</p></div>';
});

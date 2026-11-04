<?php
defined('ABSPATH') || exit;

/** Exact hook/callback/priority triples read from the installed 8.1.1 sources. */
function pa_child_remove_parent_chrome() {
    if (!pa_child_shell_enabled()) {
        return;
    }
    $callbacks = array(
        array('woodmart_after_body_open', 'woodmart_preloader_template', 500),
        array('woodmart_before_wp_footer', 'woodmart_search_full_screen', 100),
        array('woodmart_before_wp_footer', 'woodmart_full_screen_main_nav', 120),
        array('woodmart_before_wp_footer', 'woodmart_mobile_menu', 130),
        array('woodmart_before_wp_footer', 'woodmart_cart_side_widget', 140),
        array('woodmart_before_wp_footer', 'woodmart_header_banner', 160),
        array('woodmart_before_wp_footer', 'woodmart_sidebar_login_form', 160),
        array('woodmart_before_wp_footer', 'woodmart_get_sticky_social', 200),
        array('woodmart_before_wp_footer', 'woodmart_promo_popup', 200),
        array('woodmart_before_wp_footer', 'woodmart_scroll_top_btn', 10),
        array('wp_footer', 'woodmart_sticky_toolbar_template', 10),
    );
    foreach ($callbacks as $callback) {
        remove_action($callback[0], $callback[1], $callback[2]);
    }
    // Cookies, notices, plugin callbacks, wp_head/wp_footer and payment hooks remain.
}
add_action('template_redirect', 'pa_child_remove_parent_chrome', 50);

/** Presentation-only, request-local overrides via the verified native option filter. */
add_filter('woodmart_option', function ($value, $slug) {
    if (!pa_child_shell_enabled()) {
        return $value;
    }
    if (in_array($slug, array('header_banner', 'sticky_toolbar', 'sticky_footer'), true)) {
        return false;
    }
    return $value;
}, 100, 2);

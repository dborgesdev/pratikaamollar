<?php
/** Review-only snippet: integrate into an EXISTING child theme's functions.php after approval.
 * Never replace functions.php. Defaults to disabled. No checkout or session hooks.
 */
if (!defined('ABSPATH')) { exit; }
function pa_visual_page_enabled() {
    // Fill verified page IDs after staging approval. Empty = disabled.
    $page_ids = array();
    return !is_admin() && is_page($page_ids) && !empty($page_ids);
}
add_filter('body_class', function ($classes) {
    if (pa_visual_page_enabled()) { $classes[] = 'pa-operational'; }
    return $classes;
});
add_action('wp_enqueue_scripts', function () {
    if (!pa_visual_page_enabled()) { return; }
    $relative = '/pratika-visual/assets/operational.css';
    $file = get_stylesheet_directory() . $relative;
    if (is_readable($file)) {
        wp_enqueue_style('pa-operational', get_stylesheet_directory_uri() . $relative, array(), (string) filemtime($file));
    }
}, 100);

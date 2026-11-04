<?php
defined('ABSPATH') || exit;
/** Lucide-compatible geometric icons, static whitelist; never receives external SVG. */
function pa_child_icon($name) {
    $paths = array(
        'user' => '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
        'cart' => '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.58L22 6H5.12"/>',
        'menu' => '<path d="M4 5h16M4 12h16M4 19h16"/>',
        'close' => '<path d="m18 6-12 12M6 6l12 12"/>',
        'external' => '<path d="M7 17 17 7M7 7h10v10"/>',
    );
    if (!isset($paths[$name])) {
        return;
    }
    echo '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' . $paths[$name] . '</svg>';
}
function pa_child_render_header() {
    require get_stylesheet_directory() . '/template-parts/header.php';
}
function pa_child_render_footer() {
    require get_stylesheet_directory() . '/template-parts/footer.php';
}

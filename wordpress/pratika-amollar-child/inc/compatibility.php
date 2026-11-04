<?php
defined('ABSPATH') || exit;

/**
 * No guessed WoodMart hooks or wrappers. An audited adapter must preserve the
 * installed parent's structure and hooks, replacing only its visual chrome.
 * The manifest fingerprints the installed 8.1.1 sources and reviewed adapters.
 */
function pa_child_adapter_ready() {
    static $ready = null;
    if ($ready !== null) {
        return $ready;
    }
    $ready = false;
    $file = get_stylesheet_directory() . '/inc/parent-contract.json';
    if (!is_readable($file)) {
        return false;
    }
    $contract = json_decode((string) file_get_contents($file), true);
    if (!is_array($contract) || empty($contract['reviewed']) || empty($contract['files']) || !is_array($contract['files']) || empty($contract['adapters']) || !is_array($contract['adapters'])) {
        return false;
    }
    foreach (array('style.css', 'header.php', 'footer.php') as $required) {
        if (empty($contract['files'][$required])) {
            return false;
        }
    }
    foreach ($contract['files'] as $path => $expected) {
        if (!is_string($path) || strpos($path, '..') !== false || (!preg_match('~^[a-zA-Z0-9_/-]+\.php$~D', $path) && $path !== 'style.css')) {
            return false;
        }
        $source = get_template_directory() . '/' . $path;
        if (!is_readable($source) || !is_string($expected) || !hash_equals($expected, pa_child_source_hash($source))) {
            return false;
        }
    }
    // Both halves must match together; never mix parent and child wrappers.
    foreach (array('header', 'footer') as $name) {
        $expected = isset($contract['adapters'][$name]) ? $contract['adapters'][$name] : '';
        $adapter = get_stylesheet_directory() . '/adapters/' . $name . '.php';
        if (!is_readable($adapter) || !is_string($expected) || !hash_equals($expected, pa_child_source_hash($adapter))) {
            return false;
        }
    }
    $ready = true;
    return true;
}
function pa_child_source_hash($file) {
    // FTP ASCII and Git may convert LF/CRLF; compare text without changing files.
    return hash('sha256', str_replace("\r\n", "\n", (string) file_get_contents($file)));
}
function pa_child_shell_enabled() {
    // Conditional tags need the main query; parent option reads also run at boot.
    if (!did_action('wp') || is_admin() || !pa_child_adapter_ready()) {
        return false;
    }
    if ((function_exists('wp_doing_ajax') && wp_doing_ajax()) || (defined('REST_REQUEST') && REST_REQUEST)) {
        return false;
    }
    foreach (array('woodmart_needs_header', 'woodmart_needs_footer', 'woodmart_page_top_part', 'woodmart_page_bottom_part', 'woodmart_is_woo_ajax', 'woodmart_get_old_classes') as $function) {
        if (!function_exists($function)) {
            return false;
        }
    }
    return woodmart_needs_header() && woodmart_needs_footer() && !woodmart_is_woo_ajax();
}
function pa_child_load_shell($name) {
    if (!in_array($name, array('header', 'footer'), true)) {
        return;
    }
    if (pa_child_shell_enabled()) {
        require get_stylesheet_directory() . '/adapters/' . $name . '.php';
        return;
    }
    // Standard WP child-template delegation; no rewrite or output buffering.
    require get_template_directory() . '/' . $name . '.php';
}

<?php
/**
 * Plugin Name: Pratika Amollar — Store API / WP REST Cache
 * Description: Public catalogue allowlist and WooCommerce invalidation. Install as the first MU-plugin.
 * Version: 1.0.0
 * Requires PHP: 8.1
 * License: GPL-3.0-or-later
 */
namespace PratikaAmollar\StoreApiCache;

defined('ABSPATH') || exit;

final class Integration {
    public const ROUTES = ['/wc/store/v1/products', '/wc/store/v1/products/categories'];
    private static bool $dirty = false;

    /** Deliberately no plain ?rest_route support: its URI key differs in WP REST Cache. */
    public static function route(?string $uri = null): string {
        $path = parse_url($uri ?? ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
        if (!is_string($path)) return '';
        $prefix = '/' . trim((string) get_option('wp_rest_cache_rest_prefix', 'wp-json'), '/') . '/';
        $offset = strpos($path, $prefix);
        return $offset === false ? '' : rtrim(substr($path, $offset + strlen($prefix) - 1), '/');
    }

    public static function public_request(): bool {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' || !in_array(self::route(), self::ROUTES, true)) return false;
        if (!empty($_COOKIE) || !empty($_SERVER['HTTP_COOKIE'])) return false;
        foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION', 'PHP_AUTH_USER', 'PHP_AUTH_PW', 'HTTP_X_WP_NONCE', 'HTTP_NONCE', 'HTTP_CART_TOKEN', 'HTTP_X_WC_STORE_API_NONCE', 'HTTP_X_HTTP_METHOD_OVERRIDE'] as $key) {
            if (isset($_SERVER[$key]) && (string) $_SERVER[$key] !== '') return false;
        }
        foreach (['rest_route', '_wpnonce', '_nonce', 'nonce', 'cart_token', 'password', 'add-to-cart', 'remove_item', 'wc-ajax', 'consumer_key', 'consumer_secret', 'access_token', 'token', 'jwt', '_method'] as $key) {
            if (isset($_GET[$key])) return false;
        }
        if (isset($_GET['context']) && $_GET['context'] !== 'view') return false;
        // A shared anonymous response must not depend on the visitor's IP/location.
        if (str_contains((string) get_option('woocommerce_default_customer_address', ''), 'geolocation')) return false;
        return !function_exists('get_current_user_id') || get_current_user_id() === 0;
    }

    public static function allowed($endpoints): array {
        return ['wc/store/v1' => ['products', 'products/categories']];
    }

    public static function skip($skip): bool { return (bool) $skip || !self::public_request(); }

    public static function timeout($timeout, $options) {
        return in_array(self::route($options['uri'] ?? ''), self::ROUTES, true) ? 0 : $timeout;
    }

    public static function headers($headers, $uri): array {
        if (!in_array(self::route($uri), self::ROUTES, true)) return $headers;
        foreach (array_keys($headers) as $name) {
            if (in_array(strtolower($name), ['set-cookie', 'cart-token', 'nonce', 'nonce-timestamp', 'user-id', 'authorization', 'cache-control', 'expires', 'last-modified', 'etag'], true)) unset($headers[$name]);
        }
        // Persistence belongs to WordPress only, never to browser/intermediary caches.
        $headers['Cache-Control'] = 'no-store';
        return $headers;
    }

    public static function changed(): void { self::$dirty = true; }

    public static function post_changed($id, $post = null): void {
        $type = is_object($post) ? ($post->post_type ?? '') : get_post_type($id);
        if (in_array($type, ['product', 'product_variation'], true)) self::changed();
    }

    public static function status_changed($new, $old, $post): void {
        if ($new !== $old) self::post_changed($post->ID, $post);
    }

    public static function terms_changed($object_id, $terms, $tt_ids, $taxonomy): void {
        if ($taxonomy === 'product_cat' || $taxonomy === 'product_visibility' || $taxonomy === 'product_type' || $taxonomy === 'product_tag' || str_starts_with((string) $taxonomy, 'pa_')) self::post_changed($object_id);
    }

    public static function term_changed($term_id, $tt_id, $taxonomy): void {
        if ($taxonomy === 'product_cat' || $taxonomy === 'product_visibility' || $taxonomy === 'product_tag' || str_starts_with((string) $taxonomy, 'pa_')) self::changed();
    }

    public static function meta_changed($meta_id, $object_id, $key): void { self::post_changed($object_id); }
    public static function term_meta_changed($meta_id, $term_id): void {
        $term = get_term($term_id);
        if ($term && !is_wp_error($term)) self::term_changed($term_id, 0, $term->taxonomy);
    }

    /** Once after all writes in this request, not once at the first intermediate hook. */
    public static function flush(): void {
        if (!self::$dirty || !class_exists('WP_Rest_Cache_Plugin\\Includes\\Caching\\Caching')) return;
        self::$dirty = false;
        $class = 'WP_Rest_Cache_Plugin\\Includes\\Caching\\Caching';
        $cache = $class::get_instance();
        $home_path = is_multisite() ? '' : rtrim((string) parse_url(get_home_url(), PHP_URL_PATH), '/');
        $prefix = $home_path . '/' . trim((string) get_option('wp_rest_cache_rest_prefix', 'wp-json'), '/');
        foreach (self::ROUTES as $route) {
            // FLUSH_PARAMS alone DOES NOT include the parameterless URL in 2026.4.0.
            $cache->delete_cache_by_endpoint($prefix . $route, $class::FLUSH_STRICT, true);
            $cache->delete_cache_by_endpoint($prefix . $route, $class::FLUSH_PARAMS, true);
        }
    }
}

// This file must load BEFORE wp-rest-cache.php in wp-content/mu-plugins.
add_filter('wp_rest_cache/allowed_endpoints', [Integration::class, 'allowed'], PHP_INT_MAX);
add_filter('wp_rest_cache/skip_caching', [Integration::class, 'skip'], PHP_INT_MAX);
add_filter('wp_rest_cache/cache_authenticated_response', '__return_false', PHP_INT_MAX);
add_filter('wp_rest_cache/skip_nonce_caching', '__return_true', PHP_INT_MAX);
add_filter('wp_rest_cache/skip_empty_result_set', '__return_false', PHP_INT_MAX);
add_filter('wp_rest_cache/timeout', [Integration::class, 'timeout'], PHP_INT_MAX, 2);
add_filter('wp_rest_cache/cache_headers', [Integration::class, 'headers'], PHP_INT_MAX, 2);
add_filter('wp_rest_cache/pre_output_headers', [Integration::class, 'headers'], PHP_INT_MAX, 2);
// Native synchronous deletion: avoids the plugin's deferred cleanup Cron.
add_filter('wp_rest_cache/delete_caches_immediately', '__return_true', PHP_INT_MAX);
add_filter('wp_rest_cache/skip_cache_regeneration', '__return_true', PHP_INT_MAX);

foreach (['woocommerce_new_product', 'woocommerce_update_product', 'woocommerce_new_product_variation', 'woocommerce_update_product_variation', 'woocommerce_delete_product', 'woocommerce_delete_product_variation', 'woocommerce_trash_product', 'woocommerce_trash_product_variation', 'woocommerce_product_set_stock', 'woocommerce_variation_set_stock', 'woocommerce_product_set_stock_status', 'woocommerce_variation_set_stock_status', 'woocommerce_updated_product_price', 'woocommerce_updated_product_stock', 'woocommerce_product_object_updated_props', 'woocommerce_reduce_order_stock', 'woocommerce_restore_order_stock', 'woocommerce_updated_product_sales', 'woocommerce_attribute_added', 'woocommerce_attribute_updated', 'woocommerce_attribute_deleted', 'woocommerce_tax_rate_added', 'woocommerce_tax_rate_updated', 'woocommerce_tax_rate_deleted'] as $hook) {
    add_action($hook, [Integration::class, 'changed'], PHP_INT_MAX, 0);
}
foreach (['save_post_product', 'save_post_product_variation', 'before_delete_post', 'deleted_post'] as $hook) add_action($hook, [Integration::class, 'post_changed'], PHP_INT_MAX, 2);
add_action('transition_post_status', [Integration::class, 'status_changed'], PHP_INT_MAX, 3);
foreach (['added_post_meta', 'updated_post_meta', 'deleted_post_meta'] as $hook) add_action($hook, [Integration::class, 'meta_changed'], PHP_INT_MAX, 3);
add_action('set_object_terms', [Integration::class, 'terms_changed'], PHP_INT_MAX, 4);
foreach (['created_term', 'edited_term', 'delete_term'] as $hook) add_action($hook, [Integration::class, 'term_changed'], PHP_INT_MAX, 3);
foreach (['added_term_meta', 'updated_term_meta', 'deleted_term_meta'] as $hook) add_action($hook, [Integration::class, 'term_meta_changed'], PHP_INT_MAX, 2);
add_action('shutdown', [Integration::class, 'flush'], PHP_INT_MAX);

// Also keep first (uncached) responses out of downstream caches.
add_filter('rest_post_dispatch', static function ($response, $server, $request) {
    if (in_array($request->get_route(), Integration::ROUTES, true)) $response->header('Cache-Control', 'no-store');
    return $response;
}, PHP_INT_MAX, 3);

add_action('updated_option', static function ($name) {
    if (in_array($name, ['woocommerce_currency', 'woocommerce_currency_pos', 'woocommerce_price_num_decimals', 'woocommerce_price_decimal_sep', 'woocommerce_price_thousand_sep', 'woocommerce_tax_display_shop', 'woocommerce_prices_include_tax', 'woocommerce_hide_out_of_stock_items', 'woocommerce_default_country', 'woocommerce_default_customer_address', 'woocommerce_calc_taxes', 'woocommerce_tax_based_on'], true)) Integration::changed();
}, PHP_INT_MAX, 1);

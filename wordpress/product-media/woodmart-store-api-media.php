<?php
/**
 * Plugin Name: Pratika — WoodMart product media for Store API
 * Description: Read-only exposure of the existing + Video gallery, audited against WoodMart 8.1.1.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) { exit; }

function pa_woodmart_media_url($value) {
    if (!is_string($value) || 'https' !== wp_parse_url($value, PHP_URL_SCHEME)) { return ''; }
    return esc_url_raw($value, array('https'));
}

function pa_woodmart_product_media($product) {
    $result = array('videos' => array());
    if (!$product instanceof WC_Product || 'publish' !== $product->get_status() || get_post_field('post_password', $product->get_id()) ||
        (function_exists('woodmart_get_opt') && !woodmart_get_opt('single_product_main_gallery_video', true))) { return $result; }
    // Native button stores an attachment-ID-keyed map, not an ordered list of independent videos.
    $settings = get_post_meta($product->get_id(), 'woodmart_wc_video_gallery', true);
    if (!is_array($settings)) { return $result; }
    $images = array_values(array_unique(array_filter(array_merge(array($product->get_image_id()), $product->get_gallery_image_ids()))));
    foreach ($images as $image_id) {
        $row = $settings[$image_id] ?? null;
        if (!is_array($row)) { continue; }
        $type = $row['video_type'] ?? '';
        $src = '';
        if ('mp4' === $type && !empty($row['upload_video_id']) && wp_attachment_is('video', absint($row['upload_video_id']))) {
            $src = pa_woodmart_media_url(wp_get_attachment_url(absint($row['upload_video_id'])));
        } elseif ('youtube' === $type) {
            $src = pa_woodmart_media_url($row['youtube_url'] ?? '');
            $host = strtolower((string) wp_parse_url($src, PHP_URL_HOST));
            if (!in_array($host, array('youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'), true)) { $src = ''; }
        } elseif ('vimeo' === $type) {
            $src = pa_woodmart_media_url($row['vimeo_url'] ?? '');
            $host = strtolower((string) wp_parse_url($src, PHP_URL_HOST));
            if (!in_array($host, array('vimeo.com', 'www.vimeo.com', 'player.vimeo.com'), true)) { $src = ''; }
        }
        if (!$src) { continue; }
        $poster = wp_get_attachment_image_url($image_id, 'woocommerce_single');
        $result['videos'][] = array(
            'attachment_id' => (int) $image_id,
            'type' => $type,
            'src' => $src,
            'poster' => pa_woodmart_media_url($poster),
            'title' => 'Vídeo de ' . wp_strip_all_tags($product->get_name()),
        );
    }
    return $result;
}

add_action('woocommerce_blocks_loaded', static function () {
    if (!function_exists('woocommerce_store_api_register_endpoint_data')) { return; }
    woocommerce_store_api_register_endpoint_data(array(
        'endpoint' => \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::IDENTIFIER,
        'namespace' => 'pratika_media',
        'data_callback' => 'pa_woodmart_product_media',
        'schema_callback' => static function () {
            return array('videos' => array('type' => 'array', 'readonly' => true, 'items' => array(
                'type' => 'object', 'properties' => array(
                    'attachment_id' => array('type' => 'integer'), 'type' => array('type' => 'string', 'enum' => array('mp4', 'youtube', 'vimeo')),
                    'src' => array('type' => 'string'), 'poster' => array('type' => 'string'), 'title' => array('type' => 'string'),
                ),
            )));
        },
        'schema_type' => ARRAY_A,
    ));
});

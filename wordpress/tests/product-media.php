<?php
namespace XTS { class Singleton { public static function get_instance() { return new static(); } } }
namespace Automattic\WooCommerce\StoreApi\Schemas\V1 { class ProductSchema { const IDENTIFIER = 'product'; } }
namespace {
define('ABSPATH', __DIR__); define('ARRAY_A', 'ARRAY_A');
$meta = array(); $hooks = array(); $enabled = true;
function add_action($hook, $callback) { $GLOBALS['hooks'][$hook] = $callback; }
function woocommerce_store_api_register_endpoint_data($data) { $GLOBALS['registration'] = $data; }
function wp_parse_url($url, $part) { return parse_url($url, $part); }
function esc_url_raw($url, $protocols) { return $url; }
function absint($v) { return abs((int) $v); }
function wp_strip_all_tags($v) { return strip_tags($v); }
function get_post_field($field, $id) { return ''; }
function get_post_meta($id, $key, $single) { return $GLOBALS['meta'][$id][$key] ?? ''; }
function update_post_meta($id, $key, $data) { $GLOBALS['meta'][$id][$key] = $data; }
function woodmart_clean($value) { return $value; }
function wp_unslash($value) { return $value; }
function woodmart_get_opt($key, $default) { return $GLOBALS['enabled']; }
function wp_attachment_is($type, $id) { return $type === 'video' && in_array($id, array(100,101), true); }
function wp_get_attachment_url($id) { return 'https://example.com/' . $id . '.mp4'; }
function wp_get_attachment_image_url($id, $size) { return 'https://example.com/' . $id . '.jpg'; }
class WC_Product {
 public function get_id() { return 15675; }
 public function get_status() { return 'publish'; }
 public function get_image_id() { return 11; }
 public function get_gallery_image_ids() { return array(12,13,11); }
 public function get_name() { return 'Produto de teste'; }
}
function check($test, $message) { if (!$test) { throw new \Exception($message); } }
require __DIR__ . '/../product-media/woodmart-store-api-media.php';
$native = __DIR__ . '/../../.wrangler/woodmart-video-audit/class-main.php';
if (!is_file($native)) { throw new \Exception('Fonte WoodMart 8.1.1 necessária para teste do save nativo'); }
require $native;
$woodmart = \XTS\Modules\Product_Gallery_Video\Main::get_instance();
$_POST['xts-product-gallery-video'] = array(
 12 => json_encode(array('video_type'=>'youtube','youtube_url'=>'https://youtu.be/LXb3EKWsInQ')),
 11 => json_encode(array('video_type'=>'mp4','upload_video_id'=>100,'upload_video_url'=>'https://example.com/100.mp4')),
 99 => json_encode(array('video_type'=>'mp4','upload_video_id'=>101)),
 13 => json_encode(array('video_type'=>'vimeo','vimeo_url'=>'https://vimeo.com/123456789')),
);
$woodmart->save_product_gallery(15675, (object) array('post_type'=>'product'));
$p = new WC_Product(); $data = pa_woodmart_product_media($p);
check(count($data['videos']) === 3, 'Três vídeos, sem órfão');
check(array_column($data['videos'],'attachment_id') === array(11,12,13), 'Ordem nativa, não ordem do mapa');
check($data['videos'][0]['src'] === 'https://example.com/100.mp4', 'Arquivo da biblioteca');
check($data['videos'][0]['poster'] === 'https://example.com/11.jpg', 'Poster da imagem associada');
$GLOBALS['hooks']['woocommerce_blocks_loaded']();
$r = $GLOBALS['registration']; check($r['namespace'] === 'pratika_media', 'Namespace restrito');
check(($r['data_callback'])($p) === $data, 'Mesmo callback na coleção');
check(isset(($r['schema_callback'])()['videos']['items']['properties']['src']), 'Schema documentado');
$GLOBALS['enabled'] = false; check(pa_woodmart_product_media($p)['videos'] === array(), 'Configuração nativa desabilitada respeitada');
$GLOBALS['enabled'] = true; $GLOBALS['meta'][15675]['woodmart_wc_video_gallery'][11]['upload_video_id'] = 999;
$GLOBALS['meta'][15675]['woodmart_wc_video_gallery'][12]['youtube_url'] = 'https://youtube.com.evil.test/123';
check(count(pa_woodmart_product_media($p)['videos']) === 1, 'Anexo inválido/provedor externo recusados');
$GLOBALS['meta'] = array(); check(pa_woodmart_product_media($p)['videos'] === array(), 'Produto sem vídeos');
echo json_encode(array('native_save_verified'=>true,'data'=>$data));
}

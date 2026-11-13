<?php
/** Local diagnostic only. Native WoodMart code + isolated WP APIs; no production connection. */
namespace XTS { class Singleton { public static function get_instance() { return new static(); } } }
namespace Automattic\WooCommerce\StoreApi\Schemas\V1 { class ProductSchema { const IDENTIFIER = 'product'; } }
namespace {
define('ABSPATH', __DIR__); define('ARRAY_A', 'ARRAY_A');
$GLOBALS['lab_meta'] = array(); $GLOBALS['lab_hooks'] = array();
function add_action($hook,$callback,$priority=10,$args=1) { $GLOBALS['lab_hooks'][$hook][$priority][] = array($callback,$args); }
function add_filter($hook,$callback,$priority=10,$args=1) { add_action($hook,$callback,$priority,$args); }
function lab_action($hook,...$args) { $entries=$GLOBALS['lab_hooks'][$hook]??array(); ksort($entries); foreach($entries as $callbacks)foreach($callbacks as $entry)call_user_func_array($entry[0],array_slice($args,0,$entry[1])); }
function woodmart_get_opt($key,$default=true) { return true; }
function get_post_meta($id,$key,$single) { return $GLOBALS['lab_meta'][$id][$key]??''; }
function update_post_meta($id,$key,$value) { $GLOBALS['lab_meta'][$id][$key]=$value; $GLOBALS['lab_writes']++; return 1; }
function woodmart_clean($value) { return $value; }
function wp_unslash($value) { return is_array($value)?array_map('wp_unslash',$value):stripslashes($value); }
function lab_slash($value) { return is_array($value)?array_map('lab_slash',$value):addslashes($value); }
function wp_attachment_is($kind,$id) { return $kind==='video' && in_array((int)$id,array(100,101),true); }
function wp_get_attachment_url($id) { return 'https://example.com/test-'.$id.'.mp4'; }
function wp_get_attachment_image_url($id,$size) { return 'https://example.com/image-'.$id.'.jpg'; }
function esc_attr($s) { return htmlspecialchars((string)$s,ENT_QUOTES,'UTF-8'); }
function esc_html_e($s,$domain) { echo esc_attr($s); }
function wp_json_encode($value) { return json_encode($value); }
function wp_parse_url($url,$part) { return parse_url($url,$part); }
function esc_url_raw($url,$protocols) { return $url; }
function absint($value) { return abs((int)$value); }
function get_post_field($field,$id) { return ''; }
function wp_strip_all_tags($value) { return strip_tags($value); }
class WC_Product {
 public function get_id(){return 15675;} public function get_status(){return 'publish';}
 public function get_image_id(){return 16068;} public function get_gallery_image_ids(){return array(16068,15923);}
 public function get_name(){return 'QA isolado';}
}
require __DIR__.'/../../.wrangler/woodmart-video-audit/class-main.php';
require __DIR__.'/../product-media/woodmart-store-api-media.php';
$woodmart=\XTS\Modules\Product_Gallery_Video\Main::get_instance(); $woodmart->hooks();
function lab_button($woodmart,$id) { ob_start(); $woodmart->get_gallery_product_video_btn(15675,$id); return ob_get_clean(); }
function lab_save($woodmart,$entries,$before=array(),$post_type='product') {
 $GLOBALS['lab_meta']=array(15675=>array('woodmart_wc_video_gallery'=>$before));$GLOBALS['lab_writes']=0;
 $body=implode('&',array_map(static function($e){return rawurlencode('xts-product-gallery-video['.$e[0].']').'='.rawurlencode(json_encode($e[1]));},$entries));
 parse_str($body,$parsed);$_POST=lab_slash($parsed);
 lab_action('woocommerce_process_product_meta',15675,(object)array('post_type'=>$post_type));
 $after=get_post_meta(15675,'woodmart_wc_video_gallery',true);
 return array('raw_video_fields'=>array_map(static function($entry){return array('attachment_id'=>$entry[0],'video_type'=>$entry[1]['video_type']??null,'upload_video_id'=>$entry[1]['upload_video_id']??null);},$entries),'raw_occurrences'=>count($entries),'parsed_fields'=>count($parsed['xts-product-gallery-video']??array()),'parsed_16068'=>$parsed['xts-product-gallery-video'][16068]??null,'before'=>$before,'after'=>$after,'writes'=>$GLOBALS['lab_writes'],'edit_button_on_reload'=>strpos(lab_button($woodmart,16068),'xts-edit-video')!==false,'adapter_videos'=>pa_woodmart_product_media(new WC_Product())['videos']);
}
$default=$woodmart->default_settings;
$valid=array_merge($default,array('upload_video_id'=>'100','upload_video_url'=>'https://example.com/test-100.mp4'));
$changed=array_merge($valid,array('upload_video_id'=>'101','upload_video_url'=>'https://example.com/test-101.mp4'));
$results=array(
 'duplicate_main_valid_gallery_empty'=>lab_save($woodmart,array(array(16068,$valid),array(16068,$default))),
 'unique_main_valid'=>lab_save($woodmart,array(array(16068,$valid),array(15923,$default))),
 'duplicate_gallery_valid_last'=>lab_save($woodmart,array(array(16068,$default),array(16068,$valid))),
 'duplicate_both_synchronized'=>lab_save($woodmart,array(array(16068,$valid),array(16068,$valid))),
 'duplicate_replacement_reverts_to_old'=>lab_save($woodmart,array(array(16068,$changed),array(16068,$valid)),array(16068=>$valid)),
 'field_absent_preserves_metadata'=>lab_save($woodmart,array(),array(16068=>$valid)),
 'wrong_post_type_preserves_metadata'=>lab_save($woodmart,array(array(16068,$default)),array(16068=>$valid),'revision'),
);
if (realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__) {
 header('Content-Type: application/json'); echo json_encode($results,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
}
}

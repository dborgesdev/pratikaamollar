<?php
/** Local/staging mutations ONLY. Never upload this test helper to a public web directory. */
$root = getenv('PA_CACHE_TEST_WP_ROOT');
if (!$root || getenv('PA_CACHE_TEST_ALLOW_MUTATIONS') !== '1') throw new RuntimeException('Explicit test opt-in and WordPress root required.');
if (($argv[1] ?? '') === 'dedup') define('SAVEQUERIES', true);
$_SERVER['HTTP_HOST'] = '127.0.0.1:4191'; $_SERVER['REQUEST_URI'] = '/'; $_SERVER['REQUEST_METHOD'] = 'GET';
require rtrim($root, '/\\') . '/wp-load.php';
if (!in_array(wp_get_environment_type(), ['local', 'staging'], true) || str_contains(home_url(), 'pratikaamollar.com.br')) throw new RuntimeException('Refusing mutations on production/Pratika remote.');
use PratikaAmollar\StoreApiCache\Integration;
$action=$argv[1] ?? 'info'; $id=(int)($argv[2] ?? 0);
switch($action) {
    case 'create':
        $term=wp_insert_term('PA Test Category '.uniqid(), 'product_cat'); if(is_wp_error($term))throw new RuntimeException($term->get_error_message());
        $p=new WC_Product_Simple(); $p->set_name('PA Test Simple'); $p->set_status('publish'); $p->set_regular_price('10'); $p->set_manage_stock(true); $p->set_stock_quantity(10); $p->set_category_ids([$term['term_id']]); $p->save();
        $v=new WC_Product_Variable();$v->set_name('PA Test Variable');$v->set_status('publish');
        $a=new WC_Product_Attribute();$a->set_name('Finish');$a->set_options(['Test A']);$a->set_visible(true);$a->set_variation(true);$v->set_attributes([$a]);$v->save();
        $child=new WC_Product_Variation();$child->set_parent_id($v->get_id());$child->set_status('publish');$child->set_attributes(['finish'=>'Test A']);$child->set_regular_price('20');$child->set_manage_stock(true);$child->set_stock_quantity(5);$child->save();WC_Product_Variable::sync($v->get_id());
        $out=['simple'=>$p->get_id(),'variable'=>$v->get_id(),'variation'=>$child->get_id(),'category'=>$term['term_id']];break;
    case 'dedup':
        global $wpdb;
        $before=count($wpdb->queries);for($i=0;$i<100;$i++)Integration::changed();Integration::flush();
        $queries=array_slice($wpdb->queries,$before);
        $updates=count(array_filter($queries,static fn($q)=>str_contains($q[0], 'UPDATE') && str_contains($q[0], 'wrc_caches') && str_contains($q[0], 'request_uri')));
        $before=count($wpdb->queries);Integration::flush();
        $out=['endpoint_updates'=>$updates,'repeat_queries'=>count($wpdb->queries)-$before];break;
    case 'geolocation': update_option('woocommerce_default_customer_address','geolocation');$out=['mode'=>'geolocation'];break;
    case 'base-location': update_option('woocommerce_default_customer_address','base');$out=['mode'=>'base'];break;
    case 'auth':
        $uid=wp_insert_user(['user_login'=>'pa_cache_'.uniqid(),'user_pass'=>wp_generate_password(30),'role'=>'customer']);
        if(is_wp_error($uid))throw new RuntimeException($uid->get_error_message());
        wp_set_current_user($uid);$cookie=wp_generate_auth_cookie($uid,time()+3600,'logged_in');$_COOKIE[LOGGED_IN_COOKIE]=$cookie;
        $out=['id'=>$uid,'cookie'=>LOGGED_IN_COOKIE.'='.$cookie,'nonce'=>wp_create_nonce('wp_rest')];break;
    case 'delete-user': require_once ABSPATH.'wp-admin/includes/user.php';$out=['deleted'=>wp_delete_user($id)];break;
    case 'flush': Integration::changed(); $out=['queued'=>true];break;
    case 'price': $p=wc_get_product($id);$p->set_regular_price('12.34');$p->save();$out=['price'=>$p->get_price()];break;
    case 'stock': wc_update_product_stock($id,0); $out=['stock'=>wc_get_product($id)->get_stock_quantity()];break;
    case 'restock': wc_update_product_stock($id,10); $out=['stock'=>wc_get_product($id)->get_stock_quantity()];break;
    case 'order':
        $order=wc_create_order();$order->add_product(wc_get_product($id),1);$order->save();
        wc_reduce_stock_levels($order);$out=['stock'=>wc_get_product($id)->get_stock_quantity(),'order'=>$order->get_id()];
        $order->delete(true);break; // No checkout, payment gateway or customer communication.
    case 'category': $term=wp_insert_term('PA Test Changed '.uniqid(),'product_cat');$p=wc_get_product($id);$p->set_category_ids([$term['term_id']]);$p->save();$out=['category'=>$term['term_id']];break;
    case 'term': $out=wp_update_term($id,'product_cat',['name'=>'PA Test Renamed']);break;
    case 'delete-term': $out=['deleted'=>wp_delete_term($id,'product_cat')];break;
    case 'variation': $p=wc_get_product($id);$p->set_regular_price('25');$p->set_attributes(['finish'=>'Test B']);$p->save();$out=['price'=>$p->get_price()];break;
    case 'publish': $p=new WC_Product_Simple();$p->set_name('PA Test Draft');$p->set_status('draft');$p->set_regular_price('7');$p->save();$out=['id'=>$p->get_id()];break;
    case 'make-public': wp_update_post(['ID'=>$id,'post_status'=>'publish']);$out=['id'=>$id];break;
    case 'delete': $p=wc_get_product($id);if($p)$p->delete(true);$out=['deleted'=>$id];break;
    case 'rows':
        global $wpdb;$out=$wpdb->get_results("SELECT request_uri,expiration,cache_hits,deleted FROM {$wpdb->prefix}wrc_caches",ARRAY_A);break;
    case 'rewrite': flush_rewrite_rules(false);$out=['rewrite'=>true];break;
    default: $out=['wordpress'=>$wp_version,'woocommerce'=>WC_VERSION,'allowed'=>get_option('wp_rest_cache_allowed_endpoints'),'regenerate'=>\WP_Rest_Cache_Plugin\Includes\Caching\Caching::get_instance()->should_regenerate(),'cleanup_scheduled'=>wp_next_scheduled('wp_rest_cache_cleanup_deleted_caches'),'regenerate_scheduled'=>wp_next_scheduled('wp_rest_cache_regenerate_cron')];
}
if(is_wp_error($out))throw new RuntimeException($out->get_error_message());
echo wp_json_encode($out,JSON_PRETTY_PRINT);

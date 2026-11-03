<?php
// CLI helper for a disposable loopback lab ONLY. Never upload to WordPress.
$root = getenv('PA_HANDOFF_TEST_WP_ROOT');
if (PHP_SAPI !== 'cli' || !$root || getenv('PA_HANDOFF_TEST_ALLOW_MUTATIONS') !== '1') throw new RuntimeException('Local lab opt-in required.');
$_SERVER['HTTP_HOST']='127.0.0.1:4193'; $_SERVER['REQUEST_URI']='/'; $_SERVER['REQUEST_METHOD']='GET';
require $root.'/wp-load.php';
if (wp_get_environment_type() !== 'local' || !in_array(wp_parse_url(home_url(),PHP_URL_HOST),['127.0.0.1','localhost'],true)) throw new RuntimeException('Loopback local WordPress required.');
$action=$argv[1] ?? 'info';$id=(int)($argv[2] ?? 0);
switch($action) {
case 'setup':
 @mkdir(WPMU_PLUGIN_DIR,0777,true);
 file_put_contents(WPMU_PLUGIN_DIR.'/handoff-test-reject.php', '<?php add_filter("woocommerce_add_to_cart_validation", function($ok,$id){return $id==get_option("handoff_test_reject")?false:$ok;},10,2);');
 update_option('woocommerce_coming_soon','no');
 update_option('active_plugins',['woocommerce/woocommerce.php','pratika-cart-handoff.php']);
 update_option('woocommerce_store_address','Local test only');update_option('woocommerce_default_country','BR:SP');update_option('woocommerce_currency','BRL');
 $existing=get_page_by_path('checkout');
 $page=$existing?$existing->ID:wp_insert_post(['post_title'=>'Checkout local','post_name'=>'checkout','post_type'=>'page','post_status'=>'publish','post_content'=>'[woocommerce_checkout]']);update_option('woocommerce_checkout_page_id',$page);update_option('permalink_structure','/%postname%/');flush_rewrite_rules();
 $ids=[];foreach(['Handoff fixture A','Handoff fixture B'] as $name){$p=new WC_Product_Simple();$p->set_name($name);$p->set_status('publish');$p->set_regular_price('10');$p->set_virtual(true);$p->set_manage_stock(true);$p->set_stock_quantity(20);$ids[]=$p->save();}
 $p=new WC_Product_Variable();$p->set_name('Handoff fixture variable');$p->set_status('publish');$a=new WC_Product_Attribute();$a->set_name('Finish');$a->set_options(['Gold','Black']);$a->set_variation(true);$p->set_attributes([$a]);$parent=$p->save();
 $v=new WC_Product_Variation();$v->set_parent_id($parent);$v->set_status('publish');$v->set_attributes(['finish'=>'Gold']);$v->set_regular_price('25');$v->set_virtual(true);$variation=$v->save();
 $v=new WC_Product_Variation();$v->set_parent_id($parent);$v->set_status('publish');$v->set_attributes(['finish'=>'']);$v->set_regular_price('30');$v->set_virtual(true);$any=$v->save();WC_Product_Variable::sync($parent);
 $attribute=wc_create_attribute(['name'=>'Handoff color','slug'=>'handoff-color','type'=>'select']);delete_transient('wc_attribute_taxonomies');register_taxonomy('pa_handoff-color',['product']);$term=wp_insert_term('Lab Gold','pa_handoff-color',['slug'=>'lab-gold']);
 $p=new WC_Product_Variable();$p->set_name('Handoff taxonomy fixture');$p->set_status('publish');$a=new WC_Product_Attribute();$a->set_id($attribute);$a->set_name('pa_handoff-color');$a->set_options([$term['term_id']]);$a->set_variation(true);$p->set_attributes([$a]);$tax_parent=$p->save();
 $v=new WC_Product_Variation();$v->set_parent_id($tax_parent);$v->set_status('publish');$v->set_attributes(['pa_handoff-color'=>'lab-gold']);$v->set_regular_price('35');$v->set_virtual(true);$tax_variation=$v->save();WC_Product_Variable::sync($tax_parent);
 $out=['attribute'=>$attribute,'tax_parent'=>$tax_parent,'tax_variation'=>$tax_variation,'simple'=>$ids[0],'second'=>$ids[1],'parent'=>$parent,'variation'=>$variation,'any'=>$any,'page'=>$existing?0:$page,'wp'=>get_bloginfo('version'),'woo'=>WC_VERSION];break;
case 'checkout-page':update_option('woocommerce_coming_soon','no');$page=get_page_by_path('checkout');update_option('woocommerce_checkout_page_id',$page->ID);$out=$page->ID;break;
case 'reject':update_option('handoff_test_reject',$id);$out=true;break;
case 'price':$p=wc_get_product($id);$p->set_regular_price('12');$p->save();$out=true;break;
case 'stock':$p=wc_get_product($id);$p->set_stock_quantity(0);$p->save();$out=true;break;
case 'restore':$p=wc_get_product($id);$p->set_stock_quantity(20);$p->save();$out=true;break;
case 'expire':global $wpdb;$wpdb->query("DELETE FROM {$wpdb->prefix}woocommerce_sessions");$out=true;break;
case 'lock':global $wpdb;$session=$argv[2];$name='pa_handoff_lock_'.hash('sha256',$session);add_option($name,time()+180,'',false);$out=$name;break;
case 'unlock':delete_option($argv[2]);$out=true;break;
case 'cleanup-attribute':wc_delete_attribute($id);$out=true;break;
case 'cleanup':foreach(array_slice($argv,2) as $delete)wp_delete_post((int)$delete,true);$out=true;break;
default:$out=['wp'=>get_bloginfo('version'),'woo'=>WC_VERSION];
}
echo wp_json_encode($out);

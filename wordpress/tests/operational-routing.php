<?php
// Real snippet, isolated WP/Woo API stubs. No live sessions, requests or payments.
$state = array();
function add_action($hook,$fn,$priority) { $GLOBALS['callback']=$fn; if ($hook!=='template_redirect'||$priority!==1) throw new Exception('hook'); }
function home_url($path) { global $state; return 'https://'.($state['home']??'loja.pratikaamollar.com.br').$path; }
function wp_parse_url($url,$part) { return parse_url($url,$part); }
function flag($key) { return !empty($GLOBALS['state'][$key]); }
function is_admin() { return flag('admin'); }
function wp_doing_ajax() { return flag('ajax'); }
function wp_doing_cron() { return flag('cron'); }
function wp_is_json_request() { return flag('json'); }
function is_feed() { return flag('feed'); }
function is_trackback() { return flag('trackback'); }
function is_preview() { return flag('preview'); }
function is_checkout() { return flag('checkout'); }
function is_account_page() { return flag('account'); }
function is_wc_endpoint_url() { return flag('endpoint'); }
function is_front_page() { return flag('front'); }
function is_shop() { return flag('shop'); }
function is_cart() { return flag('cart'); }
function is_product() { return flag('product'); }
function is_product_category() { return flag('category'); }
function is_page($pages) { return in_array($GLOBALS['state']['page']??null,(array)$pages,true); }
function get_option($key) { return 98; }
function wc_get_page_id($key) { return 99; }
function get_queried_object() { return (object)array('post_name'=>$GLOBALS['state']['slug']??'', 'slug'=>$GLOBALS['state']['slug']??''); }
function nocache_headers() { $GLOBALS['no_cache']=true; }
function wp_redirect($to,$status,$by) { throw new RuntimeException(json_encode(array($to,$status,$by))); }
require __DIR__.'/../public-navigation.php';
$passed=0;
function check_route($name,$flags,$expected=null,$server=array(),$query=array()) {
 global $state,$callback,$passed;
 $state=$flags; $_SERVER=array_replace(array('REQUEST_METHOD'=>'GET','HTTP_HOST'=>'loja.pratikaamollar.com.br','REQUEST_URI'=>'/'),$server); $_GET=$query; $GLOBALS['no_cache']=false; $actual=null;
 try { $callback(); } catch(RuntimeException $e) { $actual=json_decode($e->getMessage(),true); }
 $wanted=$expected===null?null:array('https://pratikaamollar.com.br'.$expected,302,'Pratika Public Navigation');
 if($actual!==$wanted||$GLOBALS['no_cache']!==($expected!==null))throw new Exception($name.': '.json_encode($actual));
 $passed++;
}
check_route('home without optional headers',array('front'=>true),'/');
check_route('shop',array('shop'=>true),'/produtos');
check_route('cart HEAD',array('cart'=>true),'/carrinho',array('REQUEST_METHOD'=>'HEAD'));
check_route('contact',array('page'=>'contato'),'/contato');
foreach(array('existing-product','future-product','produto-%c3%a1')as$slug){
 check_route('product '.$slug,array('product'=>true,'slug'=>$slug),'/produto/'.rawurlencode(rawurldecode($slug)),array('REQUEST_URI'=>'/shop/any/nested/'.$slug.'/'));
 check_route('category '.$slug,array('category'=>true,'slug'=>$slug),'/categoria/'.rawurlencode(rawurldecode($slug)),array('REQUEST_URI'=>'/product-category/parent/'.$slug.'/'));
}
check_route('deleted product',array(),null,array('REQUEST_URI'=>'/shop/category/deleted/'));
check_route('unknown page',array('page'=>'unknown'));
foreach(array('admin','ajax','cron','json','feed','trackback','preview','checkout','account','endpoint')as$flag)check_route($flag,array('front'=>true,$flag=>true));
foreach(array('POST','PUT','PATCH','DELETE','OPTIONS','TRACE')as$method)check_route($method,array('front'=>true),null,array('REQUEST_METHOD'=>$method));
foreach(array('/wp-admin/','/wp-login.php','/wp-admin/admin-post.php','/wp-admin/admin-ajax.php','/wp-json/wc/store/v1/cart','/wc-api/mercadopago','/wc-ajax/update_order_review','/wp-cron.php','/xmlrpc.php','/wp-content/uploads/photo.webp','/wp-includes/script.js')as$path)check_route($path,array('front'=>true),null,array('REQUEST_URI'=>$path));
foreach(array('wc-api','wc-ajax','rest_route','action','_wpnonce','key','add-to-cart','remove_item','token','unknown')as$key)check_route($key,array('front'=>true),null,array(),array($key=>'secret'));
foreach(array('HTTP_X_REQUESTED_WITH','HTTP_AUTHORIZATION','REDIRECT_HTTP_AUTHORIZATION','HTTP_X_WP_NONCE')as$header)check_route($header,array('front'=>true),null,array($header=>'secret'));
foreach(array(98,99,'rastrear-encomenda','politica-de-privacidade','termos-e-condicoes-de-compra','trocas-devolucoes-e-reembolsos','entrega-e-frete')as$page)check_route('native page '.$page,array('front'=>true,'page'=>$page));
check_route('utm stripped',array('front'=>true),'/',array(),array('utm_source'=>'test'));
check_route('API accept',array('front'=>true,'json'=>true),null,array('HTTP_ACCEPT'=>'application/json'));
check_route('Accept not required',array('front'=>true),'/',array('HTTP_ACCEPT'=>'*/*'));
check_route('main cannot loop',array('front'=>true),null,array('HTTP_HOST'=>'pratikaamollar.com.br'));
check_route('copied installation',array('front'=>true,'home'=>'pratikaamollar.com.br'));
echo json_encode(array('passed'=>$passed))."\n";

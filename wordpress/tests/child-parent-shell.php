<?php
/** Tests reviewed shell code + real parent layout functions; not a WP/gateway lab. */
namespace XTS {
    class Registry {
        public $layout;
        public static function getInstance() { $r = new self(); $r->layout = new class { public function get_main_container_class() { return ' container'; } }; return $r; }
    }
}
namespace {
define('ABSPATH', __DIR__ . '/');
$root = dirname(__DIR__) . '/pratika-amollar-child';
$parent = getenv('PA_CHILD_PARENT') ?: dirname(__DIR__, 2) . '/.wrangler/woodmart-source/woodmart';
$mode = $argv[1] ?? 'normal';
$hooks = array(); $fired = array(); $assets = array();
function check($ok, $message) { if (!$ok) { throw new \Exception($message); } }
function add_action($hook, $callback, $priority = 10, $args = 1) { global $hooks; $hooks[$hook][$priority][] = $callback; }
function add_filter($hook, $callback, $priority = 10, $args = 1) { add_action($hook, $callback, $priority); }
function remove_action($hook, $callback, $priority = 10) { global $hooks; foreach ($hooks[$hook][$priority] ?? array() as $key => $fn) { if ($fn === $callback) { unset($hooks[$hook][$priority][$key]); } } }
function do_action($name) { global $hooks, $fired; $fired[$name] = ($fired[$name] ?? 0) + 1; $items = $hooks[$name] ?? array(); ksort($items); foreach ($items as $fns) { foreach ($fns as $fn) { if (is_callable($fn)) { $fn(); } else { echo '<i data-old="' . esc_attr($fn) . '"></i>'; } } } }
function apply_filters($name, $value, ...$args) { global $hooks; $items=$hooks[$name] ?? array(); ksort($items); foreach ($items as $fns) { foreach ($fns as $fn) { $value=$fn($value,...$args); } } return $value; }
function did_action($name) { global $mode; return $mode === 'early' ? 0 : 1; }
function is_admin() { global $mode; return $mode === 'admin'; }
function wp_doing_ajax() { global $mode; return $mode === 'ajax'; }
function is_singular($type) { return false; }
function woodmart_is_elementor_installed() { return false; }
function woodmart_has_sidebar_in_page() { return false; }
function get_stylesheet_directory() { global $root; return $root; }
function get_stylesheet_directory_uri() { return '/theme'; }
function get_template_directory() { global $parent; return $parent; }
function esc_attr($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function esc_html($value) { return esc_attr($value); }
function esc_url($value) { return esc_attr($value); }
function wp_kses($value, $allowed) { return $value; }
function language_attributes() { echo 'lang="pt-BR"'; }
function bloginfo($name) { echo $name === 'charset' ? 'UTF-8' : ''; }
function body_class() { echo 'class="' . implode(' ', apply_filters('body_class', array('original'))) . '"'; }
function wp_head() { do_action('wp_head'); }
function wp_body_open() { do_action('wp_body_open'); }
function wp_footer() { do_action('wp_footer'); }
function wp_style_is($name, $state) { return $name === 'woodmart-style'; }
function wp_enqueue_style($name, $url, $deps, $version) { global $assets; $assets[$name] = array($url,$deps); }
function wp_enqueue_script($name, $url, $deps, $version, $footer) { global $assets; $assets[$name] = array($url,$deps); }
/** PHP tokenizer extracts only audited named functions; never executes parent's functions.php. */
function load_parent_functions($relative, $wanted) {
    global $parent;
    $tokens=token_get_all(file_get_contents($parent . '/' . $relative));
    for ($i=0; $i<count($tokens); $i++) {
        if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) { continue; }
        $start=$i; $j=$i+1;
        while (is_array($tokens[$j]) && $tokens[$j][0] === T_WHITESPACE) { $j++; }
        $name=is_array($tokens[$j]) ? $tokens[$j][1] : '';
        if (!in_array($name,$wanted,true)) { continue; }
        $code=''; $depth=0; $opened=false;
        for ($k=$start; $k<count($tokens); $k++) {
            $token=$tokens[$k]; $text=is_array($token)?$token[1]:$token; $code.=$text;
            if ($token === '{') { $opened=true; $depth++; }
            if ($token === '}') { $depth--; if ($opened && $depth === 0) { break; } }
        }
        eval('use XTS\\Registry; ' . $code);
    }
}
load_parent_functions('inc/functions.php',array('woodmart_get_opt'));
load_parent_functions('inc/helpers.php',array('woodmart_needs_header','woodmart_needs_footer','woodmart_get_old_classes'));
load_parent_functions('inc/integrations/woocommerce/helpers.php',array('woodmart_is_woo_ajax','woodmart_is_pjax'));
load_parent_functions('inc/template-tags/template-tags.php',array('woodmart_page_top_part','woodmart_page_bottom_part'));
require $root . '/functions.php';
if ($mode === 'maintenance') { $GLOBALS['wd_maintenance'] = true; }
if ($mode === 'pjax') { $_REQUEST['_pjax']=1; $_SERVER['HTTP_X_REQUESTED_WITH']='xmlhttprequest'; }
$expected=in_array($mode,array('normal','line-endings'),true);
check(pa_child_adapter_ready() === ($mode !== 'tampered'), 'Unexpected source fingerprint state');
check(pa_child_shell_enabled() === $expected, 'Wrong shell gating');
$parent_callbacks=array(
 array('woodmart_after_body_open','woodmart_preloader_template',500),
 array('woodmart_before_wp_footer','woodmart_search_full_screen',100),
 array('woodmart_before_wp_footer','woodmart_full_screen_main_nav',120),
 array('woodmart_before_wp_footer','woodmart_mobile_menu',130),
 array('woodmart_before_wp_footer','woodmart_cart_side_widget',140),
 array('woodmart_before_wp_footer','woodmart_header_banner',160),
 array('woodmart_before_wp_footer','woodmart_sidebar_login_form',160),
 array('woodmart_before_wp_footer','woodmart_get_sticky_social',200),
 array('woodmart_before_wp_footer','woodmart_promo_popup',200),
 array('woodmart_before_wp_footer','woodmart_scroll_top_btn',10),
 array('wp_footer','woodmart_sticky_toolbar_template',10),
);
foreach ($parent_callbacks as $item) { add_action($item[0],$item[1],$item[2]); }
add_action('woodmart_before_wp_footer',function () { echo '<i data-preserved="plugin"></i>'; },999);
add_action('woodmart_before_wp_footer','woodmart_cookies_popup',300);
pa_child_remove_parent_chrome();
pa_child_enqueue_assets();
check(count($assets) === ($expected ? 3 : 0),'Wrong asset loading');
check(woodmart_get_opt('sticky_toolbar',true) === !$expected,'Wrong toolbar override');
check(woodmart_get_opt('unrelated-setting','unchanged') === 'unchanged','Unrelated option changed');
if ($expected) {
    ob_start(); pa_child_load_shell('header'); echo '<article data-native-slot="preserved">Native content slot</article>'; pa_child_load_shell('footer'); $html=ob_get_clean();
    check(substr_count($html,'<header ') === 1 && substr_count($html,'<footer ') === 1,'Duplicate shell');
    check(strpos($html,'data-old=') === false || strpos($html,'data-old="woodmart_cookies_popup"') !== false,'Unexpected old component');
    foreach ($parent_callbacks as $item) { check(strpos($html,'data-old="'.$item[1].'"') === false,'Old chrome survived'); }
    check(strpos($html,'data-preserved="plugin"') !== false,'Plugin hook removed');
    check(strpos($html,'data-old="woodmart_cookies_popup"') !== false,'Cookie callback removed');
    foreach (array('wp_head','wp_body_open','woodmart_after_body_open','woodmart_after_header','woodmart_before_wp_footer','wp_footer') as $name) { check(($fired[$name] ?? 0) === 1, 'Hook count '.$name); }
    check(strpos($html,'</main>') < strpos($html,'<footer '),'Footer nested in main');
    check(preg_match_all('/<div(?:\s|>)/',$html) === substr_count($html,'</div>'),'Unbalanced native wrapper divs');
    check(substr_count($html,'<main ') === 1,'Native main missing');
    check(strpos($html,'id="pa-content"') !== false,'Missing skip target');
    if ($mode === 'normal') { file_put_contents(dirname(__DIR__,2).'/docs/child-theme/parent-shell-preview.html',$html); }
} else {
    foreach ($parent_callbacks as $item) { check(in_array($item[1],$hooks[$item[0]][$item[2]],true),'Fallback removed native chrome'); }
}
echo 'PASS '.$mode."\n";
}

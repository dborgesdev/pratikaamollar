<?php
/** Bind only to 127.0.0.1. Isolated reproduction; no WP login/nonce/cookie or production DB. */
require __DIR__.'/woodmart-persistence.php';
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
$private=__DIR__.'/../../.wrangler/woodmart-video-audit/';
if($path==='/jquery.js'||$path==='/native-admin.js'){
 header('Content-Type: application/javascript');readfile($private.($path==='/jquery.js'?'jquery.min.js':'admin-productGalleryVideo.js'));return;
}
$file=__DIR__.'/../../.wrangler/woodmart-persistence-lab-state.json';
$state=is_file($file)?json_decode(file_get_contents($file),true):array('meta'=>array(),'last'=>null);
$GLOBALS['lab_meta']=array(15675=>array('woodmart_wc_video_gallery'=>$state['meta']));
$duplicate=($_GET['duplicate']??'1')==='1';
if($_SERVER['REQUEST_METHOD']==='POST'&&$path==='/reset'){
 file_put_contents($file,json_encode(array('meta'=>array(),'last'=>null)));header('Location: /?duplicate='.($duplicate?'1':'0'),true,303);return;
}
if($_SERVER['REQUEST_METHOD']==='POST'&&$path==='/save'){
 // Include above runs CLI scenarios; rebuild request from this laboratory's HTTP body.
 $body=file_get_contents('php://input');parse_str($body,$posted);
 $entries=array();foreach(explode('&',$body)as$pair){$parts=explode('=',$pair,2);if(preg_match('/^xts-product-gallery-video\[(\d+)\]$/',urldecode($parts[0]),$m))$entries[]=array((int)$m[1],json_decode(urldecode($parts[1]??''),true));}
 $last=lab_save($woodmart,$entries,$state['meta']);
 file_put_contents($file,json_encode(array('meta'=>$last['after'],'last'=>$last)));
 header('Location: /?duplicate='.($duplicate?'1':'0'),true,303);return;
}
header('Content-Type: text/html; charset=utf-8');
?><!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QA persistência WoodMart</title><style>
body{font:16px system-ui;max-width:1000px;margin:30px auto;padding:20px;color:#222;background:#fafafa}button,a{padding:10px;display:inline-block}form,section{margin:20px 0;padding:20px;border:1px solid #ccc}input{display:block;width:90%;margin:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}.xts-popup-holder{display:none}.xts-popup-holder.xts-opened{display:block;padding:20px;background:#fff4dc}.xts-add-video{background:#eee}.xts-edit-video{background:#daf0df}
</style><h1>Laboratório local — persistência WoodMart</h1><p>Produto sintético 15675; imagem 16068. Não conectado à loja. Original JS/PHP 8.1.1 com APIs WP isoladas e persistência em arquivo local.</p><nav><a href="/?duplicate=1">Com imagem duplicada</a><a href="/?duplicate=0">Sem imagem duplicada</a></nav>
<form action="/reset?duplicate=<?= $duplicate?'1':'0' ?>" method="post"><button>Limpar cenário local</button></form>
<form id="post" action="/save?duplicate=<?= $duplicate?'1':'0' ?>" method="post">
<section id="postimagediv"><h2>Imagem destacada 16068</h2><?php echo lab_button($woodmart,16068); ?></section>
<section id="woocommerce-product-images"><h2>Galeria <?= $duplicate?'16068 (duplicada)':'15923 (distinta)' ?></h2><?php echo lab_button($woodmart,$duplicate?16068:15923); ?></section>
<div class="xts-popup-holder xts-popup-product-gallery" data-default-settings='<?=esc_attr(json_encode($woodmart->default_settings))?>'><h2>Configurar vídeo de teste</h2>
<label>Tipo<input data-name="video_type" value="mp4"></label><label>ID do vídeo de teste<input data-name="upload_video_id" value=""></label><label>URL do vídeo de teste<input data-name="upload_video_url" value=""></label><input data-name="youtube_url" value=""><input data-name="vimeo_url" value=""><button type="button" class="xts-save-submit">Aplicar vídeo no botão selecionado</button></div>
<button type="submit">Atualizar produto de teste</button></form>
<h2>Estado persistido local e POST restrito aos campos de vídeo</h2><pre id="report"><?=esc_attr(json_encode($state,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES))?></pre><script src="/jquery.js"></script><script>window.woodmartConfig={product_gallery_video_text:'Video'};</script><script src="/native-admin.js"></script></html>

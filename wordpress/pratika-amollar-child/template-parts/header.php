<?php defined('ABSPATH') || exit; ?>
<a class="pa-skip" href="#pa-content">Pular para o conteúdo</a>
<header class="pa-header" data-pa-header>
    <div class="pa-header-main pa-wrap">
        <a class="pa-home" href="<?php echo esc_url(pa_child_url()); ?>" aria-label="Pratika Amollar início"><img class="pa-logo" src="<?php echo esc_url(pa_child_asset('brand/logo-pratika-amollar.png')); ?>" alt="Prátika Amollar — Acessórios e ferramentas de afiação" width="194" height="83"></a>
        <a class="pa-account" href="<?php echo esc_url(pa_child_url('/my-account/', true)); ?>" aria-label="Minha conta"><?php pa_child_icon('user'); ?><span>Minha conta</span></a>
        <a class="pa-cart" href="<?php echo esc_url(pa_child_url('/carrinho')); ?>" aria-label="Carrinho"><?php pa_child_icon('cart'); ?><span>Carrinho</span></a>
        <button class="pa-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="pa-main-navigation" hidden><span class="pa-menu-open-icon"><?php pa_child_icon('menu'); ?></span><span class="pa-menu-close-icon"><?php pa_child_icon('close'); ?></span></button>
    </div>
    <nav class="pa-nav pa-wrap" id="pa-main-navigation" aria-label="Navegação principal">
        <?php foreach (pa_child_navigation() as $item) : ?>
            <a href="<?php echo esc_url($item['url']); ?>"><?php echo esc_html($item['label']); ?></a>
        <?php endforeach; ?>
    </nav>
</header>

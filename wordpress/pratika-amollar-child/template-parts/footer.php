<?php defined('ABSPATH') || exit; $pa_config = pa_child_config(); ?>
<footer class="pa-footer">
    <div class="pa-wrap pa-footer-grid">
        <div><img class="pa-logo" src="<?php echo esc_url(pa_child_asset('brand/logo-pratika-amollar.png')); ?>" alt="Pratika Amollar" width="194" height="83"><p>Acessórios e ferramentas de afiação.</p></div>
        <div><h2>Explore a loja</h2>
            <a href="<?php echo esc_url(pa_child_url('/produtos')); ?>">Todos os produtos</a>
            <a href="<?php echo esc_url(pa_child_url('/contato')); ?>">Fale com a Pratika</a>
            <a href="<?php echo esc_url(pa_child_url('/rastrear-encomenda/', true)); ?>">Rastrear encomenda <?php pa_child_icon('external'); ?></a>
            <a href="<?php echo esc_url(pa_child_url('/my-account/', true)); ?>">Minha conta <?php pa_child_icon('external'); ?></a>
        </div>
        <div><h2>Políticas da loja</h2>
            <?php foreach (pa_child_policies() as $slug => $label) : ?>
                <a href="<?php echo esc_url(pa_child_url('/' . $slug)); ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
        </div>
        <div><h2>Vamos conversar</h2>
            <a href="<?php echo esc_url($pa_config['whatsapp']); ?>"><?php echo esc_html($pa_config['phone']); ?></a>
            <a href="<?php echo esc_url('mailto:' . $pa_config['email']); ?>"><?php echo esc_html($pa_config['email']); ?></a>
            <p>Avenida Progresso, 1310, Eldorado<br>São José do Rio Preto / SP · 15043-420</p>
        </div>
    </div>
    <div class="pa-wrap pa-footer-bottom"><span>Pratika Amollar</span><a href="<?php echo esc_url($pa_config['developer_url']); ?>" target="_blank" rel="noopener noreferrer">Desenvolvido por Douglas Borges - Smart Local</a></div>
</footer>

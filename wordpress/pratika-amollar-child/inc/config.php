<?php
defined('ABSPATH') || exit;

/** Public navigation only; technical integration origins are managed separately. */
function pa_child_config() {
    return array(
        'frontend_origin' => 'https://pratikaamollar.com.br',
        'operational_origin' => 'https://loja.pratikaamollar.com.br',
        'developer_url' => 'https://smartlocal.com.br',
        'email' => 'amolar.net@outlook.com',
        'phone' => '(17) 99162-8264',
        'whatsapp' => 'https://wa.me/5517991628264',
    );
}
function pa_child_url($path = '/', $operational = false) {
    $config = pa_child_config();
    return rtrim($config[$operational ? 'operational_origin' : 'frontend_origin'], '/') . '/' . ltrim($path, '/');
}
function pa_child_asset($path) {
    return get_stylesheet_directory_uri() . '/assets/' . ltrim($path, '/');
}
function pa_child_navigation() {
    return array(
        array('label' => 'Todos os produtos', 'url' => pa_child_url('/produtos')),
        array('label' => 'Contato', 'url' => pa_child_url('/contato')),
    );
}
function pa_child_policies() {
    return array(
        'politica-de-privacidade' => 'Política de Privacidade',
        'termos-e-condicoes-de-compra' => 'Termos e Condições de Compra',
        'trocas-devolucoes-e-reembolsos' => 'Política de Trocas, Devoluções e Reembolsos',
        'entrega-e-frete' => 'Política de Entrega e Frete',
    );
}

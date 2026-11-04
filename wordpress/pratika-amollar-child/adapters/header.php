<?php
/** Audited against installed WoodMart 8.1.1 header.php and page_top_part(). */
defined('ABSPATH') || exit;
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <link rel="pingback" href="<?php bloginfo('pingback_url'); ?>">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    <?php if (function_exists('wp_body_open')) { wp_body_open(); } ?>
    <?php do_action('woodmart_after_body_open'); ?>
    <div class="wd-page-wrapper website-wrapper">
        <?php pa_child_render_header(); ?>
        <?php woodmart_page_top_part(); ?>
        <span id="pa-content" class="pa-content-target" tabindex="-1"></span>

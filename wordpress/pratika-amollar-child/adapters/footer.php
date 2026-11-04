<?php
/** Keep the exact wrapper closure contract from installed WoodMart 8.1.1. */
defined('ABSPATH') || exit;
woodmart_page_bottom_part(); // Closes native <main>, opened by page_top_part().
?>
        </div><!-- .wd-page-content, opened by native page_top_part() -->
        <?php pa_child_render_footer(); ?>
    </div><!-- .wd-page-wrapper, opened by adapters/header.php -->
    <div class="wd-close-side wd-fill<?php echo esc_attr(woodmart_get_old_classes(' woodmart-close-side')); ?>"></div>
    <?php do_action('woodmart_before_wp_footer'); ?>
    <?php wp_footer(); ?>
</body>
</html>

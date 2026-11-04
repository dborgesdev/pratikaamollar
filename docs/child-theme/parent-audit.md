# Auditoria do pai e entrega 0.2.0 — 04/11/2026

## Resultado

O bloqueio de acesso às fontes foi resolvido com autorização explícita do usuário para consulta/download via FileZilla. O caminho confirmado foi `/www/loja/wp-content/themes`. Pai: **woodmart 8.1.1**. Foram copiados os templates e arquivos de integração necessários; a inspeção e a implementação posteriores foram locais. Nenhum upload, edição, exclusão remota, instalação, ativação ou configuração WordPress foi realizado. O domínio principal não foi alterado.

ZIP atual: `wordpress/releases/pratika-amollar-child-0.2.0.zip`. A versão 0.1.0 é histórica e não deve ser usada para instalar a integração. A 0.2.0 tem adaptador ativo quando os arquivos do pai correspondem aos auditados; não exige reconstruir menus/header/footer no Elementor. Instalação e homologação continuam aguardando autorização separada.

## Evidência das fontes reais

Cópias privadas ficam em `.wrangler/woodmart-source`, ignoradas pelo Git e fora do ZIP. `parent-source-manifest.json` registra origem, versão e hashes dos 14 arquivos determinantes. O FTP automático converteu LF para CRLF; a conferência normaliza somente as quebras de linha, sem modificar os arquivos do servidor.

Arquivos auditados: style.css (metadados e CSS relevante), header.php, footer.php, functions.php, page.php; inc/functions.php, helpers.php, actions.php, enqueue.php; inc/template-tags/template-tags.php; inc/integrations/woocommerce/helpers.php e template-tags.php; inc/modules/search.php e sticky-toolbar.php. A listagem raiz consultada e os arquivos de raiz copiados não apresentaram templates header-*.php/footer-*.php.

A cópia inicial incluiu assets do tema, mas foi interrompida e a fila excedente cancelada para priorizar os PHP necessários. Mensagens de transferência interrompida no FileZilla correspondem a essa pausa/cancelamento, não a edição remota. As cópias necessárias foram concluídas e lidas localmente. Não é backup integral do tema.

O filho existente `woodmart-child` também foi copiado. Seu functions.php contém somente `woodmart_child_enqueue_styles`, com dependência woodmart-style; style.css é padrão. Não há header/footer sobrescritos ou lógica adicional nesses arquivos. A pasta inclui screenshot e POT. Não foi consultado banco/admin para inferir o tema ativo nem exportar menus/widgets.

## Contrato confirmado e alteração

- header.php chama wp_head, wp_body_open, woodmart_after_body_open e abre `.wd-page-wrapper.website-wrapper`.
- O header visual antigo usa whb_generate_header e pode delegar ao Elementor Theme Builder. O adaptador usa diretamente o componente PHP da Pratika, sem chamar esses dois renderizadores visuais.
- A função real woodmart_page_top_part abre `.wd-page-content.main-page-wrapper`, dispara woodmart_after_header e abre `<main class="wd-content-layout ...">`. Ela permanece em uso, incluindo seu suporte a layout/sidebar.
- woodmart_page_bottom_part fecha o main. O adaptador fecha depois os dois divs nas posições nativas, renderiza o novo footer, mantém close-side e chama woodmart_before_wp_footer/wp_footer. Não reaproveita prefooter, footer widgets, HTML Block/copyright antigo nem o footer Elementor.
- page.php continua herdado: loop, conteúdo/shortcodes, sidebar e meta não foram reescritos. Checkout, conta e gateways permanecem nativos. Preservado também o disparo indireto de woodmart_after_footer pelo callback nativo no wp_footer.
- O skip link chega a um alvo focável dentro do main nativo, sem criar main duplicado nem reordenar conteúdo de checkout.

Remoções exatas em `inc/chrome.php`, executadas apenas no frontend HTML compatível, depois de o pai registrar seus callbacks:

| Hook | Callback | Prioridade |
|---|---|---|
| woodmart_after_body_open | woodmart_preloader_template | 500 |
| woodmart_before_wp_footer | woodmart_search_full_screen | 100 |
| woodmart_before_wp_footer | woodmart_full_screen_main_nav | 120 |
| woodmart_before_wp_footer | woodmart_mobile_menu | 130 |
| woodmart_before_wp_footer | woodmart_cart_side_widget | 140 |
| woodmart_before_wp_footer | woodmart_header_banner | 160 |
| woodmart_before_wp_footer | woodmart_sidebar_login_form | 160 |
| woodmart_before_wp_footer | woodmart_get_sticky_social | 200 |
| woodmart_before_wp_footer | woodmart_promo_popup | 200 |
| woodmart_before_wp_footer | woodmart_scroll_top_btn | 10 |
| wp_footer | woodmart_sticky_toolbar_template | 10 |

O filtro `woodmart_option` foi confirmado em inc/functions.php; somente header_banner/sticky_toolbar/sticky_footer recebem false na resposta atual. Não altera opções persistidas. Cookies, avisos, scripts e callbacks de plugins/pagamento continuam presentes; nenhuma remoção ampla de ações. Não foram editados os arquivos de plugins ou do pai.

## Segurança de atualização

`parent-contract.json` agora contém reviewed=true e hashes LF-normalizados dos arquivos do pai e dos adaptadores. Código divergente, arquivo ausente ou pacote incompleto aciona fallback conjunto para header/footer do pai, sem injetar CSS parcial. Guardas mantêm admin, bootstrap anterior à query, REST/AJAX/PJAX e manutenção/previews especiais no comportamento nativo. Não alterar o contrato para aceitar uma atualização sem auditar a nova fonte.

Não foi executado o functions.php original do pai no laboratório; somente funções específicas de layout/helpers foram extraídas por tokenizer e usadas em teste isolado. Nenhuma configuração comercial foi copiada ou inventada.

## Validações executadas

- Typecheck React e Worker, lint, build: aprovados. Sem modificação nesta etapa dos arquivos React/Worker ou configuração Cloudflare.
- 45 testes Node aprovados, incluindo os dois de navegação mobile. Saída em react-tests.txt.
- Lint PHP de 11 arquivos do tema aprovado com PHP 8.5.12; harness PHP também verificado.
- Validação de assets/fontes locais, logo idêntica por SHA-256, ausência de caminhos locais absolutos no código e de operações proibidas: aprovada.
- Oito cenários do adaptador aprovados: normal, admin, AJAX, PJAX, manutenção, bootstrap anterior à query, LF/CRLF equivalentes e fonte adulterada. Teste normal executa as funções reais do pai de abertura/fechamento e confere um header/footer/main, balanceamento de divs, ordem footer após main, hooks essenciais disparados uma vez, callbacks antigos removidos, callback arbitrário de plugin e cookies preservados, três recursos próprios carregados e opções alheias intactas. Casos de fallback não removem callbacks nem carregam assets próprios.
- O teste de fingerprints precisou rodar fora do sandbox local: nele `is_readable` retornava falso mesmo para arquivos legíveis por file_get_contents. O código de produção manteve a proteção; a bateria foi repetida no Windows sem essa restrição e passou. Sem operações remotas nesses testes.
- ZIP reaberto e cada entrada descomprimida comparada por SHA-256 com a fonte, raiz única correta e caminhos seguros. Checksum ao lado do ZIP.

Os testes de adaptador usam APIs WordPress isoladas, não WordPress completo. Não houve homologação visual em navegador ou execução real de Elementor/WooCommerce/Mercado Pago/Correios/Infixs. Não houve novo pedido, pagamento, e-mail ou handoff remoto. A prévia de shell gerada é laboratório, não evidência de compra homologada.

## Configuração indispensável e instalação futura

Instalar em staging autorizado pelo painel como um novo tema filho, manter woodmart instalado e ativar conforme README do ZIP. Não usar o loader/HTML antigo em paralelo. Links já estão na prévia; a migração futura da origem React é uma linha em inc/config.php e não redireciona URLs. Páginas Canvas devem usar template padrão/Full Width para chamar a moldura; preservar o widget do shortcode clássico. Conferir herança de menus/widgets/presets e eventuais conteúdos antigos inseridos manualmente nas páginas.

As quatro políticas continuam minutas não publicadas no React remoto. Não houve deploy; os links novos só poderão ser usados no ambiente real após publicação autorizada e revisão dos textos. Configurações de termos/privacidade no checkout seguem separadas desta entrega.

## Homologação e rollback

Verificar imediatamente: checkout, carrinho vazio/fallback, conta/login/cadastro/senha, painel/pedidos/detalhes/endereços, rastreamento, order-received e order-pay. Comparar em 320/375/768/1024/1440px, teclado/skip/foco, reduced-motion/zoom/leitor de tela, fonte/assets, ausência de componentes antigos focáveis e H1. Depois, sandbox autorizado para frete/AJAX/validações e três meios de pagamento, ponte e sessão sem duplicações. Não criar cobranças reais.

Rollback: reativar tema anterior; restaurar atribuições/presets registrados se necessário, sem remover pai/plugins/dados. Se painel falhar, suporte da hospedagem renomeia apenas o novo filho e restaura o tema anterior. README inclui passos completos. Pagamentos, carrinho, tracking, HMAC, cache, SMTP, DNS e domínio principal não foram reconfigurados.

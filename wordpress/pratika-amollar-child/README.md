# Pratika Amollar — WoodMart Child 0.3.0

Tema filho instalável, com adaptador implementado para os arquivos **WoodMart 8.1.1** copiados de `/www/loja/wp-content/themes/woodmart` em 04/11/2026, por FileZilla autorizado e somente leitura. Não instalado nem ativado remotamente. A versão 0.1.0 de preparação foi substituída por esta entrega.

## Instalar e ativar, quando autorizado

1. Fazer backup de banco e arquivos; exportar Theme Settings, header builder e templates Elementor. Registrar tema ativo e atribuições de menus/widgets/presets. Manter acesso ao painel da hospedagem para rollback.
2. Conferir que o pai está instalado na pasta `woodmart`, versão 8.1.1, com os arquivos auditados. `Template: woodmart` foi confirmado no pai da loja e no ZIP oficial XTemos. Não remover nem renomear o pai.
3. Em staging autorizado: **Aparência → Temas → Adicionar novo → Enviar tema → `pratika-amollar-child-0.3.0.zip` → Instalar → Ativar**.
4. O header/footer são implementados em PHP: não criar menus, widgets, HTML Blocks nem reconstruir Elementor. Não usar em paralelo o loader/HTML da pasta histórica `visual-integration`.
5. Nas páginas Elementor que usem **Canvas**, selecionar o template padrão/Full Width para que WordPress chame header/footer do tema. Canvas foi feito para ignorar a moldura; não será interceptado por JS nem alterado automaticamente no banco. Preservar o widget de shortcode `[woocommerce_checkout]` e o conteúdo nativo das outras páginas.
6. Conferir se customizações por página do Elementor/tema ou HTML inserido no próprio conteúdo duplicam elementos. O adaptador substitui a moldura do tema e Theme Builder, não remove conteúdo arbitrário das páginas. Corrigir só após revisão autorizada.
7. Links públicos já apontam para `https://pratikaamollar.com.br`, centralizados em `inc/config.php`. Origem operacional continua `https://loja.pratikaamollar.com.br`. Confirmar React funcionando no domínio principal antes da ativação definitiva. O snippet opcional `wordpress/public-navigation.php` controla essa função; instalar uma única cópia no functions.php ou ferramenta de snippets existente. O plugin anterior foi substituído.

A pasta `woodmart-child` existente na loja foi copiada e inspecionada: possui somente o enqueue padrão, style.css padrão, screenshot e POT; nenhum override de header/footer ou customização PHP adicional foi encontrado. Isso não confirma qual tema está ativo no banco. Se houver customizações salvas no painel, conferir sua herança após a troca de slug. Não instalar por cima do filho anterior.

## O que o pacote faz

- Header único: logo original, Todos os produtos e Contato estáticos; ações Minha conta e Carrinho com SVG reconhecíveis e rótulos. Sem categorias, busca, menus automáticos, wishlist, comparação, contador ou minicarrinho.
- Footer único: logo, contatos/endereço comercial confirmados, links estáticos e quatro políticas React, crédito exato com target/rel seguros.
- Assets locais: Manrope variável, DM Serif Display regular, logo e SVG whitelist. OFL e licença Lucide/Feather incluídas. Nenhuma fonte ou imagem servida pela prévia.
- Responsividade baseada no React: desktop em linha >=1200px; tablet em duas linhas; menu mobile <=767px; paddings 48/32/22/17px, logo 194×83 e 157×67 (135px no header estreito). Sem sticky adicional.
- Menu mobile sem biblioteca, com ARIA, Escape e retorno de foco, saída por Tab, clique fora e atualização de breakpoint. Sem JS, links ficam visíveis. Reduced-motion desliga transições próprias.
- CSS isolado para identidade e WooCommerce: tipografia, campos, Select2, botões, tabelas, conta, notices e estados, sem alterar IDs/nomes/máscaras/radios/iframes/AJAX.
- Preserva os wrappers e usa as funções reais `woodmart_page_top_part()` e `woodmart_page_bottom_part()`. Mantém `wp_head`, `wp_body_open`, `wp_footer`, `woodmart_after_body_open`, `woodmart_after_header` e `woodmart_before_wp_footer`.
- Remove somente callbacks visuais auditados: busca fullscreen, menu fullscreen/mobile, minicarrinho, login lateral, banner, barra inferior, social sticky, botão voltar ao topo, preloader de página e popup promocional antigo. Não remove callbacks de cookies, plugins, avisos ou hooks de pagamento. Prefooter/copyright/widgets antigos não são renderizados pelo novo footer.
- Desliga, somente na resposta frontend e via filtro nativo `woodmart_option`, as opções visuais header_banner/sticky_toolbar/sticky_footer. Não grava valores no banco. Não remove scripts de pagamentos, checkout ou conta nem reconfigura plugins.
- Admin, REST, AJAX/PJAX, manutenção e previews sem moldura do pai permanecem no comportamento nativo. A guarda usa funções da versão inspecionada e não roda conditional tags antes da query principal.

## Proteção de compatibilidade

`inc/parent-contract.json` contém hashes dos arquivos auditados do pai e dos dois adaptadores. PHP compara o conteúdo normalizando apenas CRLF/LF, pois FTP e Git podem converter quebras de linha. Um pai diferente ou pacote incompleto faz header/footer e estilos voltarem ao pai, sem misturar estruturas; aparece aviso administrativo. A guarda é por requisição, sem transient ou cache persistente.

Depois de atualizar o pai, revalidar fontes, callbacks, templates e testes e gerar um pacote novo. Não editar hashes apenas para retirar o aviso. A verificação é de compatibilidade de código, não certificação de comportamento dos plugins ou proteção contra um servidor comprometido.

O pai 8.1.1 consultado não tem `header-*.php`/`footer-*.php` na raiz. Se futuras versões introduzirem templates nomeados, auditar a precedência novamente. Os arquivos originais do pai não fazem parte deste ZIP. Não carregar o functions.php antigo junto ao novo filho.

## Verificar imediatamente após ativar

- Checkout clássico, carrinho nativo vazio/fallback; Minha conta/login/cadastro/recuperação; dashboard/pedidos/detalhes/endereços; rastreamento; `order-received` e `order-pay`.
- Um header, um footer e um main, sem moldura antiga ou controles antigos focáveis. Menus/contatos/políticas levam aos dois domínios corretos. Fonte e logo locais sem 404. Header relativo no scroll.
- 320/375/768/1024/1440px; zoom 200%; teclado/foco/skip link; leitor de tela e reduced-motion; nenhum overflow ou sobreposição de gateway.
- Ponte v2 e persistência/recarga, itens e totais; campos/validação Infixs/Brazilian Market; CEP/frete e AJAX; cupons nativos e erros de pagamento, sempre em ambiente sandbox autorizado. Nunca criar pedido/cobrança real de teste.
- Pix/cartão/boleto, confirmação/pendência e instruções; rastreio apenas quando fornecido pela operação. As funcionalidades não foram recriadas nem homologadas por este pacote.
- As páginas legais React continuam minutas locais, sem deploy nesta entrega. Os links são preparados, mas só devem integrar a experiência real após publicação autorizada e revisão jurídica. Não alterar aceitação/checkbox/configuração dos termos agora.

## Rollback

Reativar o tema anteriormente ativo em Aparência → Temas. Conferir e restaurar atribuições/presets a partir dos registros/exportações. Não excluir pai, plugins, ponte, cache, pedidos ou clientes. Se o painel não abrir, suporte da hospedagem restaura o tema anterior renomeando **somente a pasta do novo filho**. Testar checkout/conta/sessão após voltar. Nenhum cleanup de banco ou troca de secret é necessário por este tema.

## Validação e limitações

Lint PHP, validação de assets/estrutura/ZIP e testes de menu executados. A bateria de shell usa **funções de layout reais do pai 8.1.1** com APIs WordPress isoladas: confere wrappers, callbacks removidos/preservados, gates admin/AJAX/PJAX/manutenção, bootstrap, quebras de linha e fallback por alteração de código. Não é WordPress completo nem homologação Mercado Pago/Correios/Elementor. A validação visual desktop/mobile e os fluxos reais continuam pendentes em staging.

Relatórios e evidências ficam fora do ZIP, em `docs/child-theme`. Fontes consultadas: documentação oficial XTemos e arquivos da própria instalação, nunca repositórios não oficiais. A integração preserva o pai; o tema não possui hooks de ativação, chamadas HTTP, sessão própria ou gravação de opções.

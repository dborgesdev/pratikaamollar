# Tema filho — entrega local em 04/11/2026

## Resultado e limite de aceite

Implementados componentes PHP reais, fontes e logo locais, CSS de identidade/WooCommerce, JS de navegação e URLs centralizadas. Pacote: `wordpress/releases/pratika-amollar-child-0.1.0.zip`. **É um ZIP instalável de preparação, não uma integração global pronta para ativação definitiva.** O bloqueio restante é a falta dos templates originais da versão instalada do WoodMart. A instalação não reconstrói nada no Elementor, mas o header/footer do pai permanecem até completar o adaptador. Não declarar substituição global nem homologação de gateway.

Os arquivos da primeira etapa e as páginas legais continuam preservados. Esta etapa não alterou React, Worker, ponte PHP v2, contrato/HMAC, secrets, cache, plugins, DNS, pagamento, frete, SMTP ou o WordPress remoto. Não houve commit/push/merge/deploy.

## Investigação técnica e decisão

A documentação oficial recomenda tema filho para funções e overrides suportados, mantendo o pai instalado. O ZIP mínimo oficial foi baixado diretamente do link do fornecedor e inspecionado: seu `style.css` declara `Template: woodmart`. Evidência local: `woodmart-child-official.zip`. Isso confirma o identificador de distribuição, mas não confirma se a instalação particular renomeou a pasta do pai.

O suporte oficial publicou um footer que fecha wrappers e emite prefooter/copyright, além de `woodmart_before_wp_footer` e `wp_footer`. Esse exemplo histórico não comprova a versão instalada. Os registros oficiais também mostram `whb_generate_header()` no header do pai. Não foram adotados nomes de hooks genéricos como se substituíssem o builder nem código de repositórios não oficiais.

Escolha: components separados + adaptador de templates auditado por versão. `header.php`/`footer.php` delegam ao pai usando mecanismos padrão WordPress. `inc/parent-contract.json` vem vazio e revisado=false. Sem adaptador completo, não injeta nenhum componente, não carrega estilos parciais e mostra aviso administrativo. Após receber os originais, o adaptador deve preservar wrappers e hooks e substituir apenas a moldura. Hashes do pai e de ambos adaptadores evitam combinação acidental de metades incompatíveis após atualização. A proteção não valida sozinha semântica ou funcionamento; revisão e homologação continuam obrigatórias.

Templates nomeados (`header-*.php`, `footer-*.php`) e Elementor Canvas podem contornar os genéricos. Essa cobertura só pode ser concluída ao inspecionar os templates reais usados. Não foi feita transformação de HTML por regex/buffering, supressão ampla de ações nem substituição dos templates WooCommerce.

## Arquivos

Pasta `wordpress/pratika-amollar-child`:

- `style.css`: identificação do tema filho.
- `functions.php`: carregamentos, classe condicionada e aviso de compatibilidade; sem hooks de ativação ou escrita de opções.
- `inc/config.php`: origens React/WordPress e contatos; menu de somente Produtos/Contato e quatro políticas, estáticos.
- `inc/components.php`: renderizadores e SVG whitelist (licença Lucide/Feather incluída).
- `inc/compatibility.php`, `inc/parent-contract.json`: guarda e fallback íntegro ao pai.
- `header.php`, `footer.php`: delegação, sem wrappers inventados.
- `template-parts/header.php`, `template-parts/footer.php`: componentes finais implementados.
- `assets/css/identity.css`: tokens, fontes, header/footer e breakpoints do React.
- `assets/css/woocommerce.css`: apresentação de formulários/botões/tabelas/notices/conta; sem mudar grids nativos, iframes ou campos fiscais.
- `assets/js/navigation.js`: menu progressivo, ARIA, Escape/foco, clique fora, saída por Tab e breakpoint; sem dependência externa.
- `assets/brand`, `assets/fonts`: somente assets utilizados, idênticos aos originais e licenças.
- `README.md`: instalação, arquivos necessários, configuração futura, páginas de verificação e rollback.

Fora do ZIP: `scripts/build-child-theme.ps1`, `scripts/validate-child-theme.mjs`, `tests/child-navigation.test.mjs`, `wordpress/tests/child-theme.php`, evidências nesta pasta. O laboratório não é enviado como parte do tema.

## Instalação, configuração e rollback

Procedimento completo no README incluído no ZIP. Resumo: backup de banco/arquivos e export de tema/templates; conferir pai e filho ativo; em staging autorizado, Aparência → Temas → Adicionar novo → Enviar tema → instalar ZIP. **Não ativar na loja esperando a unificação: o pacote atual avisa a pendência e mantém o pai.** Não criar menus ou reconstruir Elementor. Não aplicar em paralelo o antigo pacote visual-integration.

Depois do adaptador revisado, links não exigem ajuste para homologação; só alterar `frontend_origin` em `inc/config.php` quando o domínio definitivo for autorizado. Não vincular nem publicar políticas como definitivas. Não migrar automaticamente widgets/menus/options. Conferir atribuições e presets antes/depois da ativação.

Rollback: reativar o tema anterior e conferir atribuições registradas. Em caso de painel inacessível, suporte da hospedagem restaura o tema anterior renomeando somente o novo filho, sem excluir pai, plugins ou dados. Manter acesso à hospedagem e backup antes de ativar.

## Arquivos pendentes

Solicitação exata e condicionais no README: `woodmart/style.css`, `header.php`, `footer.php`, `functions.php`, `inc/enqueue.php` se existir; templates raiz nomeados de header/footer e page usados pelas páginas operacionais; arquivos chamados que emitam moldura/barras; customizações do filho atual se existir. Não fornecer wp-config.php, senhas, chaves ou dados de clientes. Uma cópia local do tema pai da mesma versão permite avançar sem acesso administrativo remoto.

## Validação executada

- PHP portátil oficial 8.5.12, ZIP SHA-256 conferido contra a página oficial; runtime apenas em `.wrangler/qa-php`, fora do pacote e ignorado pelo Git.
- Lint PHP de todos os 8 arquivos do tema e harness: aprovado.
- Harness PHP dos componentes: aprovado; renderiza header/footer, valida navegação estática, URLs e fallback sem recursos parciais. Não contém WordPress/WoodMart.
- Validador local: assets CSS existentes e locais, logo SHA-256 igual, campos básicos do tema, ausência de caminhos absolutos locais e operações proibidas, um header/footer e links legais; evidência `local-validation.json`.
- Typecheck React/Worker: aprovado. Testes Node: 45/45 aprovados (inclui dois testes de comportamento do menu). Build React/Worker: aprovado. Lint inicialmente detectou globals do novo JS; corrigido com declaração de ambiente browser e repetido.
- ZIP: todos os arquivos descompactados em memória e comparados por SHA-256 com as fontes; nomes em formato WordPress, raiz única, nenhuma travessia de caminho. Checksum junto ao ZIP. Empacotamento reproduzível pelo script (timestamps podem alterar o checksum entre builds).
- Prévia HTML gerada com os componentes PHP reais em `components-preview.html`. Navegador bloqueou protocolo file://; não foi contornado. Portanto não houve inspeção visual em navegador de 320/375/768/1024/1440px, leitor de tela ou zoom. CSS/ARIA e menu foram verificados em código e testes, não homologados visualmente.
- Não executados WordPress/WoodMart reais, Elementor, Infixs/Brazilian Market, Mercado Pago, Correios, SMTP, conta autenticada, pedidos, frete/endereço, order-pay/order-received ou nova transferência da ponte. Plano completo de homologação continua em `docs/visual-integration/report.md` e README.

## Bloqueio de acesso remoto

A revisão automática rejeitou a captura da janela autenticada do FileZilla: poderia expor conteúdo privado do servidor, enquanto o pedido autorizava preparação no repositório sem acesso remoto. Não foi tentado contornar. Para concluir o adaptador, preferir os arquivos locais listados; se optar por consulta FTP, é necessária autorização explícita para leitura/download somente desses arquivos da loja, sem envio/edição remota.

## Fontes primárias

- https://woodmarttheme.com/docs/set-up-a-child-theme/
- https://woodmart.xtemos.com/plugins/woodmart-child.zip
- https://xtemos.com/forums/topic/footer-php/
- https://xtemos.com/forums/topic/php-fatal-error-uncaught-error-failed-opening-required/
- https://developer.wordpress.org/themes/classic-themes/basics/linking-theme-files-directories/
- PHP oficial: https://www.php.net/downloads.php?os=windows

Resultado final: lint aprovado após correção dos globals de browser e de um escape de regex no validador. ZIP final com 20 arquivos (271.482 bytes), SHA-256 `ad75a0641a0094a3109e18ace9c1df639cb46796a0198f6e77982cbf2e680bb0`. Nenhum runtime de teste, arquivo do pai ou credencial faz parte do ZIP.

> Atualização: este relatório registra a preparação histórica 0.1.0. O usuário autorizou a consulta FTP posteriormente; fontes da loja foram auditadas e o ZIP 0.2.0 contém o adaptador implementado. Estado atual e validações em parent-audit.md.

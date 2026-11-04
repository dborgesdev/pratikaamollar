# Auditoria técnica — 04/11/2026

## Escopo e evidências

Leitura integral de docs/project.md e inspeção do estado local (main, sem alterações prévias no início). React é a referência oficial. Inspeção pública, sem login, via navegador: prévia React, Minha conta, rastreamento e tentativa de checkout. Nenhuma alteração administrativa, carrinho remoto, pedido ou pagamento nesta execução. Fetch web/Node não alcançou os domínios; navegador conseguiu. Não se presume acesso a Elementor Pro nem versões/capacidades não verificadas.

Infraestrutura informada pelo responsável: WooCommerce 12.1.1, WoodMart/Core, Elementor, Infixs Checkout Fields, Mercado Pago, Correios Automático, ponte própria, WP REST Cache e SMTP/Brevo. Isso é declaração de ambiente, não inventário administrativo auditado. Brazilian Market/W3 citados historicamente em project.md não comprovam configuração atual; não reinstalar nem alterar.

## 1. Inventário React reutilizável

| Fonte | Elementos / decisões |
|---|---|
| src/components/Layout.tsx | Header e footer no mesmo componente; logo oficial, UserRound, ShoppingCart, Menu/X e ArrowUpRight (lucide-react), WhatsApp e skip link; categorias vêm da Store API; menu fecha na troca de rota. |
| src/styles.css | Base, campos, botões, grid, header/footer, breakpoints, foco, motion. |
| src/refinement.css | Camada visual definitiva: Manrope variável 200–800 funcional, DM Serif Display 400 editorial; fontes locais e OFL; ouro #D99A2B, claro #F0B443, texto #955A09, preto #0B0B0B, papel #FAF9F6, texto #1D1B17, muted #57534B, linha #E4DFD5. |
| src/shopping.css | Simplificação aprovada; header desktop em linha a partir de 1200px; sem busca; navegação central; conta/carrinho; badge React autoritativo. |
| public/brand | logo-pratika-amollar.png e texture-black-gold.png originais preservados; cópias idênticas no pacote WP. Textura não é obrigatória em checkout/formulários. |
| public/fonts | WOFF2 Manrope e DM Serif Display normal/itálico e licenças; pacote WP usa somente normal e Manrope. |
| public/editorial | Fotografias/cenografia de home não devem ser usadas como produto ou promessa em páginas operacionais. |
| src/components/Seo.tsx, worker/index.ts | SEO no cliente e HTML do Worker; canonical do domínio principal; preview bloqueada. |
| src/main.tsx | Home, catálogo, categoria, produto, carrinho, contato e fallback. Agora também quatro páginas legais lazy, com renderer e dados separados. |
| src/lib + shared + worker | API, estado, sincronização e contrato de handoff separados. Nenhuma alteração de sessão/HMAC/API/cache nesta entrega. |

Medidas: wrap até 1376px com 48px laterais; 32px até 1100px; 22px até 767px; 17px até 374px. Logo 194×83 desktop, 157×67 mobile (135px em header estreito atual). Header desktop mínimo 112px; tablet 98px; mobile 84px. Header relativo, sem sticky, sem transformação no scroll. Abaixo de 768px navegação colapsada. Desktop navegação Manrope 750/13px, caixa alta e espaçamento .4px. Botões 52px, raio 6px, gradiente 120deg #d9ae60→#bb812b, hover claro e foco 3px. Campos brancos com borda #d7d1c5, raio 6px, padding 13×15px. Footer preto #0e100e, títulos dourado claro e corpo #D0C6B4. Footer ganhou coluna de políticas: quatro colunas desktop, duas até 1000px e uma mobile; pacote WP acompanha essa composição.

Motion: entradas e IntersectionObserver nas seções editoriais/cards; transições de cor, borda e botões. Não transportar animações de vitrine para formulário ou meios de pagamento. Reduced-motion desliga animações/transições. Loading do catálogo usa logo; carregamento de checkout deve continuar sendo nativo, sem overlay React que esconda erro/estado de pagamento.

Navegação conferida na prévia: Todos os produtos, Acessórios, Máquinas de Afiação, Rebolos, Contato. Slugs: acessorios, maquinas-de-afiacao, rebolos. Não congelar menu sem revisão quando catálogo mudar. Links React na minuta WP apontam à prévia, nunca à raiz ainda não aprovada.

## 2. Achados WordPress

Minha conta pública apresenta login, cadastro alternável e recuperação de senha; existem textos mistos PT/EN. Header antigo tem busca, carrinho WordPress e menu; footer antigo tem convite de ofertas, mapa Google, redes e links institucionais antigos, sem crédito obrigatório. Não reutilizar automaticamente alegações antigas de marketing. Rastreamento pede código e mostra link ao site dos Correios; isso não comprova exibição de rastreio nos pedidos. Checkout vazio redirecionou a /cart/, exibindo carrinho vazio e recomendações. Logo, faturamento, frete, Infixs, campos de boleto e gateway não foram inspecionados nesta sessão. Confirmação, order-pay, conta autenticada e detalhes de pedidos não acessados sem pedido/credenciais. A homologação anterior da ponte consta em docs/handoff/real-validation.md, não foi repetida nem substituída.

O carrinho nativo vazio também é um caminho operacional de fallback: precisa entrar nas condições de identidade para não reintroduzir WoodMart antigo ao visitar checkout sem sessão. Não criar outro carrinho nem redirecionamento automático nesta fase.

## 3. Estratégia e comparação

| Opção | Vantagem | Limite / decisão |
|---|---|---|
| Header Builder + menus WordPress | Nativo, edição reutilizável, atribuição por página | Prioridade 1; conferir sticky, menu mobile e remoção de busca/minicarrinho. |
| HTML Block Elementor para footer | Reutilizável sem plugin novo | Prioridade 2; verificar preset condicional de footer na versão instalada. |
| Configurações individuais / presets WoodMart | Isola páginas e desativa elementos antigos | Preferido; não presumir que todos os campos globais tenham override. |
| HTML de referência + CSS isolado | Aproxima medidas, tokens e tipografia sem reescrever Woo | Preparado; exige montagem/QA de staging e troca de placeholders. |
| Tema filho | Carregamento condicional e CSS versionados | Somente se necessário; snippet desativado, não tema novo automático. |
| Elementor Theme Builder | Poderia condicionar header/footer | Pro/licença e condições não confirmados; não exigir upgrade nem usá-lo como premissa. |
| Overrides PHP de templates de checkout | Grande custo e risco de drift | Não recomendado; nenhum override de Woo, gateway ou hooks nesta entrega. |

Recursos nativos do tema devem ser tentados primeiro. HTML fornecido é referência e alternativa quando o builder não atinge o resultado; não é export do WoodMart nem equivalência visual homologada. Diferenças remanescentes (ícones, menu details/summary em vez de Menu/X, estados ativos, quebra exata) devem ser conferidas no staging. Não declarar identidade indistinguível antes dessa comparação.

## 4. Arquivos preparados

- shared/legal.ts: tipos e quatro minutas; única fonte local para React e HTML inicial do Worker.
- src/pages/{Privacy,PurchaseTerms,Returns,Shipping}.tsx: uma página por arquivo.
- src/components/LegalPage.tsx e src/legal.css: navegação, H1/seções, aviso de minuta, pendências e contato.
- src/main.tsx e src/components/Layout.tsx: rotas e links no footer, sem mudança da ponte.
- worker/index.ts: reconhecimento das quatro rotas, status 200, metadados e conteúdo inicial sem JS, noindex inclusive fora da prévia. Configurações/bindings/wrangler preservados. Minutas fora do sitemap; inclusão só após aprovação final.
- tests/legal.test.mjs: verifica HTML inicial, status e noindex das quatro rotas em modo não-preview, além de canonical/título/description.
- wordpress/visual-integration: header.html, footer.html, CSS isolado, assets locais originais, licenças e snippet opt-in para tema filho existente.
- README do pacote: instalação, seleção por página, alternativas, política/termos no checkout clássico e rollback.

## 5. Conteúdo legal e pendências

As quatro rotas são /politica-de-privacidade, /termos-e-condicoes-de-compra, /trocas-devolucoes-e-reembolsos e /entrega-e-frete. São minutas visivelmente identificadas, sem alegação de aprovação jurídica. Privacidade descreve apenas arquitetura conhecida e direitos; tratamento efetivo, finalidade/base legal por dado, retenção e fornecedores continuam pendentes. Termos apresentam identificação comercial e compra nativa. Trocas separam arrependimento, vício e eventual benefício comercial; entrega não fixa frete, modalidade ou prazo inventado.

Antes de publicar: confirmar razão social/CNPJ e controlador; endereço válido para devolução (endereço comercial não equivale a retorno); responsável/canal de privacidade; cookies, analytics e rastreadores do WP e terceiros; categorias de dados e bases legais por finalidade; retenção/descarte, medidas e incidentes; contratos/papéis e transferências internacionais dos fornecedores; cobertura de entrega, postagem, prazos/marco inicial, tentativas, avarias e reenvio; logística reversa e custos; estornos e comunicação; condições de Pix/cartão/boleto; eventuais garantias comerciais e horários de atendimento. Validar revisão jurídica e data/versão aprovada. Não inserir CNPJ ou prazos aproximados.

Base jurídica consultada: CDC art. 49 (arrependimento de sete dias e restituição), arts. 18 e 26 (vícios/prazos com exceções), LGPD arts. 6–9, 16 e 18 (transparência, bases e direitos) e Decreto 7.962/2013 (informação e atendimento no e-commerce). Conteúdo é síntese preliminar, não certificação de conformidade. Procedimento exato de vinculação de páginas locais WordPress a textos React aprovados está no README; termos integrais locais preservam expansão e checkbox clássico.

## 6. Riscos e prevenção

- WoodMart/Core/Elementor podem carregar reset, wrappers, estilos e JS conflitantes: comparar estilos computados, usar escopo e condições; não ocultar componentes com seletores genéricos nem inserir headers por JS.
- Não modificar IDs, nomes, ordem de hooks ou validações Infixs/Mercado Pago; não aplicar CSS dentro de iframes; preservar Select2 e máscaras; campos boleto permanecem pendentes e intocados.
- Checkout e conta usam AJAX/endpoints: testar após atualização de frete, login e navegação de subrotas, incluindo order-pay/order-received e recuperação. Não cachear páginas ou respostas personalizadas. Não alterar o pacote WP REST Cache existente.
- Sessões são separadas: link para React não garante leitura do carrinho nativo e contador é omitido no WP deliberadamente. Após alteração nativa de itens, retorno React pode conter snapshot anterior; documentar esse comportamento e não sincronizar por cookies nem criar segunda ponte.
- Header/footer devem substituir os antigos por configuração, inclusive mobile, prefooter e copyright; remover controles antigos nos builders, não esconder somente visualmente, deixando focos invisíveis.
- Fontes/assets locais no WP evitam dependência da prévia. Menu e conteúdo legal duplicado exigem manutenção/versionamento. Crédito Smart Local obrigatório já presente nas duas implementações.
- Aprovação futura deve abranger explicitamente staging, templates/presets, eventual loader de tema filho, páginas legais e vinculação no checkout. Esta execução não autoriza escrita remota.

## 7. Plano de homologação antes de publicar

1. Comparar React e WP em 320/375/768/1024/1440px: proporções, tipografia realmente carregada, contrastes, links, espaçamento, zoom 200%, overflow, safe area. Conferir uma única navegação e footer. Header deve permanecer relativo ao scroll.
2. Teclado: skip link, foco visível, menu abre/fecha, ordem lógica, rótulos e estados inválidos; leitor de tela para erros e resumo. Reduced-motion e touch targets; sem controles antigos focáveis.
3. Catálogo/API e carrinho: simples e variação se disponível, quantidade, remoção, erro/estoque e recarga; conferir valores apenas do Woo. Testar falha de rede e estados de loading sem perder sessão.
4. Ponte homologada: repetir snapshot real→checkout, recarga e nova tentativa, sessão visitante e autenticada, itens/atributos/total sem duplicação; conferir expiração e erros sem regressão. Nenhum secret em URL/bundle/logs.
5. Checkout sandbox: cobrança, Infixs, endereço/CEP, fretes, cupom nativo, atualizações AJAX e total; Pix, cartão e boleto com dados oficiais de teste, falha/pendente/aprovado. Nunca gerar pedido/cobrança real. Sandbox precisa de aprovação/configuração isolada antes.
6. Conta com usuário de teste: cadastro permitido conforme configuração, login, logout, recuperação sem e-mail real, painel, pedidos/detalhes, endereços e dados. Verificar endpoint e proteção de dados de outros clientes.
7. Pedidos sandbox: recebido/pendente/aprovado/recusado, order-pay, instruções, pedido/valor, recarga; rastreio somente com fixture ou código de teste autorizado, código/link Correios quando existir. Não inventar código de pedido real.
8. Políticas: quatro acessos diretos/recarga, navegação e footer, H1, HTML sem JS e metadados, noindex da minuta; depois da aprovação, revisar indexação/sitemap/canonicals. No checkout: termos integrais expandem, aceitação nativa bloqueia envio sem marcação e privacidade abre a página correta.
9. SMTP/Brevo, pagamentos e frete: verificar ausência de regressão em staging sem alterar integrações. Rollback preparado antes de aplicar na loja.

## Fontes primárias consultadas

- WoodMart Page settings: https://xtemos.com/docs-topic/page-settings/
- WoodMart Theme Settings e presets: https://woodmarttheme.com/docs/theme-settings-panel/
- WoodMart header/footer e fontes: https://woodmarttheme.com/docs/getting-started/
- WooCommerce checkout clássico: https://woocommerce.com/document/woocommerce-customizer/checkout/
- Contas e privacidade: https://woocommerce.com/document/configuring-woocommerce-settings/accounts-and-privacy/
- Configuração de páginas: https://woocommerce.com/document/configuring-woocommerce-settings/advanced/
- CDC: https://consumidor.gov.br/pages/conteudo/publico/102
- LGPD atualizada: https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html
- ANPD direitos: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares
- Decreto 7.962: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm

## 8. Validação executada e limites

- pnpm typecheck: aprovado (React e Worker).
- pnpm lint: aprovado.
- pnpm build: aprovado para cliente e Worker. Primeira execução teve aviso EPERM ao gravar log do Wrangler fora do workspace; artefatos foram gerados. Nova execução usa WRANGLER_LOG_PATH dentro de .wrangler (sem modificar configuração do projeto).
- pnpm test: 43/43 aprovados, incluindo o cenário novo das quatro rotas legais; saída em tests.txt.
- Preview Cloudflare Worker local efetivamente iniciado via Vite/Miniflare; GET nas quatro rotas confirmou 200, H1 correto, minuta no HTML e X-Robots-Tag noindex, nofollow. Evidência em worker-preview.json. Processo de verificação encerrado após consultas.
- Navegador: leitura pública da home React, Minha conta e rastreamento; checkout vazio redirecionou ao carrinho. Nenhum formulário enviado. Categorias e URLs do menu React conferidas no DOM visível.
- Navegador não alcançou o localhost (conexão recusada); portanto páginas novas não tiveram inspeção visual desktop/mobile nem navegação React por clique nesta execução. CSS responsivo foi preparado e revisado em código, não homologado por screenshot. Não foi feito deploy para contornar essa limitação.
- PHP do loader foi revisado estaticamente; não executado em WordPress/PHP local nesta tarefa. Não afirmar validação de hooks/compatibilidade real. Instalação, fontes na loja, estilos de gateway, conta autenticada, frete com endereço, erros de pagamento, boleto, pedidos/thank-you/rastreio com pedido e regressão completa da ponte continuam pendentes em staging autorizado.
- Não foram alterados wrangler.jsonc, ponte React/PHP, contrato v2, HMAC, secrets, cache, plugins, gateway, frete, SMTP, DNS ou WordPress remoto. Não houve commit, push, merge ou deploy.

## Decisões para aprovação futura

Aprovar textos definitivos e preencher pendências jurídicas/comerciais; autorizar staging e montagem nativa do header/footer por página; confirmar se será necessário acabamento no tema filho após inspeção do painel; aprovar homologação sandbox e só depois aplicação remota. Manter os links na prévia até decisão explícita sobre domínio público. A preparação atual é revisável, mas não representa instalação ou aceite final de identidade visual.

Build final repetido com log local: aprovado (build.txt), sem erro de gravação externo. Logo copiada para o pacote WP conferida por SHA-256 idêntico ao asset oficial.

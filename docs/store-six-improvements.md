# Atualização final de preços e avaliações — 13/11/2026

Formulário React inline concluído, sem redirecionamento; adaptador nativo isolado preparado e não instalado remotamente. Preços originais 16px e destaque do detalhe 28px. Resumo sob o título e convites conforme permissões reais. Depoimentos estáticos não se misturam com avaliações de produtos nem são ocultados por envio pendente. Validação atual: typecheck, ESLint, 74 testes Node, build, sintaxe PHP, 35 verificações WordPress/WooCommerce locais e envio React → WordPress local por HTTP. Relatório detalhado, pendências remotas e arquivos: docs/product-reviews.md. Esta atualização substitui as orientações anteriores de envio por link nativo; o registro abaixo preserva as etapas anteriores.

# Seis melhorias da loja — 13/11/2026

Branch única: `codex/store-six-improvements`. Implementação local, sem commit/push/merge/deploy. Nenhuma instalação/configuração remota de plugins, tema, pagamentos, frete, ponte, DNS ou Worker. Arquivos Infixs não rastreados já existentes foram preservados.

## Resultado atual

1. **Vídeos nativos WoodMart:** cadastro exclusivo pelo botão + Vídeo existente. Auditados fonte PHP de salvamento/renderização, popup, JavaScript administrativo/frontend e versão 8.1.1 no backup local da loja; JS frontend idêntico ao servido atualmente. O meta `woodmart_wc_video_gallery` contém mapa por ID de imagem, com um vídeo por imagem, fontes MP4 da biblioteca/YouTube/Vimeo. Múltiplos vídeos usam imagens diferentes e seguem a ordem da galeria. Preparado enriquecimento oficial da Store API, sem modificar tema pai nem exigir recadastro. Vídeos chegam na mesma coleção de produtos; removida a consulta individual de mídias. Galeria React conserva imagens e intercala vídeos com miniatura identificada, controles, preload none e reprodução sob demanda; pausa MP4 e desmonta iframe ao navegar. **Instalação e aceite com vídeo real ainda pendentes.**
2. **Hero sem fallback:** imagem destacada do post publicado mais recente de `hero-img`, date desc/per_page=1, por `_embedded.wp:featuredmedia`. Sem ID fixo ou consulta de mídia separada. Ausência, erro HTTP/rede/JSON ou imagem que falha não renderizam `<img>`, placeholder ou aviso. Nunca usa imagem antiga/gerada. Textos, CTA, grid/espaço reservado, efeitos e wrapper do carrossel preservados. Banners adicionais continuam como antes.
3. **Preços promocionais:** componente compartilhado com original riscado/Oferta somente com on_sale ativo e valores comparáveis. Preço atual permanece principal, unidades monetárias da API, sem percentual inventado. Faixas variáveis não recebem preço riscado agregado; opção selecionada consulta seus dados próprios. Sem mudança nesta revisão.
4. **Descrições:** curta integral sanitizada com destaque antes da completa; textos iguais não são repetidos, vazios omitidos. Conteúdo WordPress mantido. Sem mudança nesta revisão.
5. **Avaliações:** médias/contagens reais, estrelas fracionadas acessíveis, comentários somente no detalhe sob demanda e paginados, HTML sanitizado, compra verificada apenas com boolean true. Estado vazio sem estrelas inventadas. AggregateRating no Worker/React apenas com dados válidos. Sem mudança nesta revisão.
6. **Cards:** primeira imagem principal, demais na ordem nativa, setas hover/foco, teclado, swipe com limiar e supressão de clique após gesto, estado independente e sem autoplay. Imagem única sem controles. Sem consulta de mídia por card. Cards priorizam imagens e não reproduzem vídeo. Sem mudança nesta revisão.

## Auditoria pública e decisão da integração

Store API confirmou 11 produtos simples, um promocional (15992: preço 14000/normal 18000, BRL/2), sem avaliações. Hero 16198/featured_media 16199 retornou PNG real 565×441. A imagem carregou no navegador.

O usuário adicionou vídeo pelo WoodMart ao produto **15675**, slug `maquina-de-afiar-alicate-de-cuticula-completa`. Após essa edição, consultamos Store API por slug e REST `wp/v2/product` com embed. Store retornou `extensions: {}`, REST retornou `acf: []` e não expôs metadados de vídeo. Assim, não há URL de vídeo consumível nessas respostas atuais. Não usamos anexos soltos nem outro meta por suposição.

O código do tema confirmou `woodmart_wc_video_gallery` e o fluxo exato + Vídeo → JSON por attachment ID → save_product_gallery → get_post_meta → renderização. A varredura PHP do tema só encontrou esse meta no módulo product-gallery-video; os filtros nativos são de HTML/dados de apresentação e não expõem REST. O mecanismo legado `_woodmart_product_video` é distinto e não foi confundido com o botão fornecido pelo cliente.

O adaptador local `wordpress/product-media/woodmart-store-api-media.php` usa ExtendSchema/ProductSchema no namespace `extensions.pratika_media.videos`, somente leitura. Faz resolução de anexos no servidor, sem HTTP adicional por vídeo/produto e sem publicar metadados brutos. O normalizador do catálogo preserva o resultado tipado; página individual recebe `product.videos`. Não existe mais cadastro extra, dependência paga de campo repetidor ou requisição individual para buscar vídeos. **ACF usado pelos banners permanece intacto.**

Comentários e opções selecionadas continuam nas rotas GET públicas restritas do Worker já preparadas, devido à falta de CORS da Store API nessas leituras. Hero continua consultado diretamente com CORS. Sem alterações de sessão/carrinho.

## Arquivos relevantes

- Galeria e providers: `src/components/ProductGallery.tsx`, `EmbeddedVideo.tsx`, `src/lib/product-media.ts`, `src/product-presentation.css`.
- Catálogo: `shared/catalog.ts`, `src/lib/types.ts`, `src/pages/Product.tsx`.
- Hero: `src/components/HomeHero.tsx`, `src/lib/hero-image.ts`. Wrapper `HomeHeroCarousel.tsx` não modificado.
- WordPress: `wordpress/product-media/woodmart-store-api-media.php`, `README.md`, `audit.json`. Removido o arquivo do grupo adicional de vídeos.
- Validação: `tests/product-presentation.test.mjs`, `woodmart-media.test.mjs`, `wordpress/tests/product-media.php`; fixtures `product-presentation` e `hero-image` (HTML/TSX), isoladas do bundle público.
- As demais melhorias permanecem nos componentes ProductPrice/SelectedProductPrice, ProductDescription, ProductReviews/RatingSummary, CardGallery e seus serviços/testes. Fonte privada do tema fica em `.wrangler`, fora do Git e da entrega.

## Configuração WordPress e aceite

Procedimento completo em `wordpress/product-media/README.md`. Quando houver autorização de instalação, adicionar somente o adaptador como MU-plugin ou snippet aprovado. O cliente continua cadastrando no + Vídeo, sem migrar/duplicar nada. A coleção Store API precisa passar a retornar `extensions.pratika_media.videos`.

O critério “cadastrar no WoodMart e aparecer automaticamente no React” foi validado **localmente no contrato de salvamento original**, mas ainda não foi comprovado no produto remoto: requer instalar o adaptador e publicar o frontend por autorização separada. Não declarar integração operacional antes disso. A equivalência do JS atual foi confirmada; o PHP foi auditado no backup 8.1.1, sem download do PHP remoto nesta etapa. O backup dispensou a consulta pelo FileZilla; nenhuma transferência pela interface foi concluída.

Atualização posterior: novas avaliações usam formulário inline React e o adaptador AJAX isolado que delega ao fluxo nativo WordPress/WooCommerce. O redirecionamento do convite foi removido. Instalação remota e configuração de Discussão permanecem pendentes; consulte docs/product-reviews.md para a auditoria, limites e QA atuais.

## Validação executada

- `pnpm typecheck`, `pnpm lint`, `pnpm build`: aprovados.
- `pnpm test`: **67 testes aprovados**, sem falhas/skips no ambiente local, incluindo regressões de preços/descrições relacionadas, avaliações, cards, carrinho, handoff, parser de frete e matriz PHP. O teste de mídia original depende da fonte privada auditada e do runtime PHP; em outro checkout, informa skip se faltarem.
- PHP lint do adaptador e harness: aprovado.
- Teste novo executa `save_product_gallery` do WoodMart original com formulário simulado, passa o resultado pelo adaptador PHP e pelo normalizador TypeScript. Confere biblioteca, YouTube, Vimeo, múltiplos vídeos, ordem de imagens, ausência, órfãos, anexo inválido, provider indevido e opção nativa desabilitada. APIs WP/Woo isoladas; não é WordPress completo.
- Hero em navegador: imagem real carregada; cenários sem imagem e API indisponível com zero `<img>` no espaço da imagem, sem aviso/placeholder. Layout desktop preservado. Arquivo inválido removido via onError. Testes de HTTP/rede/JSON inválido também aprovados.
- Fixture de galeria: imagens/vídeo nativo, preload none, miniatura e controles; YouTube sem iframe antes de interação, iframe com autoplay=0 após clique e zero iframes após trocar mídia. Sem vídeo mantém galeria de imagens. Vimeo validado no normalizador/contrato PHP; reprodução real de Vimeo não declarada.
- Desktop/mobile: controles, teclado, dimensões e overflow inspecionados localmente; limiar de swipe coberto em teste. Gestos em aparelho físico e codecs/reprodução completa continuam pendentes. Faixa de swipe em vídeos mantém gestos dos controles nativos/iframe independentes.
- Validação anterior preservada: home/catálogo/produto promocional, carrossel de banners, preço real 180 → 140, descrição e sanitização; carrinho com adição/valor/remoção e recarga vazio, sem checkout/pedido/pagamento. Nenhuma nova homologação remota da ponte nesta revisão.
- SEO/canonical/noindex/configuração do Worker preservados. Sem Lighthouse ou benchmark de SQL/rede/CPU. Vídeos não adicionam consultas HTTP de metadados; arquivos/player são carregados somente conforme interação e uso da galeria.

## Pendências reais

Instalação/homologação do adaptador no WordPress e confirmação do vídeo real 15675 na resposta/API/React; múltiplos vídeos e reordenação/remover/substituir na administração real; vídeo MP4 em dispositivos e codecs reais; swipe físico; iframe/provider bloqueado por política/rede; produtos variáveis inexistentes no catálogo atual; comentários aprovados reais e fluxo nativo de envio; checkout/handoff sandbox ponta a ponta. Nenhum pedido ou cobrança real criado.

## Validar localmente

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
```

Abrir http://127.0.0.1:4173. Para QA isolado: `pnpm exec vite --config tests/hero-vite.config.ts`, depois http://127.0.0.1:4180/tests/fixtures/hero-image.html e http://127.0.0.1:4180/tests/fixtures/product-presentation.html. Dados sintéticos são explicitamente identificados, fora do bundle público. Reiniciar preview após build para manter manifesto/assets consistentes.

Referências: [Extensão oficial da Store API](https://developer.woocommerce.com/docs/apis/store-api/extending-store-api/available-endpoints-to-extend), [Product Reviews API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/product-reviews/). Contrato WoodMart veio do código da própria loja, com proveniência em `wordpress/product-media/audit.json`.

Checagem final de preview Worker por HTTP: `/api/catalog` 200, 11 produtos e **2 consultas upstream**, descrição curta e promoção preservadas; produto 15675 com `videos: []`, coerente com o adaptador ainda não instalado remotamente. HTML `/produto/maquina-de-afiar-alicate-de-cuticula-completa` 200, bootstrap público/canonical corretos e noindex mantido. Bateria final no estado revisado: 67/67, zero falhas/skips (`.wrangler/media-tests-final.txt`, evidência local ignorada pelo Git).

Revisão posterior: responsável instalou o adaptador e a API pública confirma `extensions.pratika_media.videos: []`. Foi aberta investigação da persistência do cadastro nativo, sem modificar adaptador/React. Falha por attachment duplicado reproduzida em teste; detalhes e limites em [diagnóstico](woodmart-video-persistence/report.md). A pendência anterior de instalação passa a ser homologação dos dados gravados e do vídeo real.
# Depoimentos da loja — atualização de 13/11/2026

Os três depoimentos autorizados pelo responsável estão em `src/data/googleReviews.ts`, exibidos por `StoreReviews.tsx` exclusivamente para contagem WooCommerce explicitamente zero. Sem integração Google, consulta de rede ou influência em notas/JSON-LD. A seção mantém acesso ao formulário nativo de avaliação do produto. Detalhes e validações (70 testes, typecheck, lint, build e preview responsivo): `docs/store-reviews.md`.

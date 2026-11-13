# Depoimentos estáticos da loja

Decisão do responsável em 13/11/2026 substitui a integração Google Places/Business Profile: nenhuma API Google, chave, endpoint, cache ou consulta de avaliações foi implementada. Place ID não é necessário nesta solução; os identificadores do redirecionamento do Maps não foram declarados Place ID.

As três transcrições fornecidas pelo responsável estão integralmente em `src/data/googleReviews.ts`. `StoreReviews.tsx` exibe autores, cinco estrelas e comentários completos, sem datas, com identificação explícita da loja e link externo de navegação. Não há imagem, iframe ou recurso remoto do Google. O link só navega após ação do visitante.

`ProductReviews.tsx` inclui a seção somente quando `review_count === 0`. Contagem positiva preserva comentários próprios carregados sob demanda; contagem ausente não dispara fallback. Os dados estáticos não entram no catálogo, média, cards, JSON-LD ou componentes de SEO.

Atualização posterior: o link de redirecionamento foi substituído pelo formulário React inline e adaptador AJAX nativo isolado, ainda não instalado remotamente. O status pendente não altera os depoimentos nem as médias; após aprovação são relidos os dados públicos. Instalação, limites, auditoria e QA atualizados em `docs/product-reviews.md` e `wordpress/product-reviews/README.md`.

Layout: três colunas em desktop, uma até 900px, texto completo com quebras preservadas e sem altura fixa. Nenhum depoimento de Marlon Pereira foi incluído.

Validação em 13/11/2026: typecheck, lint, 70 testes (sem falhas ou skips) e build aprovados. Casos de contagem zero/positiva/ausente, preservação de média e transcrições completas em `tests/store-reviews.test.mjs`. Preview Worker local novo em 4181: produto 15675 sem avaliações exibiu as três transcrições; desktop 1440px com três colunas e mobile 375px com uma coluna e sem overflow horizontal. Conferido JSON-LD real da página sem depoimentos ou aggregateRating inventado. GET público do link nativo retornou HTTP 200 e formulário `commentform` com envio em `wp-comments-post.php`. Nenhuma avaliação foi enviada. A ausência em produtos com contagem positiva foi coberta pela regra automatizada; não foi criado comentário em produção para simular esse cenário. Nenhuma chamada Google foi adicionada ao código; apenas link de navegação externa.

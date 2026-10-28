# Diagnóstico e otimização — 28/10/2026

## Escopo final aprovado

Branch única `codex/catalog-performance-loading`, mantendo o nome/endereço do Worker definido pelo usuário. **Nenhum cache implementado.** Nenhum webhook, KV, D1, Cron, Cache API, sincronização periódica, infraestrutura WordPress ou dependência de cache foi adicionado. Os materiais temporários da investigação de plugins foram descartados. Nenhum commit, push, PR, merge ou deploy nesta tarefa; WordPress, DNS e domínio principal preservados.

**Cache persistente do catálogo no WordPress: pendência deliberada, aguardando seleção e validação do plugin.** Não impede estas otimizações. Não há configuração/instalação externa necessária para executar as mudanças locais.

## Evidências e causas

O fluxo antigo fazia produtos + categorias em paralelo e, depois, uma nova consulta de produtos para cada categoria. Eram cinco chamadas de catálogo e uma de carrinho na inicialização. Cada chamada por categoria repetia dados que já estavam na primeira resposta. As duas fases sequenciais somavam latências de rede/WooCommerce. O estado global também fazia a sessão do carrinho participar da conclusão do carregamento da Home.

A captura publicada, antes das alterações, levou 10.052 / 9.966 / 7.729 ms até os produtos. O processamento local ficou entre 0,01 e 0,13 ms: não era o gargalo. A Store API direta levou 3.510 ms para produtos, 1.499 ms para categorias e 2.827 ms para um produto. São amostras, não uma avaliação estatística da hospedagem.

`Server-Timing` mostrou que a maior parte do tempo é espera pela origem. No fluxo novo, produtos levaram 2.207–2.765 ms e categorias 1.236–3.168 ms; normalização no Worker 0–1 ms. Não há evidência suficiente para atribuir a lentidão especificamente a PHP, banco, tema, plugin ou KingHost. Essa separação exige logs/APM/slow queries da origem, que não foram acessados. A origem também anunciou Cache-Control max-age=31536000 nas respostas públicas inspecionadas; esse cabeçalho não comprova armazenamento nem invalidação corretos. A política da origem deverá ser verificada na seleção futura do plugin, sem alteração remota agora.

Outro defeito reproduzido: `ASSETS.fetch` respondia 304 à requisição condicional, mas o processamento de HTML substituía o status por 200, entregando corpo vazio. Antes: HTTP 200 com zero bytes após `If-None-Match`. Depois: HTTP 200 com 4.421 bytes. Corrigido o tratamento da navegação HTML e removidos validadores do arquivo estático que não representam o HTML dinâmico. A recarga foi confirmada no navegador. Isso corrige HTTP/SEO e não cria mecanismo de cache.

## Implementação

- `/api/catalog`: uma chamada do React; duas coleções públicas paralelas no Worker (produtos e metadados de categorias), sem cabeçalhos de sessão, sempre `no-store`. Paginação completa, inclusive além de 100 produtos; limite de segurança explícito em 100 páginas, com erro em vez de truncamento silencioso.
- Removidas todas as consultas de produtos por categoria na aplicação. Pesquisa, categorias, filtros de estoque/preço, agrupamento e ordenação operam nos dados já carregados.
- Dados associados aos produtos são a primeira opção. Quatro produtos reais vieram com `categories: []`; sua categoria aparece no permalink oficial `/shop/maquinas-de-afiacao/...`. O normalizador aceita esse fallback apenas para a origem oficial e um slug existente nos metadados. Resultado confirmado: 11 produtos, Acessórios 2, Máquinas 4, Rebolos 5. Não foi inferida categoria pelo nome comercial.
- Uma instância em memória mantém o estado carregado do documento React e deduplica inicializações concorrentes. Não usa localStorage, IndexedDB, persistência, TTL, polling ou atualização em segundo plano. Um reload busca a origem novamente; navegação interna reutiliza o estado. Preço/estoque continuam sendo validados pelo WooCommerce ao comprar.
- Contextos separados para catálogo e carrinho: as seções que consomem apenas catálogo não assinam atualizações do carrinho. A sessão do carrinho começa depois do catálogo na Home; sua falha oferece reconexão sem esconder os produtos. No carrinho aberto diretamente, a sessão é essencial.
- Resposta pública contém apenas os campos efetivamente utilizados pela UI, preservando preços/unidades monetárias, descrições, imagens, estoque, atributos e variações. URLs duplicadas da galeria foram removidas; `srcset` é conservado para a imagem principal dos cards.
- Na entrada direta de produto, o catálogo utilizado no SEO é incluído como JSON inerte no HTML e reutilizado no React. Elimina a consulta separada por slug seguida de nova inicialização completa no cliente. Escape de `<` protege o fechamento do script. Se a origem falhar no SEO, devolve shell HTML 503 para permitir tratamento/retry no cliente, sem falso 404.
- Catalog, Product, Cart e Contact são chunks carregados sob demanda; DOMPurify fica no chunk de produto. Fontes locais WOFF2 oficiais, mesmas famílias e licenças. Sem novas dependências.
- Imagens de cards/miniaturas já tinham lazy loading, dimensões e imagens responsivas; foram preservadas. O hero continua prioritário. O logo original foi adicionado ao preload, sem alterar seu arquivo. As fotografias reais e a textura otimizada anterior foram mantidas, sem nova manipulação destrutiva.

## Comparação medida

Para reduzir o viés de localização, o algoritmo antigo também foi reproduzido pelo mesmo proxy da prévia local (`baseline-local.json`). Três amostras por fluxo, contra o WooCommerce real, sem cache. Os dados da publicação original estão em `baseline.json`.

| Métrica | Algoritmo anterior, mesmo proxy local | Novo fluxo local |
|---|---:|---:|
| Chamadas React de catálogo | 5 | 1 |
| Chamadas WooCommerce de catálogo | 5 | 2 |
| Chamadas iniciais totais, incluindo sessão | 6 | 3 |
| Produtos disponíveis, três amostras | 11.725 / 9.522 / 7.220 ms | 3.296 / 2.832 / 2.757 ms |
| Mediana até dados de produtos | 9.522 ms | 2.832 ms (−70,3%) |
| TTFB da primeira resposta de produtos, mediana | 5.487 ms | 2.831 ms, resposta consolidada |
| JSON de catálogo, bytes decodificados | 308.368 | 52.384 (−83,0%) |
| Novas consultas de catálogo em navegação interna | 0 após carga, já havia reutilização | 0, com inicialização concorrente deduplicada |
| Processamento inicial local | abaixo de 1 ms | abaixo de 1 ms |

O TTFB anterior acima refere-se à primeira resposta, não à disponibilidade final, que dependia de outra fase. Os tempos incluem rede, origem e transferência; não são CPU pura do Worker. As amostras são pequenas e sequenciais, com oscilação de origem; a redução estrutural de chamadas/bytes é determinística, o ganho de tempo varia.

A publicação antiga respondeu HTML da Home em 109 ms e de produto em 1.357 ms. A prévia local respondeu em 9 ms e 2.845 ms, respectivamente. **Esses TTFBs HTML não são comparação geográfica equivalente.** O novo produto espera o catálogo consolidado no servidor e inclui 64.303 bytes de HTML, evitando cinco chamadas subsequentes do navegador. Não foi publicado este build para medir o edge real. A Home não espera WooCommerce no HTML.

Os tempos de “produtos disponíveis” medem chegada/processamento dos dados, não LCP nem carregamento total de todas as imagens. A saída visual acrescenta fade de 420 ms; não existe espera mínima artificial. Não foi executado Lighthouse/WebPageTest, nem afirmado um resultado de Core Web Vitals.

| Recursos | Antes da alteração | Depois |
|---|---:|---:|
| JavaScript inicial da Home, sem compressão | 330.034 bytes | aproximadamente 290.767 bytes, entrada + chunk compartilhado (−12%) |
| CSS externo | 49.745 bytes | aproximadamente 51.763 bytes, incluindo novo loading |
| Duas fontes principais preloaded | 241.280 bytes TTF | 49.276 bytes WOFF2 (−79,6%) |
| Fonte itálica, sob demanda | 71.208 bytes TTF | 24.572 bytes WOFF2 |

O total de todos os chunks JS não cai na mesma proporção: o benefício é adiar as páginas não utilizadas. HTML inclui CSS crítico do loading para iniciar antes do bundle. As fontes TTF originais foram preservadas, porém não são mais requisitadas. O catálogo novo equivale a 6.443 bytes em gzip local estimado; esse número **não é medição de bytes na rede**. A publicação antiga já utilizava Brotli. A prévia local não reproduz a compressão do edge.

## Loading premium

Overlay preto #0B0B0B com duas camadas do mesmo PNG original, luminosidade reduzida na base, revelação luminosa da esquerda para a direita e reflexo âmbar discreto. Sem barra ou porcentagens simuladas. A composição é responsiva e não depende de imagens secundárias ou da sessão do carrinho na Home.

A tela inicial está no HTML e é substituída pelo componente React. O conteúdo é montado enquanto carrega, com saída de 420 ms após os dados essenciais e a página estarem prontos. Não reaparece nas transições internas. `prefers-reduced-motion` elimina o movimento e o fade. Há timeout de rede (18 s Worker / 20 s catálogo cliente) e guarda de inicialização de 22 s, com mensagem e retry/reload. São limites de operação, não validade de dados. Falhas de chunk têm error boundary. Fundo da página fica `inert` e `aria-hidden` enquanto o dialog está aberto; foco retido no loading/retry e devolvido ao conteúdo ao sair. Conferido no DOM: overlay removido, `inert=false`, foco em `#content`.

## Carrinho e validações

Teste real em sessão isolada (`commercial.json`): GET carrinho 1.450 ms; produto não comprável rejeitado com HTTP 400 em 1.256 ms; adicionar item comprável HTTP 201 em 1.471 ms; aumentar quantidade HTTP 200 em 1.340 ms; remover HTTP 200 em 1.306 ms. Sessão final vazia e token omitido dos artefatos. Todos esses endpoints permanecem `no-store`.

No navegador: adição otimista, aumento para 2, redução para 1, confirmação da sincronização e remoção; totais estimados mudaram imediatamente e depois foram confirmados. O motor de concorrência/consolidação/rollback e o handoff HMAC foram preservados. O teste automatizado de dez adições rápidas continuou consolidando uma escrita, com feedback local abaixo de 3 ms na execução desta tarefa. Isso não significa que a origem passou a responder em 3 ms.

**Checkout real ainda depende da instalação/validação da ponte WordPress já existente no repositório.** Sem o segredo, `/api/handoff` retorna 503 explícito e preserva o carrinho; confirmado por teste e UI. Não foi feita transferência real ao checkout, nem pedido ou pagamento. Não há produto variável publicado para validação real de variações nesta captura; os dados/contratos existentes foram mantidos e testados sem inventar opções.

- Typecheck React e Worker: aprovado.
- ESLint: aprovado.
- Build Vite + Worker: aprovado.
- Testes automatizados: 27 aprovados (15 anteriores + 12 novos), incluindo paginação, dados reais, ausência de retenção no Worker, reutilização, concorrência, timeout, resposta tardia, retry, JSON seguro e recarga condicional.
- Preview Worker local ativo em http://127.0.0.1:4180/.
- Navegador: Home, catálogo, busca por “rampa”, categoria Rebolos, produto individual, carrinho e recarga; desktop padrão (~1280 px) e mobile 390×844, sem overflow horizontal nas telas inspecionadas. A animação foi capturada em mobile e sua saída validada.
- SEO: HTML de produto com canonical, descrição e JSON-LD reais; JSON de bootstrap válido; PREVIEW/noindex preservado. Minha Conta, Rastreamento e checkout mantêm URLs nativas.
- Rede lenta/timeout/falhas: simulados no recurso de catálogo em testes controlados; não foi aplicada limitação de rede real no navegador. Reduced motion inspecionado no código/CSS, sem mudar a configuração do sistema do usuário.
- Não foram feitas alterações remotas de preço/estoque/produto nem testes de invalidação: não existe cache novo e não há ambiente autorizado para essas mutações.

## Pendências efetivas

1. **Cache persistente do catálogo no WordPress: pendência deliberada, aguardando seleção e validação do plugin.** Nenhuma infraestrutura foi preparada nesta tarefa.
2. Instalar/configurar e validar a ponte de checkout em ambiente autorizado, com produto simples/variável e sem cobrança real.
3. Logs/APM da origem para separar PHP, banco e plugins, caso se deseje reduzir os ~1–3 s por operação remota ainda observados. Não há causa comprovada atribuída à KingHost.
4. Medições de navegador/edge publicado e eventual auditoria Lighthouse após autorização de deploy. Os resultados locais não substituem essas medições.

Fontes oficiais WOFF2: URLs e unicode ranges obtidos do [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@200..800&display=swap), registrados em `google-fonts-source.css`; licenças OFL já presentes em `public/fonts`.


Artefatos finais do build e SHA-256 do wrangler: `assets-final.json`. Os scripts de medição são manuais e não executam automaticamente no frontend. Validações foram executadas com os binários locais de TypeScript, ESLint e Vite (equivalentes aos scripts pnpm), sem reinstalar dependências.

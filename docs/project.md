# Pratika Amollar — Especificação de implementação V1

Status: **V1 implementada em branch e preview independente; validações e pendências em docs/validation.md, com handoff WordPress ainda bloqueante**. Criado em 28/10/2026.

## 1. Fatos confirmados
- Marca: **Pratika Amollar**. Assinatura no logotipo: **Acessórios e ferramentas de afiação**.
- Domínio público existente: `https://pratikaamollar.com.br/` — **não alterar** antes de aprovação expressa.
- WordPress + WooCommerce clonado: `https://loja.pratikaamollar.com.br/` (KingHost). Usuário informa que a restauração foi concluída e plugins desnecessários foram removidos. A funcionalidade efetiva do clone **ainda deve ser auditada**.
- Checkout nativo preservado: `https://loja.pratikaamollar.com.br/checkout/`.
- Minha conta nativa: `https://loja.pratikaamollar.com.br/my-account/`.
- Rastreamento nativo: `https://loja.pratikaamollar.com.br/rastrear-encomenda/`.
- Contato: WhatsApp/telefone `(17) 99162-8264` = `5517991628264`; e-mail `amolar.net@outlook.com`.
- Endereço: Avenida Progresso, 1310, Eldorado, CEP 15043-420, São José do Rio Preto/SP.
- Identidade fornecida: logotipo original e textura preto/dourado em `public/brand`. **Nunca redesenhar logo**.
- Captura do catálogo na administração mostra 12 itens, 11 publicados e 1 rascunho; isso é fotografia do momento, não inventário garantido. Entre as categorias visíveis estão Máquinas de Afiação, Rebolos, Acessórios.
- Plugins visíveis após limpeza: WooCommerce, Brazilian Market on WooCommerce, Correios Automático PRO e sua dependência, Elementor, Mercado Pago, W3 Total Cache, Woodmart Core, WP Mail SMTP. Não remover nem atualizar sem análise.
- O tema WordMart permanece ativo no WordPress para páginas nativas.

## 2. Objetivo e escopo
Construir loja virtual visualmente sofisticada e funcional com **frontend React** para home, catálogo, categoria, detalhes de produto, busca, carrinho, contato e páginas institucionais necessárias. WordPress/WooCommerce continuará sendo fonte da verdade de produtos, preços, estoque, atributos, frete, pedidos e pagamentos; manter checkout, minha conta e rastreamento nativos. Primeiro preview independente; apenas após aprovação, frontend no domínio principal com Cloudflare Worker.

## 3. Arquitetura e restrições
- Frontend: React, TypeScript, Tailwind CSS, Vite; pnpm e `pnpm-lock.yaml`; React Router quando apropriado; componentes separados por página/seção, hooks e tipos explícitos.
- Deploy alvo: **Cloudflare Workers Static Assets**, com Cloudflare Vite plugin e configuração `wrangler.jsonc`, fallback SPA; Worker API apenas se necessário para integração segura. Definir scripts `dev`, `typecheck`, `lint`, `build`, `preview`, `deploy` conforme a implementação. Preview via endereço não produtivo (ex.: `*.workers.dev`) após validação; não tocar DNS da raiz agora.
- WordPress permanece na KingHost, acessível no subdomínio. **Não fazer edições de configuração ou operações financeiras em produção sem autorização**.
- Dados públicos de produtos e categorias: preferir **WooCommerce Store API** `/wp-json/wc/store/v1/`; não usar chaves `ck_`/`cs_` no bundle nem no browser. Inspecionar endpoints reais antes de implementar modelos e atributos. Se necessário, usar o Worker como BFF/proxy restrito e sem cache de estados do cliente. Não inventar resultados de API não inspecionada.
- Cart: Store API com estado server-authoritative e `Cart-Token`/nonce conforme contrato oficial. Respeitar variações por IDs/atributos, disponibilidade, descontos, unidades monetárias e mensagens de erro.
- **Ponto crítico / bloqueante de compra**: redirecionar um Cart-Token da Store API para `/checkout/` **não** equivale a transferir a sessão/cookie para o WooCommerce nativo. É necessário construir e validar uma ponte segura de handoff para que a sessão WordPress possua os itens corretos antes de navegar ao checkout. Preferir pequeno plugin/endpoint WordPress próprio que receba prova de autorização de curta duração ou um identificador opaco de transferência, revalide no servidor produtos/variações/quantidades, crie/recupere sessão WooCommerce no mesmo domínio, limpe/reponha carrinho de modo idempotente e redirecione com `303` ao checkout. Não transportar token sensível em URL, não aceitar preços fornecidos pelo cliente, não abrir endpoint que permita manipular sessões arbitrárias. Se alternativa nativa documentada for encontrada, validar ponta a ponta e registrar. Esse plugin é complemento isolado, não altera checkout/conta. Testar em ambiente sem cobranças reais.
- CORS, cookies, SameSite, cache e CSRF devem ser considerados explicitamente. Nunca cachear carrinho, checkout, conta ou respostas personalizadas.
- O frontend deve utilizar URL pública do catálogo no domínio principal quando lançado; URLs canônicas do WordPress devem permanecer fora da indexação duplicada sem bloquear checkout/conta. Planejar SEO e 301s preservando slugs de produtos/categorias originais quando possível.

## 4. Direção visual
- Marca: preto profundo, branco/off-white e dourado metálico. Tokens **propostos para V1**: `#0C0C0D` (black), `#C59636` (gold), `#F6F4EF` (off-white), `#FFFFFF`, `#34312B`; testar contraste e calibrar com arquivos reais.
- Linguagem: **industrial premium**, tipografia de impacto para títulos e sans altamente legível para conteúdo/comércio. Evitar aparência genérica de template e dourado excessivo.
- Usar logotipo fiel. Textura fornecida aplicada pontualmente em hero/CTA ou áreas escuras com tratamento, não atrás de informações de compra.
- Hero editorial de produto com foto real dos produtos da API/mídia original, recorte bem definido e composição customizada; nunca apresentar arte IA como foto real do produto. Se o banner original puder ser reutilizado, respeitar direitos/recorte; não inserir texto não factual de funcionalidades.
- Home: header funcional (logo, menu de categorias, busca, conta, carrinho), hero, trilha de categorias, vitrine dinâmica, showcase de máquina em destaque (somente se identificado no catálogo), benefícios confirmados, CTA útil e footer. Estrutura ajustável por conteúdo real. Cards com bom grid e imagens com object-fit adequado.
- Motion obrigatório: entrada orquestrada apenas em seções-chave, hover/focus de cards e CTAs, transições curtas de filtro/carrinho, feedback de loading/skeleton sem layout shift; `prefers-reduced-motion`.
- Breakpoints relevantes: 320/375/768/1024/1440. Menu mobile e busca operacional.

## 5. Páginas e experiência
- `/`: homepage comercial com dados vivos; não inventar 'mais vendidos' sem ordenação real ou evidência; usar 'Produtos em destaque' quando necessário.
- `/produtos`: catálogo com pesquisa, paginação, categorias, preço, ordenação e filtros compatíveis com atributos **reais** retornados pela Store API.
- `/categoria/:slug` (ou slug compatível ao WordPress): título, contexto factual e grid filtrado por categoria; atualizar URL/SEO.
- `/produto/:slug` (ou rota compatível): galeria, descrição sanitizada, preço correto, status de estoque, especificações, atributos, variações com preço/estoque corretos, quantidade, adicionar ao carrinho, relacionados se houver dados.
- `/carrinho`: itens com imagem, preço/total do servidor, quantidade, remoção, cupons quando suportados, avisos e CTA de finalizar via ponte segura para checkout.
- `/contato`: telefone, WhatsApp, e-mail e endereço confirmados; abrir mapa em link com endereço; evitar inventar horário ou promessa de atendimento.
- Rotas `checkout`, `my-account`, `rastrear-encomenda` **não são implementadas em React**: navegação externa para URLs nativas confirmadas.
- Header/Footer React; posteriormente solicitar alteração específica no tema do WordPress para equivalência visual apenas nas páginas nativas, preservando estrutura e hooks do checkout.
- Footer em **todas as páginas React**: texto exato `Desenvolvido por Douglas Borges - Smart Local` com `https://smartlocal.com.br`, target `_blank`, rel `noopener noreferrer`. Para páginas nativas: adaptar template/tema numa fase de integração visual aprovada, sem prejudicar extensões.
- WhatsApp flutuante em todas as páginas React: `https://wa.me/5517991628264?text=` + encodeURIComponent de `Olá! Gostaria de informações sobre os produtos da Pratika Amollar.`; adaptável à página/produto. Acessibilidade, safe area e sem cobrir CTAs.

## 6. Textos factuais disponíveis
- Marca: `Pratika Amollar`.
- Assinatura: `Acessórios e ferramentas de afiação`.
- Categorias **observadas**: `Máquinas de Afiação`, `Rebolos`, `Acessórios`; confirmar slugs/id na API.
- Não publicar alegações de frete grátis, parcelamento, entrega em 48 horas, melhor preço, avaliações ou garantias sem validar as regras atuais do WooCommerce. A captura do site antigo mostra alegações históricas que não são aprovação para reprodução.
- Copy editorial de produto = campo WordPress; não modificar dados de produto em frontend.

## 7. SEO e desempenho
- Titles/descriptions e Open Graph por rota/produto, headings semânticos, canonical no domínio principal na publicação; robots e sitemap válidos; JSON-LD Product apenas com campos reais e válidos, nunca ratings inventados.
- **Atenção**: SPA puramente client-side pode dificultar indexação robusta do catálogo e metadados específicos. Codex deve avaliar e registrar solução concreta de pre-render/SSR/HTML dinâmico no Worker antes de declarar SEO de produtos pronto, sem trocar stack só por hábito.
- Imagens WooCommerce responsivas, lazy load fora do hero, reservas de proporção, tratamento de erros, cache público adequado e sem cache de usuário.

## 8. Critérios de aceite da V1
1. Páginas completas, navegação desktop/mobile, identidade marcante e motion proposital.
2. Produtos, categorias, imagens, preços, estoque e atributos reais, sem mocks em produção.
3. Adição/atualização/remoção, variações e cupons suportados funcionam com WooCommerce real.
4. **Handoff validado**: selecionar produto variável e simples no React, finalizar, chegar ao checkout WooCommerce com produtos e quantidade corretos; sem pedidos/pagamentos reais acidentais.
5. Minha conta e rastreamento abrem nos endereços existentes.
6. Typecheck, lint, build, QA de acessibilidade e responsividade, deploy preview e teste Worker efetivos; não declarar executado se não executado.
7. Preservação integral da instalação original/domínio principal; nenhuma troca de DNS, merge, push ou deploy em produção sem autorização explícita.
8. Footer com crédito obrigatório e botão de WhatsApp válido.

## 9. Pendências
**Bloqueantes para fluxo real de compra:** confirmar acesso Store API do clone e CORS; implementar/testar ponte de carrinho; verificar endpoints WordPress, configuração de pagamento sandbox e comportamento real do checkout; garantir URL do checkout funcionando.
**Não bloqueantes para prototipação:** nome do novo repositório, favicon derivado do símbolo, horários de funcionamento, políticas legais (privacidade/trocas), conteúdo institucional além dos fatos confirmados, estratégia SEO de SSR/prerender, demais canais sociais.

## 10. Plano de entrega
1. Codex inspeciona repositório e APIs (read-only), define detalhes de integração e implementa V1 completa em branch única; não altera backend original.
2. Testa UI/catálogo/carrinho e prepara necessidade do pequeno plugin de handoff; nenhuma implantação sensível sem autorização.
3. Preview em Worker não produtivo; revisão visual e funcional.
4. Ajustes na mesma branch; validação checkout sandbox, SEO e performance.
5. Após aprovação, configurar DNS/Worker do domínio principal e tratar redirects, indexação e header/footer nativos.


## 11. Revisão V2 solicitada pelo usuário

V2 deve seguir de perto o mockup fornecido: hero integrado ao produto, categorias editoriais sem números decorativos, maior legibilidade e motion com reduced-motion. Carrinho com feedback otimista, consolidação de alterações e sincronização segura; **cupons exclusivamente no checkout nativo**, substituindo a orientação V1 de interface React para cupons. Contato ajustado pelo usuário para **nome e mensagem via WhatsApp**, sem exigir telefone/e-mail e sem serviço de envio de e-mail. Não publicar/deployar a V2 sem autorização. Medições, decisões e pendências: `docs/v2-validation.md`.

## 12. Acabamento visual da V2

Refinamento solicitado em 28/10/2026: preservar estrutura da V2; DM Serif Display nos títulos editoriais e Manrope nos textos funcionais, hospedadas localmente com OFL. Paleta de referência atualizada para #D99A2B, #F0B443, #0B0B0B e #FAF9F6; variantes de ouro escuro são utilizadas em texto pequeno sobre claro para contraste. Rebolos com fotografia original e iluminação/cenografia em CSS, sem inventar produto/rótulo. Registro de execução em `docs/visual-refinement.md`. Sem deploy autorizado.

## 13. Publicação autorizada

Em 28/10/2026 o usuário autorizou commit, push, PR, merge e deploy do estado refinado. O usuário alterou o nome do Worker para `pratikaamollar` e determinou preservar o wrangler.jsonc como está. O deploy deve usar um build novo gerado dessa configuração, mantendo PREVIEW=true e sem criar rotas/DNS do domínio principal. As pendências de instalação/validação da ponte WordPress continuam documentadas.

## 14. Diagnóstico e otimização sem cache

Em 28/10/2026 o usuário suspendeu integralmente qualquer implementação de cache, inclusive preparação no WordPress, e manteve proibidos commit, push, PR, merge e deploy nesta tarefa. A branch de trabalho é `codex/catalog-performance-loading`; wrangler.jsonc e nome/endereço definidos pelo usuário permanecem intactos. Foram consolidadas as consultas públicas do catálogo em `/api/catalog`, eliminadas as consultas por categoria, reutilizado o estado já carregado durante a navegação e implementado loading premium com o logo original. Carrinho/sessão continuam dinâmicos. **Cache persistente do catálogo no WordPress: pendência deliberada, aguardando seleção e validação do plugin.** Resultados, limites e medições em `docs/performance/report.md`. A pendência anterior de instalação/validação da ponte de checkout continua existente.

Em 28/10/2026, após a validação das otimizações, o usuário autorizou expressamente commit, push, merge e deploy desta branch. Publicação mantém PREVIEW=true, o wrangler.jsonc original e a decisão de não implementar cache.

## 15. Integração WP REST Cache preparada

Em 29/10/2026, por solicitação do usuário, foi preparada uma integração PHP independente para WP REST Cache gratuito e Store API, substituindo a pendência de seleção pela preparação local da solução específica. Mantida a branch atual `main`, sem commit/push/merge/deploy. Arquivo de instalação: `wordpress/store-api-cache/000-pratika-store-api-cache.php`, como MU-plugin anterior ao loader oficial. Foram auditadas as versões 2026.4.0 e atual 2026.4.1; bateria final em WordPress/WooCommerce reais locais com 17 cenários aprovados. Instruções em `wordpress/store-api-cache/README.md` e evidências/limites em `docs/store-api-cache/report.md`. **Não instalado nem declarado operacional no WordPress remoto**: instalação e validação na loja continuam pendentes de autorização. Não há mudanças no Worker, React, WoodMart ou DNS; carrinho e checkout permanecem fora do cache.

## 16. Simplificação da interface e compra

Em 03/11/2026 o usuário solicitou simplificação pontual, preservando o visual aprovado. Implementação na branch `codex/simplify-shopping-flow`: busca removida do header e catálogo; catálogo sem filtros/ordenação; Hero com CTA único para catálogo e sem faixa inferior; cards sem seta; galeria com controles, teclado e swipe; adição com confirmação autoritativa e botão Ver Carrinho; carrinho com títulos e resumo simplificados. Sem mudanças no WordPress/WooCommerce, cache, fiscal ou infraestrutura; sem commit/push/merge/deploy. Resultados, testes e limites em `docs/shopping-simplification.md`. A pendência anterior da ponte de checkout permanece independente deste escopo.

Em 03/11/2026 o usuário autorizou expressamente commit, push, PR, merge e deploy desta simplificação. Preservar wrangler.jsonc e PREVIEW=true; o pacote PHP de cache anterior permanece fora desta publicação.

## 17. Ponte de checkout revisada para homologação

Em 03/11/2026 o usuário limitou o trabalho à transferência React → checkout nativo. Ponte existente evoluída para contrato v2: snapshot conferido após sincronização, assinatura 90s, origem/audience, uso único, trava da sessão, atributos de variações, revalidação WooCommerce, conferência exata, persistência e rollback. Sem infraestrutura paralela e sem alterar cache/tema/gateways/frete/fiscal. Preparada localmente na branch existente, sem commit/push/PR/merge/deploy. Typechecks, lint, build e 42 testes Node aprovados; 14 cenários WordPress/WooCommerce local e inspeção desktop/mobile. Relatório: `docs/handoff/report.md`; instalação: `docs/integration.md`. **Instalação/configuração do PHP e segredo e homologação nos domínios reais seguem pendentes**, incluindo frete/fiscal, cliente autenticado e pagamento sandbox. Não declarar operacional na loja remota.

## 18. Publicação da ponte na prévia e homologação real

Em 03/11/2026 o usuário informou instalação do PHP v2 e configuração dos segredos nos dois ambientes, autorizando exclusivamente deploy no Worker de prévia e homologação real, sem commit/push/merge/DNS. Publicada versão `3a58d6c9-bb1f-4fd4-a6f0-5d0b90bbe852` no Worker `pratikaamollar`, mantendo wrangler idêntico e PREVIEW=true. Typechecks, lint, build e 42 testes aprovados. Duas transferências reais React → checkout KingHost confirmaram 1 rampa + 2 rebolos, total R$1.099,90, sem duplicação e com persistência após recarga; conferido também resumo mobile. Nenhum pedido/pagamento ou configuração remota foi alterado. Relatório e limites em `docs/handoff/real-validation.md`. Variação real (catálogo atual somente simples), cliente autenticado, frete/impostos com endereço e pagamento sandbox permanecem sem homologação nesta etapa.

Em 03/11/2026, após a homologação na prévia, o usuário autorizou commit, push, PR e merge da ponte no GitHub. O usuário ajustou a publicação para commit e push direto na main, sem PR nem branch nova no GitHub. O pacote de cache anterior permanece fora desta publicação; não foi solicitado novo deploy.

Em 03/11/2026 o usuário autorizou publicar os arquivos locais restantes diretamente na main do GitHub. Incluídos código, instruções e evidências históricas do pacote WP REST Cache; sem instalação, configuração ou nova homologação remota nesta publicação.

## 19. Unificação visual e políticas — preparação local

Em 04/11/2026 o usuário autorizou auditoria e preparação local, proibindo alterações remotas e commit/push/merge/deploy. Preparadas quatro páginas legais React como minutas explícitas, links no footer e reconhecimento/HTML/SEO das rotas no Worker, com noindex de minutas e sem mudanças de configuração do Worker. Pacote wordpress/visual-integration prioriza Header Builder, HTML Blocks e condições nativas, com CSS isolado e loader de tema filho desativado. Instalação/configuração, revisão jurídica/comercial e homologação visual/operacional remotas seguem pendentes. Relatório: docs/visual-integration/report.md; procedimento: wordpress/visual-integration/README.md. Ponte v2, cache, pagamentos, frete, SMTP e DNS preservados.

## 20. Tema filho WoodMart — componentes e ZIP local

Em 04/11/2026 o usuário pediu tema filho versionado e ZIP, sem reconstrução manual no Elementor e sem alterações remotas/publicação. Preparado wordpress/pratika-amollar-child e ZIP em wordpress/releases, com header/footer PHP estáticos, assets locais, CSS Woo, menu mobile e URLs centralizadas. Template: woodmart confirmado pelo ZIP oficial XTemos. **Substituição global ainda bloqueada:** templates da versão instalada ausentes; pacote mantém header/footer do pai sem aplicar estilo parcial, até adaptador auditado. Fontes necessárias, procedimentos, validações e bloqueio da consulta FTP pela revisão automática estão em docs/child-theme/report.md e README do tema. Não declarar integração definitiva/checkout homologados. Ponte, cache, Worker, gateways, frete, SMTP, DNS e remoto intactos. Sem commit/push/merge/deploy.

## 21. Consulta FTP autorizada e adaptador WoodMart 8.1.1

Em 04/11/2026 o usuário autorizou abrir o FileZilla e verificar/copiar fontes do tema pai, confirmando /www/loja/wp-content/themes. Consulta/download somente leitura concluídos; pai woodmart 8.1.1 e filho padrão sem overrides PHP adicionais. Implementado adaptador ativo com wrappers/funções/callbacks reais e proteção por hashes normalizados LF/CRLF. ZIP novo: wordpress/releases/pratika-amollar-child-0.2.0.zip. Relatório atual: docs/child-theme/parent-audit.md; relatório da 0.1.0 permanece histórico. Typecheck/lint/build e 45 testes Node aprovados; 8 cenários locais de shell com funções reais do pai e APIs WP isoladas aprovados. Sem instalação/ativação remota, pedido/pagamento, commit/push/merge/deploy. Homologação visual e funcional de WordPress/plugins e publicação das políticas continuam pendentes de autorização separada.

## 22. Navegação operacional e links definitivos

Em 04/11/2026 preparados plugin independente pratika-operational-routing 0.1.0, tema filho 0.3.0 com links públicos definitivos e footer React no domínio principal. Plugin desativado por padrão, com duas flags, GET/HEAD HTML conservador, 302, proteção de operações/APIs/query técnicas e rollback sem banco. Usuário autorizou liberar redirects, mas confirmou que ainda trocará o apontamento; ativação condicionada ao React efetivamente servido no domínio principal. Nenhuma alteração remota, DNS, deploy ou Git. Políticas continuam minutas noindex, inclusive navegação client-side; Worker validado localmente por HTTP em 8 URLs. Typecheck/lint/build, 46 testes Node (matriz PHP 101 casos e 9 modos do adaptador) e 8 testes de shell pai aprovados. Relatório atual e pendências: docs/operational-routing/report.md; instalação: wordpress/pratika-operational-routing/README.md. Callbacks reais dos plugins instalados, origem definitiva da ponte e sandbox seguem pendentes; não presumir segurança operacional a partir de GET ou testes isolados.

## 23. Correção simples de navegação pública

Em 04/11/2026, após diagnóstico e autorização, substituído localmente o plugin de redirects por um único snippet wordpress/public-navigation.php, instalável em functions.php ou snippets existente. Sem constantes, novo plugin, ZIP ou alteração React/Worker/DNS. Regras 302 por objetos nativos: home/shop/cart, produto post_name e categoria slug, automaticamente para itens futuros, mais contato. Sem correspondência mantém WP. Preservados operações, query técnica, políticas locais e integrações; nenhuma dependência de cabeçalhos opcionais. Removidos artefatos locais do mecanismo anterior; nenhuma ação remota. Instalação/rollback e limites no relatório curto docs/operational-routing/report.md.

## 24. Origem definitiva da ponte — diagnóstico e configuração

Em 04/11/2026 confirmado no código: erro Origem inválida em pratika-cart-handoff.php compara HTTP_ORIGIN com PA_FRONTEND_ORIGIN, origem única definida externamente em wp-config.php. Instrução anterior ainda apontava workers.dev; corrigida docs/integration.md para https://pratikaamollar.com.br. Nenhuma mudança no código PHP/React/Worker/snippet, HMAC ou secrets. Valor remoto não inspecionado nem alterado: responsável deve substituir somente a constante existente. Worker assina origem da URL efetiva, PUBLIC_ORIGIN é SEO. Typecheck/lint/build e 47 testes aprovados; 14 cenários WP/Woo reais locais com origem definitiva aprovados, incluindo sessão, 303, itens/recarga, origem indevida, HMAC, prazo/replay. Laboratório/configuração local restaurada; não valida produção. Homologação real aguarda atualização autorizada da constante.

## 25. Hero híbrido — carrossel local

Em 04/11/2026 implementado wrapper independente reutilizando HomeHero intacto como primeiro slide. Banners publicados via coleção REST WordPress, URLs ACF desktop/mobile diretas, consulta única até 100 registros e sem cache persistente; falha/ausência mantém Hero. Autoplay 6s, controles, teclado, swipe e reduced-motion. Alt preservado, com fallback título da imagem, filename e marca conforme solicitado. Primeiro banner real ID 16164 inspecionado; Arrays ACF confirmados e arte mobile/desktop carregada em QA local. Typecheck/lint/build e 53 testes aprovados. Relatório, estratégia de atualização/paginação e limites de validação em docs/hero-carousel.md. Sem alteração remota ou commit/push/merge/deploy.

Revisão do Hero em 04/11/2026: controles substituídos por bolinhas centralizadas, sem pausa manual; autoplay continua com hover/foco, preservando reduced-motion. Campo acf.link confirmado na resposta fornecida e aplicado à imagem quando URL HTTP(S) válida; vazio mantém imagem sem ação. Typecheck/lint/build e 54 testes aprovados. Preview apenas local, sem Git ou deploy.

## 26. Consolidação e publicação autorizada

Em 04/11/2026 o usuário autorizou commit, push, PR, merge e deploy, pedindo conferir paridade de main e Worker com todas as melhorias locais. Escopo, verificações e limites em docs/release-2026-11-04.md. Preservar wrangler.jsonc, PREVIEW=true, secrets e DNS. Pacotes WordPress são versionados, sem instalação remota; políticas permanecem minutas explícitas noindex.

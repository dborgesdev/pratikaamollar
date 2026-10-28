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

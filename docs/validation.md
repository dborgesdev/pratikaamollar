# Validação — 28/10/2026

Branch: `codex/pratikaamollar-v1`. Sem commit, push, PR ou merge. Main preservada.

Prévia: https://pratikaamollar-v1-preview.smartlocal.workers.dev

## Executado

- `pnpm typecheck`: aprovado, frontend e Worker em projetos TypeScript separados.
- `pnpm lint`: aprovado.
- `pnpm test`: 6 testes aprovados (noindex, restrição de endpoints/escrita, origem, ponte sem configuração e payload assinado sem token).
- `pnpm build`: aprovado; JS ~319 kB / 103 kB gzip, CSS ~27 kB / 7 kB gzip.
- `pnpm preview`: Worker do build executado em http://127.0.0.1:4173. Dev em :5173.
- Deploy não produtivo em workers.dev realizado; nenhum domínio customizado ou DNS configurado.
- API real: 11 produtos simples, 3 categorias; 5 compráveis e 6 não compráveis. Estoque isoladamente não autoriza compra. Produtos com preço 0 e compra desabilitada mostram consulta, sem oferecer produto grátis.
- API por categoria consultada: alguns produtos têm categories vazio na listagem geral; frontend reconcilia associações com consultas filtradas por ID real, sem inferir nomes.
- Carrinho anônimo real via Worker: adicionar produto 16006, atualizar de 1 para 2, remover até 0 — aprovado, sem pedido/pagamento.
- Navegador: Home desktop, catálogo de máquinas com 4 itens, busca “rampa” com 2 resultados, produto individual, adição real e navegação ao carrinho. Menu mobile abre/fecha e busca operacional. Inspeção a 375 px sem overflow horizontal.
- Páginas nativas checkout, minha conta e rastreamento respondem HTTP 200 (isso não comprova checkout completo).
- Prévia pública: API retorna 11 produtos; HTML de produto contém metadados, JSON-LD e conteúdo sem JS; header noindex/nofollow e robots bloqueiam indexação.

## Pendências efetivas

- Plugin da ponte não instalado; segredo e origem ainda não configurados. Frontend informa bloqueio ao tentar finalizar, preservando carrinho. Transferência para sessão/cookie WordPress e checkout ponta a ponta **não validada**. Instalação exige autorização para backend remoto.
- PHP CLI indisponível neste ambiente: plugin não executado nem validado por lint PHP. Exige teste em WordPress de homologação, inclusive replay, expiração, estoque e restauração do carrinho.
- Nenhum produto variável publicado foi retornado. Seleção básica por IDs existe, mas preço/estoque por variação e fluxo completo precisam de produto variável real para implementação/validação final. Não declarar suporte variável completo.
- Cupom: interface e endpoints implementados; não há código promocional confirmado para validar aplicação com sucesso. Nenhum cupom foi inventado.
- Home/listagens ainda dependem de JS para conteúdo; produto possui fallback HTML no Worker. SSR integral de listagens, auditoria Lighthouse/axe e matriz completa 320/768/1024/1440 ainda não executados.
- Políticas legais, regras de frete/parcelamento e horários não fornecidos; não foram inventados.
- Regras de redirecionamento de URLs antigas e SEO no domínio principal só após autorização de lançamento.

## Preservação

WordPress, plugins remotos, checkout, conta, rastreamento, DNS e domínio principal não foram alterados. Nenhum pedido ou pagamento foi criado. Ponte entregue isoladamente em `wordpress/pratika-cart-handoff.php`, com instalação em `docs/integration.md`.

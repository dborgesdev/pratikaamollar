# Publicação da ponte e homologação real — 03/11/2026

## Resultado

**Publicação e duas transferências reais aprovadas**, do frontend React de prévia para o checkout nativo da KingHost. Nenhum pedido foi finalizado e nenhum pagamento foi executado. Não houve alteração de DNS, domínio principal, pagamento, frete, impostos, cache, plugins ou tema remoto.

## Pré-publicação e versão

- Worker `pratikaamollar`, endereço exclusivo `https://pratikaamollar.smartlocal.workers.dev`.
- Versão Cloudflare publicada: `3a58d6c9-bb1f-4fd4-a6f0-5d0b90bbe852`.
- React/Worker conferidos com contrato PHP v2: envelope v2, HMAC-SHA256, prazo 90s, audience `pratika-checkout`, origem assinada, POST `pa_handoff`, IDs/quantidades/atributos e snapshot do servidor.
- `HANDOFF_SECRET` confirmado na listagem de nomes de secrets, sem leitura/exposição do valor. Correspondência dos segredos e origem foi comprovada funcionalmente pelas transferências aceitas no WordPress.
- GET no receptor instalado retornou 405 com a proteção de método esperada, antes do deploy. Não é prova isolada de toda a versão; os testes reais posteriores confirmaram aceitação do contrato v2.
- Typecheck React, typecheck Worker, lint, build e **42 testes Node: aprovados nesta publicação**. Os 14 cenários de integração PHP local já aprovados na preparação anterior não foram reexecutados contra a loja remota (não seriam apropriados, pois criam fixtures/alteram preço e estoque em laboratório).
- `wrangler.jsonc` permaneceu idêntico: SHA256 `F18F18A30EC1B28CDF0F59A7717ACBDDBF11553DC4627650F9AF36D84F4F6B92`.
- Build gerado com `PREVIEW=true`, sem routes de domínio próprio. Página publicada HTTP 200, novo bundle `index-DSsIa-aL.js`, cabeçalho `noindex, nofollow`.
- Sem commit, push, PR ou merge. A publicação usou o estado local autorizado, não um novo commit Git.

## Fluxo real observado no navegador

Sessão React iniciou vazia. Adicionados pelo catálogo dois produtos reais disponíveis, sem alterar dados comerciais:

| Produto | Quantidade | Valor unitário | Subtotal |
| --- | ---: | ---: | ---: |
| Rampa Afiadora Angular De Alicates Cutículas Articulada | 1 | R$ 879,90 | R$ 879,90 |
| Rebolo Reto para Afiação em Moto Esmeril — 4 Polegadas (101,6 Mm) — Grão 400 | 2 | R$ 110,00 | R$ 220,00 |
| **Total de produtos** | **3** | | **R$ 1.099,90** |

1. Adição do primeiro produto simples no React confirmada pela Store API.
2. Adição de outro produto, aumento da quantidade do rebolo de 1 para 2.
3. Clique em **Continuar para checkout** enquanto a quantidade ainda estava sincronizando: estado “Preparando seu checkout…” e controles desabilitados; o fluxo aguardou a gravação.
4. Navegação ao receptor WordPress e redirecionamento final para `https://loja.pratikaamollar.com.br/checkout/`.
5. Resumo nativo apresentou exatamente as duas linhas e as três unidades acima, total R$ 1.099,90.
6. Retorno ao React: seleção preservada. Segunda transferência da mesma seleção, com novo ticket, recebeu novamente duas linhas, 1 rampa e 2 rebolos; **não acumulou itens**.
7. Recarga do checkout: seleção e total permaneceram corretos, comprovando persistência da sessão/cookie nativo.
8. Resumo nativo também conferido em viewport 390×844; override de viewport removido ao terminar.

Não foram observados erros de sessão, assinatura, origem, cookies ou bloqueio da KingHost nas duas transferências. Não foi necessário copiar segredo, Cart-Token ou qualquer dado pessoal para URL. Nenhum campo pessoal/fiscal foi preenchido. Nenhum botão de finalizar pedido foi acionado.

## Limites da homologação

- Catálogo público consultado nesta execução: 11 produtos, todos simples. Não há variação publicada para homologação remota; variações fixas, “qualquer opção” e atributos globais têm testes locais anteriores, não validação real nesta loja.
- Frete exibiu “Digite seu endereço para ver as opções de entrega.” Valores apresentados são os produtos, sem cotação de frete. Não foi testado cálculo de frete/impostos com endereço, nem alterada configuração alguma.
- Pagamento/gateway e criação de pedido não foram testados. O aviso existente de Mercado Pago em modo de teste não foi alterado nem tratado como autorização para gerar fatura/pedido.
- Não foram induzidas expiração real de sessão, corrupção de assinatura, concorrência de carga ou indisponibilidade/estoque no backend remoto. Esses casos estão cobertos no laboratório/testes automatizados da preparação, com limites documentados em `docs/handoff/report.md`.
- Fluxo observado como visitante; cliente autenticado com carrinho anterior ainda não homologado.
- A aparência e os campos do checkout nativo não foram modificados.

## Evidências

- `checkout-real-first.png`: primeira transferência no checkout.
- `checkout-real-second.png`: segunda transferência, sem duplicação.
- `checkout-real-mobile.png`: resumo nativo em viewport mobile.

Não é necessária interação manual para comprovar as duas transferências já executadas. Para repetição: abrir `https://pratikaamollar.smartlocal.workers.dev/produtos`, adicionar produtos disponíveis, ir a `/carrinho`, alterar quantidade, clicar em **Continuar para checkout** e conferir o resumo no domínio `loja`. Voltar ao carrinho React e repetir; não clicar em **FINALIZAR PEDIDO** durante a homologação.

## Limpeza da homologação

Os itens de teste foram removidos pela interface do carrinho nativo e pela interface React. Carrinho nativo vazio confirmado. Carrinho React vazio confirmado novamente após recarga, com zero itens. Nenhum pedido foi criado.

# Relatório — ponte do carrinho para checkout nativo

Data: 03/11/2026. Trabalho local na branch existente `main`. Sem commit, push, PR, merge ou deploy. WordPress remoto, configuração do Worker, tema, cache, gateways, frete e impostos não foram alterados.

## Diagnóstico

O React já adicionava produtos e alterava/removia linhas via Store API, através do Worker. O Cart-Token permanece em cookie HttpOnly no domínio do frontend, com SameSite=Lax e Secure em HTTPS. Esse token **identifica a sessão Store API**, não autentica o visitante no checkout WordPress. Não há compartilhamento de cookies entre os domínios.

Já existia `wordpress/pratika-cart-handoff.php`: assinatura HMAC, POST cross-domain, revalidação parcial e redirect 303. A ponte foi evoluída, sem criar mecanismo paralelo. Lacunas corrigidas: snapshot não comparado ao carrinho visível; retorno de snapshot anterior à sincronização; assinatura sem versão/audience/origem internas; atributos escolhidos ignorados (especialmente variação “qualquer opção”); ausência de lock da sessão nativa; falta de conferência exata pós-inserção; rollback que perdia metadados; limpeza por Cron; cliente aceitando destino/campos arbitrários e liberando a trava antes da navegação.

O novo contrato v2 tem validade de 90s e UUID de uso único. Os registros de segurança usam options nativos sem autoload e limpeza no acesso, sem Cron. Não são uma implementação de cache. O checkout só recebe redirect após validação e persistência da sessão nativa. O receptor pode apresentar erro com link para voltar ao React; isso é um tratamento da transferência, não um checkout React.

## Arquivos

- `worker/handoff.ts`: preparação assinada, validação de sessão, snapshot, erros e atributos do WooCommerce.
- `worker/index.ts`: delegação à função de handoff e timeout da consulta; demais rotas preservadas.
- `src/lib/checkout.ts`: contrato tipado de transferência, timeout e destino POST fixo.
- `src/lib/store.tsx`: retorna o carrinho final depois de sincronizar e travar.
- `src/pages/Cart.tsx`: prevenção síncrona de duplo clique, loading, POST validado, erro/repetição/conferência explícita e recuperação ao voltar pelo navegador.
- `wordpress/pratika-cart-handoff.php`: **único componente PHP a instalar**, versão 2.0.0.
- `tests/handoff.test.mjs`, `tests/worker.test.mjs`: contrato e falhas do Worker/cliente.
- `wordpress/tests/handoff-site.php`, `handoff-local.mjs`, `handoff-preview.mjs`, `handoff-local-results.json`: laboratório, testes de integração e resultados. Não subir ao WordPress.
- `eslint.config.js`: aplica os mesmos globals Node aos scripts de teste WordPress.
- `docs/integration.md`: instalação/configuração exata, contrato, remoção, laboratório e matriz real.
- `docs/project.md`: registro de escopo e pendências.
- `docs/handoff/checkout-local-desktop.png`, `checkout-local-mobile.png`: evidência do checkout local, com produto sintético.

## Validações efetivas

**Typecheck React, typecheck Worker, lint e build: aprovados. 42 testes Node aprovados (38 anteriores e 4 novos). Lint PHP aprovado.** Sem novas dependências.

**14 cenários de integração HTTP aprovados** em WordPress 7.1.4 + WooCommerce 11.2.1 + PHP 8.5.12 com SQLite, banco local separado e sem a integração de cache. Evidência detalhada em `wordpress/tests/handoff-local-results.json`:

1. Produto simples, quantidade 3, sessão nativa nova, GET checkout e recarga sem duplicação.
2. Múltiplos itens e tickets novos substituindo um carrinho nativo existente.
3. Replay do mesmo ticket recusado com 409, sem mutação.
4. Expiração, assinatura adulterada e origem incorreta recusadas sem mutação.
5. Variação fixa e variação “qualquer opção”, quantidades e valores preservados.
6. Atributo global: label/termo de exibição resolvidos para a taxonomia/slug original.
7. Atributo divergente e linhas duplicadas rejeitados.
8. Preço alterado depois da seleção: total recalculado pelo WooCommerce.
9. Produto sem estoque: transferência rejeitada e carrinho nativo anterior preservado.
10. Alteração/remoção anterior ao checkout refletida na seleção final.
11. Falha após inserção parcial: rollback para o carrinho nativo anterior.
12. Lock ativo: outra transferência da sessão recusada com 409. Este cenário exercita o estado de concorrência; o servidor PHP de teste é de um único processo, sem teste de carga multiworker.
13. **Store API real add/update/remove → função real de preparação do Worker → PHP → sessão nativa**, simples e variação juntos; source permanece intacto.
14. Sessão nativa expirada: ticket novo estabelece nova sessão com a seleção correta.

Os testes Node cobrem também ausência/expiração da sessão Store API, snapshot divergente/estoque, segredo inválido, origem externa e destino malicioso recusado pelo cliente. Dados de teste e segredo presentes nos helpers são descartáveis e exclusivos do laboratório; o relatório não grava tokens/cookies/assinaturas.

**Navegador:** build React contra adaptador estritamente local, Store API local e PHP local. Adição pelo card, aumento de 1 para 2 e clique no checkout durante a sincronização: loading imediato e controles desabilitados; o fluxo aguardou a gravação e o checkout nativo mostrou **2 unidades, R$10,00 cada, total R$20,00**. Confirmado após recarga e em 1280×900 e 390×844; sem overflow horizontal (respectivamente scrollWidth 1265/375). Capturas salvas. O adaptador troca somente no laboratório o upstream/destino fixo por loopback; não foi introduzida configuração de produção para redirecionamento arbitrário.

O laboratório inicialmente apresentou uma página de checkout removida pela limpeza de fixtures e a tela padrão de loja em preparação. Foram corrigidas somente as fixtures/opções locais, e adicionada à ponte a verificação de página de checkout publicada. A conferência visual final foi no checkout ativo. O laboratório não reproduz WoodMart, KingHost nem gateway: os resultados locais não são homologação remota.

**Auditoria remota somente por GET:** Store API produtos HTTP 200, 11 produtos simples e nenhuma variação publicada; carrinho público novo HTTP 200 vazio com emissão de Cart-Token; checkout HTTP 200. Nenhuma adição, edição de estoque, pedido ou pagamento executado na loja remota nesta tarefa.

## Pendências reais

- Autorizar e efetuar instalação/configuração conjunta do PHP v2 e segredo do Worker, seguindo `docs/integration.md`. Nenhum secret remoto foi criado/alterado.
- Homologar o POST HTTPS entre os domínios reais, cookies no navegador, WAF/cache da KingHost, cliente autenticado com carrinho anterior e extensões WoodMart/WooCommerce da loja.
- Conferir frete e impostos recalculados com endereço de homologação. Os produtos sintéticos locais são virtuais: testes confirmam preços/totais, **não** regras reais de entrega/fiscal.
- Homologar produto variável real em staging autorizado; não havia variações no catálogo público auditado. Casos locais foram sintéticos, nunca publicados na loja.
- Pagamento sandbox não executado, sem gateway no laboratório. Depende de ambiente/credenciais de teste confirmados e autorização apropriada; não alterar Mercado Pago de produção.
- Esta entrega está **pronta para instalação e testes de homologação**, não declarada operacional no domínio real.

## Referências consultadas

- [WooCommerce — Cart Tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/).
- [WooCommerce — Cart API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart).
- [WordPress — add_option](https://developer.wordpress.org/reference/functions/add_option/).
- [WordPress — wp_safe_redirect](https://developer.wordpress.org/reference/functions/wp_safe_redirect/).
- Código oficial instalado no laboratório: `CartItemSchema`, `ProductItemTrait`, `WC_Cart`, `WC_Cart_Session`, `WC_Session_Handler` e `CartTokenUtils` (WooCommerce 11.2.1).

Atualização em 03/11/2026: após instalação/configuração informada pelo usuário, foi autorizado e realizado deploy exclusivamente na prévia. Duas transferências reais foram conferidas no checkout nativo, sem duplicação; resultados e pendências atuais em `docs/handoff/real-validation.md`. Este relatório acima registra a preparação local anterior e não deve ser interpretado como estado atual da instalação.

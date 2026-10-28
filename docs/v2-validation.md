# Revisão V2 — 28/10/2026

Branch preservada: `codex/pratikaamollar-v1`. V2 local em http://127.0.0.1:4175/. Nenhum commit, push, PR, merge ou deploy nesta revisão. O endereço público workers.dev continua na V1.

## Direção visual

Hero recomposto a partir da fotografia transparente original da categoria Máquinas de Afiação, com fundo escuro, luz lateral, sombra de bancada e título maior próximo do modelo fornecido. Não há geração de produto ou redesenho de logotipo. Categorias sem números, com fotografia integrada ao fundo, recortes e escala editorial. Cards com fotos maiores, nome legível, preço destacado e estado imediato de quantidade no carrinho. Contato da Home integrado à transição para o rodapé, sem bloco isolado de texto centralizado.

Originais em `public/brand` preservados. Derivada JPEG da textura (somente redimensionamento/compressão) em `public/editorial/workshop-texture.jpg`: 265.781 bytes contra 5.470.543 do original, redução de 95,1% no asset solicitado pela página. Fotografias da máquina e do rebolo copiadas das URLs reais de `docs/audit/categories.json`, sem alteração do produto.

Motion: entrada do hero, revelação por IntersectionObserver, aproximação curta das fotos e feedback de controles. `prefers-reduced-motion` desliga animações e transições. Sem novas promessas de frete, parcelamento, avaliações ou garantia.

## Carrinho: diagnóstico antes das mudanças

V1 medida em três ciclos no preview público, antes de modificar a integração. Cada ciclo adicionou produto real 16006, aumentou para 2, diminuiu para 1 e removeu. Apenas carrinhos anônimos; sem pedidos/pagamentos.

| Operação | n | Mediana V1 | Faixa V1 |
|---|---:|---:|---:|
| Adicionar | 3 | 1.573 ms | 1.335–74.220 ms |
| Alterar quantidade | 6 | 2.516,5 ms | 1.337–4.266 ms |
| Remover | 3 | 1.443 ms | 1.272–1.864 ms |

Evidência: `docs/audit/cart-v1-timing.json`. O pico de 74,22 s é um outlier observado, não foi descartado nem atribuído a plugin específico sem trace do WordPress.

Comparação direta com WooCommerce, sem Worker: adição 1.513–2.886 ms, atualização 1.362–1.763 ms, remoção 1.571–4.394 ms. O backend já tem latência de segundos. A causa da espera na interface foi confirmada no código: a V1 aguardava a resposta inteira antes de atualizar o estado e usava um único busy para desabilitar todos os controles. A inicialização do carrinho ainda aguardava produtos/categorias em sequência e o StrictMode podia repetir a inicialização.

## V2 e medições

Controlador separado em `src/lib/cart-sync.ts`: projeção otimista imediata; debounce de 280 ms; uma escrita de sessão por vez; intenções absolutas de quantidade e revisões impedem resposta antiga de sobrescrever edição recente. Sem bloquear controles enquanto a rede responde. Preços e limites definitivos continuam vindo do WooCommerce. Totais otimistas são identificados como estimados.

Após erro, faz leitura autoritativa e reverte a projeção. Não repete adição automaticamente após resposta ambígua. Se a leitura falhar, a próxima escrita exige reconciliação prévia. Falha bloqueia checkout e oferece nova conferência. Timeout de leitura: 30 s; de mutação: 90 s, para acomodar o pico medido sem abortar cedo uma escrita que pode estar em execução. Não há promessa de idempotência de um POST perdido no WooCommerce: reconciliação é obrigatória e falha continua explícita.

Checkout aguarda toda a fila e trava novas intenções durante a preparação/transferência. A ponte assinada original foi preservada. O plugin remoto continua não instalado/configurado, portanto checkout ponta a ponta permanece pendente e não foi declarado validado.

Ensaio integrado do controlador com WooCommerce real:

| Ação | Feedback de estado | Escritas POST |
|---|---:|---:|
| 3 adições rápidas | 0,804 ms | 1 |
| 6 edições rápidas | 0,499 ms | 1 |
| Remoção | 0,106 ms | 1 |

Foram 10 ações consolidadas em 3 POSTs; confirmação de cada POST levou 1.567–1.788 ms. Carrinho terminou vazio. Feedback mede a atualização síncrona do controlador em Node, não tempo de pintura de pixels no navegador. A edição imediata também foi conferida no browser.

Outra amostra instrumentada V2, de 12 POSTs individuais, teve mediana 3.541 ms na adição, 1.902,5 ms na atualização e 1.988 ms na remoção. O `Server-Timing: wc` mostrou 94,3% do tempo agregado dentro da chamada de rede do Worker ao WooCommerce. Não são amostras controladas de infraestrutura e V1 pública/V2 local têm caminhos diferentes: não se afirma redução de latência do servidor. A melhora demonstrada é feedback imediato e consolidação de requisições. Rastros completos em `docs/audit/cart-v2-timing.json`, `cart-woocommerce-direct-timing.json` e `cart-v2-interaction-timing.json`; ensaio reproduzível em `scripts/benchmark-cart.mjs`.

Cupons: interface completamente removida, inclusive controles de remoção e endpoints de escrita no proxy React. Cupons serão operados no checkout nativo.

## Contato conforme ajuste do usuário

Formulário somente com nome e mensagem. Nome de 2–80 caracteres, mensagem de 10–1.500, validação de espaços em branco, encoding e destinatário fixo. Gera texto organizado com Nome e Mensagem e abre o WhatsApp; confirmação do envio ocorre na conversa. Não simula mensagem enviada. Exibe erro e link alternativo “Abrir conversa” quando o texto está preparado. Sem e-mail/telefone exigidos, sem credenciais, backend de envio ou disparo automático que exija proteção antispam. Não foi enviado nenhum WhatsApp de teste à equipe.

## Validação

- Typecheck frontend e Worker: aprovado.
- ESLint: aprovado.
- 15 testes aprovados: otimista, consolidação, respostas antigas, escritor único, remoção/reentrada, estoque, rollback, timeout sem repetição, trava de checkout, validação/formatação WhatsApp e segurança do proxy/handoff.
- Build Vite/Worker aprovado. Prévia do build local executada, sem deploy.
- Browser: hero e categorias desktop, cards, menu mobile, edição rápida de quantidade, formulário inválido e preparação da mensagem com texto de QA (sem enviar).
- Contato inspecionado em 320/375/768/1024/1440; sem overflow horizontal. Home e catálogo também conferidos em 320/375/768/1024/1440 por leitura de dimensões, sem overflow horizontal; Home inspecionada visualmente em desktop, 375 e 320.
- SEO: metadados/OG atualizados na navegação cliente, JSON-LD Product substituído ao mudar de produto e removido em outras rotas. Produtos com preço zero não geram Offer. HTML inicial de produto, JSON-LD e noindex do preview conferidos no Worker local.
- Não executado: Lighthouse/axe automatizado, checkout WordPress ponta a ponta e produto variável real (não disponível no inventário auditado). SSR integral de listagens continua pendência da V1.

WordPress remoto, pagamentos, conta, rastreamento, DNS e domínio principal permanecem intactos. Não houve deploy nesta revisão.


Observações finais do QA: a máquina A2X1 tem description contendo somente parágrafos vazios no WooCommerce; a descrição integral passa a usar short_description nesse caso, sem inventar ou perder o conteúdo real. Resumo comercial é apenas um trecho, com link para o conteúdo completo abaixo. As tentativas de acionar algumas navegações por clique no IAB não confirmaram a transição; rotas diretas, estado de quantidade, formulário e integração HTTP foram verificados. A navegação por clique e acionamento do checkout na interface exigem conferência manual adicional; não estão sendo declarados integralmente aprovados.

# Simplificação da interface e compra — 03/11/2026

Branch: `codex/simplify-shopping-flow`. Prévia local: http://127.0.0.1:4182/.

## Alterações integradas

- Header sem busca no desktop/mobile; navegação reorganizada, Minha Conta preservada inclusive por ícone no mobile, ícone de carrinho com contador no canto inferior direito. Categorias também são obtidas em segundo plano nas entradas diretas em Contato/Carrinho, sem bloquear essas páginas nem duplicar consultas do catálogo já carregado.
- Hero com CTA único **Explorar produtos** para `/produtos`, sem faixa de atalhos e sem legenda institucional sobre a máquina. Mantidos fotografia original, tipografia, paleta, iluminação e animações aprovadas.
- Catálogo sem busca, preço, ordenação, filtro de disponibilidade ou eyebrow. Categorias em navegação horizontal adaptável; grid aproveita toda a largura. Parâmetros antigos de busca/ordenação na URL não continuam aplicando filtros invisíveis. Cards sem a seta sobre a imagem; títulos, preços, imagens e disponibilidade continuam vindo do WooCommerce.
- `ProductGallery.tsx`: setas anterior/próxima, navegação circular, Home/End/setas do teclado, miniaturas com estado selecionado e swipe horizontal por Pointer Events. Gestos curtos/diagonais/verticais não trocam imagem; cancelamento do gesto libera o estado. Setas só existem com mais de uma imagem. Imagem principal usa `object-fit: contain`; transição discreta respeita reduced motion.
- `AddToCart.tsx`: botão bloqueado durante envio com **Adicionando ao carrinho**; confirmação **Adicionado ao Carrinho** e link com aparência de botão **Ver Carrinho** somente após confirmação autoritativa. Não há modal, nova tela ou confirmação adicional obrigatória. Ao comprar pelo teclado, o foco segue para Ver Carrinho após a confirmação, desde que o usuário não tenha focado outro elemento; em erro, retorna ao botão de tentativa.
- `CartSync.addConfirmed`: coalescência por ID durante processamento, validação da resposta de carrinho e dos metadados monetários, confirmação de quantidade real, rollback/reconciliação e possibilidade de tentativa explícita após erro. Não repete POST ambíguo automaticamente. Um GET de reconciliação válido pode confirmar a quantidade quando a resposta do POST foi perdida. Falha de outro produto não transforma uma adição válida em falsa confirmação nem libera checkout com erro pendente.
- Variações usam o ID selecionado para o envio. Ao adicionar uma variação nova, o carrinho não projeta o preço do pai como se fosse o preço confirmado da variação; aguarda o preço recebido do servidor. Opções e valores não são inventados.
- Carrinho com título **Carrinho**, sem eyebrows, título editorial do resumo ou aviso de sincronização concluída. Mantidos itens, quantidade, remoção, valores, total, continuar comprando e checkout. Só aparecem estados de atualização/erro quando relevantes. Textos próprios ao consumidor não mencionam WooCommerce.

## Validações executadas

- Typecheck React e Worker, ESLint, build Vite/Worker: aprovados.
- **38 testes automatizados aprovados**, sendo os 27 anteriores e 11 novos: confirmação tardia, dez cliques na mesma adição resultando em uma escrita, resposta sem item, resposta inválida/incompleta, estoque recusado e retry, POST ambíguo confirmado por GET sem duplicação, variação com preço real do servidor, falhas concorrentes, limite de quantidade, índices da galeria e intenção de swipe horizontal.
- Navegador com backend real: Home → catálogo → Rampa Afiadora → adição → Ver Carrinho. Observado primeiro o estado **Adicionando ao carrinho**, com botão/quantidade desabilitados, e somente depois a confirmação com **Ver Carrinho**. Nenhuma confirmação otimista de sucesso foi exibida.
- Carrinho real de teste: 1 → 2 → 1 unidade, totais coerentes com o servidor, remoção do item ao final. Sem criação de pedido/pagamento.
- Compra também testada com Enter no card da Home: foco confirmado no link Ver Carrinho após resposta real; Enter nesse link abriu o carrinho. Item removido ao final.
- Galeria real com oito imagens: botão Próxima alterou 1/8 → 2/8; tecla ArrowLeft retornou para 1/8, com miniaturas atualizadas.
- Conferidos desktop (~1280 px), tablet 820×1180, mobile 390×844 e breakpoint 320×740. Nas telas inspecionadas, `scrollWidth` igual à largura disponível, sem overflow horizontal. Header sem input, catálogo sem input/select, cards sem span de seta, Hero com um CTA e sem `.hero-bottom`/`.hero-caption`, carrinho sem mensagem de sincronização concluída.
- Paginação do catálogo conferida: segunda página mostrou os dois produtos restantes; os 11 itens continuam acessíveis.
- Menu mobile e navegação Rebolos funcionais; a categoria exibiu cinco produtos reais. Todas as leituras comerciais vieram da integração existente. A consulta atual confirmou **11 produtos simples e nenhuma variação publicada**.
- As setas e o teclado foram exercitados no navegador. A lógica de swipe/limiar/gesto vertical foi testada automaticamente; não foi feito teste em aparelho físico com toque. Reduced motion está preservado no CSS, sem mudar as preferências do sistema do usuário.

## Limites e pendências efetivas

- O endpoint local `/api/handoff` continua respondendo indisponibilidade da ponte nativa; a interface agora informa indisponibilidade de checkout com o carrinho preservado. Ação e integração foram mantidas, mas **não houve transferência ponta a ponta para o checkout**, pois a instalação/configuração da ponte WordPress segue como pendência anterior. Nenhuma alteração no backend foi feita para contornar isso.
- Produto simples foi testado com WooCommerce real. Produto variável, erros de estoque, concorrência e respostas inválidas foram testados com transportes controlados nos testes, sem cadastrar/alterar produtos ou estoque na loja. Não declarar homologação real de variações inexistentes no catálogo atual.
- Confirmar o gesto de swipe em aparelho físico e repetir o handoff quando a ponte estiver autorizada e disponível.

## Preservação de escopo

Sem alterações em WordPress, WooCommerce, cache, configurações fiscais, Worker ou wrangler. Sem dependências novas. Os arquivos de cache PHP e documentação que já estavam pendentes antes desta tarefa foram preservados. Sem commit, push, PR, merge ou deploy.



## Publicação autorizada

Em 03/11/2026 o usuário autorizou commit, push, PR, merge e deploy. O pacote de cache anterior permanece fora deste release, e a configuração do Worker será preservada.

# Paginação do catálogo — correção aprovada, 13/11/2026

Branch atual preservada: `main`, base `cba8f2e`. Antes do trabalho, somente os quatro caminhos Infixs já existentes estavam não rastreados; continuam preservados. Após aprovação, autorizado commit exclusivo desta correção, push da main e verificação da publicação. Os relatórios de auditoria de APIs permanecem fora desse commit; nenhuma integração foi modificada.

## Causa e solução

O catálogo cortava a lista em grupos fixos de 9. O CSS efetivo de `shopping.css`, carregado após os estilos anteriores, usa quatro colunas em desktop, três até 1199px, duas até 900px e uma até 600px. Nove não é múltiplo de quatro nem de dois.

Adotado limite fixo de **12**, mínimo múltiplo comum de 1/2/3/4. Nenhum listener de resize, consulta de API ou alteração de associação/ordem foi introduzido. Redimensionar mantém exatamente os mesmos IDs e a página atual. Somente a última página pode ficar incompleta. Não há cards vazios, repetidos ou ocultados por CSS.

| Largura CSS | Colunas | Produtos por página completa | Linhas completas |
| --- | ---: | ---: | ---: |
| Até 600px | 1 | 12 | 12 |
| 601–900px | 2 | 12 | 6 |
| 901–1199px | 3 | 12 | 4 |
| A partir de 1200px | 4 | 12 | 3 |

O roteamento já reiniciava Catalog por pathname; esse comportamento foi preservado. O componente extraído recebe também key da categoria. Se os dados diminuírem, a página é limitada à última válida; esse limite é persistido para que um crescimento posterior não salte de volta a uma página antiga. Não houve alteração na estratégia de atualização do catálogo.

## Arquivos

- `src/pages/Catalog.tsx`: filtros, ordem, banner e categorias preservados; resultados delegados ao componente próprio.
- `src/components/CatalogProducts.tsx`: grade, total, estado de página, vazio e controles acessíveis.
- `src/lib/catalog-pagination.ts`: limite 12 e seleção pura dos itens/página válida.
- `src/catalog.css`: preço com espaço reservado, alinhamento dos controles, botão Conhecer com mesma altura mínima de 52px e paginação centralizada com quebra mobile.
- `tests/catalog-pagination.test.mjs`: páginas completas, última parcial, ordem, unicidade, filtros e alterações de quantidade.
- `tests/fixtures/catalog-pagination.html` e `.tsx`: dados sintéticos somente no laboratório; mesmos cards e componente de resultados, sem chamadas reais às APIs de produtos/carrinho.

Preço, estoque, galeria, textos integrais, botões e fluxo do carrinho não foram reimplementados. O CSS é restrito ao catálogo. Títulos longos continuam legíveis e sem truncamento. Um desalinhamento adicional de 5px vinha da diferença entre a altura do link Conhecer e o botão Adicionar; a correção mantém preços e botões alinhados na mesma linha da grade.

## QA executado

- Typecheck e ESLint aprovados; **76 testes Node**, sem falhas ou skips; build de produção aprovado.
- Navegador, fixture de 37 itens: 320, 375, 430, 479, 480, 481, 599, 600, 601, 640, 767, 768, 899, 900, 901, 1024, 1198, 1199, 1200, 1280, 1440 e 1920px. Inclui antes/no/depois dos breakpoints reais da grade e de regras visuais relacionadas.
- Nas 22 larguras: 12 cards na primeira página, zero overflow horizontal, zero diferença de alinhamento do fim dos preços e dos botões entre cards da mesma linha. Contador da fixture ficou em uma única leitura simulada de sessão; redimensionar/paginar/filtrar não adicionou consultas.
- Navegação real dos controles na fixture: páginas 1/2/3/4 mostram IDs 1–12/13–24/25–36/37. A segunda página manteve IDs 13–24 ao mudar de desktop para 640px. Nenhuma duplicação ou omissão.
- Categoria parcial: 19 itens em 12/7; troca reinicia em 1. Categoria vazia: nenhum card nem paginação. Dados reduzidos de 37 para 13 enquanto estava na página 4: cai para página 2, ID 13; ao voltar a 37, permanece na página 2, IDs 13–24.
- Testes unitários percorrem 0, 1, 9, 11, 12, 13, 24, 25, 37, 100 e 101 itens, páginas inválidas e lista filtrada, mantendo ordem e unicidade. Alteração de dados foi simulada localmente; nenhum produto remoto foi editado para testar.
- Conferência visual desktop, tablet e mobile: cards normais, promocionais, indisponíveis e títulos de comprimentos diferentes; paginação mobile em duas linhas, botões com área mínima de 44px, status com aria-live e estados disabled corretos.
- Preview Worker local em 4186 com catálogo real: 11 produtos em uma única página, categorias Acessórios=2, Máquinas=4 e Rebolos=5. Retorno ao catálogo mantém os 11. As nove larguras solicitadas foram medidas novamente com dados reais, sem overflow; colunas 1/1/1/2/2/3/4/4/4. Console sem erros/avisos observados.

Com os 11 produtos atuais, a linha final incompleta é esperada e permitida: trata-se da única/última página. Para 13 produtos, a primeira terá 12 e a última, um. Nenhum espaço artificial foi preenchido.

Reprodução: `pnpm exec vite --config tests/fixtures/vite.config.ts --port 5185`, abrir `/tests/fixtures/catalog-pagination.html`. Build/preview usam as APIs atuais, sem trocar a arquitetura. A arquitetura de APIs atual foi preservada, conforme a decisão posterior à auditoria separada.

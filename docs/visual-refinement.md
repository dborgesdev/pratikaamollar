# Refinamento visual da V2 — 28/10/2026

Branch existente: `codex/pratikaamollar-v1`. Estrutura, componentes, textos comerciais e integração preservados. Sem commit, push, merge ou deploy.

## Acabamento aplicado

- DM Serif Display regular para títulos editoriais e categorias: comparada renderizada com o mockup e escolhida pelo desenho mais pesado que Georgia. Sem simulação de negrito. Manrope variável nos textos funcionais, nomes de produtos, preços, botões e navegação; pesos 450–800 conforme função.
- Fontes locais em public/fonts, obtidas do repositório oficial google/fonts, com licenças OFL incluídas. font-display:swap; preload dos dois arquivos usados acima da dobra. Sem requisições ao Google Fonts em runtime.
- Tokens de acabamento em src/refinement.css, importado após o estilo estrutural: ouro #D99A2B, luz #F0B443, preto #0B0B0B e papel #FAF9F6. Ouro escuro #955A09 em textos pequenos sobre claro para contraste; preços em #B36A06 com tamanho/peso de texto grande.
- Hero com composição preservada: exposição maior da textura, luz âmbar localizada, sombra de contato mais definida e contraste aplicado somente à fotografia do equipamento (1.055). Sem saturação/brilho global nem alteração do asset.
- Rebolos com escala dominante, perspectiva moderada da fotografia, luz lateral, sombra de apoio e plano de bancada. Foto e rótulo originais preservados, sem imagens geradas, recoloração ou novos detalhes técnicos. Recorte de composição pode cortar extremidades do asset, mantendo o rótulo como foco.
- Botões com dourado mais luminoso e relevo discreto, preços mais fortes, bordas e sombras de cards calibradas e ícones com traços consistentes. Reduced-motion mantém pose estática do rebolo e remove deslocamentos de hover nos elementos principais.

## Verificação

- Typecheck do frontend e Worker: aprovado.
- ESLint: aprovado.
- Build Vite/Cloudflare Worker: aprovado.
- 15 testes existentes: aprovados; nenhum código de carrinho, API ou handoff foi alterado nesta revisão.
- Capturas da Home desktop (1440 px), hero mobile (375 px), seção Rebolos e vitrine comparadas com o mockup. Família calculada no browser: DM Serif Display nos títulos e Manrope no corpo. Sem overflow horizontal nas leituras em 320/375/768/1024/1440 px.
- Contrastes calculados: texto de botão/ouro 7,69:1; ouro pequeno/fundo claro 5,33:1; preço grande/branco 4,22:1; ouro luminoso/preto 10,60:1; texto funcional/fundo claro 7,27:1. Estes pares atendem AA em seus respectivos tamanhos; não equivalem a auditoria automatizada de acessibilidade completa.
- As pendências funcionais de handoff/WordPress e QA manual já documentadas na V2 permanecem; não foram apresentadas como resolvidas por este refinamento.

Prévia exclusivamente local em http://127.0.0.1:4176/, com Worker, para avaliação. O endereço público workers.dev não foi atualizado.


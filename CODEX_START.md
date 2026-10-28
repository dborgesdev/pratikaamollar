# Instrução inicial para Codex — Pratika Amollar

Leia integralmente `AGENTS.md` e `docs/project.md` e inspecione o repositório existente antes de alterar. Desenvolva uma V1 completa do frontend React conforme a especificação, com páginas, conteúdo factual, assets fornecidos, responsividade, motion, SEO e integração real com WooCommerce. Use branch única de implementação. Não utilize mocks como se fossem dados de produção.

Primeiro verifique, de modo **somente leitura**, os endpoints públicos de `https://loja.pratikaamollar.com.br/wp-json/wc/store/v1/`, os modelos de produtos/categorias, imagens, variações e suporte a Cart-Token. Não exponha segredos. Registre lacunas reais no `docs/project.md`.

Implemente fluxo de carrinho e planeje/implemente integração segura para checkout nativo. Se a ponte exigir alterações no WordPress, prepare plugin de forma isolada no repositório, documente, mas **não instale no backend sem autorização**. Não alegue que o checkout funciona sem teste completo de sessão WooCommerce. Não gerar pedido ou pagamento real.

Execute validações efetivas e deixe uma prévia local/deploy de preview configurável para avaliação visual. Não faça commit, push, merge, nem altere DNS ou produção. Relate arquivos, testes, passos de preview e bloqueios reais.

# Páginas legais — atualização local de 06/11/2026

Atualizadas as quatro políticas com os textos fornecidos pelo responsável nesta conversa. A Política de Privacidade mantém as oito seções e sua redação; as demais mantêm quatro seções. Padronizados razão social Pratika Amollar, CNPJ 30.867.419/0001-06, endereço comercial, e-mail e telefone. A identificação aparece nos quatro documentos, no React e no HTML inicial. O endereço é identificado como comercial, sem autorização de postagem de devolução.

Removidos avisos de minuta, quadros de pendências, referências às tecnologias internas e linguagem administrativa. As substituições pontuais usam finalização da compra, Minha conta e Rastrear encomenda. Mercado Pago mantido nos termos. A restituição usa o parágrafo exato solicitado no anexo inicial, que preserva os direitos legais e informa o meio de reembolso e prazos da instituição. As instruções de retorno remetem ao atendimento antes da postagem; não foram criados prazos ou condições operacionais.

Arquivos de implementação:

- shared/legal.ts: conteúdo, metadados e identificação compartilhados. O campo pending permanece como array vazio para compatibilidade, sem apresentação pública.
- src/components/LegalPage.tsx: apresentação sem avisos/listas, com identificação empresarial; navegação e contatos preservados.
- src/legal.css: removidos estilos dos quadros antigos e aplicada apresentação normal à identificação, com quebra de texto.
- worker/index.ts: HTML inicial atualizado, com todos os parágrafos e identificação, sem avisos/listas. Sem alterações nas APIs ou integrações.
- tests/legal.test.mjs: conteúdo, seções, CNPJ, restituição, ausência de referências internas, HTML e SEO.

Footer inspecionado, sem alteração: os quatro links continuam derivados das mesmas rotas e apontam ao domínio principal. Canonical, titles, descriptions e Open Graph conferidos. Não há schema específico nas páginas legais; elas não recebem schema Product. Mantidos noindex no cliente, meta e cabeçalho HTTP, PREVIEW, sitemap e wrangler.jsonc; remoção visual dos avisos não liberou indexação.

Validação executada:

- Typecheck aprovado; lint aprovado; 55 testes aprovados, sem falhas ou skips; build aprovado.
- Teste do HTML das quatro políticas em 24 combinações (quatro documentos × URL normal/barra/query × PREVIEW true/false), com texto completo, identidade, metadados e noindex.
- Preview Worker local por HTTP: quatro acessos diretos com status 200, todos os parágrafos, identidade, canonical e noindex conferidos. Evidência local gerada em .wrangler/legal-final-http.json (ignorada pelo Git).
- Navegador: quatro documentos, navegação entre políticas, identificação e links do footer. Inspeção visual desktop e mobile 375 × 812, com quebra de títulos/links; ausência de overflow horizontal conferida no mobile.

Preview de revisão: http://127.0.0.1:4176/entrega-e-frete (as quatro políticas estão interligadas). Relatório e atualização de docs/project.md são documentação interna. Nenhuma outra página teve conteúdo alterado. Nenhuma alteração remota, commit, push, merge ou deploy.

Após a revisão local, em 06/11/2026, o usuário autorizou commit, push, PR, merge e deploy. Publicação limitada às alterações acima, mantendo noindex, sitemap, configuração e integrações. Conferir as quatro rotas publicadas e os assets do build da main após o deploy.

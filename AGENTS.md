# AGENTS.md — Pratika Amollar

Leia `docs/project.md` integralmente antes de qualquer implementação; é a fonte de decisões e pendências do projeto. Não invente produtos, preços, benefícios, imagens, avaliações ou configurações operacionais. Use React + TypeScript + Tailwind + Vite + pnpm e Cloudflare Workers, salvo motivo documentado. Mantenha seções e páginas em componentes `.tsx` próprios e dados, lógica, API e UI separados, com tipos explícitos. Preserve marca e assets em `public/brand`, implemente motion intencional com reduced-motion, responsividade, SEO e acessibilidade.

A fonte da verdade é WooCommerce; use Store API, sem credenciais secretas no cliente. **Não suponha que Cart-Token transfira sessão para checkout nativo**: implemente e valide ponte segura. Não tocar checkout, pagamentos, conta, tracking ou plugins sem autorização. Não tocar site principal nem DNS antes de aprovação. Não criar pedidos ou cobranças reais em testes. Não fazer commit, push, merge ou deploy produtivo sem pedido explícito.

Valide typecheck, lint, build, preview Worker, navegação, API, carrinho, handoff, mobile e SEO; relate o que realmente foi testado e qualquer pendência.

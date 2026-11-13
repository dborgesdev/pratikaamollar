# Instalação do adaptador de avaliações

Preparado localmente; **não instalado na loja**. Não enviar arquivos de `wordpress/tests` ao servidor.

Após autorização, copiar somente `pratika-product-reviews.php` para `wp-content/mu-plugins/pratika-product-reviews.php` no WordPress da loja. WooCommerce deve estar ativo. Não editar WooCommerce, WoodMart, checkout ou a ponte de carrinho. Não instalar cópias simultâneas como plugin, MU-plugin e snippet.

O React faz GET de contexto e POST de envio em `https://loja.pratikaamollar.com.br/wp-admin/admin-ajax.php`, actions `pa_review_context` e `pa_review_submit`. Os dois handlers também atendem visitantes anônimos. Não há escrita pela Store API ou chave administrativa. O GET retorna permissões atuais e desafio temporário; não contém nome/e-mail do cliente. O POST usa a sessão WordPress recebida pelo navegador e o fluxo `wp_handle_comment_submission`.

Por padrão, somente a origem exata `https://pratikaamollar.com.br` é autorizada. Não é necessário novo segredo: o desafio usa os salts internos existentes do WordPress. Caso uma homologação em outro domínio seja autorizada, configurar uma lista explícita em `wp-config.php`, por exemplo:

```php
define('PA_REVIEW_ORIGINS', array(
    'https://pratikaamollar.com.br',
    'https://SEU-DOMINIO-DE-HOMOLOGACAO',
));
```

Não usar wildcard ou liberar origens recebidas da requisição. Não definir essa constante duas vezes. Contexto e submissão precisam ficar fora de caches de página/CDN e de regras que bloqueiem AJAX público. O código envia no-store, Vary: Origin e CORS com credenciais. Não alterar regras remotas sem aprovação.

Produção e loja usam HTTPS e o mesmo domínio registrável, permitindo cookies da loja nas chamadas credentialed ao seu próprio host. Em previews de outro domínio, o navegador pode bloquear cookies de terceiros: o adaptador tratará a sessão ausente como anônima e continuará aplicando as restrições. Não há transmissão ou recriação de sessão pelo Worker.

Antes de habilitar o frontend, conferir sem mudar as opções: WooCommerce → Configurações → Produtos → Avaliações; WordPress → Configurações → Discussão; produto → Dados do produto → Avançado. O adaptador lê as opções em cada envio e não as altera. Se moderação manual estiver ativa, mantém pendente, inclusive para usuário autenticado. Spam/trash e rejeições de hooks são preservados. Se futuramente houver exigência de comprador verificado, ela será aplicada usando o usuário atual, nunca apenas um e-mail declarado pelo visitante.

Limites: 10.000 bytes de comentário, 200 de nome, 100 de e-mail, corpo HTTP até 40.000 bytes (inclui URL encoding); desafio entre 3 segundos e 30 minutos; intervalo mínimo de 20s e máximo de 10 tentativas nativas por hora por IP. Há honeypot, lock por rede e replay idempotente temporário, além de duplicidade, flood e hooks nativos. Os transientes armazenam somente hashes, contadores e resultado técnico; avaliações ficam exclusivamente nas tabelas nativas. Não existe armazenamento paralelo de comentários.

O servidor deve fornecer REMOTE_ADDR correto, com ajuste de proxy feito apenas em infraestrutura confiável. O adaptador não confia em X-Forwarded-For arbitrário. IP compartilhado/NAT pode compartilhar limites. Essas proteções não substituem a defesa do servidor contra ataques distribuídos. Validar WAF/antispam existentes na homologação; não foram instalados serviços novos.

Homologar uma avaliação real autorizada ou usar ambiente separado, sem comentários fictícios em produção. Conferir: usuário anônimo/autenticado, CORS e cookies, comentário nativo tipo review, meta rating, status de moderação e atualização da listagem após aprovação. Avaliação pendente não deve alterar a seção de depoimentos nem a nota pública.

Rollback: remover somente o MU-plugin e voltar o frontend à versão anterior. As avaliações nativas já recebidas permanecem no WooCommerce. Desafios expirados e transientes são temporários. Relatório e comandos de laboratório: `docs/product-reviews.md`.

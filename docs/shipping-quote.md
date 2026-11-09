# Simulador de frete por produto

O React chama `POST /api/shipping-quote` na mesma origem. O Worker verifica a requisição, confirma o produto e a associação da variação na Store API e envia um novo POST anônimo ao AJAX nativo da Infixs. A ponte de checkout usa suas próprias rotas e credenciais. A resposta da cotação contém apenas JSON e não propaga cookies. O Worker limita consultas por IP e mantém um teto de oito consultas em andamento por instância, com prazo total de dez segundos para as chamadas ao WordPress.

## Configuração e validação

- Manter o Correios Automático ativo com a ação `infixs_correios_automatico_calculate_shipping` disponível para convidados. O handler da versão 1.14.0 exige `postcode` e `product_id`, lê `variation_id` e `quantity` e não verifica nonce.
- Manter `SHIPPING_QUOTE_QUANTITY` ausente até confirmar no WordPress que `general.consider_quantity` está habilitado e comparar a cotação de múltiplas unidades com o checkout. Após essa confirmação, configurar a variável do Worker como `true`. Se desabilitar a opção no WordPress, remover a variável antes. O HTML do plugin não informa a quantidade efetivamente calculada.
- A normalização aceita os templates padrão e customizado inspecionados, com valores em BRL no formato brasileiro. Mudanças de markup ou moeda devem passar pelos testes antes de atualizar o plugin. O desconto é lido do valor atual. O valor riscado é descartado.
- O plugin pode devolver o mesmo estado vazio para ausência de métodos e determinadas falhas de transportadora. O simulador informa que nenhuma opção foi retornada. Falhas de HTTP, timeout e respostas fora do formato retornam erro de consulta.
- Em homologação, comparar produto simples e variável com uma e múltiplas unidades, incluindo PAC, SEDEX, frete grátis, CEPs sem cobertura e indisponibilidade do serviço. Comparar a etapa de apresentação de tarifas do checkout com o mesmo item, quantidade, destino e sem cupons. Conferir o carrinho React e a sessão nativa antes e depois das cotações concorrentes e da transferência assinada. Encerrar antes de finalizar pedido.
- Conferir no WordPress se as consultas geram somente estado anônimo descartável e se as camadas de cache não armazenam o POST. Os testes da borda verificam o contrato de isolamento HTTP. A inspeção de gravações no servidor exige acesso ao ambiente de homologação.

## Rollback

Restaurar a versão anterior do Worker e dos assets React juntos. Remover a variável de quantidade se tiver sido adicionada. A integração usa o AJAX existente, sem instalação de PHP adicional e sem migração de dados.

## Evidência da consulta ao AJAX real

Em 09/11/2026, uma requisição direta de convidado para o produto simples 16006, uma unidade e CEP de teste em São Paulo retornou HTTP 200 com SEDEX a R$ 19,00 (até um dia útil) e PAC grátis (até cinco dias úteis). O POST não enviou cookie nem nonce, e a resposta não incluiu Set-Cookie. A Store API também retornou esse produto como comprável e em estoque. Esses valores documentam a consulta pontual. Na mesma data, o checkout nativo de uma sessão convidada descartável, com uma unidade do mesmo produto e o mesmo CEP, exibiu SEDEX a R$ 19,00 em um dia útil e PAC grátis em cinco dias úteis, com R$ 15,45 de preço original. A comparação confirma esse cenário. A matriz com variações, múltiplas unidades, cliente autenticado, gravações anônimas no WordPress e transferência assinada real segue pendente. Nenhum pedido foi finalizado.

A prévia local respondeu com `400` para CEP inválido e `422` para múltiplas unidades com a configuração de quantidade desabilitada. Após ajustar a política de redirecionamento para o modo manual do workerd, a prévia retornou `200` e as mesmas duas modalidades, valores e prazos do AJAX real, com `Cache-Control: no-store` e sem `Set-Cookie`. Os testes em workerd também exercitam o parser, a validação e a separação de credenciais com upstream controlado.

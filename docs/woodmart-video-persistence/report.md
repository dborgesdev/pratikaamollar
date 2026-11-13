# Persistência de vídeos WoodMart — diagnóstico de 13/11/2026

Branch: `codex/store-six-improvements`. Escopo desta etapa: diagnóstico e reprodução local. **Adaptador REST, galeria React e tema pai não foram modificados. Nenhum produto/metadado/configuração de produção foi salvo.** Sem commit, push, merge ou deploy.

## Conclusão e grau de confirmação

**Confirmado em teste com o JS e o método de salvamento originais do WoodMart 8.1.1:** imagem destacada e item da galeria com o mesmo attachment geram inputs com o mesmo nome. Ao editar somente o botão da imagem destacada, seu input recebe o vídeo; o input da cópia na galeria continua vazio. Ambos são enviados. PHP conserva o último valor de uma chave repetida e descarta o primeiro **antes** de `save_product_gallery`. O WoodMart grava a configuração vazia recebida. No reload, sua própria validação mostra + Vídeo; o adaptador corretamente retorna array vazio.

**Confirmado na loja por leitura pública:** produto **15675**, imagem inicial **16068**, sequência de imagens começa **16068, 16068**. A extensão `pratika_media.videos` existe e está vazia. CSS público declara WoodMart **8.1.1**; JS administrativo público é idêntico à cópia auditada, normalizando LF/CRLF.

**DOM administrativo real confirmado posteriormente:** existem dois inputs `xts-product-gallery-video[16068]`, ambos hidden, habilitados e pertencentes ao formulário `post`. Ordem 0: imagem destacada; ordem 1: galeria. Ambos estão com tipo mp4, upload_video_id vazio e nenhuma URL de upload/YouTube/Vimeo. O valor atual é igual ao inicial em ambos. Evidência limitada aos campos-alvo em `live-dom-snapshot.json`; sem headers, cookies, nonces ou credenciais nas consultas/evidências salvas. DevTools foi fechado ao concluir e a página permaneceu aberta sem salvar.

**Ainda não confirmado em produção:** valores dos dois campos durante um novo cadastro no POST administrativo real e valor bruto de `woodmart_wc_video_gallery` antes/depois desse salvamento. Portanto, a duplicação é uma causa suficiente, reproduzida e fortemente compatível com o caso real, **não uma declaração de que o POST/banco de produção já foram inspecionados**. Não se pode excluir outro callback remoto ou falha de anexo apenas pela API vazia.

## Cadeia de causa

1. `get_main_image_video_btn` delega ao mesmo gerador de botão da galeria. `get_gallery_product_video_btn` emite `xts-product-gallery-video[ATTACHMENT_ID]`.
2. A imagem 16068 nos dois lugares pode gerar duas ocorrências de `xts-product-gallery-video[16068]`. A ordem padrão dos metaboxes WooCommerce põe postimagediv antes de woocommerce-product-images; a ordem efetiva deve ser conferida no admin do usuário, que pode rearranjar metaboxes.
3. O JS nativo seleciona `.xts-product-gallery-video.xts-active` e escreve JSON somente em `$btn.siblings('input')`. Não sincroniza outros inputs do mesmo attachment.
4. O formulário envia, por exemplo, primeira ocorrência com `upload_video_id=100` e segunda com `upload_video_id=""` (**100 é dado sintético de laboratório**).
5. PHP transforma as duas ocorrências numa chave só, com o último valor. `$_POST` já perdeu o vídeo quando o hook WooCommerce roda.
6. O save nativo não exige `upload_video_id` para o tipo atual `mp4`: a condição de descarte usa rótulos `custom` e `upload`, além de video_type vazio. Assim, uma linha mp4 com ID vazio ainda pode ser gravada no mapa. Não corrigimos essa condição do pai.
7. `check_is_available_video` exige ID de anexo de vídeo válido no caso mp4. Por isso, depois da gravação vazia, o botão volta a adicionar vídeo.
8. O adaptador lê o mesmo mapa e exige anexo válido: a exclusão nessa situação é consequência dos dados recebidos, não perda causada pela galeria React.

Também reproduzido: quando já há um vídeo e apenas a primeira ocorrência é alterada, a segunda pode conservar o vídeo antigo. Nesse caso, a atualização parece reverter, em vez de apagar.

## Reprodução executada

Laboratório HTTP em **127.0.0.1:4182** usando:

- Botões renderizados por `get_gallery_product_video_btn` original.
- `inc/admin/assets/js/productGalleryVideo.js` original, sem patch.
- Formulário local e popup mínimo compatível com os seletores nativos. A biblioteca é o jQuery público da própria instalação, salvo somente na área privada ignorada pelo Git.
- POST real do navegador ao PHP local, sem credenciais, cookies de autenticação ou nonces.
- Hook `woocommerce_process_product_meta` e `save_product_gallery` originais executados em APIs WordPress isoladas.
- Persistência do laboratório em `.wrangler/woodmart-persistence-lab-state.json`, **não em banco WordPress/MySQL**. Isso isola a falha de serialização; não comprova a saúde do banco real.

| Cenário de teste | Resultado |
|---|---|
| 16068 principal com vídeo, 16068 na galeria vazio | 2 ocorrências no POST, 1 campo após parser; salva ID vazio; botão adicionar no reload; API sem vídeos |
| 16068 principal com vídeo, 15923 na galeria | 2 campos distintos; ID 100 persiste; botão editar no reload; adaptador retorna 1 vídeo |
| 16068 duplicado, vídeo somente na última ocorrência | Persiste |
| Duas ocorrências sincronizadas | Persiste |
| Troca do vídeo só na primeira, segunda conserva antigo | Persiste o antigo |
| Campo de vídeo ausente | Save nativo não grava; meta anterior permanece |
| Post type diferente de product | Save nativo não grava; meta anterior permanece |

Os dois primeiros cenários foram percorridos no navegador, incluindo configurar/aplicar no popup, atualizar formulário, POST, gravação e recarga. Evidências **sintéticas, sem segredo**: `duplicate-post.json` e `unique-post.json` nesta pasta. Só os campos de vídeo desse laboratório foram inspecionados; não houve exportação de HAR nem captura de POST administrativo de produção. A primeira tentativa do servidor ficou sem loopback no sandbox; reiniciado com acesso local permitido, os testes HTTP/navegador funcionaram.

Testes automatizados adicionados em `tests/woodmart-persistence.test.mjs`: sete cenários. O teste anterior montava diretamente um array associativo PHP e não representava nomes repetidos no corpo HTTP; por isso não detectava esse problema. O novo teste começa com corpo URL-encoded com ocorrências repetidas e usa o parser real do PHP.

## Condições do hook e hipóteses alternativas

No WoodMart: `single_product_main_gallery_video` precisa estar habilitado para registrar os hooks. `woocommerce_process_product_meta` registra o callback com prioridade 10 e dois argumentos. O método requer post_type product e campo de vídeo não vazio; limpa os valores, decodifica JSON e chama update_post_meta.

No código WooCommerce do backup, o caminho administrativo passa por save_post/save_meta_boxes e verifica: WP_Post/ID válidos; não ser autosave/revisão; validação do nonce WooCommerce; post_ID do formulário correspondente; permissão edit_post; guarda contra repetição. Só depois dispara o hook de produto. **Os valores de nonces não foram lidos nem registrados.** Essas condições foram auditadas no código; o laboratório não simula toda a autenticação WooCommerce.

| Observação real necessária | Diagnóstico que permite |
|---|---|
| Campo ausente no POST | Falha de envio/JS/formulário; save nativo não deve atualizar esse meta |
| Campo repetido com valores divergentes | Colisão no parser anterior à gravação, como reproduzido |
| Campo único válido, meta não muda | Investigar guardas do hook, callback removido, erro de update ou escrita posterior |
| Meta válido persiste, UI volta para adicionar | Conferir chave do attachment, tipo/ID do vídeo, existência do anexo, opção nativa e cache |
| UI reconhece vídeo, extensão continua vazia | Conferir publicação/senha/opção nativa, associação à galeria, anexo válido, URL HTTPS e provider no adaptador |

Tema filho **local** e snippet de navegação não têm callbacks de gravação desse meta ou desse hook. O adaptador é somente leitura. A busca literal nos PHP dos plugins do backup não encontrou `woodmart_wc_video_gallery`. Isso não exclui hooks genéricos, snippets instalados posteriormente ou mudanças remotas; a lista efetiva de callbacks/versão do PHP remoto permanece pendente.

Não há evidência pública de alteração recente do contrato administrativo: versão pública 8.1.1 e JS idêntico ao auditado. O PHP remoto não foi baixado nesta etapa; não se afirma equivalência integral de todos os arquivos atuais só pela versão/JS.

## Menor correção indicada

Após confirmar a colisão no ambiente real, **retirar somente a ocorrência redundante de 16068 da galeria do produto**, mantendo 16068 como imagem destacada e mantendo o arquivo na biblioteca. Em seguida, configurar novamente o vídeo pelo botão da imagem destacada e salvar normalmente pelo WooCommerce.

Não é necessário alterar adaptador, React, meta no banco ou tema pai para essa correção de cadastro. Ela foi validada no cenário local com IDs de galeria distintos. Se houver exigência real de repetir a mesma imagem, a alternativa é sincronizar todos os inputs homônimos no JS administrativo por extensão isolada; isso exigiria escopo/validação próprios, inclusive substituição/remoção e mudança de ordem dos metaboxes. Nenhum patch desse tipo foi aplicado/preparado como correção automática nesta etapa.

Riscos: remover a cópia errada pode retirar uma imagem diferente ou mudar a sequência de miniaturas; **não excluir o attachment da biblioteca nem trocar a destacada**. Uma repetição visual a menos é o efeito esperado. Produtos já salvos com configuração vazia precisam de novo cadastro nativo do vídeo; deduplicar imagens sozinho não recupera a URL perdida. Não fazer sincronização ampla de todos os produtos nem atualizar/desativar plugins para testar essa hipótese em produção.

## Validação no produto 15675 — procedimento pendente

1. Em staging, copiar somente o produto e os anexos necessários; preservar main 16068 e duplicata para reproduzir. Não copiar cookies/credenciais de clientes. Se o teste precisar ocorrer no produto publicado, obter autorização expressa antes de salvar qualquer alteração.
2. Ler apenas o meta-alvo antes de salvar, por acesso administrativo autorizado/CLI: `wp post meta get 15675 woodmart_wc_video_gallery --format=json`. Guardar apenas dados de mídia necessários, sem dumps completos de banco/logs.
3. No DOM administrativo, conferir quantos inputs têm exatamente `name="xts-product-gallery-video[16068]"` e sua ordem. Configurar um vídeo no botão da imagem destacada.
4. Na aba Network, verificar **somente as ocorrências desse campo de vídeo** no Payload do POST. Não exportar HAR, Copy as cURL ou requisição inteira: contêm cookies/nonces. Não registrar os demais campos/headers.
5. Após salvar, ler novamente o mesmo meta, recarregar a edição e verificar o botão. O caso reproduzido terá última ocorrência vazia, meta mp4 sem upload_video_id e interface de adicionar.
6. Confirmado o caso, remover só a duplicata da galeria, preservar a destacada, configurar novamente o vídeo e salvar. Conferir campo único, meta com ID válido e botão de editar após recarga.
7. Conferir Store API `/wp-json/wc/store/v1/products/15675`: `extensions.pratika_media.videos` deve conter attachment_id 16068 e a URL esperada; depois validar a galeria React. Se houver cache público já existente, invalidar apenas o produto pelo procedimento atual, sem mudar regras/sessões.
8. Se POST/meta forem diferentes do cenário diagnosticado, não aplicar a correção por suposição: seguir a matriz acima e conferir callbacks efetivos antes/depois da prioridade 10.

A inspeção do admin real foi posteriormente autorizada e concluída somente para leitura dos campos de vídeo já carregados. Foram confirmados dois inputs homônimos habilitados no formulário post, com destacada antes da galeria; ambos carregados como mp4, sem ID/URL, com valor atual igual ao valor inicial. Não foi acionado Atualizar nem configurado qualquer vídeo. O POST e o meta bruto de produção antes/depois continuam pendentes; a leitura do DOM não substitui esses dados.

## Arquivos e checks

Fontes privadas auditadas em `.wrangler/woodmart-video-audit`:
- `class-main.php`: hooks (61–66), campo (126), save (176–194), check_is_available_video (508).
- `admin-productGalleryVideo.js`: botão ativo (9), atribuição ao sibling (31).
- `class-wc-admin-meta-boxes.php`: ordem padrão dos metaboxes (166), save/guardas (214 em diante).
- `class-wc-meta-box-product-images.php`: loop e hook por imagem da galeria.

Criados nesta etapa: `wordpress/tests/woodmart-persistence.php`, `wordpress/tests/woodmart-persistence-router.php`, `tests/woodmart-persistence.test.mjs` e relatório/evidências nesta pasta. Documentos de projeto/mídias atualizados somente para registrar o diagnóstico e o estado atual da extensão.

`pnpm lint`, `pnpm test` (68/68 sem skips) e PHP lint aprovados. `pnpm typecheck` e `pnpm build` também aprovados como regressão. Nenhuma mudança funcional de loja aplicada nesta etapa.

Para repetir o teste determinístico: `node --test tests/woodmart-persistence.test.mjs`. Para a reprodução interativa: `.wrangler/qa-php/runtime/php.exe -n -S 127.0.0.1:4182 wordpress/tests/woodmart-persistence-router.php`. Requer fontes privadas auditadas em `.wrangler`, não distribuídas pelo repositório. Servidor deve permanecer vinculado a 127.0.0.1 e ser encerrado após o teste; não publicar esses arquivos como ferramenta administrativa.

## Atualização real autorizada e validada

Após o diagnóstico, o responsável autorizou explicitamente atualizar o produto 15675 e identificou o arquivo mais recente da biblioteca como “maquina de afiar.mp4”. Pela edição nativa foi selecionado **Maquina-de-afiar-alicate.mp4**, anexo de vídeo **16201**, enviado em 13/11/2026 (aproximadamente 6 MB/49 s).

Executado exclusivamente pelo formulário WooCommerce/WoodMart:

1. Retirada somente a ocorrência redundante de **16068 da galeria**; imagem destacada 16068 e arquivo da biblioteca preservados. Demais nove imagens mantidas na mesma ordem.
2. Pelo + Vídeo da imagem destacada, selecionado o MP4 indicado e aplicado o cadastro nativo, com autoplay **0**.
3. Conferido antes do envio: featured_id 16068; galeria sem 16068; apenas um input de vídeo para 16068; upload_video_id 16201 e URL do arquivo correto.
4. Acionado **Atualizar** uma vez. A administração exibiu produto atualizado e botão de editar vídeo.
5. Recarregada explicitamente a edição: o botão continuou reconhecendo o vídeo. Não foi necessária mudança no pai, adaptador ou React.
6. GET público independente da Store API confirmou **um vídeo** em `extensions.pratika_media.videos`, attachment_id de imagem **16068**, tipo mp4, URL `https://loja.pratikaamollar.com.br/wp-content/uploads/2025/04/Maquina-de-afiar-alicate.mp4`. Lista de imagens sem a duplicação. Evidência de dados públicos: `live-update-result.json`.

Resultado: a menor correção de cadastro resolveu o sintoma no produto real. A colisão já reproduzida com código original e agora confirmada no DOM real sustenta o diagnóstico; não se afirma captura do POST problemático histórico nem leitura direta do metadado bruto de produção. A persistência foi validada por recarga administrativa e nova leitura da API, cujo adaptador lê o meta nativo.

Não houve edição direta de banco, exclusão de attachment, alteração de preço/textos/estoque, tema/plugins, commit/push/merge/deploy ou criação de pedidos. O ato de salvar segue os hooks normais da instalação; não foram instrumentados todos os efeitos internos de terceiros. Reprodução completa/codecs do MP4 no frontend publicado não foram homologados nesta atualização; a implementação React segue local até publicação separadamente autorizada.

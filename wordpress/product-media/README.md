# Mídias nativas WoodMart → Store API → React

Status em 13/11/2026: integração local preparada e testada. **Não instalada no WordPress remoto.** Nenhum segundo cadastro de vídeos, ACF PRO, migração ou alteração do tema pai é necessário.

## Auditoria do recurso + Vídeo

Fonte: backup local da própria loja de 04/11/2026, tema WoodMart **8.1.1**. Somente o ZIP interno de temas foi extraído; banco/plugins/dados de clientes não foram consultados. Fontes privadas ficam em `.wrangler/woodmart-video-audit`, ignoradas pelo Git. Hashes e proveniência em `audit.json`. O JavaScript frontend foi comparado ao arquivo público atual e é idêntico, normalizando LF/CRLF. A equivalência integral do PHP remoto não foi confirmada por download nesta etapa.

Arquivos auditados no tema:

- `inc/integrations/woocommerce/modules/product-gallery-video/class-main.php`: botões, save_product_gallery, validação, renderização e filtros.
- `.../template/popup.php`: fontes MP4/YouTube/Vimeo, biblioteca e configurações.
- `inc/admin/assets/js/productGalleryVideo.js`: serialização dos inputs e associação com cada imagem.
- `js/scripts/wc/productGalleryVideo.js`: reprodução, lazy load e pausa no tema.
- `style.css`: versão 8.1.1.

Contrato confirmado no código original:

- O botão próximo à imagem destacada é acrescentado por `admin_post_thumbnail_html`. Cada imagem da galeria também recebe botão via `woocommerce_admin_after_product_gallery_item`.
- Cada botão escreve `xts-product-gallery-video[ATTACHMENT_ID]` como JSON no formulário. `woocommerce_process_product_meta` chama `save_product_gallery`, que salva um mapa no post meta **`woodmart_wc_video_gallery`**.
- Campos: `video_type` (`mp4`, `youtube`, `vimeo`), `upload_video_id`, `upload_video_url`, `youtube_url`, `vimeo_url`; há também autoplay, tamanho, controles e opções de apresentação.
- **Um vídeo por imagem**. Múltiplos vídeos são cadastrados em imagens diferentes. A ordem acompanha imagem principal e galeria WooCommerce, não a ordem das chaves do mapa. Alterar a ordem das imagens muda a ordem dos vídeos associados. Não existe ordenação independente de vídeos nesse recurso auditado.
- MP4 usa arquivo novo/existente da biblioteca. URLs externas são campos específicos de YouTube/Vimeo; não foi encontrado suporte genérico a URL externa de MP4 nesse popup. Não confundir com o recurso antigo `_woodmart_product_video`, que gera outro botão e não é o cadastro + Vídeo auditado.
- O tema lê esse mapa e injeta vídeo em `woocommerce_single_product_image_thumbnail_html` e `woodmart_get_single_product_image_data`; miniaturas recebem classes pelo filtro `woodmart_single_product_thumbnail_classes`. Esses filtros fornecem apresentação HTML, não dados REST. Somente o módulo citado referencia esse meta no conjunto PHP do tema.
- A opção nativa `single_product_main_gallery_video` habilita o recurso. O adaptador respeita a opção quando a função WoodMart está disponível.

O produto de referência é **15675**, slug `maquina-de-afiar-alicate-de-cuticula-completa`. Após o usuário cadastrar vídeo, Store API pública retornou `extensions: {}`; REST `wp/v2/product` retornou `acf: []`, sem esse meta. A data de modificação refletiu a edição. Nenhum link de vídeo apareceu nas respostas públicas inspecionadas. Não inferimos a URL real do vídeo a partir de arquivos anexos ou descrições.

## Integração preparada

Arquivo: **`woodmart-store-api-media.php`**, independente do pai. Usa o mecanismo oficial `woocommerce_store_api_register_endpoint_data` no ProductSchema; não modifica cadastro, posts, opções, carrinho ou checkout. Expõe somente:

```json
{
  "extensions": {
    "pratika_media": {
      "videos": [{
        "attachment_id": 16068,
        "type": "mp4",
        "src": "https://exemplo.invalid/video.mp4",
        "poster": "https://exemplo.invalid/imagem.jpg",
        "title": "Vídeo de Nome do produto"
      }]
    }
  }
}
```

Acima é exemplo de **contrato do adaptador**, não resposta operacional da loja. O endpoint não publica o mapa bruto nem opções privadas. Ignora imagens removidas/órfãs, anexos inválidos, produtos não publicados/protegidos e fontes inseguras. Resolve a URL do arquivo da biblioteca pelo ID original no servidor; não exige recadastro. YouTube/Vimeo usam os campos nativos com hosts restritos; o cliente também valida IDs e gera URLs fixas de embed sem autoplay.

A extensão chega na **mesma resposta de produtos** já usada por `/api/catalog` e pelo HTML inicial do Worker. O normalizador preserva dados tipados em `product.videos`. Foram removidas a consulta REST individual e a resolução de mídias no navegador. Quantidade de requisições HTTP do catálogo permanece igual; não há requisições de metadados por vídeo ou produto. APIs WordPress/WooCommerce usam suas rotinas normais de leitura de posts/metadados; não foi acrescentado cache persistente nem benchmark de consultas SQL.

React mantém cada imagem nativa uma vez e acrescenta o vídeo imediatamente depois da imagem à qual está associado. A imagem principal continua primeiro. O poster usa a imagem associada, sem duplicar cadastro. Cards seguem apenas com imagens. MP4 tem controles nativos, playsInline e preload none; YouTube/Vimeo só montam iframe depois de clicar em Reproduzir. Troca pausa MP4 e desmonta iframes, interrompendo o player. Configurações nativas de autoplay não são aplicadas: o React sempre exige interação. Controles de player preservam seus gestos; a faixa “Deslize aqui...” permite navegar no mobile sem conflitar com seek/iframes.

## Instalação e aceite remoto pendentes

Não foi solicitado instalar/ativar código remoto nesta revisão local. Quando autorizado:

1. Instalar somente `woodmart-store-api-media.php` em `wp-content/mu-plugins/` (ou incluir como snippet PHP aprovado existente). Não editar WoodMart nem criar outro cadastro.
2. Manter o vídeo existente do produto 15675. Consultar `/wp-json/wc/store/v1/products/15675` e a coleção de produtos: deve aparecer `extensions.pratika_media.videos` com o ID da imagem e URL real. Conferir também produto sem vídeos → array vazio.
3. Se a loja já retiver respostas públicas em cache, invalidar somente respostas públicas de produtos pertinentes pelo procedimento existente. Não mudar regras/configurações de cache nem limpar sessões de compra.
4. Após publicação React separadamente autorizada, abrir o produto no frontend: imagem principal, miniatura Vídeo, reprodução por interação, troca/pausa, mobile. Nenhum cadastro extra.
5. Conferir múltiplos vídeos em imagens diferentes, reordenação, remoção e substituição usando o botão nativo; salvar produto e verificar API/React. Não criar pedidos/cobranças.

Rollback: remover/desativar somente o adaptador. Metadados originais e galeria WoodMart ficam intactos; sem extensão, React mostra imagens. Não há writes, migrações ou exclusão de dados nesse arquivo.

## Validação e limites

Typecheck/lint/build aprovados. PHP lint aprovado. Teste local chama **save_product_gallery original do tema** com formulário simulado, lê resultado pelo adaptador, verifica registro/schema da Store API e normaliza até o catálogo React. Cenários: MP4 da biblioteca, YouTube, Vimeo, múltiplos/ordem, imagem órfã, anexo inválido, host indevido, recurso desabilitado e produto sem vídeos. APIs WordPress e objeto WooCommerce são isolados nesse teste; não equivale a WordPress completo/instalação remota.

Fixture de navegador é explicitamente sintética, fora do bundle da loja. Verificações de controles, carregamento sob demanda, navegação e desmontagem do player não comprovam o vídeo real cadastrado no servidor. Homologação desse vídeo aguarda a instalação do adaptador; o contrato nativo já foi identificado, não há campo a inventar.

Referência oficial: [Extensões de produtos na Store API](https://developer.woocommerce.com/docs/apis/store-api/extending-store-api/available-endpoints-to-extend).

## Diagnóstico posterior de persistência (13/11/2026)

A extensão já foi instalada pelo responsável e aparece na API pública; `videos: []` não significa ausência da extensão. Foi reproduzida perda no salvamento nativo quando a mesma imagem destacada também está na galeria: inputs homônimos divergem, PHP retém o último e o vídeo pode ser substituído por configuração vazia. Adaptador e React não foram alterados durante o diagnóstico. Causa confirmada em teste isolado, POST/meta de produção ainda não inspecionados. Procedimento e menor correção de cadastro: [relatório de persistência](../../docs/woodmart-video-persistence/report.md).

Validação posterior autorizada no produto real 15675: removida apenas a imagem duplicada da galeria e cadastrado pelo botão nativo o MP4 16201 informado pelo responsável. Após atualizar e recarregar, o cadastro permaneceu e a API pública retornou um vídeo associado à imagem 16068. Adaptador/React não foram modificados. Evidência e limites no relatório de persistência.

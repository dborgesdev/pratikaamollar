// Isolated QA data; never imported into the storefront bundle.
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import raw from '../../docs/performance/raw-products-before.json';
import type { Product } from '../../src/lib/types';
import ProductGallery from '../../src/components/ProductGallery';
import ProductPrice from '../../src/components/ProductPrice';
import CardGallery from '../../src/components/CardGallery';
import { productVideos } from '../../src/lib/product-media';
import ProductReviews from '../../src/components/ProductReviews';
import ProductDescription, { ShortDescription } from '../../src/components/ProductDescription';
import '../../src/styles.css';
import '../../src/refinement.css';
import '../../src/shopping.css';
import '../../src/product-presentation.css';
const p = raw[0] as Product;
const videos = [{type:'mp4' as const, attachmentId:p.images[0].id,src:'https://media.w3.org/2010/05/sintel/trailer.mp4',position:1,title:'Vídeo de teste — não representa o produto',poster:'/editorial/maquinas-de-afiacao.png'}];
const reviews = async () => ({reviews:[{id:1,product_id:p.id,reviewer:'Cenário sintético de QA',review:'<p>Comentário de teste <strong>com formatação</strong>.</p><img src=x onerror="alert(1)">',rating:3.5,verified:true}],more:false});
function QA(){const [single,setSingle]=useState(false);const [mode,setMode]=useState('mp4'); const pictures=single?p.images.slice(0,1):p.images;return <BrowserRouter><main className="wrap section"><h1>QA isolado — dados sintéticos</h1><p>Vídeo e avaliação abaixo são dados de teste. Não fazem parte da loja.</p><button className="button" onClick={()=>setSingle(!single)}>{single?'Várias imagens':'Uma imagem'}</button><nav aria-label="Vídeos de QA">{['none','mp4','youtube','vimeo'].map(type=><button style={{padding:14}} key={type} onClick={()=>setMode(type)}>{type}</button>)}</nav><div className="product-detail"><ProductGallery key={String(single)+mode} videos={mode==='none'?[]:mode==='mp4'?videos:productVideos({videos:[{attachment_id:p.images[0].id,type:mode,src:mode==='youtube'?'https://youtu.be/LXb3EKWsInQ':'https://vimeo.com/259400046',title:'Vídeo externo de QA'}]},pictures)} pictures={pictures} name="Galeria de teste"/><div><CardGallery key={String(single)} product={{...p,images:pictures}}/><ProductPrice product={{...p,on_sale:true,prices:{...p.prices,price:'14000',regular_price:'18000',sale_price:'14000',price_range:null}}}/><ShortDescription html="<p>Descrição curta de QA <strong>sem truncamento</strong>.</p>"/><ProductDescription product={{...p,short_description:'Descrição curta de QA',description:'<p>Descrição completa de QA.</p>'}}/></div></div><ProductReviews product={{...p,review_count:1,average_rating:'3.5'}} loadReviews={reviews}/></main></BrowserRouter>}
ReactDOM.createRoot(document.getElementById('root')!).render(<QA/>);

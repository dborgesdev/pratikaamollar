// Isolated synthetic QA only; not imported by storefront builds or routes.
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import raw from '../../docs/performance/raw-products-before.json';
import type { Product } from '../../src/lib/types';
import { ReviewProvider } from '../../src/components/ReviewContext';
import ProductReviews from '../../src/components/ProductReviews';
import ProductRating from '../../src/components/ProductRating';

import ProductPrice from '../../src/components/ProductPrice';
import { reviewPolicy, submitReview, ReviewSubmissionError, type ReviewPolicy } from '../../src/lib/review-submission';
import '../../src/styles.css';
import '../../src/refinement.css';
import '../../src/product-presentation.css';
const product = {...raw[0],review_count:0,average_rating:'0'} as Product;
function Scenario({ mode }: { mode: string }) {
  const currentProduct = {...product,id:mode==='native-local'?Number(new URLSearchParams(location.search).get('local_product')):product.id};
  const [sent,setSent]=useState(0);
  const [loadPolicy] = useState(() => async (): Promise<ReviewPolicy> => {
    if(mode==='native-local') return reviewPolicy(currentProduct.id,new AbortController().signal,async(url,options)=>fetch('http://127.0.0.1:4197/context?'+new URL(String(url)).searchParams.toString(),options));
    if(mode==='context-error') throw new Error('QA');
    return {enabled:mode!=='disabled', can_submit:!['disabled','verified'].includes(mode),authenticated:mode==='authenticated',email_required:true,rating_enabled:true,rating_required:true,reason:mode==='verified'?'verified_owner_required':'',challenge:'synthetic-qa-token'};
  });
  return <ReviewProvider productId={currentProduct.id} loadPolicy={loadPolicy}><ProductRating product={mode==='fractional'?{...currentProduct,average_rating:'4.3',review_count:7}:currentProduct}/><ProductPrice detail product={{...currentProduct,on_sale:true,prices:{...product.prices,price:'14000',regular_price:'18000',sale_price:'14000',price_range:null}}}/><p role="status">Envios de QA: {sent}</p><ProductReviews product={mode==='fractional'?{...currentProduct,average_rating:'4.3',review_count:7}:currentProduct} loadReviews={async()=>({reviews:[{id:999,product_id:currentProduct.id,reviewer:'Cliente sintético de QA',review:'Comentário aprovado sintético de QA.',rating:5,verified:false}],more:false})} sendReview={async(id,draft,policy,signal)=>{setSent(value=>value+1);if(mode==='native-local')return submitReview(id,draft,policy,signal,async(_url,options)=>fetch('http://127.0.0.1:4197/submit',options));await new Promise(resolve=>setTimeout(resolve,500));if(mode==='network-error')throw new Error('offline');if(mode==='field-error')throw new ReviewSubmissionError('E-mail recusado no cenário de QA.','email');return mode==='approved'?'approved':'pending';}}/></ReviewProvider>;
}
function QA() { const [mode,setMode]=useState('pending');return <main className="wrap section"><h1>QA isolado de avaliações</h1><p>Envios simulados; native-local usa somente WordPress loopback de QA.</p><label>Cenário<select value={mode} onChange={event=>setMode(event.target.value)}>{['pending','approved','network-error','field-error','authenticated','disabled','verified','context-error','fractional','native-local'].map(item=><option key={item}>{item}</option>)}</select></label><Scenario key={mode} mode={mode}/></main>; }
ReactDOM.createRoot(document.getElementById('root')!).render(<QA/>);

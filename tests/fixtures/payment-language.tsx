// Isolated QA: never submits a form, order or request to the real shop.
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import raw from '../../docs/performance/raw-products-before.json';
import type { Product } from '../../src/lib/types';
import '../../src/styles.css';
import '../../src/refinement.css';
import '../../src/shopping.css';
import '../../src/product-presentation.css';
const products=raw as Product[];
const bootstrap=document.createElement('script');bootstrap.id='pa-catalog';bootstrap.type='application/json';bootstrap.textContent=JSON.stringify({products,categories:products[0].categories});document.body.append(bootstrap);
let mode='cart';
const first=products[0];
const cart={items:[{...first,key:'qa',quantity:1,quantity_limits:{minimum:1,maximum:10,editable:true},totals:{line_total:first.prices.price,currency_code:'BRL',currency_minor_unit:2}}],items_count:1,coupons:[],errors:[],totals:{total_price:first.prices.price,currency_code:'BRL',currency_minor_unit:2}};
window.fetch=async input=>{
  const url=String(input);
  if(url==='/api/handoff'){
    if(mode==='sending')return new Promise(()=>{});
    if(mode==='success')return Response.json({action:'https://loja.pratikaamollar.com.br/wp-admin/admin-post.php',fields:{action:'pa_handoff',payload:'qa',signature:'a'.repeat(43)}});
    return Response.json({message:'Não foi possível prosseguir para o pagamento. Seu carrinho está preservado. Tente novamente.'},{status:502});
  }
  if(url.includes('pa_review_context'))return Response.json({enabled:false,can_submit:false,authenticated:false,email_required:true,rating_enabled:true,rating_required:true,reason:'disabled'});
  return Response.json(cart);
};
HTMLFormElement.prototype.submit=function(){const notice=document.createElement('p');notice.setAttribute('role','status');notice.textContent='Simulação concluída: navegação para o pagamento interceptada, sem envio.';document.querySelector('main')?.append(notice);};
const {StoreProvider}=await import('../../src/lib/store');
const {default:Cart}=await import('../../src/pages/Cart');
const {default:ProductPage}=await import('../../src/pages/Product');
const {default:Catalog}=await import('../../src/pages/Catalog');
function QA(){const [scenario,setScenario]=useState('cart');return <main><div className="wrap" style={{paddingBlock:20}}><h2>QA local de linguagem</h2><p>Dados e envio simulados; sem gravação na loja.</p><label>Cenário<select value={scenario} onChange={event=>{mode=event.target.value;setScenario(mode);}}>{['cart','error','sending','success'].map(value=><option key={value}>{value}</option>)}</select></label><nav><Link to="/carrinho">Carrinho</Link> · <Link to={'/produto/'+first.slug}>Produto</Link> · <Link to="/produtos">Catálogo</Link></nav></div><StoreProvider key={scenario}><Routes><Route path="/carrinho" element={<Cart key={scenario}/>}/><Route path="/produto/:slug" element={<ProductPage/>}/><Route path="/produtos" element={<Catalog/>}/></Routes></StoreProvider></main>;}
ReactDOM.createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/carrinho']}><QA/></MemoryRouter>);

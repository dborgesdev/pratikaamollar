// Synthetic data in an isolated test entry only. No requests to product/cart APIs.
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import raw from '../../docs/performance/raw-products-before.json';
import type { Product } from '../../src/lib/types';
import '../../src/styles.css';
import '../../src/refinement.css';
import '../../src/shopping.css';
import '../../src/product-presentation.css';
import '../../src/catalog.css';
let requests = 0;
window.fetch = async () => { requests++; const counter=document.querySelector("[data-qa-requests]"); if(counter) counter.textContent=String(requests); return Response.json({items:[],items_count:0,errors:[],coupons:[],totals:{total_price:'0',currency_code:'BRL',currency_minor_unit:2}}); };
const base = raw[0] as Product;
const bootstrap = document.createElement('script'); bootstrap.id='pa-catalog'; bootstrap.type='application/json';bootstrap.textContent=JSON.stringify({products:[],categories:[]});document.body.append(bootstrap);
const {StoreProvider} = await import('../../src/lib/store');
const {default:CatalogProducts} = await import('../../src/components/CatalogProducts');
function QA() {
  const [count,setCount]=useState(37),[category,setCategory]=useState('all');
  const products:Product[]=Array.from({length:count},(_,index)=>({...base,id:100001+index,slug:`qa-${index+1}`,name:`QA ${index+1} — ${index%3===0?'Título extenso de produto para conferir a leitura integral e o alinhamento dos preços e botões':'Produto de teste'}`,review_count:0,average_rating:'0',on_sale:index%3===0,is_purchasable:index%5!==0,is_in_stock:index%5!==0,prices:{...base.prices,price:index%5===0?'0':'14000',regular_price:'18000',sale_price:'14000',price_range:null}}));
  const list=category==='even'?products.filter((_,index)=>index%2===0):products;
  return <main className="wrap section"><h1>QA isolado — paginação</h1><p>Dados sintéticos; nenhum envio ao WordPress.</p><label>Quantidade<input aria-label="Quantidade de produtos QA" type="number" value={count} min={0} max={101} onChange={event=>setCount(Math.max(0,Math.min(101,Number(event.target.value))))}/></label><label>Categoria QA<select value={category} onChange={event=>setCategory(event.target.value)}><option value="all">Todos</option><option value="even">Categoria parcial</option><option value="empty">Categoria vazia</option></select></label><p>Consultas de dados: <output data-qa-requests>{requests}</output></p><CatalogProducts key={category} products={category==='empty'?[]:list}/></main>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<BrowserRouter><StoreProvider><QA/></StoreProvider></BrowserRouter>);

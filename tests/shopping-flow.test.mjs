import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {CartSync}=await loadTs(new URL('../src/lib/cart-sync.ts',import.meta.url));
const {swipeDirection,galleryIndex}=await loadTs(new URL('../src/lib/gallery.ts',import.meta.url));
const prices={price:'1000',regular_price:'1000',currency_code:'BRL',currency_minor_unit:2};
const product={id:1,name:'Test fixture',type:'simple',images:[],prices,is_in_stock:true,is_purchasable:true};
function cart(items=[]){return{items:items.map(({id=1,quantity=1,price='1000'})=>({id,key:'key-'+id,name:'Test fixture',quantity,images:[],prices:{...prices,price},totals:{line_total:String(Number(price)*quantity),currency_code:'BRL',currency_minor_unit:2},quantity_limits:{minimum:1,maximum:9,editable:true}})),items_count:items.reduce((n,i)=>n+(i.quantity||1),0),coupons:[],errors:[],totals:{total_price:String(items.reduce((n,i)=>n+Number(i.price||1000)*(i.quantity||1),0)),currency_code:'BRL',currency_minor_unit:2}};}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('confirma adição só após resposta válida e dez cliques concorrentes não duplicam',async()=>{
 let respond;let writes=0,finished=false;
 const sync=new CartSync(async()=>{writes++;return new Promise(resolve=>{respond=resolve})},1000);sync.hydrate(cart());
 const pending=sync.addConfirmed(product,1);const copies=Array.from({length:9},()=>sync.addConfirmed(product,1));assert.ok(copies.every(copy=>copy===pending));pending.then(()=>{finished=true});
 assert.deepEqual(sync.getSnapshot().pendingAdditionIds,[1]);await tick();assert.equal(finished,false);assert.equal(writes,1);respond(cart([{id:1,quantity:1}]));await pending;assert.equal(finished,true);assert.equal(sync.getSnapshot().cart.items_count,1);assert.deepEqual(sync.getSnapshot().pendingAdditionIds,[]);
});
test('resposta HTTP bem sucedida sem o item não confirma adição',async()=>{const sync=new CartSync(async()=>cart(),0);sync.hydrate(cart());await assert.rejects(sync.addConfirmed(product,1),/confirmar/)});
test('resposta malformada é rejeitada e reconciliada sem confirmação falsa',async()=>{const paths=[];const sync=new CartSync(async path=>{paths.push(path);return path==='cart'?cart():{items:[]}},0);sync.hydrate(cart());await assert.rejects(sync.addConfirmed(product,1),/inválido/);assert.deepEqual(paths,['cart/add-item','cart']);assert.equal(sync.getSnapshot().cart.items_count,0)});
test('estoque recusado libera botão e uma tentativa explícita posterior envia uma unidade',async()=>{
 let reject=true,writes=0;const sync=new CartSync(async(path,body)=>{if(path==='cart')return cart();writes++;if(reject)throw Error('Estoque insuficiente');return cart([{id:body.id,quantity:body.quantity}])},0);sync.hydrate(cart());await assert.rejects(sync.addConfirmed(product,1),/Estoque/);assert.deepEqual(sync.getSnapshot().pendingAdditionIds,[]);reject=false;await sync.addConfirmed(product,1);assert.equal(writes,2);assert.equal(sync.getSnapshot().cart.items_count,1);
});
test('POST ambíguo só vira sucesso se GET autoritativo confirma quantidade; não repete escrita',async()=>{const paths=[];const sync=new CartSync(async path=>{paths.push(path);if(path==='cart')return cart([{id:1,quantity:1}]);throw Error('Timeout')},0);sync.hydrate(cart());await sync.addConfirmed(product,1);assert.deepEqual(paths,['cart/add-item','cart']);assert.equal(sync.getSnapshot().failed,false)});
test('variação envia o ID correto e usa preço recebido do servidor, sem projetar preço do pai',async()=>{
 let respond,body;const sync=new CartSync(async(path,payload)=>{body=payload;return new Promise(resolve=>{respond=resolve})},0);sync.hydrate(cart());const promise=sync.addConfirmed({...product,id:501,type:'variable'},2);await tick();assert.equal(sync.getSnapshot().cart.items_count,0);assert.equal(body.id,501);assert.equal(body.quantity,2);respond(cart([{id:501,quantity:2,price:'23500'}]));await promise;assert.equal(sync.getSnapshot().cart.items[0].prices.price,'23500');
});
test('falha de outro produto não apaga confirmação nem libera checkout indevidamente',async()=>{
 let state=cart();const sync=new CartSync(async(path,body)=>{if(path==='cart')return state;if(body.id===2)throw Error('Sem estoque');state=cart([{id:1,quantity:1}]);return state},0);sync.hydrate(cart());const result=await Promise.allSettled([sync.addConfirmed(product,1),sync.addConfirmed({...product,id:2},1)]);assert.equal(result[0].status,'fulfilled');assert.equal(result[1].status,'rejected');assert.equal(sync.getSnapshot().failed,true);assert.equal(sync.getSnapshot().cart.items_count,1);
});
test('limite real de quantidade impede adição sem mudança de estoque',async()=>{let writes=0;const sync=new CartSync(async()=>{writes++;return cart()},0);sync.hydrate(cart([{id:1,quantity:9}]));await assert.rejects(sync.addConfirmed(product,1),/disponível/);assert.equal(writes,0)});
test('galeria navega circularmente, sem índice inválido para imagem única',()=>{assert.equal(galleryIndex(0,-1,4),3);assert.equal(galleryIndex(3,1,4),0);assert.equal(galleryIndex(0,1,1),0);assert.equal(galleryIndex(0,1,0),0)});
test('swipe exige intenção horizontal, preserva gestos verticais e movimentos curtos',()=>{assert.equal(swipeDirection(-85,10),1);assert.equal(swipeDirection(85,-10),-1);assert.equal(swipeDirection(15,100),0);assert.equal(swipeDirection(35,3),0);assert.equal(swipeDirection(60,60),0)});

test('metadados monetários incompletos não produzem confirmação de sucesso',async()=>{const invalid=cart([{id:1}]);delete invalid.items[0].prices.currency_code;const sync=new CartSync(async path=>path==='cart'?cart():invalid,0);sync.hydrate(cart());await assert.rejects(sync.addConfirmed(product,1),/inválido/);assert.equal(sync.getSnapshot().failed,true)});

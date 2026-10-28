// Explicit manual anonymous-cart benchmark. Never creates orders or payments.
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/lib/cart-sync.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {CartSync}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const origin='http://127.0.0.1:5174';let cookie='';const requests=[];
async function transport(path,body){const start=performance.now();const response=await fetch(origin+'/api/store/'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});const setCookie=response.headers.get('set-cookie');if(setCookie)cookie=setCookie.split(';')[0];const data=await response.json();requests.push({path,ms:Math.round(performance.now()-start),upstream:response.headers.get('server-timing'),status:response.status});if(!response.ok)throw Error(data.message);return data;}
const products=await transport('products?include=16006');const sync=new CartSync(transport,280);sync.hydrate(await transport('cart'));const interactions=[];
let start=performance.now();for(let i=0;i<3;i++)sync.add(products[0],1);interactions.push({action:'3 rapid adds',feedbackMs:performance.now()-start,optimisticQuantity:sync.getSnapshot().cart.items_count});await sync.flush();
start=performance.now();for(const quantity of [4,3,5,4,3,2])sync.setQuantity(products[0].id,quantity);interactions.push({action:'6 rapid quantity edits',feedbackMs:performance.now()-start,optimisticQuantity:sync.getSnapshot().cart.items_count});await sync.flush();
start=performance.now();sync.setQuantity(products[0].id,0);interactions.push({action:'remove',feedbackMs:performance.now()-start,optimisticQuantity:sync.getSnapshot().cart.items_count});await sync.flush();
const output={context:'V2 local Worker to live WooCommerce, anonymous cart, no checkout',interactions,requests,finalCount:sync.getSnapshot().cart.items_count,postRequests:requests.filter(r=>r.path.startsWith('cart/')).length};writeFileSync(new URL('../docs/audit/cart-v2-interaction-timing.json',import.meta.url),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));

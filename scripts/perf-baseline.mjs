import { writeFileSync, statSync, readdirSync } from 'node:fs';
const base=process.env.PERF_BASE || 'https://pratikaamollar.smartlocal.workers.dev';
async function measure(path){const start=performance.now();const response=await fetch(base+path,{headers:{'Accept-Encoding':'gzip, br'}});const ttfb=performance.now()-start;const text=await response.text();return {path,status:response.status,ttfbMs:Math.round(ttfb),totalMs:Math.round(performance.now()-start),decodedBytes:Buffer.byteLength(text),encoding:response.headers.get('content-encoding'),cache:response.headers.get('cache-control'),serverTiming:response.headers.get('server-timing'),data:JSON.parse(text)}}
const runs=[];
for(let n=0;n<3;n++){
 const start=performance.now();const cartPromise=measure('/api/store/cart');
 const first=await Promise.all([measure('/api/store/products?per_page=100'),measure('/api/store/products/categories?per_page=100')]);
 const groups=await Promise.all(first[1].data.map(c=>measure('/api/store/products?per_page=100&category='+c.id)));
 const processing=performance.now();const products=first[0].data.map(p=>({...p,categories:first[1].data.filter((c,i)=>groups[i].data.some(x=>x.id===p.id))}));const processingMs=performance.now()-processing;
 const availableMs=performance.now()-start;const cart=await cartPromise;
 runs.push({run:n+1,products:products.length,productsAvailableMs:Math.round(availableMs),initialDataMs:Math.round(performance.now()-start),processingMs,catalogRequests:first.length+groups.length,cartRequests:1,requests:[...first,...groups,cart].map(item=>Object.fromEntries(Object.entries(item).filter(([key])=>key!=='data')))});
}
const assets=readdirSync('dist/client/assets').filter(x=>/\.(js|css)$/.test(x)).map(x=>({file:x,bytes:statSync('dist/client/assets/'+x).size}));
const html=[];for(const path of ['/','/produto/maquina-de-afiar-alicate-de-cuticula-completa']){const start=performance.now();const response=await fetch(base+path);const ttfb=performance.now()-start;await response.text();html.push({path,ttfbMs:Math.round(ttfb),totalMs:Math.round(performance.now()-start)})}
const result={date:new Date().toISOString(),context:'Legacy 5-call initialization algorithm; '+base+'; real WooCommerce; decoded bytes, not wire bytes',runs,assets,html};writeFileSync(process.env.PERF_OUTPUT || 'docs/performance/baseline.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));

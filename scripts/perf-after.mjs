import {writeFileSync,readdirSync,statSync,readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
const base='http://127.0.0.1:4180';
const runs=[];
for(let i=0;i<3;i++){
 const start=performance.now();const r=await fetch(base+'/api/catalog');const ttfb=performance.now()-start;const text=await r.text();const received=performance.now();const data=JSON.parse(text);const parseMs=performance.now()-received;
 runs.push({run:i+1,status:r.status,ttfbMs:Math.round(ttfb),productsAvailableMs:Math.round(performance.now()-start),decodedBytes:Buffer.byteLength(text),gzipBytes:gzipSync(text).length,processingMs:parseMs,products:data.products.length,categories:data.categories.map(c=>({id:c.id,count:c.count})),upstreamRequests:data.meta.upstreamRequests,categoryFallbacks:data.meta.categoryFallbacks,serverTiming:r.headers.get('server-timing'),cache:r.headers.get('cache-control')});
 if(i===0)writeFileSync('docs/performance/catalog-after.json',text);
}
const html=[];for(const path of ['/','/produto/maquina-de-afiar-alicate-de-cuticula-completa']){const start=performance.now();const r=await fetch(base+path);const ttfb=performance.now()-start;const text=await r.text();const boot=text.match(/<script id="pa-catalog" type="application\/json">([\s\S]*?)<\/script>/);html.push({path,status:r.status,ttfbMs:Math.round(ttfb),totalMs:Math.round(performance.now()-start),decodedBytes:Buffer.byteLength(text),bootstrapProducts:boot?JSON.parse(boot[1]).products.length:null,canonical:text.match(/rel="canonical" href="([^"]+)"/)?.[1],noindex:text.includes('noindex'),hasSchema:text.includes('data-product-schema')})}
const assets=readdirSync('dist/client/assets').filter(f=>/\.(js|css)$/.test(f)).map(file=>({file,bytes:statSync('dist/client/assets/'+file).size,gzipBytes:gzipSync(readFileSync('dist/client/assets/'+file)).length}));
const result={date:new Date().toISOString(),context:'Local Cloudflare Worker preview -> real remote WooCommerce; NO cache; not edge-to-edge comparison with published baseline',runs,html,assets};writeFileSync('docs/performance/after.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));

// Local-only adapter for exercising the production build against a disposable WooCommerce.
// Never deploy this server or use it for real traffic. It rewrites the fixed upstream solely in this lab.
import http from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {loadTs} from '../../tests/helpers/load-ts.mjs';
if(process.env.PA_HANDOFF_TEST_ALLOW_MUTATIONS!=='1')throw Error('Local lab opt-in required');
const native='http://127.0.0.1:4193',origin='http://localhost:4183',root=resolve('dist/client');
const originalFetch=globalThis.fetch;
globalThis.fetch=(url,options)=>originalFetch(typeof url==='string'?url.replace('https://loja.pratikaamollar.com.br',native):url,options);
const {default:worker}=await loadTs(new URL('../../worker/index.ts',import.meta.url));
const env={HANDOFF_SECRET:'local-handoff-disposable-secret-32-bytes-only',PREVIEW:'true',PUBLIC_ORIGIN:origin,ASSETS:{fetch:async()=>new Response('unused')}};
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{try{const path=new URL(req.url,origin).pathname;if(path.startsWith('/api/')){const chunks=[];for await(const c of req)chunks.push(c);const r=await worker.fetch(new Request(origin+req.url,{method:req.method,headers:req.headers,body:req.method==='POST'?Buffer.concat(chunks):undefined}),env);res.writeHead(r.status,Object.fromEntries(r.headers));const text=await r.text();res.end(text.replaceAll('https://loja.pratikaamollar.com.br',native));return;}let file=resolve(root,'.'+path);if(!file.startsWith(root))throw Error('path');if(!existsSync(file)||!statSync(file).isFile())file=root+'/index.html';res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');const content=readFileSync(file);res.end(['.js','.html'].includes(extname(file))?content.toString().replaceAll('https://loja.pratikaamollar.com.br',native):content);}catch(error){res.statusCode=500;res.end(error.message);}}).listen(4183,'127.0.0.1',()=>console.log('Disposable React/Worker adapter: '+origin));

// Against the explicitly opted-in loopback lab ONLY, never the storefront.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
if(process.env.PA_REVIEW_TEST_ALLOW_MUTATIONS!=='1') throw Error('Local opt-in required');
const {id} = JSON.parse(readFileSync('.wrangler/review-http-state.json','utf8'));
const base='http://127.0.0.1:4197',origin='http://127.0.0.1:5183';
const context=await fetch(`${base}/context?product_id=${id}`,{headers:{Origin:origin}});
assert.equal(context.status,200);assert.equal(context.headers.get('access-control-allow-origin'),origin);assert.equal(context.headers.get('access-control-allow-credentials'),'true');assert.match(context.headers.get('cache-control'),/no-store/);
const policy=await context.json();assert.equal(policy.can_submit,true);assert.equal(policy.authenticated,false);
for(const bad of ['https://evil.test','http://127.0.0.1:5183.evil.test','null']) {const response=await fetch(`${base}/context?product_id=${id}`,{headers:{Origin:bad}});assert.equal(response.status,403);assert.equal(response.headers.get('access-control-allow-origin'),null);}
assert.equal((await fetch(`${base}/submit`,{headers:{Origin:origin}})).status,405);
await new Promise(resolve=>setTimeout(resolve,3200));
const body=new URLSearchParams({product_id:String(id),challenge:policy.challenge,rating:'5',comment:'Avaliação sintética de QA HTTP exclusivamente local.',author:'QA local HTTP',email:'qa-http@example.test',website:''});
const send=()=>fetch(`${base}/submit`,{method:'POST',headers:{Origin:origin},body});
let response=await send();assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'pending'});
response=await send();assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'pending'});
body.set('comment','Reutilização indevida do mesmo desafio.');response=await send();assert.equal(response.status,409);assert.equal((await response.json()).code,'used_challenge');
console.log(JSON.stringify({cors:true,origin_rejection:true,method_rejection:true,pending:true,replay:true,changed_replay_rejected:true}));

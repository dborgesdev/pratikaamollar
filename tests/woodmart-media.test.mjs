import {loadTs} from './helpers/load-ts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const php='.wrangler/qa-php/runtime/php.exe';
const source='.wrangler/woodmart-video-audit/class-main.php';
test('save nativo WoodMart → extensão Store API: biblioteca, YouTube, Vimeo, ordem, órfãos e ausência', {skip:!existsSync(php)||!existsSync(source)?'Requer PHP e fonte privada WoodMart 8.1.1 auditada':false},async()=>{
 const result=JSON.parse(execFileSync(php,['-n','wordpress/tests/product-media.php'],{encoding:'utf8'}));
 assert.equal(result.native_save_verified,true);assert.equal(result.data.videos.length,3);
 const {normalizeCatalog}=await loadTs(new URL('../shared/catalog.ts',import.meta.url));
 const pictures=[11,12,13].map(id=>({id,src:'https://example.com/'+id+'.jpg',thumbnail:'',srcset:'',sizes:'',alt:''}));
 const raw={id:15675,name:'QA',slug:'qa',type:'simple',prices:{price:'1',regular_price:'1',currency_code:'BRL',currency_minor_unit:2},images:pictures,categories:[],extensions:{pratika_media:result.data}};
 const payload=normalizeCatalog([raw],[],2);
 assert.equal(payload.products[0].videos.length,3);assert.deepEqual(payload.products[0].videos.map(v=>v.position),[1,2,3]);
 assert.equal(payload.meta.upstreamRequests,2);
});

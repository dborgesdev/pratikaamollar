import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { CATALOG_PAGE_SIZE, catalogPage } = await loadTs(new URL('../src/lib/catalog-pagination.ts',import.meta.url));
test('páginas completas preenchem as grades 1/2/3/4 sem repetir ou omitir produtos',()=>{
  for(const count of [0,1,9,11,12,13,24,25,37,100,101]){
    const products=Array.from({length:count},(_,id)=>({id}));const collected=[];
    for(let page=1;page<=catalogPage(products,1).pages;page++){
      const data=catalogPage(products,page);collected.push(...data.items);
      if(page<data.pages)for(const columns of [1,2,3,4])assert.equal(data.items.length%columns,0);
    }
    assert.deepEqual(collected,products);assert.equal(new Set(collected.map(p=>p.id)).size,count);
  }
  assert.equal(CATALOG_PAGE_SIZE,12);
});
test('mudança de dados limita a página; vazio, página inválida e última incompleta',()=>{
  const products=Array.from({length:37},(_,id)=>id);
  assert.deepEqual(catalogPage(products,2).items,products.slice(12,24));
  assert.deepEqual(catalogPage(products,4).items,[36]);
  assert.equal(catalogPage(products.slice(0,13),4).page,2);
  for(const page of [0,-1,NaN,Infinity])assert.equal(catalogPage(products,page).page,1);
  assert.deepEqual(catalogPage([],9),{items:[],page:1,pages:1});
  assert.deepEqual(catalogPage(products.filter(id=>id%2===0),1).items,products.filter(id=>id%2===0).slice(0,12));
});

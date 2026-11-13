import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { promotion, rating } = await loadTs(new URL('../src/lib/product-presentation.ts', import.meta.url));
const { heroImage } = await loadTs(new URL('../src/lib/hero-image.ts', import.meta.url));
const { productVideos } = await loadTs(new URL('../src/lib/product-media.ts', import.meta.url));
const { fetchReviews } = await loadTs(new URL('../src/lib/reviews.ts', import.meta.url));
const base={type:'simple',on_sale:true,prices:{price:'14000',regular_price:'18000',sale_price:'14000',price_range:null}};
test('promoção só com estado ativo e preços comparáveis; sem desconto em variável agregado',()=>{
 assert.equal(promotion(base),true);
 for(const p of [{...base,on_sale:false},{...base,type:'variable'},{...base,prices:{...base.prices,price:'18000'}},{...base,prices:{...base.prices,sale_price:'0'}},{...base,prices:{...base.prices,price_range:{min_amount:'100',max_amount:'200'}}}]) assert.equal(promotion(p),false);
});
test('estrelas só com média e contagem reais válidas',()=>{assert.deepEqual(rating({average_rating:'4.3',review_count:2}),{average:4.3,count:2});for(const p of [{average_rating:'5',review_count:0},{average_rating:'6',review_count:1},{review_count:2}])assert.equal(rating(p),null)});
test('hero usa featured media embutida e falha fechada',()=>{
 assert.deepEqual(heroImage([{status:'publish',_embedded:{'wp:featuredmedia':[{media_type:'image',source_url:'https://example.com/hero.png',alt_text:'Hero'}]}}]),{src:'https://example.com/hero.png',alt:'Hero'});
 for(const data of [null,[],[{status:'draft'}],[{status:'publish',_embedded:{'wp:featuredmedia':[{media_type:'image',source_url:'javascript:alert(1)'}]}}]])assert.equal(heroImage(data),null);
});
test('vídeos WoodMart vêm da extensão com associação e ordem das imagens',()=>{
 const pictures=[{id:11,src:'https://example.com/a.jpg'},{id:12,src:'https://example.com/b.jpg'}];
 assert.deepEqual(productVideos({},pictures),[]);
 const rows=productVideos({videos:[{attachment_id:12,type:'mp4',src:'https://example.com/video.mp4'},{attachment_id:99,type:'mp4',src:'https://example.com/orphan.mp4'},{attachment_id:11,type:'youtube',src:'https://youtu.be/LXb3EKWsInQ'},{attachment_id:12,type:'mp4',src:'https://example.com/duplicate.mp4'},{attachment_id:11,type:'mp4',src:'javascript:alert(1)'}]},pictures);
 assert.equal(rows.length,2);assert.equal(rows[0].position,2);assert.equal(rows[0].poster,pictures[1].src);assert.equal(rows[1].position,1);
});
test('embed permite apenas IDs/provedores conhecidos sem autoplay',async()=>{
 const {embedUrl}=await loadTs(new URL('../src/lib/product-media.ts',import.meta.url));
 assert.match(embedUrl('youtube','https://www.youtube.com/watch?v=LXb3EKWsInQ&autoplay=1'),/autoplay=0/);
 assert.match(embedUrl('youtube','https://youtube.com/shorts/LXb3EKWsInQ'),/youtube-nocookie/);
 assert.match(embedUrl('vimeo','https://vimeo.com/123456789/abcdef'),/h=abcdef/);
 for(const src of ['https://youtube.com.evil.test/watch?v=LXb3EKWsInQ','https://evil.test/LXb3EKWsInQ','javascript:alert(1)','https://youtu.be/invalid'])assert.equal(embedUrl('youtube',src),undefined);
});
test('comentários são paginados somente do produto solicitado, sem cookies',async()=>{
 const previous=globalThis.fetch;let request;
 globalThis.fetch=async(url,options)=>{request={url,options};return Response.json([{id:1,product_id:10,reviewer:'Cliente',review:'<p>Comentário de teste</p>',rating:4,verified:true},{id:2,product_id:20}],{headers:{'X-WP-TotalPages':'2'}})};
 try{const result=await fetchReviews(10,1,new AbortController().signal);assert.equal(result.reviews.length,1);assert.equal(result.more,true);assert.match(request.url,/product_id=10/);assert.equal(request.options.credentials,'omit')}finally{globalThis.fetch=previous}
});

test('Hero HTTP indisponível, JSON inválido ou falha de rede retorna ausência silenciosa',async()=>{
 const {fetchHeroImage}=await loadTs(new URL('../src/lib/hero-image.ts',import.meta.url));
 for(const fetcher of [async()=>new Response('',{status:503}),async()=>new Response('invalid json'),async()=>{throw new Error('offline')},async()=>Response.json([])])assert.equal(await fetchHeroImage(undefined,fetcher),null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../wordpress/pratika-amollar-child/assets/js/navigation.js',import.meta.url),'utf8');
function harness(mobile=true){
 const events={};const attrs={};const classes=new Set();let focused=false;
 const on=(target,type,fn)=>{events[target+':'+type]=fn};
 const button={hidden:true,setAttribute:(k,v)=>attrs[k]=v,getAttribute:k=>attrs[k],focus:()=>{focused=true},addEventListener:(t,f)=>on('button',t,f)};
 const link={closest:()=>link};
 const nav={hidden:false,contains:el=>el===link,addEventListener:(t,f)=>on('nav',t,f)};
 const header={querySelector:s=>s==='.pa-menu-toggle'?button:nav,contains:el=>[button,nav,link].includes(el),classList:{add:c=>classes.add(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)},addEventListener:(t,f)=>on('header',t,f)};
 const media={matches:mobile,addEventListener:(t,f)=>on('media',t,f)};
 const document={activeElement:null,querySelector:()=>header,addEventListener:(t,f)=>on('document',t,f)};
 vm.runInNewContext(source,{document,window:{matchMedia:()=>media}});
 return{events,attrs,classes,button,nav,media,document,link,focused:()=>focused};
}
test('menu mobile: progressive enhancement, abre por botão, fecha com Escape e devolve foco',()=>{
 const h=harness();assert.equal(h.button.hidden,false);assert.equal(h.nav.hidden,true);assert.equal(h.attrs['aria-expanded'],'false');
 h.events['button:click']();assert.equal(h.nav.hidden,false);assert.equal(h.attrs['aria-label'],'Fechar menu');
 let prevented=false;h.events['header:keydown']({key:'Escape',preventDefault:()=>{prevented=true}});
 assert.equal(h.nav.hidden,true);assert.equal(h.attrs['aria-expanded'],'false');assert.equal(h.focused(),true);assert.equal(prevented,true);
});
test('menu fecha ao navegar, clicar fora ou sair por teclado; desktop permanece visível',()=>{
 const h=harness();
 for(const close of [()=>h.events['nav:click']({target:h.link}),()=>h.events['document:click']({target:{}}),()=>h.events['header:focusout']({relatedTarget:{}})]){h.events['button:click']();close();assert.equal(h.nav.hidden,true)}
 h.media.matches=false;h.events['media:change']();assert.equal(h.nav.hidden,false);
 h.document.activeElement=h.link;h.media.matches=true;h.events['media:change']();assert.equal(h.nav.hidden,true);assert.equal(h.focused(),true);
});

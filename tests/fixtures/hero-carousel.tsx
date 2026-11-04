// Isolated local QA only: existing assets stand in for complete WP banner art.
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import HomeHeroCarousel from '../../src/components/HomeHeroCarousel';
import { fetchBanners, type Banner } from '../../src/lib/banners';
import '../../src/styles.css';
import '../../src/refinement.css';
import '../../src/shopping.css';
const fixture: Banner[] = [1,2,3].map(id => ({id,desktop:{url:'/editorial/maquinas-de-afiacao.png',alt:`Fixture ${id}`},mobile:{url:'/editorial/maquinas-de-afiacao.png',alt:`Fixture ${id}`}}));
const loaders = [async()=>[],async()=>fixture.slice(0,1),async()=>fixture,async()=>{throw new Error('Falha simulada')},fetchBanners];
function QA(){const [mode,setMode]=useState(0);return <BrowserRouter><nav aria-label="Cenários de teste">{['Sem banners','Um banner','Múltiplos banners','Falha API','API real'].map((label,index)=><button style={{padding:16}} key={label} onClick={()=>setMode(index)}>{label}</button>)}</nav><HomeHeroCarousel key={mode} loadBanners={loaders[mode]}/><p>Fim do Hero — conferir estabilidade da posição.</p></BrowserRouter>}
ReactDOM.createRoot(document.getElementById('root')!).render(<QA/>);

import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import HomeHero from '../../src/components/HomeHero';
import { fetchHeroImage } from '../../src/lib/hero-image';
import '../../src/styles.css';
import '../../src/refinement.css';
import '../../src/shopping.css';
const loaders=[fetchHeroImage,async()=>null,async()=>{throw new Error('Falha de QA')},async()=>({src:'https://loja.pratikaamollar.com.br/arquivo-inexistente-qa.png',alt:'QA'})];
function QA(){const [mode,setMode]=useState(0);return <BrowserRouter><nav aria-label="Cenários de QA">{['Imagem real','Sem imagem','API indisponível','Arquivo inválido'].map((label,i)=><button style={{padding:16}} key={label} onClick={()=>setMode(i)}>{label}</button>)}</nav><HomeHero key={mode} loadImage={loaders[mode]}/></BrowserRouter>}
ReactDOM.createRoot(document.getElementById('root')!).render(<QA/>);

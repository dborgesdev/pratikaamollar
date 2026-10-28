import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import './styles.css';
import './refinement.css';
function Status(){const {loading,error,reload}=useStore();return loading?<div className="loading" role="status">Conectando ao catálogo Pratika Amollar…<div className="loading-bar"/></div>:error?<div className="wrap error" role="alert">{error} <button onClick={reload}>Tentar novamente</button></div>:null}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><StoreProvider><Status/><Routes><Route element={<Layout/>}><Route index element={<Home/>}/><Route path="produtos" element={<Catalog/>}/><Route path="categoria/:slug" element={<Catalog/>}/><Route path="produto/:slug" element={<Product key={location.pathname}/>}/><Route path="carrinho" element={<Cart/>}/><Route path="contato" element={<Contact/>}/><Route path="*" element={<div className="wrap section empty"><h1>Página não encontrada</h1><Link to="/">Voltar ao início</Link></div>}/></Route></Routes></StoreProvider></BrowserRouter></React.StrictMode>);


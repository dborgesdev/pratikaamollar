import React, { lazy, Suspense, useState, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { StoreProvider, needsCatalog, useCatalog, useCart } from './lib/store';
import Layout from './components/Layout';
import Home from './pages/Home';
import LoadingOverlay from './components/LoadingOverlay';
import './styles.css';
import './refinement.css';
import './loading.css';
const Catalog = lazy(() => import('./pages/Catalog'));
const Product = lazy(() => import('./pages/Product'));
const Cart = lazy(() => import('./pages/Cart'));
const Contact = lazy(() => import('./pages/Contact'));
class PageBoundary extends React.Component<{children: React.ReactNode; onFailure: () => void}, {failed: boolean}> {
  state = { failed: false };
  componentDidCatch() { this.props.onFailure(); }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="wrap section" role="alert"><h1>Não foi possível abrir esta página.</h1><button className="button" onClick={() => window.location.reload()}>Recarregar página</button></div> : this.props.children; }
}
function ReadyPage({ children, ready }: { children: React.ReactNode; ready: () => void }) { useLayoutEffect(ready, [ready]); return children; }
function Application() {
  const { pathname } = useLocation();
  const catalog = useCatalog(), cart = useCart();
  const [initialPath] = useState(pathname);
  const [pageReady, setPageReady] = useState(false);
  const markReady = useCallback(() => setPageReady(true), []);
  // Only essential data gates first entry; session initialization never holds the home.
  const initialCatalog = needsCatalog(initialPath);
  const error = initialCatalog ? catalog.error : initialPath === '/carrinho' ? cart.cartError : '';
  const pending = initialCatalog ? catalog.loading : initialPath === '/carrinho' ? !cart.cart && !cart.cartError : false;
  return <><LoadingOverlay pending={pending || !pageReady} error={error} retry={() => { if(initialCatalog) catalog.reload(); else void cart.loadCart().catch(() => {}); }}/><div id="application-shell">{catalog.error && <div className="session-alert" role="alert">{catalog.error}<button onClick={catalog.reload}>Tentar novamente</button></div>}{cart.cartError && pathname !== '/carrinho' && <div className="session-alert" role="status">Não foi possível conectar seu carrinho.<button onClick={() => { void cart.loadCart().catch(() => {}); }}>Reconectar</button></div>}<PageBoundary onFailure={markReady}><Suspense fallback={<div className="route-loading" role="status">Abrindo página…</div>}><ReadyPage ready={markReady}><Routes><Route element={<Layout/>}><Route index element={<Home/>}/><Route path="produtos" element={<Catalog key={pathname}/>}/><Route path="categoria/:slug" element={<Catalog key={pathname}/>}/><Route path="produto/:slug" element={<Product key={pathname}/>}/><Route path="carrinho" element={<Cart/>}/><Route path="contato" element={<Contact/>}/><Route path="*" element={<div className="wrap section empty"><h1>Página não encontrada</h1><Link to="/">Voltar ao início</Link></div>}/></Route></Routes></ReadyPage></Suspense></PageBoundary></div></>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><StoreProvider><Application/></StoreProvider></BrowserRouter></React.StrictMode>);

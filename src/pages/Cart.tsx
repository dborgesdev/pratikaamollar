import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../lib/store';
import { money, plain } from '../lib/api';
import Seo from '../components/Seo';
import { checkoutTransfer } from '../lib/checkout';
export default function Cart() {
  const { cart, busy, failed, notice, setQuantity, beginCheckout, refreshCart, pendingAdditionIds } = useCart();
  const [error, setError] = useState(''), [sending, setSending] = useState(false);
  const checkoutInFlight = useRef(false);
  async function checkout() {
    if (checkoutInFlight.current || !cart) return;
    checkoutInFlight.current = true;
    setSending(true); setError(''); let unlock: (() => void) | undefined;
    try {
      const ready = await beginCheckout(); unlock = ready.unlock;
      const data = await checkoutTransfer(ready.cart);
      const form = document.createElement('form'); form.method = 'POST'; form.action = data.action;
      for (const [name, value] of Object.entries(data.fields)) { const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = String(value); form.append(input); }
      document.body.append(form); form.submit();
      // Release only on failure; a confirmed form navigates to the WordPress receiver.
      window.addEventListener('pageshow', () => { unlock?.(); checkoutInFlight.current = false; setSending(false); }, { once: true });
    } catch (e) { setError(e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError') ? 'A loja demorou para responder. Seu carrinho está preservado. Tente novamente.' : (e as Error).message); setSending(false); checkoutInFlight.current = false; unlock?.(); }
  }
  return <div className="wrap section cart-page"><Seo title="Seu carrinho"/><div className="breadcrumb"><Link to="/">Início</Link> / Carrinho</div><h1>Carrinho</h1>
    {failed && !cart?.items.length && <div className="error" role="alert">{notice}<button className="button outline" onClick={() => { void refreshCart().catch(e => setError(e.message)); }}>Conferir carrinho novamente</button></div>}
    {!cart ? <div className="cart-skeleton" role="status">Conectando seu carrinho…</div> : !cart.items.length ? <div className="empty"><ShoppingCart size={40}/><h2>Seu carrinho está esperando por você.</h2><p>Encontre máquinas e acessórios para a sua bancada.</p><Link className="button" to="/produtos">Explorar produtos <ArrowRight size={18}/></Link></div> : <div className="cart-grid"><div>
      {(busy || failed) && <div className={'sync-status ' + (failed ? 'error' : '')} role={failed ? 'alert' : 'status'}>{busy ? <><span className="sync-dot"/> Atualizando carrinho…</> : notice}</div>}
      {cart.items.map(item => <article className="cart-item" key={item.id}><img src={item.images[0]?.thumbnail || item.images[0]?.src} alt=""/><div><h2>{plain(item.name)}</h2><p>{money(item.prices)}</p><div className="quantity"><button aria-label={'Diminuir quantidade de ' + plain(item.name)} disabled={sending || item.quantity <= item.quantity_limits.minimum || !item.quantity_limits.editable} onClick={() => setQuantity(item.id, item.quantity - 1)}><Minus size={16}/></button><input aria-label={'Quantidade de ' + plain(item.name)} type="number" min={item.quantity_limits.minimum} max={item.quantity_limits.maximum} disabled={sending || !item.quantity_limits.editable} value={item.quantity} onChange={e => setQuantity(item.id, Number(e.target.value))}/><button aria-label={'Aumentar quantidade de ' + plain(item.name)} disabled={sending || item.quantity >= item.quantity_limits.maximum || !item.quantity_limits.editable} onClick={() => setQuantity(item.id, item.quantity + 1)}><Plus size={16}/></button></div></div><div className="cart-line-end"><strong>{money({ ...item.prices, price: item.totals.line_total })}</strong><button disabled={sending} aria-label={'Remover ' + plain(item.name)} onClick={() => setQuantity(item.id, 0)}><Trash2 size={19}/></button></div></article>)}
      <>{failed && <button className="button outline" onClick={() => { void refreshCart().catch(e => setError(e.message)); }}>Conferir carrinho novamente</button>}</><Link to="/produtos" className="text-link">Continuar explorando <ArrowRight size={18}/></Link>
    </div><aside className="summary" aria-label="Resumo do carrinho"><div className="total"><span>{busy ? 'Total estimado' : 'Total atual'}</span><strong>{money({ price: cart.totals.total_price, regular_price: '', ...cart.totals })}</strong></div><p>Frete e condições de pagamento serão calculados no checkout da loja.</p><button className="button" disabled={sending || failed || pendingAdditionIds.length > 0} onClick={() => void checkout()}>{sending ? 'Preparando seu checkout…' : 'Continuar para checkout'} <ArrowRight size={19}/></button><p className="checkout-note">{busy ? 'Suas alterações serão sincronizadas antes de continuar.' : 'Você continuará no checkout da Pratika Amollar.'}</p>{error && <div className="error"><p role="alert">{error}</p><button className="button outline" disabled={sending} onClick={() => { void refreshCart().then(() => setError('')).catch(e => setError(e.message)); }}>Conferir sessão do carrinho</button></div>}{cart.errors?.map((e, i) => <p role="alert" key={i}>{e.message}</p>)}</aside></div>}
  </div>;
}

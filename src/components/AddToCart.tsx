import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, Plus } from 'lucide-react';
import { useCart } from '../lib/store';
import { plain } from '../lib/api';
import type { Product } from '../lib/types';
export default function AddToCart({ product, quantity = 1, disabled = false }: { product: Product; quantity?: number; disabled?: boolean }) {
  const { addToCart, cart, checkoutLocked, pendingAdditionIds } = useCart();
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const button = useRef<HTMLButtonElement>(null), confirmation = useRef<HTMLAnchorElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!restoreFocus.current || document.activeElement !== document.body) return;
    if (status === 'success') confirmation.current?.focus({ preventScroll: true });
    if (status === 'error') button.current?.focus({ preventScroll: true });
  }, [status]);
  const pending = status === 'pending' || pendingAdditionIds.includes(product.id);
  async function add() {
    if (inFlight.current || pending || disabled) return;
    restoreFocus.current = document.activeElement === button.current;
    inFlight.current = true; setStatus('pending'); setError('');
    try { await addToCart(product, quantity); setStatus('success'); }
    catch (failure) { setError(plain((failure as Error).message).replace(/WooCommerce/gi, 'loja')); setStatus('error'); }
    finally { inFlight.current = false; }
  }
  return <div className="add-control"><button ref={button} type="button" className="button add-button" disabled={disabled || !cart || checkoutLocked || pending} aria-busy={pending} onClick={() => { void add(); }}>{pending ? <><LoaderCircle className="add-spinner" size={18}/>Adicionando ao carrinho</> : <>Adicionar ao carrinho <Plus size={18}/></>}</button>
    <div className="add-feedback" aria-live="polite" aria-atomic="true">{status === 'success' && <><span className="add-success"><Check size={18}/>Adicionado ao Carrinho</span><Link ref={confirmation} className="button outline view-cart" to="/carrinho">Ver Carrinho</Link></>}{status === 'error' && <><p className="error" role="alert">{error}</p><Link className="text-link" to="/carrinho">Ver Carrinho</Link><span className="retry-hint">Use “Adicionar ao carrinho” para tentar novamente.</span></>}</div>
  </div>;
}

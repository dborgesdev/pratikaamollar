import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ReviewSubmissionError, submitReview, validateReview, type ReviewDraft, type ReviewField } from '../lib/review-submission';
import { useProductReviews } from './ReviewContext';

export default function ReviewForm({ productId, send = submitReview, onApproved }: { productId: number; send?: typeof submitReview; onApproved?: () => void }) {
  const { policy, failed, open, openForm, closeForm, retry } = useProductReviews();
  const [draft, setDraft] = useState<ReviewDraft>({ rating: '', comment: '', author: '', email: '', website: '' });
  const [errors, setErrors] = useState<Partial<Record<ReviewField, string>>>({}), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [sent, setSent] = useState(false);
  const panel = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), request = useRef<AbortController | null>(null), locked = useRef(false);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!open || !policy) return;
    panel.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    panel.current?.querySelector<HTMLElement>('form input:not([tabindex="-1"]),form textarea,.review-cancel')?.focus({ preventScroll: true });
  }, [open, policy]);
  function field(name: ReviewField) { return { value: draft[name], onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(current => ({ ...current, [name]: event.target.value })), 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `review-error-${name}` : undefined }; }
  function error(name: ReviewField) { return errors[name] ? <span id={`review-error-${name}`} className="review-field-error">{errors[name]}</span> : null; }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!policy || locked.current || sent) return;
    const next = validateReview(draft, policy); setErrors(next); setMessage('');
    if (Object.keys(next).length) { panel.current?.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus(); return; }
    locked.current = true; setBusy(true);
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const status = await send(productId, draft, policy, controller.signal);
      setSent(true);
      setMessage(status === 'approved' ? 'Sua avaliação foi publicada com sucesso.' : 'Sua avaliação foi enviada com sucesso e será publicada após aprovação.');
      if (status === 'approved') onApproved?.();
    } catch (cause) {
      if (cause instanceof ReviewSubmissionError) {
        setMessage(cause.message);
        if (cause.field) { setErrors({ [cause.field]: cause.message }); panel.current?.querySelector<HTMLElement>(`[name="${cause.field}"]`)?.focus(); }
        if (cause.code === 'invalid_challenge') retry();
      } else setMessage('Não foi possível confirmar o envio. Seu texto foi preservado. Tente novamente para consultar o resultado do mesmo envio.');
    } finally { clearTimeout(timeout); request.current = null; locked.current = false; setBusy(false); }
  }
  return <div className="product-review-submission" ref={panel}>
    <h3>Avalie este produto</h3>
    {!policy && !failed && <p role="status">Carregando opções de avaliação…</p>}
    {failed && <p role="status">Não foi possível carregar o formulário. <button type="button" className="text-link" onClick={retry}>Tentar novamente</button></p>}
    {policy?.enabled && <button ref={trigger} hidden={open} type="button" className="button outline" onClick={openForm}>Avaliar este produto</button>}
    {policy && open && !policy.can_submit && <p role="status">{policy.reason === 'login_required' ? 'Entre na sua conta da loja para avaliar este produto.' : policy.reason === 'verified_owner_required' ? 'Somente compradores verificados deste produto podem avaliá-lo.' : 'Este produto não aceita avaliações no momento.'}</p>}
    {policy?.can_submit && open && <form className="review-form" onSubmit={event => void submit(event)} noValidate>
      <fieldset disabled={busy || sent}>
        {policy.rating_enabled && <fieldset className="review-rating"><legend>Sua avaliação{policy.rating_required ? ' (obrigatória)' : ' (opcional)'}</legend><div>{[1, 2, 3, 4, 5].map(value => <label key={value} className={Number(draft.rating) >= value ? 'selected' : ''}><input type="radio" name="rating" value={value} checked={draft.rating === String(value)} onChange={() => setDraft(current => ({ ...current, rating: String(value) }))} required={policy.rating_required} aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`} aria-invalid={Boolean(errors.rating)} aria-describedby={errors.rating ? 'review-error-rating' : undefined}/><span aria-hidden="true">★</span></label>)}</div>{error('rating')}</fieldset>}
        <label>Seu comentário<textarea name="comment" required rows={6} maxLength={10000} {...field('comment')}/>{error('comment')}</label>
        {!policy.authenticated && <><label>Nome<input name="author" autoComplete="name" required maxLength={200} {...field('author')}/>{error('author')}</label><label>E-mail{!policy.email_required && ' (opcional)'}<input name="email" type="email" autoComplete="email" required={policy.email_required} maxLength={100} {...field('email')}/>{error('email')}</label><p className="review-privacy">Seu e-mail não será publicado.</p></>}
        <label className="review-honeypot" aria-hidden="true">Deixe vazio<input name="website" tabIndex={-1} autoComplete="off" value={draft.website} onChange={event => setDraft(current => ({ ...current, website: event.target.value }))}/></label>
        {!sent && <button className="button" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar avaliação'}</button>}
      </fieldset>
    </form>}
    {message && <p role="status" aria-live="polite">{message}</p>}
    {open && <button type="button" className="text-link review-cancel" disabled={busy} onClick={() => { closeForm(); requestAnimationFrame(() => trigger.current?.focus()); }}>Fechar formulário</button>}
  </div>;
}

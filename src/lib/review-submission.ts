export interface ReviewPolicy {
  enabled: boolean; can_submit: boolean; authenticated: boolean; email_required: boolean;
  rating_enabled: boolean; rating_required: boolean; reason: string; challenge?: string;
}
export interface ReviewDraft { rating: string; comment: string; author: string; email: string; website: string }
export type ReviewField = 'rating' | 'comment' | 'author' | 'email';
export class ReviewSubmissionError extends Error {
  constructor(message: string, public field?: ReviewField, public code?: string) { super(message); }
}
const endpoint = 'https://loja.pratikaamollar.com.br/wp-admin/admin-ajax.php';
async function responseData(response: Response): Promise<Record<string, unknown>> {
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Resposta inválida.');
  return data as Record<string, unknown>;
}
export async function reviewPolicy(id: number, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<ReviewPolicy> {
  const response = await fetcher(`${endpoint}?action=pa_review_context&product_id=${id}`, { credentials: 'include', cache: 'no-store', signal, redirect: 'error' });
  const data = await responseData(response);
  if (!response.ok || !['enabled', 'can_submit', 'authenticated', 'email_required', 'rating_enabled', 'rating_required'].every(key => typeof data[key] === 'boolean') || typeof data.reason !== 'string' || (data.can_submit && typeof data.challenge !== 'string')) throw new Error('Avaliações indisponíveis.');
  return data as unknown as ReviewPolicy;
}
export function validateReview(draft: ReviewDraft, policy: ReviewPolicy): Partial<Record<ReviewField, string>> {
  const errors: Partial<Record<ReviewField, string>> = {};
  if (policy.rating_enabled && ((policy.rating_required && !draft.rating) || (draft.rating && !/^[1-5]$/.test(draft.rating)))) errors.rating = 'Selecione de 1 a 5 estrelas.';
  if (!draft.comment.trim() || new TextEncoder().encode(draft.comment).length > 10000) errors.comment = 'Escreva um comentário de até 10.000 bytes.';
  if (!policy.authenticated && (!draft.author.trim() || new TextEncoder().encode(draft.author).length > 200)) errors.author = 'Informe seu nome (até 200 bytes).';
  if (!policy.authenticated && ((policy.email_required && !draft.email.trim()) || (draft.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) || new TextEncoder().encode(draft.email).length > 100)))) errors.email = 'Informe um e-mail válido.';
  return errors;
}
export async function submitReview(id: number, draft: ReviewDraft, policy: ReviewPolicy, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<'approved' | 'pending'> {
  if (!policy.can_submit || !policy.challenge) throw new Error('Este produto não está disponível para sua avaliação.');
  const body = new URLSearchParams({ ...draft, action: 'pa_review_submit', product_id: String(id), challenge: policy.challenge });
  const response = await fetcher(endpoint, { method: 'POST', credentials: 'include', cache: 'no-store', redirect: 'error', signal, body });
  const data = await responseData(response);
  if (!response.ok) {
    const field = ['rating', 'comment', 'author', 'email'].includes(String(data.field)) ? data.field as ReviewField : undefined;
    throw new ReviewSubmissionError(typeof data.message === 'string' ? data.message : 'Não foi possível enviar a avaliação.', field, typeof data.code === 'string' ? data.code : undefined);
  }
  if (data.status !== 'approved' && data.status !== 'pending') throw new Error('Não foi possível confirmar o envio.');
  return data.status;
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { reviewPolicy, type ReviewPolicy } from '../lib/review-submission';
import type { Product } from '../lib/types';

interface ReviewContextValue {
  policy: ReviewPolicy | null; failed: boolean; open: boolean; openForm: () => void; closeForm: () => void; retry: () => void;
  summary: Pick<Product, 'review_count' | 'average_rating'> | null; refreshSummary: () => Promise<void>;
}
const Context = createContext<ReviewContextValue>({ policy: null, failed: false, open: false, openForm: () => {}, closeForm: () => {}, retry: () => {}, summary: null, refreshSummary: async () => {} });
export const useProductReviews = () => useContext(Context);
export function ReviewProvider({ productId, children, loadPolicy = reviewPolicy }: { productId: number; children: ReactNode; loadPolicy?: typeof reviewPolicy }) {
  const [policy, setPolicy] = useState<ReviewPolicy | null>(null), [failed, setFailed] = useState(false), [open, setOpen] = useState(false), [attempt, setAttempt] = useState(0);
  const [summary, setSummary] = useState<ReviewContextValue['summary']>(null);
  useEffect(() => {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
    let active = true;
    setFailed(false);
    void loadPolicy(productId, controller.signal).then(data => { if (active) setPolicy(data); }).catch(() => { if (active) setFailed(true); }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [productId, attempt, loadPolicy]);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  const refreshSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/product-option?product_id=${productId}`, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(12000) });
      const data = await response.json() as Product;
      if (response.ok && data.id === productId && Number.isInteger(data.review_count) && Number(data.review_count) >= 0 && Number.isFinite(Number(data.average_rating))) setSummary({ review_count: data.review_count, average_rating: data.average_rating });
    } catch { /* Submission success remains valid if its public read cannot refresh. */ }
  }, [productId]);
  return <Context.Provider value={{ policy, failed, open, openForm: () => setOpen(true), closeForm: () => setOpen(false), retry, summary, refreshSummary }}>{children}</Context.Provider>;
}

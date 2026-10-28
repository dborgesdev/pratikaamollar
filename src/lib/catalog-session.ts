import { CatalogResource } from './catalog-resource';
import type { CatalogPayload } from '../../shared/catalog';
function initialCatalog(): CatalogPayload | null {
  const element = document.getElementById('pa-catalog');
  if (!element?.textContent) return null;
  try { const data = JSON.parse(element.textContent); return Array.isArray(data.products) && Array.isArray(data.categories) ? data : null; } catch { return null; }
}
export const catalogResource = new CatalogResource(async signal => {
  const response = await fetch('/api/catalog', { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível carregar os produtos. Tente novamente.');
  return response.json() as Promise<CatalogPayload>;
}, initialCatalog());

// LCM of the existing 1/2/3/4-column layouts: resizing never changes a page's membership.
export const CATALOG_PAGE_SIZE = 12;
export function catalogPage<T>(products: readonly T[], requestedPage: number) {
  const pages = Math.max(1, Math.ceil(products.length / CATALOG_PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1));
  return { items: products.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE), page, pages };
}

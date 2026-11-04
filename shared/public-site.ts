/** Public navigation only. Never use this value for Store API or handoff origins. */
export const publicOrigin = 'https://pratikaamollar.com.br';
export const publicUrl = (path = '/') => publicOrigin + '/' + path.replace(/^\/+/, '');

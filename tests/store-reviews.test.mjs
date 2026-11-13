import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { googleReviews, showStoreReviews } = await loadTs(new URL('../src/data/googleReviews.ts', import.meta.url));

test('depoimentos da loja só para contagem explicitamente zero, sem alterar média WooCommerce', () => {
  assert.equal(showStoreReviews(0), true);
  for (const count of [1, 12, undefined, null, -1, NaN]) assert.equal(showStoreReviews(count), false);
  const product = Object.freeze({ review_count: 0, average_rating: '0' });
  showStoreReviews(product.review_count);
  assert.equal(product.average_rating, '0');
});

test('três transcrições autorizadas, integrais e sem datas ou avaliação sem comentário', () => {
  assert.deepEqual(googleReviews.map(r => r.author), ['Thainara Moitinho', 'Charles Luis', 'Luiz C. Justino']);
  assert.ok(googleReviews.every(r => r.rating === 5 && r.comment.length > 0 && !('date' in r)));
  assert.equal(googleReviews[0].comment, 'Fiquei extremamente satisfeita com a minha experiência de compra! Adquiri uma máquina de afiar sem muita experiência na área, mas o atendimento da equipe foi excelente, me proporcionando todo o suporte necessário para fazer a escolha certa. Hoje, me sinto como uma profissional afiando com qualidade e eficiência, tudo graças à orientação e ao excelente produto que recebi. Recomendo fortemente, tanto pela qualidade das máquinas quanto pelo atendimento impecável!');
  assert.equal(googleReviews[1].comment, 'Empresa super séria e com produtos de ótima qualidade!\nAtendimento pré e pós venda sem comentários, equipe muito bem qualificada e atenciosa.\nSe estão procurando uma máquina para começar na afiação está é a empresa certa!');
  assert.equal(googleReviews[2].comment, 'Muito bom! Qualidade top, procedência e todo o suporte necessário pós venda. Indico de olhos fechados.');
});

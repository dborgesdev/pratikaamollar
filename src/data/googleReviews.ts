export interface StoreReview { author: string; rating: 5; comment: string }

// Transcrições fornecidas e autorizadas pelo responsável da loja; não são avaliações de produtos.
export const googleReviews: readonly StoreReview[] = [
  {
    author: 'Thainara Moitinho', rating: 5,
    comment: 'Fiquei extremamente satisfeita com a minha experiência de compra! Adquiri uma máquina de afiar sem muita experiência na área, mas o atendimento da equipe foi excelente, me proporcionando todo o suporte necessário para fazer a escolha certa. Hoje, me sinto como uma profissional afiando com qualidade e eficiência, tudo graças à orientação e ao excelente produto que recebi. Recomendo fortemente, tanto pela qualidade das máquinas quanto pelo atendimento impecável!',
  },
  {
    author: 'Charles Luis', rating: 5,
    comment: 'Empresa super séria e com produtos de ótima qualidade!\nAtendimento pré e pós venda sem comentários, equipe muito bem qualificada e atenciosa.\nSe estão procurando uma máquina para começar na afiação está é a empresa certa!',
  },
  {
    author: 'Luiz C. Justino', rating: 5,
    comment: 'Muito bom! Qualidade top, procedência e todo o suporte necessário pós venda. Indico de olhos fechados.',
  },
];

export function showStoreReviews(reviewCount: number | undefined): boolean {
  // Ausência de informação não significa ausência de avaliações aprovadas.
  return reviewCount === 0;
}

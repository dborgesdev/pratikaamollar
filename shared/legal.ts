export interface LegalSection { title: string; paragraphs: string[] }
export interface LegalDocument { slug: string; title: string; description: string; sections: LegalSection[]; pending: string[] }
export const legalBusinessIdentity = [
  'Razão social: Pratika Amollar',
  'CNPJ: 30.867.419/0001-06',
  'Endereço comercial: Avenida Progresso, 1310, Eldorado, São José do Rio Preto/SP, CEP 15043-420',
  'E-mail: amolar.net@outlook.com',
  'Telefone: (17) 99162-8264',
];
export const legalDocuments: LegalDocument[] = [
  {
    slug: 'politica-de-privacidade', title: 'Política de Privacidade',
    description: 'Como a Pratika Amollar utiliza dados pessoais nas compras e no atendimento, seus direitos e contato sobre privacidade.',
    sections: [
      { title: 'Apresentação', paragraphs: [
        'A Pratika Amollar, inscrita no CNPJ 30.867.419/0001-06, apresenta nesta política informações sobre o uso de dados pessoais nas compras e no atendimento aos clientes.',
      ] },
      { title: 'Dados utilizados e suas finalidades', paragraphs: [
        'Ao realizar uma compra, criar uma conta ou entrar em contato conosco, você fornece informações cadastrais, de contato, de endereço e relacionadas ao pedido.',
        'Essas informações são utilizadas para processar a compra, organizar a entrega, prestar atendimento e cumprir obrigações legais aplicáveis.',
        'O tratamento necessário à compra está relacionado à execução do contrato ou às providências solicitadas por você antes da contratação. A realização de uma compra não representa, por si só, autorização para receber publicidade.',
      ] },
      { title: 'Atendimento pelo WhatsApp', paragraphs: [
        'Ao escolher o atendimento pelo WhatsApp, você será direcionado para esse serviço e poderá confirmar o envio da mensagem. As informações enviadas também estarão sujeitas à política de privacidade do WhatsApp.',
      ] },
      { title: 'Compartilhamento de informações', paragraphs: [
        'A operação da loja envolve serviços de pagamento, entrega, hospedagem e comunicação. O compartilhamento de dados deve estar limitado às informações necessárias para essas atividades ou para o cumprimento de obrigações legais.',
      ] },
      { title: 'Cookies e funcionamento da loja', paragraphs: [
        'A loja utiliza mecanismos de sessão para permitir o funcionamento de recursos como carrinho e conta do cliente.',
        'Você pode administrar cookies nas configurações do navegador. O bloqueio de determinados cookies pode afetar o funcionamento desses recursos.',
      ] },
      { title: 'Conservação dos dados', paragraphs: [
        'A conservação de informações deve observar a finalidade de cada tratamento e as obrigações legais aplicáveis. Por esse motivo, uma solicitação de exclusão pode não abranger dados cuja manutenção seja exigida ou permitida por lei.',
      ] },
      { title: 'Seus direitos', paragraphs: [
        'Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD), você pode solicitar confirmação do tratamento, acesso e correção dos seus dados, além de informações sobre compartilhamento.',
        'Também pode solicitar anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados irregularmente; portabilidade, conforme a regulamentação; e revogação do consentimento, quando aplicável. Esses direitos estão sujeitos às condições e exceções previstas em lei.',
      ] },
      { title: 'Contato sobre privacidade', paragraphs: [
        'Para dúvidas ou solicitações relacionadas aos seus dados pessoais, entre em contato:',
        'Pratika Amollar', 'CNPJ: 30.867.419/0001-06', 'E-mail: amolar.net@outlook.com',
        'Poderemos solicitar informações para confirmar sua identidade e proteger seus dados ao atender uma solicitação.',
      ] },
    ], pending: [],
  },
  {
    slug: 'termos-e-condicoes-de-compra', title: 'Termos e Condições de Compra',
    description: 'Informações sobre o fornecedor, produtos, pagamento, confirmação da compra e direitos do consumidor na Pratika Amollar.',
    sections: [
      { title: 'Fornecedor e atendimento', paragraphs: [
        'Razão social: Pratika Amollar — acessórios e ferramentas de afiação. CNPJ: 30.867.419/0001-06. Contatos: amolar.net@outlook.com e (17) 99162-8264. Endereço comercial: Avenida Progresso, 1310, Eldorado, São José do Rio Preto/SP, CEP 15043-420.',
      ] },
      { title: 'Produtos e revisão da compra', paragraphs: [
        'Descrição, preço e disponibilidade são fornecidos na loja virtual. Antes de concluir, confira produto, quantidade, endereço, frete e total na finalização da compra. Esclareça divergências pelo atendimento, sem afastar os direitos relativos à oferta previstos no CDC.',
      ] },
      { title: 'Pagamento e confirmação', paragraphs: [
        'A compra é concluída pelo site, com os meios disponibilizados pelo Mercado Pago. Disponibilidade de Pix, cartão e boleto, parcelamento, vencimentos e instruções devem ser conferidos na finalização da compra; esta política não garante condições comerciais não verificadas.',
        'Pedido recebido não significa necessariamente pagamento aprovado. Considere o status e as instruções exibidos pelo meio de pagamento. Não envie senha ou dados completos de cartão ao atendimento.',
      ] },
      { title: 'Conta e direitos', paragraphs: [
        'Login, recuperação de senha, pedidos e endereços são gerenciados na área Minha conta. O acesso aos detalhes dos pedidos exige a identificação correspondente nessa área.',
        'Aplicam-se o CDC e as normas de comércio eletrônico. Estes termos não excluem garantias legais, arrependimento ou acesso aos órgãos de defesa do consumidor. Consulte também as políticas de entrega e de trocas.',
      ] },
    ], pending: [],
  },
  {
    slug: 'trocas-devolucoes-e-reembolsos', title: 'Política de Trocas, Devoluções e Reembolsos',
    description: 'Direito de arrependimento, vícios e divergências, orientações para solicitar devoluções e reembolsos na Pratika Amollar.',
    sections: [
      { title: 'Arrependimento', paragraphs: [
        'O CDC assegura o direito de desistir da compra a distância em sete dias, contados da assinatura ou do recebimento, conforme o caso. O exercício desse direito não exige justificativa e envolve a restituição dos valores pagos, inclusive frete, sem ônus ao consumidor.',
      ] },
      { title: 'Vícios e divergências', paragraphs: [
        'Os prazos legais para reclamar de vícios aparentes ou de fácil constatação são de 30 dias para produtos não duráveis e 90 dias para duráveis, contados da entrega; para vício oculto, a contagem começa quando o problema se evidencia. Em regra, não sanado o vício em até 30 dias, o consumidor pode escolher substituição, restituição ou abatimento, observadas as exceções e condições do CDC.',
        'Comunique também produto divergente ou avaria. Fotografias e informações do pedido podem auxiliar a análise sem criar exigências que eliminem direitos legais.',
      ] },
      { title: 'Solicitação e retorno', paragraphs: [
        'Contate amolar.net@outlook.com ou (17) 99162-8264 com o pedido e a solicitação. Solicite ao atendimento o endereço e as instruções para devolução antes da postagem. Essa orientação não suspende nem reduz os prazos legais para exercer seus direitos.',
      ] },
      { title: 'Restituição', paragraphs: [
        'Nos casos de exercício do direito de arrependimento, os valores pagos serão restituídos conforme a legislação aplicável. O reembolso será processado, sempre que possível, pelo mesmo meio de pagamento utilizado na compra. Os prazos de disponibilização do valor pela instituição financeira ou de pagamento serão informados ao cliente durante o atendimento, sem prejuízo dos direitos assegurados por lei.',
      ] },
    ], pending: [],
  },
  {
    slug: 'entrega-e-frete', title: 'Política de Entrega e Frete',
    description: 'Consulta de frete, endereço de entrega, acompanhamento dos pedidos e atendimento para problemas na entrega na Pratika Amollar.',
    sections: [
      { title: 'Cálculo e condições', paragraphs: [
        'Informe seu CEP ao finalizar a compra para consultar as opções de entrega disponíveis e o valor do frete para seu endereço. Confira as condições de envio e o valor total do pedido antes de concluir a compra.',
      ] },
      { title: 'Prazo e endereço', paragraphs: [
        'Revise seu endereço antes da compra. Para correções ou dificuldades de entrega, contate a loja; custos de reenvio e procedimentos para ausência ou endereço incorreto serão informados durante o atendimento.',
      ] },
      { title: 'Acompanhamento', paragraphs: [
        'Consulte as páginas Minha conta e Rastrear encomenda. Não se presume rastreio imediato após pagamento.',
      ] },
      { title: 'Problemas na entrega', paragraphs: [
        'Contate amolar.net@outlook.com ou (17) 99162-8264 com o pedido. A loja deve tratar problemas de entrega e cumprir a oferta, preservadas as alternativas legais do consumidor em caso de descumprimento.',
      ] },
    ], pending: [],
  },
];

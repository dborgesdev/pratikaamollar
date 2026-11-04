export interface LegalSection { title: string; paragraphs: string[] }
export interface LegalDocument { slug: string; title: string; description: string; sections: LegalSection[]; pending: string[] }
export const legalDocuments: LegalDocument[] = [
  {
    "slug": "politica-de-privacidade",
    "title": "Política de Privacidade",
    "description": "Dados pessoais, finalidades, direitos e contato.",
    "sections": [
      {
        "title": "Escopo e contato",
        "paragraphs": [
          "Esta minuta abrange a loja React e as operações no WordPress/WooCommerce. O contato comercial confirmado é amolar.net@outlook.com e (17) 99162-8264. A identificação jurídica do controlador e o canal específico de privacidade precisam de confirmação."
        ]
      },
      {
        "title": "Dados e finalidades",
        "paragraphs": [
          "A compra e a conta utilizam dados cadastrais, de contato, endereço e informações do pedido para executar a compra, entregar produtos e prestar atendimento. Os campos efetivamente exigidos devem ser conferidos no checkout. No contato React, nome e mensagem compõem um link para o WhatsApp; o envio acontece nesse serviço quando você o confirma.",
          "As sessões React e WordPress são separadas. A ponte transfere itens ao checkout nativo, sem representar compartilhamento automático de login."
        ]
      },
      {
        "title": "Serviços e bases legais",
        "paragraphs": [
          "A infraestrutura informada envolve Cloudflare, KingHost, WooCommerce, Mercado Pago, Correios Automático e Brevo/WP Mail SMTP. Dados encaminhados a cada fornecedor, seus papéis e eventuais transferências internacionais precisam de validação.",
          "As bases legais devem ser definidas por finalidade: execução de contrato e providências solicitadas antes da compra; obrigações legais quando aplicáveis; outras hipóteses somente quando justificadas. Uma compra não representa consentimento para publicidade."
        ]
      },
      {
        "title": "Seus direitos",
        "paragraphs": [
          "Nos termos da LGPD, você pode solicitar confirmação e acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários ou irregulares, portabilidade conforme regulamentação, informações sobre compartilhamento, revogação de consentimento e eliminação de dados tratados com essa base, ressalvadas as hipóteses legais de conservação. Pode solicitar informações sobre não consentir e suas consequências e peticionar à ANPD.",
          "Use o contato comercial para encaminhar sua solicitação enquanto o canal específico é confirmado. Sua identificação poderá ser verificada de forma proporcional para proteger seus dados."
        ]
      },
      {
        "title": "Cookies, conservação e segurança",
        "paragraphs": [
          "Carrinho e conta dependem de mecanismos de sessão. Cookies, armazenamento local, registros de acesso, ferramentas de análise e suas durações precisam de inventário técnico. Não se declara ausência de rastreadores.",
          "Prazos de conservação, exclusão, medidas de segurança e resposta a incidentes devem ser documentados pelo responsável antes da versão definitiva."
        ]
      }
    ],
    "pending": [
      "Razão social, CNPJ, controlador e canal de privacidade.",
      "Inventário de dados e cookies; bases legais por finalidade; retenção e segurança.",
      "Operadores, suboperadores e transferências internacionais."
    ]
  },
  {
    "slug": "termos-e-condicoes-de-compra",
    "title": "Termos e Condições de Compra",
    "description": "Informações preliminares sobre compra, pagamento e atendimento.",
    "sections": [
      {
        "title": "Fornecedor e atendimento",
        "paragraphs": [
          "Pratika Amollar — acessórios e ferramentas de afiação. Contatos: amolar.net@outlook.com e (17) 99162-8264. Endereço comercial informado: Avenida Progresso, 1310, Eldorado, São José do Rio Preto/SP, CEP 15043-420. Este endereço não está confirmado para devoluções. Razão social e CNPJ estão pendentes."
        ]
      },
      {
        "title": "Produtos e revisão da compra",
        "paragraphs": [
          "Descrição, preço e disponibilidade são fornecidos pelo WooCommerce. Antes de concluir, confira produto, quantidade, endereço, frete e total no checkout nativo. Esclareça divergências pelo atendimento, sem afastar os direitos relativos à oferta previstos no CDC."
        ]
      },
      {
        "title": "Pagamento e confirmação",
        "paragraphs": [
          "A compra é concluída no WooCommerce, com os meios disponibilizados pelo Mercado Pago. Disponibilidade de Pix, cartão e boleto, parcelamento, vencimentos e instruções devem ser conferidos no checkout; esta minuta não garante condições comerciais não verificadas.",
          "Pedido recebido não significa necessariamente pagamento aprovado. Considere o status e as instruções exibidos pelo meio de pagamento. Não envie senha ou dados completos de cartão ao atendimento."
        ]
      },
      {
        "title": "Conta e direitos",
        "paragraphs": [
          "Login, recuperação de senha, pedidos e endereços são gerenciados na área Minha conta do WordPress. Detalhes de pedidos exigem a validação nativa correspondente.",
          "Aplicam-se o CDC e as normas de comércio eletrônico. Estes termos não excluem garantias legais, arrependimento ou acesso aos órgãos de defesa do consumidor. Consulte também as políticas de entrega e de trocas."
        ]
      }
    ],
    "pending": [
      "Identificação jurídica completa.",
      "Condições de pagamento, atendimento e confirmação configuradas.",
      "Revisão final e data de vigência."
    ]
  },
  {
    "slug": "trocas-devolucoes-e-reembolsos",
    "title": "Política de Trocas, Devoluções e Reembolsos",
    "description": "Arrependimento, vícios do produto, devoluções e reembolsos.",
    "sections": [
      {
        "title": "Arrependimento",
        "paragraphs": [
          "O CDC assegura o direito de desistir da compra a distância em sete dias, contados da assinatura ou do recebimento, conforme o caso. O exercício desse direito não exige justificativa e envolve a restituição dos valores pagos, inclusive frete, sem ônus ao consumidor. A logística reversa precisa de confirmação operacional."
        ]
      },
      {
        "title": "Vícios e divergências",
        "paragraphs": [
          "Os prazos legais para reclamar de vícios aparentes ou de fácil constatação são de 30 dias para produtos não duráveis e 90 dias para duráveis, contados da entrega; para vício oculto, a contagem começa quando o problema se evidencia. Em regra, não sanado o vício em até 30 dias, o consumidor pode escolher substituição, restituição ou abatimento, observadas as exceções e condições do CDC.",
          "Comunique também produto divergente ou avaria. Fotografias e informações do pedido podem auxiliar a análise sem criar exigências que eliminem direitos legais. Não há prazo comercial adicional de troca confirmado."
        ]
      },
      {
        "title": "Solicitação e retorno",
        "paragraphs": [
          "Contate amolar.net@outlook.com ou (17) 99162-8264 com o pedido e a solicitação. O endereço e o procedimento de devolução dependem de confirmação: solicite instruções antes da postagem. Essa orientação não suspende nem reduz os prazos legais para exercer seus direitos."
        ]
      },
      {
        "title": "Restituição",
        "paragraphs": [
          "No arrependimento, os valores pagos devem ser restituídos de imediato, monetariamente atualizados, conforme o CDC. O fluxo de estorno junto ao meio de pagamento e sua comunicação precisam ser documentados. O tempo de exibição pelo banco ou emissor não pode restringir a obrigação legal."
        ]
      }
    ],
    "pending": [
      "Endereço de retorno e logística reversa sem custo no arrependimento.",
      "Responsável e acompanhamento de solicitações e estornos.",
      "Trocas comerciais adicionais e garantias contratuais, se existentes."
    ]
  },
  {
    "slug": "entrega-e-frete",
    "title": "Política de Entrega e Frete",
    "description": "Frete, entrega e acompanhamento dos pedidos.",
    "sections": [
      {
        "title": "Cálculo e condições",
        "paragraphs": [
          "Frete e opções de entrega são apresentados no checkout nativo conforme endereço e regras configuradas no WooCommerce e Correios Automático. Confira opções e total antes de concluir. Não estão confirmados regiões atendidas, frete gratuito, modalidades ou prazos fixos."
        ]
      },
      {
        "title": "Prazo e endereço",
        "paragraphs": [
          "O prazo informado na compra deve esclarecer o marco inicial e considerar processamento e transporte aplicáveis. Postagem, corte de horário e dias de operação precisam de confirmação. Não há promessa de entrega em 48 horas.",
          "Revise seu endereço antes da compra. Para correções ou dificuldades de entrega, contate a loja; custos de reenvio e procedimentos para ausência ou endereço incorreto dependem de validação e devem respeitar os direitos do consumidor."
        ]
      },
      {
        "title": "Acompanhamento",
        "paragraphs": [
          "Consulte as páginas nativas Minha conta e Rastrear encomenda. Código e link de rastreio dependem de disponibilização pela operação e pelo Correios Automático. Não se presume rastreio imediato após pagamento."
        ]
      },
      {
        "title": "Problemas na entrega",
        "paragraphs": [
          "Contate amolar.net@outlook.com ou (17) 99162-8264 com o pedido. A loja deve tratar problemas de entrega e cumprir a oferta, preservadas as alternativas legais do consumidor em caso de descumprimento. Os procedimentos internos precisam de confirmação."
        ]
      }
    ],
    "pending": [
      "Regiões, modalidades, expedição, postagem e marco inicial da previsão.",
      "Tentativas, retirada, extravio, avarias e critérios de reenvio.",
      "Disponibilização do rastreio e comunicação."
    ]
  }
];

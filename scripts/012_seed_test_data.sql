-- Script de dados de teste para Digital Chaveiro
-- Contém exemplos de cada tipo de dado que o sistema manipula
-- Execute este script APÓS criar a loja e as credenciais de funcionários

-- ===== DADOS DE TESTE =====

-- 1. PRODUTOS (pelo menos 3 tipos de chaves diferentes)
INSERT INTO public.produtos (
  loja_id,
  nome,
  codigo_barras,
  preco,
  custo,
  estoque,
  categoria,
  descricao,
  ativo,
  created_at,
  updated_at
) VALUES
-- Chaves
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Cópia de Chave Simples',
  'CHAVE-001',
  15.00,
  5.00,
  150,
  'Chaves',
  'Cópia de chave residencial padrão',
  true,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Cópia de Chave Tetra',
  'CHAVE-002',
  25.00,
  10.00,
  80,
  'Chaves',
  'Cópia de chave tetra canalhão',
  true,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Cópia de Chave Yale',
  'CHAVE-003',
  20.00,
  8.00,
  120,
  'Chaves',
  'Cópia de chave Yale cilíndrica',
  true,
  now(),
  now()
),
-- Controles
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Controle Remoto Universal',
  'CONTR-001',
  80.00,
  40.00,
  25,
  'Controles',
  'Controle remoto para portão automático',
  true,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Controle Remoto Programável',
  'CONTR-002',
  120.00,
  60.00,
  15,
  'Controles',
  'Controle remoto programável para 4 frequências',
  true,
  now(),
  now()
),
-- Acessórios
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Chaveiro Plástico',
  'ACESS-001',
  5.00,
  1.50,
  300,
  'Acessórios',
  'Chaveiro plástico colorido',
  true,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Corrente Cromada',
  'ACESS-002',
  8.00,
  3.00,
  200,
  'Acessórios',
  'Corrente cromada 60cm',
  true,
  now(),
  now()
);

-- 2. SERVIÇOS (pelo menos 2 tipos)
INSERT INTO public.servicos (
  loja_id,
  nome,
  preco,
  custo,
  descricao,
  duracao_estimada,
  ativo,
  created_at,
  updated_at
) VALUES
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Corte e Cópia de Chave',
  15.00,
  5.00,
  'Serviço de corte e cópia de chave simples',
  10,
  true,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Conserto de Fechadura',
  60.00,
  20.00,
  'Conserto e ajuste de fechaduras residenciais',
  30,
  true,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Instalação de Interfone',
  150.00,
  50.00,
  'Instalação e configuração de interfone',
  60,
  true,
  now(),
  now()
);

-- 3. CLIENTES (pelo menos 2 pessoas físicas/jurídicas)
INSERT INTO public.clientes (
  loja_id,
  nome,
  email,
  telefone,
  cpf,
  endereco,
  observacoes,
  created_at,
  updated_at
) VALUES
(
  (SELECT id FROM public.lojas LIMIT 1),
  'João Silva',
  'joao@email.com',
  '(11) 98765-4321',
  '12345678901',
  'Rua A, 123',
  NULL,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Maria Oliveira',
  'maria@email.com',
  '(11) 99876-5432',
  '98765432101',
  'Av. B, 456',
  NULL,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Empresa XYZ Ltda',
  'contato@empresaxyz.com',
  '(11) 3123-4567',
  '12345678000190',
  'Rua C, 789',
  NULL,
  now(),
  now()
);

-- 4. FUNCIONÁRIOS (será criado via create-employee, incluindo em auth.users)
-- Deixe comentado — será criado via interface, mas pode inserir credencial aqui se necessário
-- INSERT INTO public.lojas_credenciais_funcionarios (...) VALUES (...);

-- 5. VENDAS (pelo menos 2 exemplos de diferentes formas de pagamento)
INSERT INTO public.vendas (
  loja_id,
  funcionario_id,
  cliente_id,
  total,
  desconto,
  forma_pagamento,
  tipo,
  status,
  observacoes,
  created_at
) VALUES
(
  (SELECT id FROM public.lojas LIMIT 1),
  NULL,
  (SELECT id FROM public.clientes WHERE nome = 'João Silva' LIMIT 1),
  45.00,
  0,
  'dinheiro',
  'avista',
  'concluida',
  NULL,
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  NULL,
  (SELECT id FROM public.clientes WHERE nome = 'Maria Oliveira' LIMIT 1),
  85.00,
  5.00,
  'credito',
  'aprazo',
  'concluida',
  NULL,
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  NULL,
  (SELECT id FROM public.clientes WHERE nome = 'Empresa XYZ Ltda' LIMIT 1),
  150.00,
  15.00,
  'debito',
  'avista',
  'concluida',
  NULL,
  now() - interval '2 days'
);

-- 6. ITENS DE VENDA (relacionar com as vendas acima)
INSERT INTO public.vendas_itens (
  venda_id,
  tipo,
  item_id,
  nome,
  quantidade,
  preco_unitario,
  subtotal,
  created_at
) VALUES
-- Venda 1: 2x chave simples + 3x chaveiro
(
  (SELECT id FROM public.vendas WHERE total = 45.00 LIMIT 1),
  'produto',
  (SELECT id FROM public.produtos WHERE codigo_barras = 'CHAVE-001' LIMIT 1),
  'Cópia de Chave Simples',
  2,
  15.00,
  30.00,
  now()
),
(
  (SELECT id FROM public.vendas WHERE total = 45.00 LIMIT 1),
  'produto',
  (SELECT id FROM public.produtos WHERE codigo_barras = 'ACESS-001' LIMIT 1),
  'Chaveiro Plástico',
  3,
  5.00,
  15.00,
  now()
),
-- Venda 2: serviço de corte + controle
(
  (SELECT id FROM public.vendas WHERE total = 85.00 LIMIT 1),
  'servico',
  (SELECT id FROM public.servicos WHERE nome = 'Corte e Cópia de Chave' LIMIT 1),
  'Corte e Cópia de Chave',
  1,
  15.00,
  15.00,
  now()
),
(
  (SELECT id FROM public.vendas WHERE total = 85.00 LIMIT 1),
  'produto',
  (SELECT id FROM public.produtos WHERE codigo_barras = 'CONTR-001' LIMIT 1),
  'Controle Remoto Universal',
  1,
  80.00,
  80.00,
  now()
),
-- Venda 3: Serviço de instalação
(
  (SELECT id FROM public.vendas WHERE total = 150.00 LIMIT 1),
  'servico',
  (SELECT id FROM public.servicos WHERE nome = 'Instalação de Interfone' LIMIT 1),
  'Instalação de Interfone',
  1,
  150.00,
  150.00,
  now()
);

-- 7. CONTAS A PAGAR (pelo menos 2)
INSERT INTO public.contas_pagar (
  loja_id,
  categoria_id,
  descricao,
  valor,
  data_vencimento,
  data_pagamento,
  status,
  recorrente,
  observacoes,
  created_at,
  updated_at
) VALUES
(
  (SELECT id FROM public.lojas LIMIT 1),
  NULL,
  'Compra de estoque de chaves',
  500.00,
  CURRENT_DATE + INTERVAL '7 days',
  NULL,
  'pendente',
  false,
  NULL,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  NULL,
  'Aluguel do espaço',
  1500.00,
  CURRENT_DATE + INTERVAL '5 days',
  NULL,
  'pendente',
  false,
  NULL,
  now(),
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  NULL,
  'Internet e telefone',
  150.00,
  CURRENT_DATE - INTERVAL '2 days',
  NULL,
  'pendente',
  false,
  NULL,
  now(),
  now()
);

-- 8. VENDAS A PRAZO - PARCELAS (para vendas com pagamento parcelado)
INSERT INTO public.vendas_prazo_parcelas (
  venda_id,
  loja_id,
  cliente_id,
  numero_parcela,
  valor,
  data_vencimento,
  data_recebimento,
  status,
  created_at,
  updated_at
) VALUES
-- Parcelas da venda 2 (Maria - credito/aprazo)
(
  (SELECT id FROM public.vendas WHERE total = 85.00 LIMIT 1),
  (SELECT id FROM public.lojas LIMIT 1),
  (SELECT id FROM public.clientes WHERE nome = 'Maria Oliveira' LIMIT 1),
  1,
  42.50,
  CURRENT_DATE + INTERVAL '10 days',
  NULL,
  'pendente',
  now(),
  now()
),
(
  (SELECT id FROM public.vendas WHERE total = 85.00 LIMIT 1),
  (SELECT id FROM public.lojas LIMIT 1),
  (SELECT id FROM public.clientes WHERE nome = 'Maria Oliveira' LIMIT 1),
  2,
  42.50,
  CURRENT_DATE + INTERVAL '20 days',
  NULL,
  'pendente',
  now(),
  now()
);

-- 9. PERDAS/DANOS (pelo menos 1)
INSERT INTO public.perdas (
  loja_id,
  produto_id,
  categoria_id,
  funcionario_id,
  nome_produto,
  quantidade,
  valor_custo,
  motivo,
  observacoes,
  created_at
) VALUES
(
  (SELECT id FROM public.lojas LIMIT 1),
  (SELECT id FROM public.produtos WHERE codigo_barras = 'CHAVE-001' LIMIT 1),
  NULL,
  NULL,
  'Cópia de Chave Simples',
  3,
  5.00,
  'Chave danificada durante corte',
  'Dano operacional - falha na máquina',
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  (SELECT id FROM public.produtos WHERE codigo_barras = 'CONTR-001' LIMIT 1),
  NULL,
  NULL,
  'Controle Remoto Universal',
  1,
  40.00,
  'Controle remoto com defeito de fábrica',
  'Produto defeituoso - devolução ao fornecedor',
  now() - interval '3 days'
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  (SELECT id FROM public.produtos WHERE codigo_barras = 'ACESS-001' LIMIT 1),
  NULL,
  NULL,
  'Chaveiro Plástico',
  5,
  1.50,
  'Chaveiros perdidos no estoque',
  'Perda/Roubo durante inventário',
  now() - interval '5 days'
);

-- 10. CATEGORIAS DE DESPESAS (para contas a pagar)
INSERT INTO public.categorias_despesas (
  loja_id,
  nome,
  descricao,
  created_at
) VALUES
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Compras',
  'Compras de produtos e estoque',
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Aluguel',
  'Aluguel do espaço comercial',
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Utilidades',
  'Água, luz, internet, telefone',
  now()
),
(
  (SELECT id FROM public.lojas LIMIT 1),
  'Folha de Pagamento',
  'Salários e encargos de funcionários',
  now()
);

-- ===== FIM DOS DADOS DE TESTE =====
-- Nota: Para criar movimentações de caixa, acesse a página de Caixa no aplicativo
-- Nota: Para cadastrar funcionários, use a interface de Configuração da Loja (cria Auth user automaticamente)

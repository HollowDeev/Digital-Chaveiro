-- Script para garantir que todas as lojas tenham motivos de problemas padrão
-- Execute este script no SQL Editor do Supabase

-- Inserir motivos padrão para TODAS as lojas que ainda não têm
INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao, ativo)
SELECT l.id, 'Peça com defeito', 'A peça utilizada estava com defeito', true
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Peça com defeito'
);

INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao, ativo)
SELECT l.id, 'Cliente forneceu informação errada', 'Cliente passou informação incorreta sobre o serviço', true
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Cliente forneceu informação errada'
);

INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao, ativo)
SELECT l.id, 'Erro de execução', 'Erro durante a execução do serviço', true
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Erro de execução'
);

INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao, ativo)
SELECT l.id, 'Falta de ferramenta adequada', 'Não havia ferramenta adequada para realizar o serviço', true
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Falta de ferramenta adequada'
);

INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao, ativo)
SELECT l.id, 'Material de baixa qualidade', 'O material utilizado era de qualidade inferior', true
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Material de baixa qualidade'
);

INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao, ativo)
SELECT l.id, 'Atraso na entrega', 'O serviço não foi entregue no prazo combinado', true
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Atraso na entrega'
);

-- Verificar os motivos criados
SELECT 
    l.nome as loja,
    m.nome as motivo,
    m.descricao,
    m.ativo
FROM public.motivos_problemas_servicos m
JOIN public.lojas l ON l.id = m.loja_id
ORDER BY l.nome, m.nome;

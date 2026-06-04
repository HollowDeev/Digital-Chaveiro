-- Adiciona custo_total na tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS custo_total DECIMAL(10,2) DEFAULT 0;

-- Adiciona custo_unitario e custo_total na tabela vendas_itens
ALTER TABLE public.vendas_itens 
ADD COLUMN IF NOT EXISTS custo_unitario DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_total DECIMAL(10,2) DEFAULT 0;

-- Atualizar metadados para comentários no Supabase
COMMENT ON COLUMN public.vendas.custo_total IS 'Custo total (CMV) embutido nesta venda';
COMMENT ON COLUMN public.vendas_itens.custo_unitario IS 'Custo unitário do produto ou serviço na hora da venda';
COMMENT ON COLUMN public.vendas_itens.custo_total IS 'Custo unitário multiplicado pela quantidade';

-- 1. Atualizar o custo_unitario e custo_total para ITENS DO TIPO PRODUTO
UPDATE public.vendas_itens vi
SET 
    custo_unitario = p.custo,
    custo_total = p.custo * vi.quantidade
FROM public.produtos p
WHERE vi.tipo = 'produto' 
  AND vi.item_id = p.id
  AND vi.custo_total = 0; -- Atualiza apenas os que estão zerados

-- 2. Atualizar o custo_unitario e custo_total para ITENS DO TIPO SERVIÇO
-- Faz um sub-select para somar todos os custos cadastrados do serviço na tabela servicos_custos
UPDATE public.vendas_itens vi
SET 
    custo_unitario = COALESCE(
        (SELECT SUM(sc.valor) 
         FROM public.servicos_custos sc 
         WHERE sc.servico_id = vi.item_id), 
        0
    ),
    custo_total = COALESCE(
        (SELECT SUM(sc.valor) 
         FROM public.servicos_custos sc 
         WHERE sc.servico_id = vi.item_id), 
        0
    ) * vi.quantidade
WHERE vi.tipo = 'servico'
  AND vi.custo_total = 0;

-- 3. Atualizar o custo_total na tabela de VENDAS
-- Soma todos os custos recém-atualizados da tabela vendas_itens
UPDATE public.vendas v
SET custo_total = COALESCE(
    (SELECT SUM(vi.custo_total)
     FROM public.vendas_itens vi
     WHERE vi.venda_id = v.id),
    0
)
WHERE v.custo_total = 0;

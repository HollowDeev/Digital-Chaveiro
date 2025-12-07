-- Script 022: Verificação da estrutura de vendas_itens
-- Data: 2025-12-06
-- Descrição: A tabela vendas_itens já suporta serviços através do campo 'tipo' e 'item_id'

-- Verificar estrutura atual
-- A tabela vendas_itens já foi criada no script 005 com:
-- - tipo: 'produto' ou 'servico'
-- - item_id: UUID genérico que referencia produtos.id ou servicos.id
-- - nome: nome do item (produto ou serviço)

-- Nenhuma alteração necessária!
-- A estrutura já permite registrar tanto produtos quanto serviços.

-- Verificação opcional: adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_vendas_itens_item_id ON public.vendas_itens(item_id);
CREATE INDEX IF NOT EXISTS idx_vendas_itens_tipo ON public.vendas_itens(tipo);

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.vendas_itens.tipo IS 'Tipo do item: produto ou servico';
COMMENT ON COLUMN public.vendas_itens.item_id IS 'ID do produto (se tipo=produto) ou ID do serviço (se tipo=servico)';


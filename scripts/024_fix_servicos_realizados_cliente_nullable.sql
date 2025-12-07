-- Tornar cliente_id opcional em servicos_realizados
-- Motivo: Nem todos os serviços precisam estar vinculados a um cliente específico

ALTER TABLE public.servicos_realizados 
ALTER COLUMN cliente_id DROP NOT NULL;

COMMENT ON COLUMN public.servicos_realizados.cliente_id IS 'Cliente associado ao serviço (opcional)';

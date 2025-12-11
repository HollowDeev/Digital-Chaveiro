-- Fix: Permitir culpado_funcionario_id NULL em servicos_problemas
-- Motivo: Nem todo problema é causado por funcionário (pode ser cliente ou outros)

-- 1. Remover constraint NOT NULL se existir
ALTER TABLE public.servicos_problemas 
ALTER COLUMN culpado_funcionario_id DROP NOT NULL;

-- 2. Verificar a alteração
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'servicos_problemas'
AND column_name = 'culpado_funcionario_id';

-- 3. Comentário explicativo
COMMENT ON COLUMN public.servicos_problemas.culpado_funcionario_id IS 'ID do funcionário culpado (NULL se culpado for cliente ou outros)';

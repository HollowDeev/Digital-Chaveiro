-- Add: Adicionar campo problemas_salvos para rastrear se já teve problemas registrados
-- Permite salvar problemas sem finalizar o serviço

-- 1. Adicionar campo problemas_salvos
ALTER TABLE public.servicos_realizados
ADD COLUMN IF NOT EXISTS problemas_salvos BOOLEAN DEFAULT FALSE;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN public.servicos_realizados.problemas_salvos IS 'Indica se o serviço já teve problemas registrados anteriormente. Usado para controlar a interface de finalização.';

-- 3. Verificar a alteração
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'servicos_realizados'
AND column_name = 'problemas_salvos';

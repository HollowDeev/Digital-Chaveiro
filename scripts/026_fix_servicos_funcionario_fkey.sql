-- Fix: Corrigir foreign key de funcionario_responsavel_id
-- Problema: funcionario_responsavel_id referencia lojas_usuarios.id mas deveria referenciar auth.users(id)

-- 1. Remover a constraint antiga
ALTER TABLE public.servicos_realizados 
DROP CONSTRAINT IF EXISTS servicos_realizados_funcionario_responsavel_id_fkey;

-- 2. Adicionar nova constraint apontando para auth.users
ALTER TABLE public.servicos_realizados 
ADD CONSTRAINT servicos_realizados_funcionario_responsavel_id_fkey 
FOREIGN KEY (funcionario_responsavel_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- 3. Comentário explicativo
COMMENT ON COLUMN public.servicos_realizados.funcionario_responsavel_id IS 'ID do usuário responsável pela execução do serviço (auth.users)';

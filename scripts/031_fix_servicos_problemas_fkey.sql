-- Fix: Corrigir foreign key de culpado_funcionario_id em servicos_problemas
-- Problema: Está apontando para lojas_usuarios(id) quando deveria apontar para auth.users(id)

-- 1. Remover a constraint antiga
ALTER TABLE public.servicos_problemas
DROP CONSTRAINT IF EXISTS servicos_problemas_culpado_funcionario_id_fkey;

-- 2. Adicionar a constraint correta apontando para auth.users
ALTER TABLE public.servicos_problemas
ADD CONSTRAINT servicos_problemas_culpado_funcionario_id_fkey
  FOREIGN KEY (culpado_funcionario_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 3. Verificar a constraint (sintaxe correta PostgreSQL)
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' 
  AND table_name = 'servicos_problemas'
  AND column_name = 'culpado_funcionario_id';


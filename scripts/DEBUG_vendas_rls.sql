-- Script de diagnóstico para políticas RLS de vendas
-- Execute este script no Supabase SQL Editor para diagnosticar o problema

-- 1. Verificar usuário autenticado
SELECT 
  auth.uid() as user_id,
  auth.email() as user_email;

-- 2. Verificar lojas do usuário
SELECT 
  l.id as loja_id,
  l.nome as loja_nome,
  l.dono_id,
  CASE 
    WHEN l.dono_id = auth.uid() THEN 'SIM - É DONO'
    ELSE 'NÃO'
  END as eh_dono
FROM public.lojas l
WHERE l.dono_id = auth.uid();

-- 3. Verificar relação lojas_usuarios
SELECT 
  lu.loja_id,
  l.nome as loja_nome,
  lu.usuario_id,
  CASE 
    WHEN lu.usuario_id = auth.uid() THEN 'SIM'
    ELSE 'NÃO'
  END as usuario_na_tabela
FROM public.lojas_usuarios lu
JOIN public.lojas l ON l.id = lu.loja_id
WHERE lu.usuario_id = auth.uid();

-- 4. Testar a política de INSERT (simulação)
SELECT 
  l.id as loja_id,
  l.nome,
  CASE 
    WHEN l.dono_id = auth.uid() THEN 'PODE INSERIR (dono)'
    WHEN EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE loja_id = l.id AND usuario_id = auth.uid()
    ) THEN 'PODE INSERIR (lojas_usuarios)'
    ELSE 'NÃO PODE INSERIR'
  END as permissao_insert
FROM public.lojas l
WHERE l.dono_id = auth.uid() 
   OR EXISTS (
     SELECT 1 FROM public.lojas_usuarios
     WHERE loja_id = l.id AND usuario_id = auth.uid()
   );

-- 5. Verificar se há algum problema com a tabela lojas_usuarios
SELECT COUNT(*) as total_registros_lojas_usuarios
FROM public.lojas_usuarios;

-- 6. Verificar estrutura da tabela lojas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lojas'
ORDER BY ordinal_position;

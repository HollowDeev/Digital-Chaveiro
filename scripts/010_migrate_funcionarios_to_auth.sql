-- Migração para linkar funcionários existentes em lojas_credenciais_funcionarios com Supabase Auth
-- Este script tenta linkar registros sem auth_user_id aos usuários existentes no Auth
-- ou cria novos usuários (via trigger ou aplicação) e os linka

-- IMPORTANTE: Este é um script PREPARATÓRIO (sem ação destrutiva)
-- Próximos passos:
-- 1. Executar este script no SQL Editor do Supabase (cria view temporária para diagnóstico)
-- 2. Executar app/api/lojas/migrate-employees/route.ts (Node.js) para criar/linkar users

-- View temporária: mostra credenciais sem auth_user_id e se existe user no Auth com mesmo email
create or replace view public.v_funcionarios_sem_auth as
select
  fcf.id,
  fcf.loja_id,
  fcf.email,
  fcf.auth_user_id,
  au.id as auth_id_encontrado,
  case
    when fcf.auth_user_id is not null then 'JÁ_LINKADO'
    when au.id is not null then 'PODE_LINKAR'
    else 'PRECISA_CRIAR_AUTH'
  end as status
from public.lojas_credenciais_funcionarios fcf
left join auth.users au on au.email = fcf.email
where fcf.loja_id is not null
order by fcf.created_at desc;

-- Após executar a view acima, verifique os resultados:
-- select * from v_funcionarios_sem_auth where status != 'JÁ_LINKADO';

-- Depois, use o endpoint POST /api/lojas/migrate-employees para:
-- 1. Linkar os que têm auth user (status = 'PODE_LINKAR')
-- 2. Criar auth users para os que faltam (status = 'PRECISA_CRIAR_AUTH')
-- 3. Criar entradas em lojas_usuarios para todos que foram lincados

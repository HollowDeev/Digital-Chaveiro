-- Script para corrigir dados de lojas_usuarios que estão com campos NULL
-- Este script preenche os campos nome, email e cargo para registros existentes

-- Atualizar donos que não têm nome preenchido
-- Busca o nome do user_metadata do auth.users
UPDATE public.lojas_usuarios lu
SET 
    nome = COALESCE(
        (SELECT raw_user_meta_data->>'nome' FROM auth.users WHERE id = lu.usuario_id),
        (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = lu.usuario_id),
        (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = lu.usuario_id),
        'Usuário'
    ),
    email = COALESCE(lu.email, (SELECT email FROM auth.users WHERE id = lu.usuario_id)),
    cargo = COALESCE(lu.cargo, 
        CASE 
            WHEN lu.nivel_acesso = 'dono' THEN 'Dono'
            WHEN lu.nivel_acesso = 'gerente' THEN 'Gerente'
            ELSE 'Funcionário'
        END
    ),
    data_admissao = COALESCE(lu.data_admissao, lu.created_at::date),
    ativo = COALESCE(lu.ativo, true)
WHERE lu.nome IS NULL OR lu.nome = '';

-- Atualizar funcionários usando dados de lojas_credenciais_funcionarios se existirem
UPDATE public.lojas_usuarios lu
SET 
    email = COALESCE(lu.email, lcf.email)
FROM public.lojas_credenciais_funcionarios lcf
WHERE lcf.auth_user_id = lu.usuario_id
  AND lu.email IS NULL;

-- Verificar resultados
SELECT 
    lu.id,
    lu.nome,
    lu.email,
    lu.cargo,
    lu.nivel_acesso,
    lu.ativo,
    l.nome as loja_nome
FROM public.lojas_usuarios lu
JOIN public.lojas l ON l.id = lu.loja_id
ORDER BY lu.created_at DESC;

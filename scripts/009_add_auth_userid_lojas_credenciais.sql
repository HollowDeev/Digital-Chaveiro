-- Adiciona coluna auth_user_id à tabela lojas_credenciais_funcionarios para referenciar o usuário criado no Auth
alter table public.lojas_credenciais_funcionarios
  add column if not exists auth_user_id uuid references auth.users(id);

-- Nota: esta migração apenas adiciona a coluna. Para popular retroativamente, é necessário criar manualmente usuários no Auth e atualizar os registros.

-- Adicionar campos para armazenar informações dos funcionários na tabela lojas_usuarios
-- Isso permite manter dados de funcionários sem depender de auth.users

-- Adicionar novos campos à tabela lojas_usuarios
alter table public.lojas_usuarios
add column if not exists nome text,
add column if not exists email text,
add column if not exists telefone text,
add column if not exists cargo text,
add column if not exists salario numeric(10, 2) default 0,
add column if not exists data_admissao date default current_date,
add column if not exists ativo boolean default true;

-- Comentários explicativos
comment on column public.lojas_usuarios.nome is 'Nome completo do funcionário';
comment on column public.lojas_usuarios.email is 'Email do funcionário (pode ser diferente do email de autenticação)';
comment on column public.lojas_usuarios.telefone is 'Telefone de contato do funcionário';
comment on column public.lojas_usuarios.cargo is 'Cargo ou função do funcionário';
comment on column public.lojas_usuarios.salario is 'Salário mensal do funcionário';
comment on column public.lojas_usuarios.data_admissao is 'Data de admissão do funcionário';
comment on column public.lojas_usuarios.ativo is 'Indica se o funcionário está ativo';

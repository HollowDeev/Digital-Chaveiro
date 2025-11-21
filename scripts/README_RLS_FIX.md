# 🔐 Correção de Políticas RLS (Row Level Security)

## 🐛 Problema Identificado

**Erro:** `403 Forbidden` ao tentar criar/visualizar produtos e serviços no Supabase

**Causa:** As políticas RLS (Row Level Security) estavam escritas de forma que verificavam se o usuário estava na tabela `lojas_usuarios` **OU** era dono da loja em uma única subconsulta aninhada. Isso causava problemas de lógica, pois o dono da loja **não** está registrado na tabela `lojas_usuarios` (apenas funcionários adicionados estão).

### Estrutura das Tabelas

```
lojas
├── id
├── dono_id (referencia auth.users) ← DONO DA LOJA
└── ...

lojas_usuarios (apenas funcionários adicionados)
├── loja_id
├── usuario_id (referencia auth.users)
├── nivel_acesso ('dono', 'gerente', 'funcionario')
└── ...
```

### Problema nas Policies Antigas

```sql
-- ❌ ERRADO - Lógica aninhada confusa
create policy "..."
  on public.produtos for select
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and (
        dono_id = auth.uid() or  -- ← Confuso: dentro do WHERE de lojas
        exists (
          select 1 from public.lojas_usuarios
          where loja_id = lojas.id and usuario_id = auth.uid()
        )
      )
    )
  );
```

## ✅ Solução Implementada

Separamos as verificações em duas consultas `EXISTS` independentes:

```sql
-- ✅ CORRETO - Verificações separadas
create policy "Usuários podem ver produtos das suas lojas"
  on public.produtos for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = produtos.loja_id 
      and lojas.dono_id = auth.uid()  -- ← Dono verifica aqui
    )
    or  -- ← OU separado
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = produtos.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()  -- ← Funcionários verificam aqui
    )
  );
```

## 📋 Scripts de Correção

Criamos 3 scripts SQL para corrigir o problema:

### 1. `013_fix_produtos_policies.sql`
Corrige apenas as policies da tabela `produtos`

### 2. `014_fix_servicos_policies.sql`
Corrige apenas as policies da tabela `servicos`

### 3. `015_fix_all_rls_policies.sql` ⭐ **RECOMENDADO**
**Script consolidado que corrige TODAS as tabelas de uma vez:**
- ✅ produtos
- ✅ servicos
- ✅ clientes
- ✅ vendas
- ✅ vendas_itens
- ✅ categorias_contas
- ✅ contas_pagar
- ✅ parcelas_receber
- ✅ categorias_perdas
- ✅ perdas

## 🚀 Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `015_fix_all_rls_policies.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`
6. Aguarde a mensagem de sucesso

### Opção 2: Via CLI do Supabase

```bash
# Navegar até a pasta do projeto
cd "C:\Users\Thaua\Documents\Programação\Digital Chaveiro"

# Executar o script
supabase db reset --db-url "sua-connection-string"
```

### Opção 3: Via psql (PostgreSQL CLI)

```bash
psql "postgresql://..." -f scripts/015_fix_all_rls_policies.sql
```

## 🔍 Verificação

Após executar o script, você pode verificar se as policies foram aplicadas corretamente:

```sql
-- Ver todas as policies de produtos
SELECT * FROM pg_policies WHERE tablename = 'produtos';

-- Ver todas as policies de serviços
SELECT * FROM pg_policies WHERE tablename = 'servicos';
```

## 📊 Impacto das Mudanças

### Antes (❌ Não funcionava)
- Donos não conseguiam criar/ver produtos
- Erro 403 Forbidden
- RLS bloqueando acesso legítimo

### Depois (✅ Funcionando)
- Donos têm acesso completo aos dados da sua loja
- Funcionários têm acesso baseado em `nivel_acesso`
- Gerentes podem INSERT/UPDATE
- Funcionários podem apenas SELECT

## 🔐 Níveis de Acesso

| Ação | Dono | Gerente | Funcionário |
|------|------|---------|-------------|
| SELECT (Ver) | ✅ | ✅ | ✅ |
| INSERT (Criar) | ✅ | ❌* | ❌ |
| UPDATE (Editar) | ✅ | ✅ | ❌ |
| DELETE (Deletar) | ✅ | ❌ | ❌ |

*Gerentes podem inserir em algumas tabelas como produtos e serviços

## ⚠️ Importante

- **Backup:** Sempre faça backup do banco antes de executar scripts de alteração
- **Teste:** Após executar, teste criar um produto e um serviço
- **RLS:** As políticas RLS são cruciais para segurança - não desabilite o RLS!

## 📝 Próximos Passos

Após executar o script `015_fix_all_rls_policies.sql`:

1. Atualize a página do seu aplicativo
2. Tente criar um novo produto
3. Tente criar um novo serviço
4. Verifique se os dados aparecem corretamente

Se ainda houver problemas, verifique:
- Se o usuário está autenticado (`auth.uid()` não é null)
- Se a loja foi criada corretamente com `dono_id = auth.uid()`
- Se as credenciais do Supabase estão corretas no `.env.local`

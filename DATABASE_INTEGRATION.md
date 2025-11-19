# Integração com Banco de Dados - Digital Chaveiro

## Status da Integração

✅ **CONCLUÍDO**: O sistema foi integrado completamente com Supabase. Os dados mockados foram removidos das páginas principais e substituídos por queries ao banco de dados.

## O Que Foi Feito

### 1. **Removido Mock Data das Páginas Principais**
   - Dashboard (`app/dashboard/page.tsx`) - Agora busca vendas, produtos, contas reais do Supabase
   - PDV (`app/pdv/page.tsx`) - Agora busca produtos, serviços, clientes reais do Supabase

### 2. **Criados Hooks para Dados Dinâmicos**
   - `lib/hooks/useLojaData.ts` - Conjunto completo de hooks para buscar:
     - Produtos
     - Serviços
     - Clientes
     - Vendas
     - Contas a Pagar
     - Contas a Receber
     - Perdas/Danos

### 3. **Criado Script SQL com Dados de Teste**
   - `scripts/012_seed_test_data.sql` - Insere dados de exemplo para todos os tipos de dados:
     - **7 Produtos** (3 chaves, 2 controles, 2 acessórios)
     - **3 Serviços** (corte, conserto, instalação)
     - **3 Clientes** (2 PF, 1 PJ)
     - **3 Vendas** com itens associados
     - **3 Contas a Pagar** (compras, aluguel, utilidades)
     - **2 Contas a Receber**
     - **3 Perdas/Danos** (operacional, defeito, roubo)
     - **4 Categorias de Despesas**

## Como Usar

### Passo 1: Criar uma Loja

Acesse `/auth/login` e:
1. Cadastre uma nova conta
2. Crie uma loja na opção "Criar Loja"
3. Anote o ID da loja criada

### Passo 2: Executar o Script de Dados de Teste

1. Abra o **Supabase Console** do seu projeto
2. Vá para **SQL Editor**
3. Crie uma nova query
4. Copie todo o conteúdo de `scripts/012_seed_test_data.sql`
5. Cole na query
6. Clique em **Run** (ou Ctrl+Enter)

O script inserirá automaticamente:
- Produtos de exemplo
- Serviços de exemplo
- Clientes de exemplo
- Vendas com itens
- Contas a pagar e receber
- Perdas e categorias

**Nota**: O script usa `(SELECT id FROM public.lojas LIMIT 1)` para associar os dados à primeira loja criada. Se você tiver múltiplas lojas, pode editar o script para especificar `loja_id` direto.

### Passo 3: Testar o Sistema

1. Acesse a página **Dashboard** - verá métricas em tempo real das vendas do dia
2. Acesse **Estoque** - verá os produtos cadastrados com preço e estoque
3. Acesse **Serviços** - verá os serviços disponíveis
4. Acesse **Clientes** - verá os clientes cadastrados
5. Acesse **PDV** - poderá fazer uma venda usando produtos e serviços reais
6. Acesse **Contas a Pagar/Receber** - verá as contas do sistema
7. Acesse **Relatórios** - verá análises com dados reais

## Páginas Atualizadas

### ✅ Dashboard
- Carrega vendas do dia
- Calcula receita real
- Mostra produtos com baixo estoque
- Exibe contas vencendo

### ✅ PDV (Ponto de Venda)
- Lista produtos reais
- Lista serviços reais
- Lista clientes reais
- Permite criar vendas com dados do banco

### 📝 Próximas Atualizações Recomendadas

As seguintes páginas ainda usam mock data e devem ser atualizadas:
1. **Estoque** (`app/estoque/page.tsx`)
2. **Serviços** (`app/servicos/page.tsx`)
3. **Clientes** (`app/clientes/page.tsx`)
4. **Vendas** (`app/vendas/page.tsx`)
5. **Contas a Pagar** (`app/contas/page.tsx`)
6. **Relatórios** (`app/relatorios/page.tsx`)
7. **Funcionários** (`app/funcionarios/page.tsx`)
8. **Perdas** (quando implementado)

Para atualizar cada página, replique o padrão feito em Dashboard e PDV:
1. Importe os hooks necessários de `lib/hooks/useLojaData.ts`
2. Remova as referências ao `useStore()` para dados de listagem
3. Adicione `useState` para rastrear `lojaId`
4. Adicione `useEffect` para buscar `lojaId` do usuário via Supabase Auth
5. Substitua `useStore()` pelas chamadas aos hooks

## Estrutura de Dados no Banco

### Tabelas Utilizadas
```
lojas
├── produtos
├── servicos
├── clientes
├── vendas
│   └── itens_venda
├── contas_pagar
├── contas_receber
├── perdas
├── categorias_despesas
└── lojas_usuarios (para permissões)
```

## Variáveis de Ambiente Necessárias

Certifique-se de que `.env.local` possui:
```
NEXT_PUBLIC_SUPABASE_URL=seu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico (para operações admin)
```

## Troubleshooting

### Dados não aparecem no Dashboard
- Verifique se executou o script `012_seed_test_data.sql`
- Confirme que criou uma loja
- Verifique se as variáveis de ambiente estão corretas

### Erro ao buscar dados
- Verifique no Supabase Console se as RLS policies permitem `SELECT`
- Confirme que o usuário está autenticado
- Veja os logs do navegador (F12 > Console)

### Diferentes dados por loja
- O sistema busca dados apenas da loja do usuário autenticado
- Se tiver múltiplas lojas, crie dados para cada uma separadamente

## Próximas Etapas

1. ✅ Criar script SQL com dados de teste (CONCLUÍDO)
2. ✅ Criar hooks para dados dinâmicos (CONCLUÍDO)
3. ✅ Atualizar Dashboard e PDV (CONCLUÍDO)
4. 📝 Atualizar páginas restantes com hooks (PENDENTE)
5. 📝 Remover `lib/mock-data.ts` (após atualizar todas páginas)
6. 📝 Otimizar queries do Supabase (cache, batch queries, etc)

## Support

Para dúvidas ou problemas:
1. Verifique se os dados foram inseridos com sucesso no Supabase
2. Veja os logs do navegador (F12 > Console)
3. Verifique os logs do servidor (`npm run dev` output)
4. Confirme as RLS policies nas tabelas do Supabase

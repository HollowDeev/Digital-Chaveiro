# Integração PDV com Módulo de Serviços

## Visão Geral

Este documento explica como integrar o PDV para criar automaticamente registros de serviços realizados quando uma venda contém itens de serviço.

## Modificações Necessárias no PDV

### 1. Identificar Itens de Serviço

No arquivo `app/pdv/page.tsx`, após criar uma venda com sucesso, precisamos:

1. Identificar quais itens da venda são serviços (não produtos)
2. Criar registros em `servicos_realizados` para cada serviço vendido

### 2. Código de Integração

Adicione este código após a criação bem-sucedida da venda:

```typescript
// Após criar a venda com sucesso
const { data: vendaData } = await supabase
  .from("vendas")
  .insert({
    loja_id: lojaId,
    cliente_id: clienteId,
    funcionario_id: funcionarioId,
    subtotal,
    desconto,
    total,
    forma_pagamento: formaPagamento,
    status: "concluida",
  })
  .select()
  .single()

if (vendaData) {
  // Inserir itens da venda
  for (const item of carrinho) {
    await supabase.from("vendas_itens").insert({
      venda_id: vendaData.id,
      tipo: item.tipo, // 'produto' ou 'servico'
      item_id: item.id, // ID do produto ou serviço
      nome: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      subtotal: item.preco * item.quantidade,
    })

    // Se for um serviço, criar registro em servicos_realizados
    if (item.tipo === "servico") {
      await supabase.from("servicos_realizados").insert({
        loja_id: lojaId,
        venda_id: vendaData.id,
        servico_id: item.id,
        cliente_id: clienteId,
        status: "aberto",
        data_inicio: new Date().toISOString(),
        // Opcional: adicionar data prevista baseada na duracao_estimada
        data_prevista_conclusao: item.duracao_estimada 
          ? new Date(Date.now() + item.duracao_estimada * 60 * 60 * 1000).toISOString()
          : null,
      })
    }
  }
}
```

### 3. Modificação Completa da Função handleFinalizarVenda

Aqui está a função completa modificada:

```typescript
const handleFinalizarVenda = async () => {
  if (!clienteSelecionado) {
    alert("Selecione um cliente")
    return
  }

  if (carrinho.length === 0) {
    alert("Adicione itens ao carrinho")
    return
  }

  if (!formaPagamento) {
    alert("Selecione a forma de pagamento")
    return
  }

  setFinalizando(true)

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Usuário não autenticado")
    }

    // Buscar funcionário atual
    const { data: funcionario } = await supabase
      .from("lojas_usuarios")
      .select("id")
      .eq("usuario_id", user.id)
      .eq("loja_id", lojaId)
      .single()

    if (!funcionario) {
      throw new Error("Funcionário não encontrado")
    }

    // Buscar caixa aberto
    const { data: caixa } = await supabase
      .from("caixas")
      .select("id")
      .eq("loja_id", lojaId)
      .eq("status", "aberto")
      .single()

    if (!caixa) {
      throw new Error("Não há caixa aberto. Abra um caixa antes de realizar vendas.")
    }

    // Calcular totais
    const subtotal = carrinho.reduce(
      (acc, item) => acc + item.preco * item.quantidade,
      0
    )
    const total = subtotal - desconto

    // Criar venda
    const { data: vendaData, error: vendaError } = await supabase
      .from("vendas")
      .insert({
        loja_id: lojaId,
        cliente_id: clienteSelecionado.id,
        funcionario_id: funcionario.id,
        subtotal,
        desconto,
        total,
        forma_pagamento: formaPagamento,
        status: formaPagamento === "prazo" ? "pendente" : "concluida",
      })
      .select()
      .single()

    if (vendaError) throw vendaError

    // Inserir itens da venda e criar serviços realizados
    for (const item of carrinho) {
      // Inserir item da venda
      await supabase.from("vendas_itens").insert({
        venda_id: vendaData.id,
        tipo: item.tipo, // 'produto' ou 'servico'
        item_id: item.id, // ID do produto ou serviço
        nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.preco * item.quantidade,
      })

      // Se for serviço, criar registro em servicos_realizados
      if (item.tipo === "servico") {
        // Buscar duração estimada do serviço
        const { data: servicoData } = await supabase
          .from("servicos")
          .select("duracao_estimada")
          .eq("id", item.id)
          .single()

        // Calcular data prevista (se houver duração estimada)
        let dataPrevista = null
        if (servicoData?.duracao_estimada) {
          const minutosEstimados = servicoData.duracao_estimada
          dataPrevista = new Date(
            Date.now() + minutosEstimados * 60 * 1000
          ).toISOString()
        }

        await supabase.from("servicos_realizados").insert({
          loja_id: lojaId,
          venda_id: vendaData.id,
          servico_id: item.id,
          cliente_id: clienteSelecionado.id,
          status: "aberto",
          data_inicio: new Date().toISOString(),
          data_prevista_conclusao: dataPrevista,
        })
      }

      // Se for produto, atualizar estoque
      if (item.tipo === "produto") {
        await supabase.rpc("atualizar_estoque_produto", {
          p_produto_id: item.id,
          p_quantidade: -item.quantidade,
        })
      }
    }

    // Registrar movimentação no caixa (apenas se for à vista)
    if (formaPagamento !== "prazo") {
      await supabase.from("caixa_movimentacoes").insert({
        caixa_id: caixa.id,
        tipo: "entrada",
        categoria: "venda",
        valor: total,
        descricao: `Venda #${vendaData.id.slice(0, 8)} - ${clienteSelecionado.nome}`,
        venda_id: vendaData.id,
      })
    }

    // Se for venda a prazo, criar parcelas a receber
    if (formaPagamento === "prazo" && numeroParcelas > 0) {
      const valorParcela = total / numeroParcelas

      for (let i = 1; i <= numeroParcelas; i++) {
        const dataVencimento = new Date()
        dataVencimento.setDate(dataVencimento.getDate() + i * 30)

        await supabase.from("parcelas_receber").insert({
          venda_id: vendaData.id,
          loja_id: lojaId,
          cliente_id: clienteSelecionado.id,
          numero_parcela: i,
          valor: valorParcela,
          data_vencimento: dataVencimento.toISOString(),
          status: "pendente",
        })
      }
    }

    alert("Venda realizada com sucesso!")
    
    // Limpar carrinho e formulário
    setCarrinho([])
    setClienteSelecionado(null)
    setFormaPagamento("")
    setDesconto(0)
    setNumeroParcelas(1)
    
  } catch (error) {
    console.error("Erro ao finalizar venda:", error)
    alert(`Erro ao finalizar venda: ${error.message}`)
  } finally {
    setFinalizando(false)
  }
}
```

## Estrutura dos Dados

### Identificando Tipo de Item

No carrinho, cada item deve ter a propriedade `tipo`:

```typescript
interface ItemCarrinho {
  id: string
  nome: string
  tipo: "produto" | "servico"  // Identificador do tipo
  preco: number
  quantidade: number
  // ... outras propriedades
}
```

### Diferenciando no Momento de Adicionar

Quando adicionar um produto ao carrinho:

```typescript
// Produto
setCarrinho([...carrinho, {
  id: produto.id,
  nome: produto.nome,
  tipo: "produto",
  preco: produto.preco,
  quantidade: 1,
  estoque: produto.estoque,
}])

// Serviço
setCarrinho([...carrinho, {
  id: servico.id,
  nome: servico.nome,
  tipo: "servico",
  preco: servico.preco,
  quantidade: 1,
  duracao_estimada: servico.duracao_estimada,
}])
```

## Tabela vendas_itens

A tabela `vendas_itens` já está configurada corretamente para suportar tanto produtos quanto serviços:

```sql
-- Estrutura atual da tabela (já criada no script 005)
create table if not exists public.vendas_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references public.vendas(id) on delete cascade not null,
  tipo text not null check (tipo in ('produto', 'servico')),
  item_id uuid not null,  -- ID do produto ou serviço
  nome text not null,
  quantidade integer not null,
  preco_unitario decimal(10,2) not null,
  subtotal decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

**Campos importantes:**
- `tipo`: Define se é 'produto' ou 'servico'
- `item_id`: UUID que referencia `produtos.id` (se tipo=produto) ou `servicos.id` (se tipo=servico)
- `nome`: Nome do item (armazenado para histórico)

**Nenhuma alteração necessária!** O script 022 apenas adiciona índices para melhor performance.

## Fluxo Completo

```
1. Cliente escolhe produtos/serviços no PDV
   ↓
2. Funcionário finaliza venda
   ↓
3. Sistema cria registro em "vendas"
   ↓
4. Para cada item do carrinho:
   a) Cria registro em "vendas_itens"
   b) Se item.tipo === "servico":
      - Cria registro em "servicos_realizados"
      - Status: "aberto"
      - Data início: agora
      - Data prevista: calculada pela duração
   c) Se item.tipo === "produto":
      - Atualiza estoque
   ↓
5. Registra movimentação no caixa (se não for a prazo)
   ↓
6. Serviço aparece na página "Serviços" como "Em Aberto"
   ↓
7. Quando funcionário finalizar:
   - Abre modal de finalização
   - Upload de fotos ou registro de problemas
   - Aceite do termo de responsabilidade
   - Status muda para "finalizado"
```

## Testando a Integração

### Teste 1: Venda Simples de Serviço
1. Adicione 1 serviço ao carrinho
2. Finalize a venda
3. Vá para página "Serviços"
4. Verifique se o serviço aparece em "Em Aberto"

### Teste 2: Venda Mista (Produto + Serviço)
1. Adicione 1 produto e 1 serviço ao carrinho
2. Finalize a venda
3. Verifique que:
   - Estoque do produto foi atualizado
   - Serviço aparece em "Serviços" → "Em Aberto"

### Teste 3: Múltiplos Serviços
1. Adicione 3 serviços diferentes ao carrinho
2. Finalize a venda
3. Verifique que os 3 serviços aparecem separadamente

### Teste 4: Finalização de Serviço
1. Vá para "Serviços" → "Em Aberto"
2. Clique em "Finalizar" em um serviço
3. Marque "Sim" para serviço perfeito
4. Faça upload de fotos
5. Selecione funcionário e aceite o termo
6. Verifique que:
   - Serviço sumiu de "Em Aberto"
   - Serviço apareceu em "Histórico"
   - Status = "finalizado"

### Teste 5: Finalização com Problema
1. Finalize um serviço marcando "Não"
2. Adicione pelo menos 1 problema
3. Preencha todos os campos
4. Faça upload de fotos do problema
5. Verifique que o problema foi registrado

## Próximas Melhorias

1. **Notificações**: Notificar funcionário quando serviço está próximo da data prevista
2. **Status "em_andamento"**: Adicionar botão para marcar serviço como em andamento
3. **Cancelamento**: Permitir cancelar serviço com motivo
4. **Reagendamento**: Se houver problema, permitir mudar data prevista
5. **Dashboard**: Adicionar métricas de serviços no dashboard
6. **Relatórios**: Incluir serviços nos relatórios (tempo médio, taxa de problemas, etc.)

# Sistema de Vendas com Serviços - Funcionamento

## Visão Geral

O sistema agora distingue entre **produtos** e **serviços** na hora da venda. A principal diferença é que:

- **Produtos**: São contabilizados como receita imediatamente após a venda
- **Serviços**: Só são contabilizados como receita quando finalizados na página de Serviços

## Fluxo Completo

### 1. Venda no PDV

Quando uma venda contém serviços:

```typescript
// PDV cria a venda normalmente
INSERT INTO vendas (loja_id, cliente_id, total, status, ...)

// Para cada item no carrinho
INSERT INTO vendas_itens (venda_id, tipo, item_id, nome, ...)

// Se item.tipo === "servico"
INSERT INTO servicos_realizados (
  loja_id,
  venda_id, 
  servico_id,
  cliente_id,
  status: "aberto",  // ← IMPORTANTE: Status inicial é "aberto"
  data_inicio: NOW()
)
```

**Importante:** A venda é criada com `status: "concluida"` mas o valor dos serviços **não entra no caixa ainda**.

### 2. Movimentação no Caixa

A movimentação no caixa é registrada **apenas para produtos**:

```typescript
// Calcular total apenas de produtos
const totalProdutos = vendaAtual.itens
  .filter(item => item.tipo === "produto")
  .reduce((acc, item) => acc + item.subtotal, 0)

// Registrar no caixa apenas o valor dos produtos
INSERT INTO caixa_movimentacoes (
  tipo: "entrada",
  valor: totalProdutos - desconto,  // Apenas produtos
  categoria: "Venda - Produtos"
)
```

### 3. Página de Serviços

Na página `/servicos`, o funcionário visualiza:

- **Em Aberto**: Serviços com `status = "aberto"` ou `"em_andamento"`
- **Histórico**: Serviços com `status = "finalizado"`

### 4. Finalização do Serviço

Quando o funcionário clica em "Finalizar":

```typescript
// 1. Atualiza o serviço
UPDATE servicos_realizados SET
  status = "finalizado",
  data_conclusao = NOW(),
  funcionario_responsavel_id = ...

// 2. Registra no caixa o valor do serviço
INSERT INTO caixa_movimentacoes (
  tipo: "entrada",
  categoria: "Venda - Serviço Finalizado",
  valor: servico.preco,
  descricao: "Finalização do serviço: [nome_servico]"
)

// 3. Se houver fotos de comprovação
INSERT INTO servicos_arquivos (tipo: "comprovacao", ...)

// 4. Se houver problemas
INSERT INTO servicos_problemas (...)
INSERT INTO servicos_arquivos (tipo: "problema", ...)
```

## Importante: Cálculos Financeiros

### Total de Vendas

Para calcular o **total de vendas do dia**, você deve considerar:

```typescript
// ERRADO ❌
const totalVendas = vendas.reduce((acc, v) => acc + v.total, 0)

// CORRETO ✅
// 1. Vendas de produtos (já no caixa)
const totalProdutos = vendasItens
  .filter(item => item.tipo === "produto")
  .reduce((acc, item) => acc + item.subtotal, 0)

// 2. Serviços finalizados (já no caixa)
const totalServicos = servicosRealizados
  .filter(s => s.status === "finalizado")
  .reduce((acc, s) => acc + s.servico.preco, 0)

// Total real
const totalVendas = totalProdutos + totalServicos
```

### Serviços Pendentes

Serviços em aberto são **recebíveis futuros**:

```typescript
const servicosPendentes = servicosRealizados
  .filter(s => s.status === "aberto" || s.status === "em_andamento")
  .reduce((acc, s) => acc + s.servico.preco, 0)

console.log(`Você tem R$ ${servicosPendentes} em serviços a finalizar`)
```

## Exemplo Prático

### Venda no PDV
```
Cliente: João Silva
Itens:
  - 2x Chave Simples (Produto) = R$ 20,00
  - 1x Cópia de Chave Codificada (Serviço) = R$ 150,00
  
Total da Venda: R$ 170,00
```

### O que acontece:

1. **Venda criada** com total R$ 170,00
2. **Itens salvos**:
   - `tipo: "produto"`, item_id: chave_simples_id
   - `tipo: "servico"`, item_id: copia_codificada_id
3. **Estoque atualizado**: -2 unidades de Chave Simples
4. **Serviço registrado** em `servicos_realizados` com status "aberto"
5. **Caixa registra**: R$ 20,00 (apenas os produtos)
   - ⚠️ Os R$ 150,00 do serviço **NÃO entram no caixa ainda**

### Quando o Serviço é Finalizado:

```
Funcionário: Maria
Data: 06/12/2025 15:30
Serviço ocorreu perfeitamente? ✅ Sim
Fotos de comprovação: 3 arquivos
```

1. **Status atualizado** para "finalizado"
2. **Caixa registra**: R$ 150,00 (valor do serviço)
   - 💰 Agora sim entra no caixa!
3. **Fotos salvas** no storage

### Resultado Final:

- **Caixa total**: R$ 170,00 (R$ 20 produtos + R$ 150 serviço)
- **Venda total**: R$ 170,00 ✅
- **Serviço finalizado**: ✅ Com comprovação

## Relatórios e Dashboard

### Dashboard - Cards de Métricas

```typescript
// Receita Hoje (só o que entrou no caixa)
const receitaHoje = caixaMovimentacoes
  .filter(m => m.tipo === "entrada" && isToday(m.created_at))
  .reduce((acc, m) => acc + m.valor, 0)

// Serviços Pendentes (recebíveis futuros)
const servicosPendentes = servicosRealizados
  .filter(s => s.status !== "finalizado")
  .length

// Card sugerido:
<Card>
  <CardTitle>Serviços Pendentes</CardTitle>
  <CardContent>
    <p className="text-2xl">{servicosPendentes}</p>
    <p className="text-sm text-muted">
      R$ {valorServicosPendentes.toFixed(2)} a receber
    </p>
  </CardContent>
</Card>
```

### Relatórios

No módulo de Relatórios, você pode adicionar:

```typescript
// Filtrar por tipo de receita
const receitaProdutos = movimentacoes
  .filter(m => m.categoria?.includes("Produto"))
  .reduce((acc, m) => acc + m.valor, 0)

const receitaServicos = movimentacoes
  .filter(m => m.categoria?.includes("Serviço"))
  .reduce((acc, m) => acc + m.valor, 0)

// Taxa de conclusão de serviços
const servicosFinalizados = servicosRealizados.filter(s => s.status === "finalizado").length
const totalServicos = servicosRealizados.length
const taxaConclusao = (servicosFinalizados / totalServicos) * 100

console.log(`Taxa de conclusão: ${taxaConclusao.toFixed(1)}%`)
```

## Considerações Importantes

### 1. Cliente Obrigatório para Serviços

É recomendável tornar o cliente obrigatório quando há serviços no carrinho:

```typescript
// No PDV
if (vendaAtual.itens.some(item => item.tipo === "servico")) {
  if (!vendaAtual.clienteId || vendaAtual.clienteId === "none") {
    mostrarToast("⚠️ Cliente é obrigatório para vendas com serviços!")
    return
  }
}
```

### 2. Cancelamento de Vendas

Se uma venda for cancelada e continha serviços:

```typescript
// Atualizar status dos serviços relacionados
UPDATE servicos_realizados 
SET status = "cancelado"
WHERE venda_id = venda_cancelada_id
```

### 3. Integração com Contas a Receber

Se a venda foi a prazo e contém serviços:

- As parcelas devem considerar o valor **total** (produtos + serviços)
- Mas o serviço só entra no caixa quando finalizado
- Isso significa que você recebe a parcela mas só finaliza o serviço depois

**Sugestão**: Adicionar validação para não permitir receber parcela antes de finalizar serviço:

```typescript
if (servicosAbertos.length > 0) {
  alert("Finalize os serviços antes de receber esta parcela")
  return
}
```

## Próximos Passos

1. **Dashboard**: Adicionar card "Serviços Pendentes"
2. **Relatórios**: Separar receita de produtos vs serviços
3. **Notificações**: Alertar quando serviço está atrasado
4. **Políticas**: Definir prazo máximo para finalizar serviço
5. **Comissões**: Calcular comissão de funcionários apenas após finalizar serviço

## SQL Úteis

### Ver serviços não finalizados
```sql
SELECT 
  sr.id,
  s.nome as servico,
  c.nome as cliente,
  sr.data_inicio,
  sr.status,
  v.total as valor_venda
FROM servicos_realizados sr
JOIN servicos s ON s.id = sr.servico_id
JOIN clientes c ON c.id = sr.cliente_id
JOIN vendas v ON v.id = sr.venda_id
WHERE sr.status IN ('aberto', 'em_andamento')
ORDER BY sr.data_inicio;
```

### Ver receita real do dia
```sql
SELECT 
  SUM(valor) as receita_total
FROM caixa_movimentacoes
WHERE tipo = 'entrada'
AND DATE(created_at) = CURRENT_DATE;
```

### Ver valor em serviços pendentes
```sql
SELECT 
  COUNT(*) as quantidade,
  SUM(s.preco) as valor_total
FROM servicos_realizados sr
JOIN servicos s ON s.id = sr.servico_id
WHERE sr.status IN ('aberto', 'em_andamento');
```

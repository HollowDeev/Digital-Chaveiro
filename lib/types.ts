// Tipos para o sistema de gestão comercial

export type Produto = {
  id: string
  nome: string
  codigo: string
  preco: number
  custoUnitario: number
  estoque: number
  categoria: string
  descricao?: string
  imagem?: string
  ativo: boolean
}

export type Servico = {
  id: string
  nome: string
  codigo: string
  preco: number
  duracao?: number // em minutos
  categoria: string
  descricao?: string
  ativo: boolean
  custos?: Array<{
    id: string
    nome: string
    valor: number
    descricao?: string
  }>
}

export type Cliente = {
  id: string
  nome: string
  email?: string
  telefone?: string
  cpf?: string
  cpf_cnpj?: string
  endereco?: string
  dataCadastro: string
  ultimaCompra?: string
}

export type Funcionario = {
  id: string
  nome: string
  email: string
  telefone: string
  cargo: string
  salario: number
  dataAdmissao: string
  ativo: boolean
  foto?: string
}

export type ItemVenda = {
  tipo: "produto" | "servico"
  id: string
  nome: string
  preco: number
  quantidade: number
  subtotal: number
}

export type Venda = {
  id: string
  data: string
  clienteId?: string
  clienteNome?: string
  funcionarioId: string
  funcionarioNome: string
  itens: ItemVenda[]
  subtotal: number
  desconto: number
  total: number
  formaPagamento: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outros"
  status: "concluida" | "cancelada"
}

export type MovimentacaoCaixa = {
  id: string
  data: string
  tipo: "entrada" | "saida"
  categoria: "venda" | "despesa" | "sangria" | "suprimento" | "outros"
  valor: number
  descricao: string
  funcionarioId: string
  funcionarioNome: string
  vendaId?: string
}

export type Caixa = {
  id: string
  dataAbertura: string
  dataFechamento?: string
  funcionarioAberturaId: string
  funcionarioAberturaNome: string
  funcionarioFechamentoId?: string
  funcionarioFechamentoNome?: string
  valorAbertura: number
  valorFechamento?: number
  status: "aberto" | "fechado"
  movimentacoes: MovimentacaoCaixa[]
}

export type ResumoVendas = {
  totalVendas: number
  totalServicos: number
  totalReceita: number
  mediaTransacao: number
}

export type CategoriaDespesa = {
  id: string
  nome: string
  cor: string
  ativo: boolean
}

export type ContaPagar = {
  id: string
  descricao: string
  valor: number
  dataVencimento: string
  dataPagamento?: string
  categoriaId: string
  categoria: string
  status: "pendente" | "paga" | "atrasada"
  recorrente: boolean
  observacoes?: string
}

export type ContaReceber = {
  id: string
  descricao: string
  valor: number
  dataVencimento: string
  dataRecebimento?: string
  clienteId?: string
  clienteNome?: string
  vendaId?: string
  status: "pendente" | "recebida" | "atrasada"
  observacoes?: string
}

export type VendaPrazo = {
  id: string
  vendaId: string
  clienteId: string
  clienteNome: string
  valorTotal: number
  valorPago: number
  valorRestante: number
  dataVenda: string
  dataVencimento: string
  status: "pendente" | "parcial" | "quitada" | "atrasada"
  parcelas: ParcelaVendaPrazo[]
}

export type ParcelaVendaPrazo = {
  id: string
  numero: number
  valor: number
  dataVencimento: string
  dataPagamento?: string
  status: "pendente" | "paga" | "atrasada"
}

export type Perda = {
  id: string
  produtoId: string
  produtoNome: string
  quantidade: number
  custoUnitario: number
  custoTotal: number
  funcionarioId: string
  funcionarioNome?: string
  categoriaId: string
  categoria?: string
  categoriaNome?: string
  motivo: string
  data: string
  observacoes?: string
}

export type CategoriaPerda = {
  id: string
  nome: string
  descricao?: string
  cor?: string
  ativo?: boolean
}

export type HistoricoFuncionario = {
  vendas: Venda[]
  perdas: Perda[]
  totalVendas: number
  totalPerdas: number
  valorTotalVendas: number
  custoTotalPerdas: number
}

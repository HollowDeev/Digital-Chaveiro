# Módulo de Serviços - Digital Chaveiro

## Visão Geral

O módulo de Serviços foi criado para gerenciar todo o ciclo de vida dos serviços prestados pela chaveiro, desde o registro inicial no PDV até a finalização com comprovação ou registro de problemas.

## Arquivos Criados

### Scripts SQL
- `scripts/020_create_servicos_realizados.sql` - Cria as tabelas principais do módulo
- `scripts/021_create_storage_bucket.sql` - Configura o bucket de storage para upload de fotos

### Páginas
- `app/servicos/page.tsx` - Página principal do módulo
- `app/servicos/loading.tsx` - Skeleton de carregamento

### Hooks
Adicionados ao `lib/hooks/useLojaData.ts`:
- `useServicosRealizados()` - Busca serviços realizados
- `useMotivosProblemas()` - Busca motivos de problemas
- `useProblemasServico()` - Busca problemas de um serviço
- `useArquivosServico()` - Busca arquivos de um serviço

## Estrutura do Banco de Dados

### Tabela: servicos_realizados
Armazena instâncias de serviços vendidos e em andamento.

**Campos principais:**
- `id` - UUID único
- `loja_id` - Referência à loja
- `venda_id` - Referência à venda original
- `servico_id` - Referência ao tipo de serviço
- `cliente_id` - Referência ao cliente
- `funcionario_responsavel_id` - Funcionário que finalizou
- `status` - aberto | em_andamento | finalizado | cancelado
- `data_inicio` - Data de início do serviço
- `data_prevista_conclusao` - Previsão de conclusão
- `data_conclusao` - Data efetiva de conclusão
- `observacoes` - Observações gerais

### Tabela: servicos_arquivos
Armazena fotos de comprovação ou de problemas.

**Campos principais:**
- `id` - UUID único
- `servico_realizado_id` - Referência ao serviço
- `tipo` - comprovacao | problema
- `url` - URL pública do arquivo
- `nome_arquivo` - Nome original do arquivo
- `tamanho` - Tamanho em bytes
- `mime_type` - Tipo MIME
- `uploaded_by` - Usuário que fez upload

### Tabela: motivos_problemas_servicos
Categorias de problemas que podem ocorrer.

**Campos principais:**
- `id` - UUID único
- `loja_id` - Referência à loja
- `nome` - Nome do motivo
- `descricao` - Descrição detalhada
- `ativo` - Se o motivo está ativo

**Motivos padrão inseridos:**
- Peça com defeito
- Cliente forneceu informação errada
- Erro de execução
- Falta de ferramenta adequada

### Tabela: servicos_problemas
Registros de problemas ocorridos durante serviços.

**Campos principais:**
- `id` - UUID único
- `servico_realizado_id` - Referência ao serviço
- `motivo_id` - Referência ao motivo
- `culpado` - funcionario | cliente | outros
- `culpado_funcionario_id` - Se culpado for funcionário, qual
- `descricao` - Descrição detalhada do problema
- `custo_extra` - Custo adicional gerado
- `registrado_por` - Usuário que registrou
- `termo_aceito` - Se o termo foi aceito
- `termo_aceito_em` - Timestamp da aceitação
- `data_problema` - Data do problema

## Funcionalidades

### 1. Visualização de Serviços

#### Serviços em Aberto
- Lista todos os serviços com status "aberto" ou "em_andamento"
- Mostra informações do serviço, cliente, datas
- Botão para finalizar cada serviço

#### Histórico
- Lista todos os serviços finalizados
- Filtro por nome do serviço, cliente ou telefone
- Visualização de datas de início e conclusão

### 2. Finalização de Serviços

Ao clicar em "Finalizar", abre um modal com:

#### Pergunta Principal
**"O serviço ocorreu perfeitamente?"**

##### Se SIM:
- Campo para upload de fotos de comprovação
- Permite múltiplos arquivos
- Preview dos arquivos selecionados
- Remove arquivos antes de enviar

##### Se NÃO:
- Botão "Adicionar Problema" para registrar múltiplos problemas
- Para cada problema:
  - **Motivo do Problema**: Select com motivos cadastrados
  - **Culpado**: funcionario | cliente | outros
  - **Funcionário Responsável**: Se culpado = funcionario
  - **Descrição**: Textarea com detalhes
  - **Custo Extra**: Campo numérico para custos adicionais
  - **Fotos do Problema**: Upload de múltiplas fotos
  - Botão para remover o problema

#### Campos Obrigatórios
- **Funcionário Responsável pelo Registro**: Select com funcionários
- **Termo de Responsabilidade**: Checkbox obrigatório
  - Texto: "Aceito o termo de responsabilidade e confirmo que todas as informações prestadas são verdadeiras"
  - Explicação sobre auditoria com data/hora

### 3. Armazenamento de Arquivos

**Bucket Supabase Storage**: `servicos-arquivos`

**Estrutura de pastas:**
```
servicos-arquivos/
  └── {servico_realizado_id}/
      ├── comprovacao/
      │   └── {timestamp}.{ext}
      └── problema/
          └── {timestamp}.{ext}
```

**Políticas RLS:**
- Usuários autenticados podem fazer upload
- Usuários autenticados podem visualizar
- Usuários autenticados podem deletar

## Fluxo de Trabalho

### 1. Criação do Serviço (PDV)
```typescript
// Quando uma venda com serviço é criada no PDV
await supabase.from("servicos_realizados").insert({
  loja_id: lojaId,
  venda_id: vendaId,
  servico_id: servicoId,
  cliente_id: clienteId,
  status: "aberto",
  data_inicio: new Date().toISOString(),
  data_prevista_conclusao: dataPrevista, // Opcional
})
```

### 2. Finalização Sem Problemas
```typescript
// Atualiza o serviço
await supabase.from("servicos_realizados").update({
  status: "finalizado",
  data_conclusao: new Date().toISOString(),
  funcionario_responsavel_id: funcionarioId,
})

// Upload de fotos de comprovação
for (const arquivo of arquivos) {
  // Upload para storage
  const { data } = await supabase.storage
    .from("servicos-arquivos")
    .upload(path, arquivo)
  
  // Registra na tabela
  await supabase.from("servicos_arquivos").insert({
    servico_realizado_id: servicoId,
    tipo: "comprovacao",
    url: publicUrl,
    nome_arquivo: arquivo.name,
    uploaded_by: user.id,
  })
}
```

### 3. Finalização Com Problemas
```typescript
// Atualiza o serviço
await supabase.from("servicos_realizados").update({
  status: "finalizado",
  data_conclusao: new Date().toISOString(),
  funcionario_responsavel_id: funcionarioId,
})

// Para cada problema
for (const problema of problemas) {
  // Registra o problema
  await supabase.from("servicos_problemas").insert({
    servico_realizado_id: servicoId,
    motivo_id: problema.motivo_id,
    culpado: problema.culpado,
    culpado_funcionario_id: problema.culpado_funcionario_id,
    descricao: problema.descricao,
    custo_extra: problema.custo_extra,
    registrado_por: user.id,
    termo_aceito: true,
    termo_aceito_em: new Date().toISOString(),
  })
  
  // Upload de fotos do problema
  for (const arquivo of problema.arquivos) {
    // Upload e registro similar ao de comprovação
    // mas com tipo: "problema"
  }
}
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas que verificam:

1. **Donos da loja** (`lojas.dono_id = auth.uid()`)
2. **Usuários vinculados** (`lojas_usuarios.usuario_id = auth.uid()`)

### Políticas Aplicadas

**SELECT**: Usuários podem visualizar dados das suas lojas
**INSERT**: Usuários podem inserir dados nas suas lojas
**UPDATE**: Usuários podem atualizar dados das suas lojas

### Termo de Responsabilidade

Todos os registros de problemas exigem:
- Aceitação explícita do termo
- Timestamp da aceitação
- Usuário que registrou

Isso garante auditoria completa e responsabilização.

## Integração com PDV

Para integrar com o PDV, quando uma venda contém serviços:

```typescript
// Após criar a venda
const { data: venda } = await supabase
  .from("vendas")
  .insert({ ... })
  .select()
  .single()

// Para cada item de serviço na venda
for (const item of itensServico) {
  await supabase.from("servicos_realizados").insert({
    loja_id: lojaId,
    venda_id: venda.id,
    servico_id: item.servico_id,
    cliente_id: clienteId,
    status: "aberto",
    data_inicio: new Date().toISOString(),
  })
}
```

## Próximos Passos

1. **Executar os scripts SQL** no Supabase:
   - `020_create_servicos_realizados.sql`
   - `021_create_storage_bucket.sql`

2. **Configurar Storage no Supabase**:
   - Criar bucket `servicos-arquivos`
   - Aplicar políticas RLS

3. **Integrar com PDV**:
   - Adicionar criação de `servicos_realizados` após venda
   - Identificar itens que são serviços na venda

4. **Testes**:
   - Criar serviço no PDV
   - Finalizar com sucesso (upload de fotos)
   - Finalizar com problemas (múltiplos problemas, fotos)
   - Verificar auditoria e timestamps

## Observações

- Todos os uploads são armazenados no Supabase Storage
- URLs são públicas mas restritas por RLS
- Arquivos são organizados por serviço e tipo
- Timestamps automáticos para auditoria
- Termo de responsabilidade garante veracidade das informações

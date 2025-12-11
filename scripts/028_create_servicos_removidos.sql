-- Criar tabela para serviços removidos (soft delete)
CREATE TABLE IF NOT EXISTS public.servicos_removidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_realizado_id UUID NOT NULL,
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  funcionario_responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  motivo_remocao TEXT NOT NULL,
  removido_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  data_remocao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  dados_completos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_servicos_removidos_loja ON public.servicos_removidos(loja_id);
CREATE INDEX IF NOT EXISTS idx_servicos_removidos_data ON public.servicos_removidos(data_remocao);

-- RLS
ALTER TABLE public.servicos_removidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver serviços removidos de suas lojas"
  ON public.servicos_removidos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = servicos_removidos.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = servicos_removidos.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir serviços removidos em suas lojas"
  ON public.servicos_removidos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE public.servicos_removidos IS 'Registro de serviços deletados com motivo (soft delete)';
COMMENT ON COLUMN public.servicos_removidos.dados_completos IS 'JSON com todos os dados do serviço antes da remoção';
COMMENT ON COLUMN public.servicos_removidos.motivo_remocao IS 'Motivo pelo qual o serviço foi removido';

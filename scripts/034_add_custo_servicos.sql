-- Add custo field to servicos table (deprecated - using servicos_custos table instead)
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS custo_unitario DECIMAL(10, 2) DEFAULT 0;

-- Create servicos_custos table for tracking individual cost items
CREATE TABLE IF NOT EXISTS public.servicos_custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  CONSTRAINT servicos_custos_valor_positive CHECK (valor >= 0)
);

-- Enable RLS on servicos_custos
ALTER TABLE public.servicos_custos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for servicos_custos
CREATE POLICY "servicos_custos_select_policy"
  ON public.servicos_custos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.servicos
      WHERE servicos.id = servicos_custos.servico_id
      AND EXISTS (
        SELECT 1 FROM public.lojas
        WHERE lojas.id = servicos.loja_id AND (
          lojas.dono_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = lojas.id AND lojas_usuarios.usuario_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "servicos_custos_insert_policy"
  ON public.servicos_custos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servicos
      WHERE servicos.id = servicos_custos.servico_id
      AND EXISTS (
        SELECT 1 FROM public.lojas
        WHERE lojas.id = servicos.loja_id AND (
          lojas.dono_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = lojas.id AND lojas_usuarios.usuario_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "servicos_custos_update_policy"
  ON public.servicos_custos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.servicos
      WHERE servicos.id = servicos_custos.servico_id
      AND EXISTS (
        SELECT 1 FROM public.lojas
        WHERE lojas.id = servicos.loja_id AND (
          lojas.dono_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = lojas.id AND lojas_usuarios.usuario_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "servicos_custos_delete_policy"
  ON public.servicos_custos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.servicos
      WHERE servicos.id = servicos_custos.servico_id
      AND EXISTS (
        SELECT 1 FROM public.lojas
        WHERE lojas.id = servicos.loja_id AND (
          lojas.dono_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = lojas.id AND lojas_usuarios.usuario_id = auth.uid()
          )
        )
      )
    )
  );

-- Verify tables structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('servicos', 'servicos_custos')
ORDER BY table_name, ordinal_position;

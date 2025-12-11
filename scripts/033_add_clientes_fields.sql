-- Add missing fields to clientes table
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'pf' CHECK (tipo IN ('pf', 'pj'));
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Drop old policies to recreate them
DROP POLICY IF EXISTS "Usuários podem ver clientes das lojas que têm acesso" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Donos podem deletar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem deletar clientes das suas lojas" ON public.clientes;

-- Recreate RLS policies with better logic
CREATE POLICY "clientes_select_policy"
  ON public.clientes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = clientes.loja_id AND (
        lojas.dono_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.lojas_usuarios
          WHERE lojas_usuarios.loja_id = lojas.id AND lojas_usuarios.usuario_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "clientes_insert_policy"
  ON public.clientes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = loja_id AND (
        lojas.dono_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.lojas_usuarios
          WHERE lojas_usuarios.loja_id = lojas.id AND lojas_usuarios.usuario_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "clientes_update_policy"
  ON public.clientes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = clientes.loja_id AND (
        lojas.dono_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.lojas_usuarios
          WHERE lojas_usuarios.loja_id = lojas.id AND lojas_usuarios.usuario_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "clientes_delete_policy"
  ON public.clientes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = clientes.loja_id AND (
        lojas.dono_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.lojas_usuarios
          WHERE lojas_usuarios.loja_id = lojas.id AND lojas_usuarios.usuario_id = auth.uid()
        )
      )
    )
  );

-- Verify clientes table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes'
ORDER BY ordinal_position;

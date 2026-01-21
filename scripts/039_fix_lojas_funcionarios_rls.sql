-- Script para corrigir políticas RLS da tabela lojas
-- Permite que funcionários (via lojas_usuarios) também possam VER as lojas
-- Executar este script no Supabase SQL Editor

-- =====================================================
-- PASSO 1: Remover TODAS as políticas existentes de lojas
-- =====================================================

DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'lojas'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.lojas', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- PASSO 2: Garantir que RLS está habilitado
-- =====================================================
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 3: Criar novas políticas (incluindo funcionários)
-- =====================================================

-- SELECT: Donos E funcionários podem ver as lojas
CREATE POLICY "lojas_select"
    ON public.lojas
    FOR SELECT
    USING (
        -- Dono pode ver
        auth.uid() = dono_id
        OR
        -- Funcionário com acesso pode ver
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = lojas.id 
            AND lojas_usuarios.usuario_id = auth.uid()
        )
    );

-- INSERT: Apenas usuários autenticados podem criar lojas (como donos)
CREATE POLICY "lojas_insert"
    ON public.lojas
    FOR INSERT
    WITH CHECK (auth.uid() = dono_id);

-- UPDATE: Apenas donos podem atualizar suas lojas
CREATE POLICY "lojas_update"
    ON public.lojas
    FOR UPDATE
    USING (auth.uid() = dono_id);

-- DELETE: Apenas donos podem deletar suas lojas
CREATE POLICY "lojas_delete"
    ON public.lojas
    FOR DELETE
    USING (auth.uid() = dono_id);

-- =====================================================
-- PASSO 4: Verificar as políticas criadas
-- =====================================================
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'lojas';

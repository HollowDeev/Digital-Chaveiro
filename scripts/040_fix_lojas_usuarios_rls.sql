-- Script para corrigir políticas RLS da tabela lojas_usuarios
-- Garante que funcionários possam ver seus próprios registros e que donos possam gerenciar
-- Executar este script no Supabase SQL Editor

-- =====================================================
-- PASSO 1: Remover TODAS as políticas existentes de lojas_usuarios
-- =====================================================

DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'lojas_usuarios'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.lojas_usuarios', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- PASSO 2: Garantir que RLS está habilitado
-- =====================================================
ALTER TABLE public.lojas_usuarios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 3: Criar novas políticas
-- =====================================================

-- SELECT: Usuários podem ver seus próprios registros OU donos podem ver todos da sua loja
CREATE POLICY "lojas_usuarios_select"
    ON public.lojas_usuarios
    FOR SELECT
    USING (
        -- Funcionário pode ver seu próprio registro
        usuario_id = auth.uid()
        OR
        -- Dono pode ver todos os funcionários da sua loja
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = lojas_usuarios.loja_id 
            AND lojas.dono_id = auth.uid()
        )
    );

-- INSERT: Apenas donos podem adicionar funcionários às suas lojas
CREATE POLICY "lojas_usuarios_insert"
    ON public.lojas_usuarios
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = loja_id 
            AND lojas.dono_id = auth.uid()
        )
    );

-- UPDATE: Donos podem atualizar funcionários das suas lojas
CREATE POLICY "lojas_usuarios_update"
    ON public.lojas_usuarios
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = lojas_usuarios.loja_id 
            AND lojas.dono_id = auth.uid()
        )
    );

-- DELETE: Donos podem remover funcionários das suas lojas
CREATE POLICY "lojas_usuarios_delete"
    ON public.lojas_usuarios
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = lojas_usuarios.loja_id 
            AND lojas.dono_id = auth.uid()
        )
    );

-- =====================================================
-- PASSO 4: Verificar as políticas criadas
-- =====================================================
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'lojas_usuarios';

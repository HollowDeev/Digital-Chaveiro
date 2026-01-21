-- Script DEFINITIVO para corrigir políticas RLS
-- SEM RECURSÃO - cada tabela só verifica colunas próprias ou usa funções SECURITY DEFINER
-- Executar este script COMPLETO no Supabase SQL Editor

-- =====================================================
-- PASSO 1: Criar função auxiliar com SECURITY DEFINER
-- (Ignora RLS para evitar recursão)
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_access_to_loja(p_loja_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.lojas_usuarios
        WHERE loja_id = p_loja_id AND usuario_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.lojas
        WHERE id = p_loja_id AND dono_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.user_is_loja_owner(p_loja_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.lojas
        WHERE id = p_loja_id AND dono_id = auth.uid()
    );
$$;

-- =====================================================
-- PASSO 2: Remover TODAS as políticas existentes
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
-- PASSO 3: Garantir que RLS está habilitado
-- =====================================================
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas_usuarios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 4: Criar políticas para LOJAS
-- =====================================================

CREATE POLICY "lojas_select"
    ON public.lojas FOR SELECT
    USING (public.user_has_access_to_loja(id));

CREATE POLICY "lojas_insert"
    ON public.lojas FOR INSERT
    WITH CHECK (dono_id = auth.uid());

CREATE POLICY "lojas_update"
    ON public.lojas FOR UPDATE
    USING (dono_id = auth.uid());

CREATE POLICY "lojas_delete"
    ON public.lojas FOR DELETE
    USING (dono_id = auth.uid());

-- =====================================================
-- PASSO 5: Criar políticas para LOJAS_USUARIOS
-- =====================================================

CREATE POLICY "lojas_usuarios_select"
    ON public.lojas_usuarios FOR SELECT
    USING (
        usuario_id = auth.uid() 
        OR public.user_is_loja_owner(loja_id)
    );

CREATE POLICY "lojas_usuarios_insert"
    ON public.lojas_usuarios FOR INSERT
    WITH CHECK (public.user_is_loja_owner(loja_id));

CREATE POLICY "lojas_usuarios_update"
    ON public.lojas_usuarios FOR UPDATE
    USING (public.user_is_loja_owner(loja_id));

CREATE POLICY "lojas_usuarios_delete"
    ON public.lojas_usuarios FOR DELETE
    USING (public.user_is_loja_owner(loja_id));

-- =====================================================
-- PASSO 6: Verificar as políticas criadas
-- =====================================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('lojas', 'lojas_usuarios')
ORDER BY tablename, policyname;

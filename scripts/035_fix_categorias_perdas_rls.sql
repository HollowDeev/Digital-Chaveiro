-- Script para corrigir políticas RLS da tabela categorias_perdas
-- Executar este script no Supabase SQL Editor

-- =====================================================
-- PASSO 1: Remover TODAS as políticas existentes
-- =====================================================

DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'categorias_perdas'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.categorias_perdas', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- PASSO 2: Garantir que RLS está habilitado
-- =====================================================
ALTER TABLE public.categorias_perdas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 3: Criar novas políticas (mais permissivas)
-- =====================================================

-- SELECT: Usuários autenticados podem ver categorias da loja
-- Verifica via lojas_usuarios OU se é dono da loja
CREATE POLICY "categorias_perdas_select"
    ON public.categorias_perdas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = categorias_perdas.loja_id
            AND lojas_usuarios.usuario_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = categorias_perdas.loja_id
            AND lojas.dono_id = auth.uid()
        )
    );

-- INSERT: Usuários podem criar se têm acesso via lojas_usuarios OU são donos
CREATE POLICY "categorias_perdas_insert"
    ON public.categorias_perdas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = categorias_perdas.loja_id
            AND lojas_usuarios.usuario_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = categorias_perdas.loja_id
            AND lojas.dono_id = auth.uid()
        )
    );

-- UPDATE
CREATE POLICY "categorias_perdas_update"
    ON public.categorias_perdas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = categorias_perdas.loja_id
            AND lojas_usuarios.usuario_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = categorias_perdas.loja_id
            AND lojas.dono_id = auth.uid()
        )
    );

-- DELETE
CREATE POLICY "categorias_perdas_delete"
    ON public.categorias_perdas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = categorias_perdas.loja_id
            AND lojas_usuarios.usuario_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = categorias_perdas.loja_id
            AND lojas.dono_id = auth.uid()
        )
    );

-- =====================================================
-- PASSO 4: Verificar as políticas criadas
-- =====================================================
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'categorias_perdas';

-- =====================================================
-- PASSO 5: Mesma correção para tabela perdas
-- =====================================================

DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'perdas'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.perdas', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.perdas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perdas_select"
    ON public.perdas
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.lojas_usuarios WHERE lojas_usuarios.loja_id = perdas.loja_id AND lojas_usuarios.usuario_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.lojas WHERE lojas.id = perdas.loja_id AND lojas.dono_id = auth.uid())
    );

CREATE POLICY "perdas_insert"
    ON public.perdas
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.lojas_usuarios WHERE lojas_usuarios.loja_id = perdas.loja_id AND lojas_usuarios.usuario_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.lojas WHERE lojas.id = perdas.loja_id AND lojas.dono_id = auth.uid())
    );

CREATE POLICY "perdas_update"
    ON public.perdas
    FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.lojas_usuarios WHERE lojas_usuarios.loja_id = perdas.loja_id AND lojas_usuarios.usuario_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.lojas WHERE lojas.id = perdas.loja_id AND lojas.dono_id = auth.uid())
    );

CREATE POLICY "perdas_delete"
    ON public.perdas
    FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM public.lojas_usuarios WHERE lojas_usuarios.loja_id = perdas.loja_id AND lojas_usuarios.usuario_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.lojas WHERE lojas.id = perdas.loja_id AND lojas.dono_id = auth.uid())
    );

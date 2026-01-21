-- Script para corrigir políticas RLS das tabelas lojas e lojas_usuarios
-- IMPORTANTE: Evita recursão infinita usando políticas independentes
-- Executar este script COMPLETO no Supabase SQL Editor

-- =====================================================
-- PASSO 1: Remover TODAS as políticas existentes
-- =====================================================

-- Remover políticas de lojas
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

-- Remover políticas de lojas_usuarios
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
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas_usuarios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 3: Criar políticas para lojas_usuarios PRIMEIRO
-- (Não depende de lojas para evitar recursão)
-- =====================================================

-- SELECT: Usuários podem ver registros onde são o usuario_id
-- OU registros de lojas onde são donos (verificando diretamente pelo loja_id)
CREATE POLICY "lojas_usuarios_select"
    ON public.lojas_usuarios
    FOR SELECT
    USING (
        usuario_id = auth.uid()
        OR
        loja_id IN (SELECT id FROM public.lojas WHERE dono_id = auth.uid())
    );

-- INSERT: Usando service role na API ou donos verificados
CREATE POLICY "lojas_usuarios_insert"
    ON public.lojas_usuarios
    FOR INSERT
    WITH CHECK (
        loja_id IN (SELECT id FROM public.lojas WHERE dono_id = auth.uid())
    );

-- UPDATE: Donos podem atualizar
CREATE POLICY "lojas_usuarios_update"
    ON public.lojas_usuarios
    FOR UPDATE
    USING (
        loja_id IN (SELECT id FROM public.lojas WHERE dono_id = auth.uid())
    );

-- DELETE: Donos podem remover
CREATE POLICY "lojas_usuarios_delete"
    ON public.lojas_usuarios
    FOR DELETE
    USING (
        loja_id IN (SELECT id FROM public.lojas WHERE dono_id = auth.uid())
    );

-- =====================================================
-- PASSO 4: Criar políticas para lojas
-- (Usa lojas_usuarios mas de forma segura)
-- =====================================================

-- SELECT: Donos podem ver suas lojas OU funcionários podem ver lojas que têm acesso
CREATE POLICY "lojas_select"
    ON public.lojas
    FOR SELECT
    USING (
        dono_id = auth.uid()
        OR
        id IN (SELECT loja_id FROM public.lojas_usuarios WHERE usuario_id = auth.uid())
    );

-- INSERT: Apenas donos
CREATE POLICY "lojas_insert"
    ON public.lojas
    FOR INSERT
    WITH CHECK (dono_id = auth.uid());

-- UPDATE: Apenas donos
CREATE POLICY "lojas_update"
    ON public.lojas
    FOR UPDATE
    USING (dono_id = auth.uid());

-- DELETE: Apenas donos
CREATE POLICY "lojas_delete"
    ON public.lojas
    FOR DELETE
    USING (dono_id = auth.uid());

-- =====================================================
-- PASSO 5: Verificar as políticas criadas
-- =====================================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('lojas', 'lojas_usuarios')
ORDER BY tablename, policyname;

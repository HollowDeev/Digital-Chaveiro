-- Script para corrigir políticas RLS da tabela produtos
-- Permite que funcionários (lojas_usuarios) também possam gerenciar produtos
-- Executar este script no Supabase SQL Editor

-- =====================================================
-- PASSO 1: Remover TODAS as políticas existentes de produtos
-- =====================================================

DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'produtos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.produtos', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- PASSO 2: Garantir que RLS está habilitado
-- =====================================================
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 3: Criar novas políticas (incluindo funcionários)
-- =====================================================

-- SELECT: Usuários podem ver produtos das suas lojas
CREATE POLICY "produtos_select"
    ON public.produtos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = produtos.loja_id 
            AND lojas.dono_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = produtos.loja_id 
            AND lojas_usuarios.usuario_id = auth.uid()
        )
    );

-- INSERT: Donos E funcionários podem inserir produtos
CREATE POLICY "produtos_insert"
    ON public.produtos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = produtos.loja_id 
            AND lojas.dono_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = produtos.loja_id 
            AND lojas_usuarios.usuario_id = auth.uid()
        )
    );

-- UPDATE: Donos E funcionários podem atualizar produtos
CREATE POLICY "produtos_update"
    ON public.produtos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = produtos.loja_id 
            AND lojas.dono_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = produtos.loja_id 
            AND lojas_usuarios.usuario_id = auth.uid()
        )
    );

-- DELETE: Donos E funcionários podem deletar produtos
CREATE POLICY "produtos_delete"
    ON public.produtos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE lojas.id = produtos.loja_id 
            AND lojas.dono_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = produtos.loja_id 
            AND lojas_usuarios.usuario_id = auth.uid()
        )
    );

-- =====================================================
-- PASSO 4: Verificar as políticas criadas
-- =====================================================
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'produtos';

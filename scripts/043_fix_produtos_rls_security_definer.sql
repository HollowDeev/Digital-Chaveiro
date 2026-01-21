-- Script para corrigir políticas RLS da tabela produtos
-- Usa funções SECURITY DEFINER para evitar problemas de recursão
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
-- PASSO 3: Criar novas políticas usando funções SECURITY DEFINER
-- =====================================================

-- SELECT: Usuários com acesso à loja podem ver produtos
CREATE POLICY "produtos_select"
    ON public.produtos
    FOR SELECT
    USING (public.user_has_access_to_loja(loja_id));

-- INSERT: Usuários com acesso à loja podem inserir produtos
CREATE POLICY "produtos_insert"
    ON public.produtos
    FOR INSERT
    WITH CHECK (public.user_has_access_to_loja(loja_id));

-- UPDATE: Usuários com acesso à loja podem atualizar produtos
CREATE POLICY "produtos_update"
    ON public.produtos
    FOR UPDATE
    USING (public.user_has_access_to_loja(loja_id));

-- DELETE: Usuários com acesso à loja podem deletar produtos
CREATE POLICY "produtos_delete"
    ON public.produtos
    FOR DELETE
    USING (public.user_has_access_to_loja(loja_id));

-- =====================================================
-- PASSO 4: Verificar as políticas criadas
-- =====================================================
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'produtos';

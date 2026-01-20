-- Script para corrigir políticas RLS da tabela vendas_itens
-- Executar este script no Supabase SQL Editor

-- =====================================================
-- PASSO 1: Remover TODAS as políticas existentes
-- =====================================================

DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'vendas_itens'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.vendas_itens', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- PASSO 2: Garantir que RLS está habilitado
-- =====================================================
ALTER TABLE public.vendas_itens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 3: Criar novas políticas (mais permissivas)
-- =====================================================

-- SELECT: Usuários podem ver itens das vendas de suas lojas
CREATE POLICY "vendas_itens_select"
    ON public.vendas_itens
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.vendas v
            WHERE v.id = vendas_itens.venda_id
            AND (
                EXISTS (SELECT 1 FROM public.lojas_usuarios WHERE loja_id = v.loja_id AND usuario_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.lojas WHERE id = v.loja_id AND dono_id = auth.uid())
            )
        )
    );

-- INSERT: Usuários podem inserir itens em vendas de suas lojas
CREATE POLICY "vendas_itens_insert"
    ON public.vendas_itens
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vendas v
            WHERE v.id = vendas_itens.venda_id
            AND (
                EXISTS (SELECT 1 FROM public.lojas_usuarios WHERE loja_id = v.loja_id AND usuario_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.lojas WHERE id = v.loja_id AND dono_id = auth.uid())
            )
        )
    );

-- UPDATE: Usuários podem atualizar itens das vendas de suas lojas
CREATE POLICY "vendas_itens_update"
    ON public.vendas_itens
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.vendas v
            WHERE v.id = vendas_itens.venda_id
            AND (
                EXISTS (SELECT 1 FROM public.lojas_usuarios WHERE loja_id = v.loja_id AND usuario_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.lojas WHERE id = v.loja_id AND dono_id = auth.uid())
            )
        )
    );

-- DELETE: Usuários podem excluir itens das vendas de suas lojas
CREATE POLICY "vendas_itens_delete"
    ON public.vendas_itens
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.vendas v
            WHERE v.id = vendas_itens.venda_id
            AND (
                EXISTS (SELECT 1 FROM public.lojas_usuarios WHERE loja_id = v.loja_id AND usuario_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.lojas WHERE id = v.loja_id AND dono_id = auth.uid())
            )
        )
    );

-- =====================================================
-- PASSO 4: Verificar as políticas criadas
-- =====================================================
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'vendas_itens';

-- =====================================================
-- PASSO 5: Teste - verificar itens de uma venda
-- =====================================================
-- Descomente e substitua o ID da venda para testar:
-- SELECT * FROM vendas_itens WHERE venda_id = 'SEU_VENDA_ID_AQUI';

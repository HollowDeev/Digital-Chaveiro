-- Script para corrigir a política de SELECT da tabela lojas_usuarios
-- PROBLEMA: Funcionários não conseguem ver outros funcionários da mesma loja
-- A política atual só permite que funcionários vejam sua própria linha
-- Isso causa o problema de a lista de funcionários não aparecer no PDV, caixa, etc.

-- SOLUÇÃO: Permitir que qualquer usuário com acesso à loja veja todos os funcionários daquela loja

-- =====================================================
-- PASSO 1: Garantir que a função helper existe
-- =====================================================

-- Função para verificar se usuário tem acesso à loja (como dono ou funcionário)
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

-- =====================================================
-- PASSO 2: Remover política SELECT existente
-- =====================================================

DROP POLICY IF EXISTS "lojas_usuarios_select" ON public.lojas_usuarios;
DROP POLICY IF EXISTS "lojas_usuarios_select_all" ON public.lojas_usuarios;
DROP POLICY IF EXISTS "Permitir SELECT para usuários da loja" ON public.lojas_usuarios;
DROP POLICY IF EXISTS "Permitir SELECT próprio" ON public.lojas_usuarios;

-- =====================================================
-- PASSO 3: Criar nova política de SELECT
-- Agora permite que QUALQUER usuário com acesso à loja 
-- veja TODOS os funcionários daquela loja
-- =====================================================

CREATE POLICY "lojas_usuarios_select"
    ON public.lojas_usuarios FOR SELECT
    USING (
        -- Usuário tem acesso à loja = pode ver todos os funcionários da loja
        public.user_has_access_to_loja(loja_id)
    );

-- =====================================================
-- PASSO 4: Verificar que as outras políticas existem
-- =====================================================

-- Política de INSERT (apenas dono pode adicionar funcionários)
DROP POLICY IF EXISTS "lojas_usuarios_insert" ON public.lojas_usuarios;
CREATE POLICY "lojas_usuarios_insert"
    ON public.lojas_usuarios FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE id = loja_id AND dono_id = auth.uid()
        )
    );

-- Política de UPDATE (apenas dono pode atualizar funcionários)
DROP POLICY IF EXISTS "lojas_usuarios_update" ON public.lojas_usuarios;
CREATE POLICY "lojas_usuarios_update"
    ON public.lojas_usuarios FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE id = loja_id AND dono_id = auth.uid()
        )
    );

-- Política de DELETE (apenas dono pode remover funcionários)
DROP POLICY IF EXISTS "lojas_usuarios_delete" ON public.lojas_usuarios;
CREATE POLICY "lojas_usuarios_delete"
    ON public.lojas_usuarios FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas
            WHERE id = loja_id AND dono_id = auth.uid()
        )
    );

-- =====================================================
-- PASSO 5: Verificar as políticas criadas
-- =====================================================
SELECT 
    schemaname,
    tablename, 
    policyname, 
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'lojas_usuarios'
ORDER BY policyname;

-- =====================================================
-- PASSO 6: Testar a consulta
-- Execute como um funcionário para verificar se vê todos
-- =====================================================
-- SELECT * FROM public.lojas_usuarios WHERE loja_id = 'SEU_LOJA_ID';

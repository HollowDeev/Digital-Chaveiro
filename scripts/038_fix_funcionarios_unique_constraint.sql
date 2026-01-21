-- Script para corrigir constraint única na tabela lojas_credenciais_funcionarios
-- O problema: loja_id estava como UNIQUE, permitindo apenas 1 funcionário por loja
-- Executar este script no Supabase SQL Editor

-- =====================================================
-- PASSO 1: Remover a constraint UNIQUE do loja_id
-- =====================================================

-- Primeiro, descobrir o nome da constraint
-- Geralmente é "lojas_credenciais_funcionarios_loja_id_key"
ALTER TABLE public.lojas_credenciais_funcionarios 
DROP CONSTRAINT IF EXISTS lojas_credenciais_funcionarios_loja_id_key;

-- =====================================================
-- PASSO 2: Criar um índice para performance (opcional, mas recomendado)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lojas_credenciais_funcionarios_loja_id 
ON public.lojas_credenciais_funcionarios(loja_id);

-- =====================================================
-- PASSO 3: Verificar a estrutura da tabela
-- =====================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lojas_credenciais_funcionarios'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 4: Verificar constraints restantes
-- =====================================================
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.lojas_credenciais_funcionarios'::regclass;

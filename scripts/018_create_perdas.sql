-- Script 018: Criar tabelas de perdas e categorias de perdas
-- Data: 2025-11-21
-- Descrição: Criação das tabelas para gerenciar perdas de estoque com categorização

-- Tabela de categorias de perdas
CREATE TABLE IF NOT EXISTS public.categorias_perdas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(loja_id, nome)
);

-- Tabela de perdas
CREATE TABLE IF NOT EXISTS public.perdas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES public.categorias_perdas(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    custo_unitario DECIMAL(10, 2) NOT NULL CHECK (custo_unitario >= 0),
    custo_total DECIMAL(10, 2) NOT NULL CHECK (custo_total >= 0),
    motivo TEXT NOT NULL,
    funcionario_id UUID REFERENCES public.lojas_usuarios(id) ON DELETE SET NULL,
    observacoes TEXT,
    data_perda TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categorias_perdas_loja ON public.categorias_perdas(loja_id);
CREATE INDEX IF NOT EXISTS idx_perdas_loja ON public.perdas(loja_id);
CREATE INDEX IF NOT EXISTS idx_perdas_produto ON public.perdas(produto_id);
CREATE INDEX IF NOT EXISTS idx_perdas_categoria ON public.perdas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_perdas_funcionario ON public.perdas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_perdas_data ON public.perdas(data_perda);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.categorias_perdas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perdas ENABLE ROW LEVEL SECURITY;

-- Policies para categorias_perdas
-- SELECT: Usuários podem ver categorias da sua loja
CREATE POLICY "Usuários podem visualizar categorias de perdas da sua loja"
    ON public.categorias_perdas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = categorias_perdas.loja_id
            AND lojas_usuarios.user_id = auth.uid()
        )
    );

-- INSERT: Usuários podem criar categorias para sua loja
CREATE POLICY "Usuários podem criar categorias de perdas para sua loja"
    ON public.categorias_perdas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = categorias_perdas.loja_id
            AND lojas_usuarios.user_id = auth.uid()
        )
    );

-- UPDATE: Usuários podem atualizar categorias da sua loja
CREATE POLICY "Usuários podem atualizar categorias de perdas da sua loja"
    ON public.categorias_perdas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = categorias_perdas.loja_id
            AND lojas_usuarios.user_id = auth.uid()
        )
    );

-- DELETE: Usuários podem deletar categorias da sua loja
CREATE POLICY "Usuários podem deletar categorias de perdas da sua loja"
    ON public.categorias_perdas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = categorias_perdas.loja_id
            AND lojas_usuarios.user_id = auth.uid()
        )
    );

-- Policies para perdas
-- SELECT: Usuários podem ver perdas da sua loja
CREATE POLICY "Usuários podem visualizar perdas da sua loja"
    ON public.perdas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = perdas.loja_id
            AND lojas_usuarios.user_id = auth.uid()
        )
    );

-- INSERT: Usuários podem registrar perdas para sua loja
CREATE POLICY "Usuários podem registrar perdas para sua loja"
    ON public.perdas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = perdas.loja_id
            AND lojas_usuarios.user_id = auth.uid()
        )
    );

-- UPDATE: Usuários podem atualizar perdas da sua loja
CREATE POLICY "Usuários podem atualizar perdas da sua loja"
    ON public.perdas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = perdas.loja_id
            AND lojas_usuarios.user_id = auth.uid()
        )
    );

-- DELETE: Usuários podem deletar perdas da sua loja
CREATE POLICY "Usuários podem deletar perdas da sua loja"
    ON public.perdas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.lojas_usuarios
            WHERE lojas_usuarios.loja_id = perdas.loja_id
            AND lojas_usuarios.user_id = auth.uid()
        )
    );

-- ============================================
-- Categorias de perdas padrão
-- ============================================

-- Inserir categorias padrão para cada loja existente
INSERT INTO public.categorias_perdas (loja_id, nome, descricao)
SELECT 
    id,
    'Vencimento',
    'Produtos vencidos ou próximos ao vencimento'
FROM public.lojas
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_perdas 
    WHERE categorias_perdas.loja_id = lojas.id 
    AND categorias_perdas.nome = 'Vencimento'
);

INSERT INTO public.categorias_perdas (loja_id, nome, descricao)
SELECT 
    id,
    'Dano',
    'Produtos danificados ou quebrados'
FROM public.lojas
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_perdas 
    WHERE categorias_perdas.loja_id = lojas.id 
    AND categorias_perdas.nome = 'Dano'
);

INSERT INTO public.categorias_perdas (loja_id, nome, descricao)
SELECT 
    id,
    'Furto',
    'Produtos furtados ou roubados'
FROM public.lojas
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_perdas 
    WHERE categorias_perdas.loja_id = lojas.id 
    AND categorias_perdas.nome = 'Furto'
);

INSERT INTO public.categorias_perdas (loja_id, nome, descricao)
SELECT 
    id,
    'Defeito de Fábrica',
    'Produtos com defeito de fabricação'
FROM public.lojas
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_perdas 
    WHERE categorias_perdas.loja_id = lojas.id 
    AND categorias_perdas.nome = 'Defeito de Fábrica'
);

INSERT INTO public.categorias_perdas (loja_id, nome, descricao)
SELECT 
    id,
    'Outros',
    'Outras causas de perdas não especificadas'
FROM public.lojas
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_perdas 
    WHERE categorias_perdas.loja_id = lojas.id 
    AND categorias_perdas.nome = 'Outros'
);

-- Comentários nas tabelas
COMMENT ON TABLE public.categorias_perdas IS 'Categorias para classificação de perdas de estoque';
COMMENT ON TABLE public.perdas IS 'Registro de perdas de produtos no estoque';

COMMENT ON COLUMN public.categorias_perdas.nome IS 'Nome da categoria de perda';
COMMENT ON COLUMN public.categorias_perdas.descricao IS 'Descrição detalhada da categoria';

COMMENT ON COLUMN public.perdas.produto_id IS 'Produto que teve perda';
COMMENT ON COLUMN public.perdas.categoria_id IS 'Categoria da perda';
COMMENT ON COLUMN public.perdas.quantidade IS 'Quantidade de unidades perdidas';
COMMENT ON COLUMN public.perdas.custo_unitario IS 'Custo unitário do produto no momento da perda';
COMMENT ON COLUMN public.perdas.custo_total IS 'Custo total da perda (quantidade × custo unitário)';
COMMENT ON COLUMN public.perdas.motivo IS 'Motivo detalhado da perda';
COMMENT ON COLUMN public.perdas.data_perda IS 'Data e hora em que a perda foi identificada';
COMMENT ON COLUMN public.perdas.funcionario_id IS 'Funcionário que registrou a perda';
COMMENT ON COLUMN public.perdas.observacoes IS 'Observações adicionais sobre a perda';

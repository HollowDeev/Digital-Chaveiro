-- Script 020: Criar tabelas para controle de serviços realizados
-- Data: 2025-12-06
-- Descrição: Tabelas para gerenciar serviços em andamento, finalizados e problemas

-- Tabela de serviços realizados (instâncias de serviços vendidos)
CREATE TABLE IF NOT EXISTS public.servicos_realizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  funcionario_responsavel_id UUID REFERENCES public.lojas_usuarios(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'finalizado', 'cancelado')),
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_prevista_conclusao TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de arquivos/fotos dos serviços
CREATE TABLE IF NOT EXISTS public.servicos_arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_realizado_id UUID NOT NULL REFERENCES public.servicos_realizados(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('comprovacao', 'problema')),
  url TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de motivos de problemas (categorias)
CREATE TABLE IF NOT EXISTS public.motivos_problemas_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de problemas registrados nos serviços
CREATE TABLE IF NOT EXISTS public.servicos_problemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_realizado_id UUID NOT NULL REFERENCES public.servicos_realizados(id) ON DELETE CASCADE,
  motivo_id UUID NOT NULL REFERENCES public.motivos_problemas_servicos(id) ON DELETE RESTRICT,
  culpado TEXT NOT NULL CHECK (culpado IN ('funcionario', 'cliente', 'outros')),
  culpado_funcionario_id UUID REFERENCES public.lojas_usuarios(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  custo_extra DECIMAL(10, 2) DEFAULT 0,
  registrado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  termo_aceito BOOLEAN NOT NULL DEFAULT FALSE,
  termo_aceito_em TIMESTAMP WITH TIME ZONE,
  data_problema TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_servicos_realizados_loja ON public.servicos_realizados(loja_id);
CREATE INDEX IF NOT EXISTS idx_servicos_realizados_status ON public.servicos_realizados(status);
CREATE INDEX IF NOT EXISTS idx_servicos_realizados_venda ON public.servicos_realizados(venda_id);
CREATE INDEX IF NOT EXISTS idx_servicos_arquivos_servico ON public.servicos_arquivos(servico_realizado_id);
CREATE INDEX IF NOT EXISTS idx_servicos_problemas_servico ON public.servicos_problemas(servico_realizado_id);
CREATE INDEX IF NOT EXISTS idx_motivos_problemas_loja ON public.motivos_problemas_servicos(loja_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_servicos_realizados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER servicos_realizados_updated_at
  BEFORE UPDATE ON public.servicos_realizados
  FOR EACH ROW
  EXECUTE FUNCTION update_servicos_realizados_updated_at();

-- RLS Policies

-- servicos_realizados
ALTER TABLE public.servicos_realizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar serviços realizados das suas lojas"
  ON public.servicos_realizados FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = servicos_realizados.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = servicos_realizados.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir serviços realizados nas suas lojas"
  ON public.servicos_realizados FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar serviços realizados das suas lojas"
  ON public.servicos_realizados FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = servicos_realizados.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = servicos_realizados.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- servicos_arquivos
ALTER TABLE public.servicos_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar arquivos dos serviços das suas lojas"
  ON public.servicos_arquivos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.servicos_realizados sr
      JOIN public.lojas l ON l.id = sr.loja_id
      WHERE sr.id = servicos_arquivos.servico_realizado_id 
      AND l.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.servicos_realizados sr
      JOIN public.lojas_usuarios lu ON lu.loja_id = sr.loja_id
      WHERE sr.id = servicos_arquivos.servico_realizado_id 
      AND lu.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir arquivos nos serviços das suas lojas"
  ON public.servicos_arquivos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servicos_realizados sr
      JOIN public.lojas l ON l.id = sr.loja_id
      WHERE sr.id = servico_realizado_id 
      AND l.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.servicos_realizados sr
      JOIN public.lojas_usuarios lu ON lu.loja_id = sr.loja_id
      WHERE sr.id = servico_realizado_id 
      AND lu.usuario_id = auth.uid()
    )
  );

-- motivos_problemas_servicos
ALTER TABLE public.motivos_problemas_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar motivos de problemas das suas lojas"
  ON public.motivos_problemas_servicos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = motivos_problemas_servicos.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = motivos_problemas_servicos.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir motivos de problemas nas suas lojas"
  ON public.motivos_problemas_servicos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- servicos_problemas
ALTER TABLE public.servicos_problemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar problemas dos serviços das suas lojas"
  ON public.servicos_problemas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.servicos_realizados sr
      JOIN public.lojas l ON l.id = sr.loja_id
      WHERE sr.id = servicos_problemas.servico_realizado_id 
      AND l.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.servicos_realizados sr
      JOIN public.lojas_usuarios lu ON lu.loja_id = sr.loja_id
      WHERE sr.id = servicos_problemas.servico_realizado_id 
      AND lu.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir problemas nos serviços das suas lojas"
  ON public.servicos_problemas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servicos_realizados sr
      JOIN public.lojas l ON l.id = sr.loja_id
      WHERE sr.id = servico_realizado_id 
      AND l.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.servicos_realizados sr
      JOIN public.lojas_usuarios lu ON lu.loja_id = sr.loja_id
      WHERE sr.id = servico_realizado_id 
      AND lu.usuario_id = auth.uid()
    )
  );

-- Inserir alguns motivos de problemas padrão
INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao)
SELECT l.id, 'Peça com defeito', 'A peça utilizada estava com defeito'
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Peça com defeito'
);

INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao)
SELECT l.id, 'Cliente forneceu informação errada', 'Cliente passou informação incorreta sobre o serviço'
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Cliente forneceu informação errada'
);

INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao)
SELECT l.id, 'Erro de execução', 'Erro durante a execução do serviço'
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Erro de execução'
);

INSERT INTO public.motivos_problemas_servicos (loja_id, nome, descricao)
SELECT l.id, 'Falta de ferramenta adequada', 'Não havia ferramenta adequada para realizar o serviço'
FROM public.lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM public.motivos_problemas_servicos 
  WHERE loja_id = l.id AND nome = 'Falta de ferramenta adequada'
);

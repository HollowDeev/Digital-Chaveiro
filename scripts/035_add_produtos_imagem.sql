-- Script 035: Adicionar campo imagem_url aos produtos e criar bucket de storage
-- Data: 2026-01-15
-- Descrição: Permitir upload de fotos para produtos

-- 1. Adicionar coluna para URL da imagem na tabela produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS imagem_url text;

COMMENT ON COLUMN public.produtos.imagem_url IS 'URL da imagem do produto no Supabase Storage';

-- 2. Criar bucket para imagens de produtos (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'produtos-imagens', 
  'produtos-imagens', 
  true,  -- público para facilitar exibição das imagens
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Políticas de Storage para o bucket produtos-imagens

-- Remover políticas existentes (se houver) para recriar
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de imagens de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer pessoa pode visualizar imagens de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar suas imagens de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar imagens de produtos" ON storage.objects;

-- Policy para permitir usuários autenticados fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload de imagens de produtos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'produtos-imagens' 
    AND auth.role() = 'authenticated'
  );

-- Policy para permitir visualização pública (bucket é público)
CREATE POLICY "Qualquer pessoa pode visualizar imagens de produtos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produtos-imagens');

-- Policy para permitir usuários autenticados atualizar imagens
CREATE POLICY "Usuários autenticados podem atualizar suas imagens de produtos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'produtos-imagens' 
    AND auth.role() = 'authenticated'
  );

-- Policy para permitir usuários autenticados deletar imagens
CREATE POLICY "Usuários autenticados podem deletar imagens de produtos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'produtos-imagens' 
    AND auth.role() = 'authenticated'
  );

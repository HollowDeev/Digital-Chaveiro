-- Script 021: Criar bucket de storage para arquivos de serviços
-- Data: 2025-12-06
-- Descrição: Configurar Supabase Storage para upload de fotos

-- Criar bucket para arquivos de serviços (executar no Supabase Storage ou via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('servicos-arquivos', 'servicos-arquivos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy para permitir usuários autenticados fazer upload
CREATE POLICY "Usuários podem fazer upload de arquivos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'servicos-arquivos' 
    AND auth.role() = 'authenticated'
  );

-- Policy para permitir usuários visualizar arquivos das suas lojas
CREATE POLICY "Usuários podem visualizar arquivos das suas lojas"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'servicos-arquivos' 
    AND auth.role() = 'authenticated'
  );

-- Policy para permitir usuários deletar seus arquivos
CREATE POLICY "Usuários podem deletar arquivos das suas lojas"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'servicos-arquivos' 
    AND auth.role() = 'authenticated'
  );

-- Verificar bucket servicos-arquivos e configurações

-- 1. Listar buckets
SELECT id, name, public, created_at, updated_at, avif_autodetection
FROM storage.buckets
WHERE name = 'servicos-arquivos';

-- 2. Verificar policies do bucket
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 3. Se o bucket não exista ou tenha problemas, recriar
-- DELETE FROM storage.buckets WHERE name = 'servicos-arquivos';

-- 4. Criar bucket com permissões públicas (se necessário)
INSERT INTO storage.buckets (id, name, owner, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'servicos-arquivos',
  'servicos-arquivos',
  NULL,
  true,
  false,
  52428800,
  NULL
)
ON CONFLICT DO NOTHING;

-- 5. Criar policy para acesso público
CREATE POLICY "Permitir acesso público - SELECT"
ON storage.objects FOR SELECT
USING (bucket_id = 'servicos-arquivos')
WITH CHECK (bucket_id = 'servicos-arquivos');

-- 6. Criar policy para insert autenticado
CREATE POLICY "Permitir upload autenticado - INSERT"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'servicos-arquivos' 
  AND auth.role() = 'authenticated'
);

-- 7. Criar policy para delete
CREATE POLICY "Permitir delete autenticado - DELETE"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'servicos-arquivos' 
  AND auth.role() = 'authenticated'
);

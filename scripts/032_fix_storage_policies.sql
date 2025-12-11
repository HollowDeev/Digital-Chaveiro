-- Verificar e ajustar políticas de RLS do bucket servicos-arquivos

-- 1. Desabilitar RLS temporariamente para permitir acesso público (se necessário)
-- Se as imagens devem ser públicas, você pode deixar sem RLS

-- 2. Ou criar políticas de acesso público
-- Primeiro, vamos verificar as policies atuais
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND definition LIKE '%servicos-arquivos%';

-- 3. Se precisar permitir acesso público aos arquivos, crie esta policy:
CREATE POLICY "Permitir acesso público aos arquivos de serviços"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'servicos-arquivos');

-- 4. Ou, se quiser manter restrito mas permitir aos usuários autenticados:
CREATE POLICY "Usuários autenticados podem ver arquivos de serviços"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'servicos-arquivos' 
    AND auth.role() = 'authenticated'
  );

-- Nota: A URL pública funcionará mesmo com RLS habilitado, 
-- pois as URLs públicas usam um mecanismo diferente
-- O erro 400 pode indicar um problema com a URL em si

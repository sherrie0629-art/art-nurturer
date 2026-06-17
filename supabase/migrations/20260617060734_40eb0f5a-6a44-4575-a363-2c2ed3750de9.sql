
-- shared-posters: add UPDATE policy scoped to user's own folder
CREATE POLICY "Users can update own shared posters"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shared-posters'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'shared-posters'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- tarot-card-art is server-generated only — remove user INSERT/SELECT paths
DROP POLICY IF EXISTS "Users can upload own tarot card art" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own tarot card art" ON storage.objects;

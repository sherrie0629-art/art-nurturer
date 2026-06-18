
-- 1) soul_mirrors: add owner UPDATE policy
CREATE POLICY "Users can update their own soul mirrors"
ON public.soul_mirrors
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) assessment-cache storage bucket: explicit service_role policies
CREATE POLICY "Service role can insert assessment cache"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'assessment-cache');

CREATE POLICY "Service role can update assessment cache"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'assessment-cache')
WITH CHECK (bucket_id = 'assessment-cache');

CREATE POLICY "Service role can delete assessment cache"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'assessment-cache');

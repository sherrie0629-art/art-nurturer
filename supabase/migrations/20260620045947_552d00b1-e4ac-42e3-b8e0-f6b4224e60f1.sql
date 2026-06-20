ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_reason text;

CREATE INDEX IF NOT EXISTS profiles_is_banned_idx ON public.profiles(is_banned) WHERE is_banned = true;

DROP POLICY IF EXISTS "Admins can update any profile ban status" ON public.profiles;
CREATE POLICY "Admins can update any profile ban status"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
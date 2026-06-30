GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_followups TO authenticated;
GRANT ALL ON public.agent_followups TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;

NOTIFY pgrst, 'reload schema';
